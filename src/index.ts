type RGB = [number, number, number]
type ColorInput = string | RGB

export const ANSI_INDEX_MAP = {
  black: 0,
  red: 1,
  green: 2,
  yellow: 3,
  blue: 4,
  magenta: 5,
  cyan: 6,
  white: 7,
  gray: 8,
  redBright: 9,
  greenBright: 10,
  yellowBright: 11,
  blueBright: 12,
  magentaBright: 13,
  cyanBright: 14,
  whiteBright: 15,
} as const

export type ThemeKey = keyof typeof ANSI_INDEX_MAP

export class TermPalette {
  private isSupported: boolean

  constructor() {
    const env = process.env
    const isCI = !!env.CI
    const isTTY = !!process.stdout?.isTTY
    const noColor = env.NO_COLOR !== undefined && env.NO_COLOR !== ''

    this.isSupported = !noColor && isTTY && !isCI
  }

  private parseColor(color: ColorInput): string {
    if (Array.isArray(color)) {
      const r = Math.max(0, Math.min(255, color[0])).toString(16).padStart(2, '0')
      const g = Math.max(0, Math.min(255, color[1])).toString(16).padStart(2, '0')
      const b = Math.max(0, Math.min(255, color[2])).toString(16).padStart(2, '0')
      return `rgb:${r}/${g}/${b}`
    }

    if (/^[0-9A-Fa-f]{6}$/.test(color)) {
      return `#${color}`
    }

    return color
  }

  private resolveIndex(key: ThemeKey): number {
    if (key in ANSI_INDEX_MAP) {
      return ANSI_INDEX_MAP[key]
    }
    return -1
  }

  setColor(key: ThemeKey, color: ColorInput): this {
    if (!this.isSupported) return this

    const index = this.resolveIndex(key)
    if (index < 0) return this

    const hex = this.parseColor(color)
    process.stdout.write(`\x1b]4;${index};${hex}\x07`)
    return this
  }

  setTheme(theme: Partial<Record<ThemeKey, ColorInput>>): this {
    if (!this.isSupported) return this

    const entries = Object.entries(theme)
    if (entries.length === 0) return this

    const sequence = entries
      .map(([key, color]) => {
        const index = this.resolveIndex(key as ThemeKey)
        if (index < 0) return null
        return `${index};${this.parseColor(color as ColorInput)}`
      })
      .filter(Boolean)
      .join(';')

    if (sequence) {
      process.stdout.write(`\x1b]4;${sequence}\x07`)
    }

    return this
  }
}

export const palette = new TermPalette()
