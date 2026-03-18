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
type BaseThemeKey =
  | 'black'
  | 'red'
  | 'green'
  | 'yellow'
  | 'blue'
  | 'magenta'
  | 'cyan'
  | 'white'
  | 'gray'
type DerivedBrightThemeKey = Exclude<ThemeKey, BaseThemeKey>
type BaseThemeConfig = Record<BaseThemeKey, ColorInput>

const BRIGHT_THEME_MAP: Record<DerivedBrightThemeKey, BaseThemeKey> = {
  redBright: 'red',
  greenBright: 'green',
  yellowBright: 'yellow',
  blueBright: 'blue',
  magentaBright: 'magenta',
  cyanBright: 'cyan',
  whiteBright: 'white',
}

export const BUILTIN_THEMES = {
  Catppuccin: {
    black: '#1e1e2e',
    red: '#f38ba8',
    green: '#a6e3a1',
    yellow: '#f9e2af',
    blue: '#89b4fa',
    magenta: '#cba6f7',
    cyan: '#89dceb',
    white: '#cdd6f4',
    gray: '#6c7086',
  },
  Dracula: {
    black: '#282a36',
    red: '#ff5555',
    green: '#50fa7b',
    yellow: '#f1fa8c',
    blue: '#bd93f9',
    magenta: '#ff79c6',
    cyan: '#8be9fd',
    white: '#f8f8f2',
    gray: '#6272a4',
  },
  TokyoNight: {
    black: '#1a1b26',
    red: '#f7768e',
    green: '#9ece6a',
    yellow: '#e0af68',
    blue: '#7aa2f7',
    magenta: '#bb9af7',
    cyan: '#7dcfff',
    white: '#a9b1d6',
    gray: '#565f89',
  },
  Nord: {
    black: '#2e3440',
    red: '#bf616a',
    green: '#a3be8c',
    yellow: '#ebcb8b',
    blue: '#81a1c1',
    magenta: '#b48ead',
    cyan: '#88c0d0',
    white: '#d8dee9',
    gray: '#4c566a',
  },
  OneDark: {
    black: '#282c34',
    red: '#e06c75',
    green: '#98c379',
    yellow: '#e5c07b',
    blue: '#61afef',
    magenta: '#c678dd',
    cyan: '#56b6c2',
    white: '#abb2bf',
    gray: '#5c6370',
  },
  Gruvbox: {
    black: '#282828',
    red: '#fb4934',
    green: '#b8bb26',
    yellow: '#fabd2f',
    blue: '#83a598',
    magenta: '#d3869b',
    cyan: '#8ec07c',
    white: '#ebdbb2',
    gray: '#928374',
  },
  SolarizedDark: {
    black: '#002b36',
    red: '#dc322f',
    green: '#859900',
    yellow: '#b58900',
    blue: '#268bd2',
    magenta: '#d33682',
    cyan: '#2aa198',
    white: '#839496',
    gray: '#586e75',
  },
  MonokaiPro: {
    black: '#2d2a2e',
    red: '#ff6188',
    green: '#a9dc76',
    yellow: '#ffd866',
    blue: '#5da9ff',
    magenta: '#ab9df2',
    cyan: '#78dce8',
    white: '#fcfcfa',
    gray: '#727072',
  },
  MonokaiDimmed: {
    black: '#1e1e1e',
    red: '#c4265e',
    green: '#86b42b',
    yellow: '#b3b42b',
    blue: '#6a7ec8',
    magenta: '#8c6bc8',
    cyan: '#56adbc',
    white: '#e3e3dd',
    gray: '#75715e',
  },
  GitHubDark: {
    black: '#0d1117',
    red: '#f85149',
    green: '#2ea043',
    yellow: '#d29922',
    blue: '#58a6ff',
    magenta: '#bc8cff',
    cyan: '#39c5cf',
    white: '#c9d1d9',
    gray: '#8b949e',
  },
  AyuDark: {
    black: '#0a0e14',
    red: '#ff3333',
    green: '#b8cc52',
    yellow: '#e7c547',
    blue: '#36a3d9',
    magenta: '#f07178',
    cyan: '#95e6cb',
    white: '#b3b1ad',
    gray: '#4d5566',
  },
} as const satisfies Record<string, BaseThemeConfig>
export type BuiltinTheme = keyof typeof BUILTIN_THEMES

class Termpal {
  private isSupported: boolean
  private activeBuiltinTheme: BuiltinTheme | undefined

  private isTruthyEnvFlag(value: string | undefined): boolean {
    if (value === undefined) return false
    const normalized = value.trim().toLowerCase()
    return (
      normalized !== '' &&
      normalized !== '0' &&
      normalized !== 'false' &&
      normalized !== 'no' &&
      normalized !== 'off'
    )
  }

  constructor() {
    const env = process.env
    const isCI = this.isTruthyEnvFlag(env.CI)
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

  private clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value))
  }

  private toRgb(color: ColorInput): RGB | null {
    if (Array.isArray(color)) {
      return [
        Math.round(this.clamp(color[0], 0, 255)),
        Math.round(this.clamp(color[1], 0, 255)),
        Math.round(this.clamp(color[2], 0, 255)),
      ]
    }

    const hex = color.match(/^#?([0-9A-Fa-f]{6})$/)
    if (hex) {
      const value = hex[1]
      return [
        parseInt(value.slice(0, 2), 16),
        parseInt(value.slice(2, 4), 16),
        parseInt(value.slice(4, 6), 16),
      ]
    }

    const rgb = color.match(/^rgb:([0-9A-Fa-f]{2})\/([0-9A-Fa-f]{2})\/([0-9A-Fa-f]{2})$/)
    if (rgb) {
      return [parseInt(rgb[1], 16), parseInt(rgb[2], 16), parseInt(rgb[3], 16)]
    }

    return null
  }

  private rgbToHsl([r, g, b]: RGB): [number, number, number] {
    const rN = r / 255
    const gN = g / 255
    const bN = b / 255
    const max = Math.max(rN, gN, bN)
    const min = Math.min(rN, gN, bN)
    const delta = max - min
    const l = (max + min) / 2

    if (delta === 0) {
      return [0, 0, l * 100]
    }

    const s = delta / (1 - Math.abs(2 * l - 1))
    let h = 0

    if (max === rN) {
      h = ((gN - bN) / delta) % 6
    } else if (max === gN) {
      h = (bN - rN) / delta + 2
    } else {
      h = (rN - gN) / delta + 4
    }

    const hue = (h * 60 + 360) % 360
    return [hue, s * 100, l * 100]
  }

  private hslToRgb([h, s, l]: [number, number, number]): RGB {
    const sN = this.clamp(s, 0, 100) / 100
    const lN = this.clamp(l, 0, 100) / 100
    const c = (1 - Math.abs(2 * lN - 1)) * sN
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
    const m = lN - c / 2
    const hN = ((h % 360) + 360) % 360
    let rN = 0
    let gN = 0
    let bN = 0

    if (hN < 60) {
      rN = c
      gN = x
    } else if (hN < 120) {
      rN = x
      gN = c
    } else if (hN < 180) {
      gN = c
      bN = x
    } else if (hN < 240) {
      gN = x
      bN = c
    } else if (hN < 300) {
      rN = x
      bN = c
    } else {
      rN = c
      bN = x
    }

    return [Math.round((rN + m) * 255), Math.round((gN + m) * 255), Math.round((bN + m) * 255)]
  }

  private deriveBrightColor(color: ColorInput): ColorInput {
    const rgb = this.toRgb(color)
    if (!rgb) return color

    const [h, s, l] = this.rgbToHsl(rgb)
    const brightS = this.clamp(s + 18, 0, 100)
    const brightL = this.clamp(l - 2, 0, 100)
    return this.hslToRgb([h, brightS, brightL])
  }
  // Bright normalization rule for dark backgrounds: keep H unchanged, apply S +18 and L -2 (clamped).
  private withDerivedBrightColors(theme: ThemeConfig): ThemeConfig {
    const mergedTheme: ThemeConfig = { ...theme }

    for (const [brightKey, baseKey] of Object.entries(BRIGHT_THEME_MAP) as [
      DerivedBrightThemeKey,
      BaseThemeKey,
    ][]) {
      if (mergedTheme[brightKey] !== undefined) continue
      const baseColor = mergedTheme[baseKey]
      if (baseColor === undefined) continue
      if (!this.isValidColorInput(baseColor)) continue
      mergedTheme[brightKey] = this.deriveBrightColor(baseColor)
    }

    return mergedTheme
  }

  private isValidColorInput(color: unknown): color is ColorInput {
    if (Array.isArray(color)) {
      return (
        color.length === 3 &&
        color.every((channel) => typeof channel === 'number' && Number.isFinite(channel))
      )
    }

    if (typeof color !== 'string') return false
    if (color.trim() === '') return false
    if (/^#?[0-9A-Fa-f]{6}$/.test(color)) return true
    if (/^rgb:[0-9A-Fa-f]{2}\/[0-9A-Fa-f]{2}\/[0-9A-Fa-f]{2}$/.test(color)) return true
    return false
  }

  private writeOsc4(index: number, color: ColorInput): void {
    const parsed = this.parseColor(color)
    process.stdout.write(`\x1b]4;${index};${parsed}\x07`)
  }

  private resetOsc4(index?: number): void {
    if (index === undefined) {
      process.stdout.write('\x1b]104\x07')
      return
    }
    process.stdout.write(`\x1b]104;${index}\x07`)
  }

  set(theme: ThemeConfig): this {
    if (!this.isSupported) return this

    const entries = Object.entries(theme)
    if (entries.length === 0) return this

    for (const [key, color] of entries) {
      const index = this.resolveIndex(key as ThemeKey)
      if (index < 0) continue
      if (!this.isValidColorInput(color)) continue
      this.writeOsc4(index, color)
    }

    this.activeBuiltinTheme = undefined

    return this
  }

  use(themeName: BuiltinTheme): this {
    const theme = BUILTIN_THEMES[themeName]
    if (!theme) return this
    this.set(this.withDerivedBrightColors(theme))
    this.activeBuiltinTheme = themeName
    return this
  }

  reset(keys?: ThemeKey[]): this {
    if (!this.isSupported) return this

    if (!keys || keys.length === 0) {
      this.resetOsc4()
      this.activeBuiltinTheme = undefined
      return this
    }

    for (const key of keys) {
      const index = this.resolveIndex(key)
      if (index < 0) continue
      this.resetOsc4(index)
    }

    this.activeBuiltinTheme = undefined

    return this
  }
}

export const termpal = new Termpal()
