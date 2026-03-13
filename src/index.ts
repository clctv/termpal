type RGB = [number, number, number]
type ColorInput = string | RGB

const ANSI_INDEX_MAP = {
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
export type ThemeConfig = Partial<Record<ThemeKey, ColorInput>>

// Bright normalization rule for dark backgrounds: keep H unchanged, apply S +18 and L -2 (clamped).
export const BUILTIN_THEMES = {
  Catppuccin: {
    black: '#1e1e2e',
    red: '#f38ba8',
    green: '#a6e3a1',
    yellow: '#f9e2af',
    blue: '#89b4fa',
    magenta: '#ee90db',
    cyan: '#89dceb',
    white: '#cdd6f4',
    gray: '#6c7086',
    redBright: '#fe759c',
    greenBright: '#94ed8d',
    yellowBright: '#ffe19f',
    blueBright: '#7aacff',
    magentaBright: '#f97be0',
    cyanBright: '#73e3f7',
    whiteBright: '#beccf9',
  },
  Dracula: {
    black: '#282a36',
    red: '#ff5555',
    green: '#50fa7b',
    yellow: '#f1fa8c',
    blue: '#79b8ff',
    magenta: '#ff79c6',
    cyan: '#8be9fd',
    white: '#f8f8f2',
    gray: '#6272a4',
    redBright: '#ff4b4b',
    greenBright: '#41ff71',
    yellowBright: '#f4ff7d',
    blueBright: '#6fb3ff',
    magentaBright: '#ff6fc2',
    cyanBright: '#7fe9ff',
    whiteBright: '#f7f7e9',
  },
} as const satisfies Record<string, ThemeConfig>
export type BuiltinThemeName = keyof typeof BUILTIN_THEMES

class Termpal {
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

  setTheme(theme: ThemeConfig): this {
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

  useTheme(themeName: BuiltinThemeName): this {
    const theme = BUILTIN_THEMES[themeName]
    if (!theme) return this
    return this.setTheme(theme)
  }
}

export const termpal = new Termpal()
