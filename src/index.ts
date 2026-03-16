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

// Bright normalization rule for dark backgrounds: keep H unchanged, apply S +18 and L -2 (clamped).
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
    magenta: '#ee90db',
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
    red: '#cc241d',
    green: '#98971a',
    yellow: '#d79921',
    blue: '#458588',
    magenta: '#b16286',
    cyan: '#689d6a',
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
  Monokai: {
    black: '#272822',
    red: '#f92672',
    green: '#a6e22e',
    yellow: '#e6db74',
    blue: '#66d9ef',
    magenta: '#ae81ff',
    cyan: '#a1efe4',
    white: '#f8f8f2',
    gray: '#75715e',
  },
  RosePine: {
    black: '#191724',
    red: '#eb6f92',
    green: '#31748f',
    yellow: '#f6c177',
    blue: '#9ccfd8',
    magenta: '#c4a7e7',
    cyan: '#ebbcba',
    white: '#e0def4',
    gray: '#6e6a86',
  },
  NightOwl: {
    black: '#011627',
    red: '#ef5350',
    green: '#22da6e',
    yellow: '#addb67',
    blue: '#82aaff',
    magenta: '#c792ea',
    cyan: '#21c7a8',
    white: '#d6deeb',
    gray: '#5f7e97',
  },
} as const satisfies Record<string, BaseThemeConfig>
export type BuiltinTheme = keyof typeof BUILTIN_THEMES
type BuiltinThemeConfig = (typeof BUILTIN_THEMES)[BuiltinTheme]

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

  private normalizeHex6(color: string): string | null {
    const match = color.match(/^#?([0-9A-Fa-f]{6})$/)
    if (!match) return null
    return `#${match[1].toLowerCase()}`
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

  private toHex6(color: ColorInput): string | null {
    const rgb = this.toRgb(color)
    if (!rgb) return null
    return `#${rgb.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
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

  private parseOsc4QueryColor(payload: string): string | null {
    const normalized = payload.trim()
    const directHex = this.normalizeHex6(normalized)
    if (directHex) return directHex

    const rgb16 = normalized.match(
      /^rgb:([0-9A-Fa-f]{1,4})\/([0-9A-Fa-f]{1,4})\/([0-9A-Fa-f]{1,4})$/,
    )
    if (rgb16) {
      const to8BitHex = (value: string): string => {
        const max = (1 << (value.length * 4)) - 1
        const parsed = parseInt(value, 16)
        if (max <= 0) return '00'
        return Math.round((parsed / max) * 255)
          .toString(16)
          .padStart(2, '0')
      }
      return `#${to8BitHex(rgb16[1])}${to8BitHex(rgb16[2])}${to8BitHex(rgb16[3])}`
    }

    return null
  }

  private queryOsc4Color(index: number, timeoutMs: number): Promise<string | null> {
    const stdin = process.stdin
    if (!stdin.isTTY || !process.stdout.isTTY) return Promise.resolve(null)

    return new Promise((resolve) => {
      const wasRaw = Boolean((stdin as NodeJS.ReadStream & { isRaw?: boolean }).isRaw)
      const shouldToggleRaw = typeof stdin.setRawMode === 'function'
      const shouldResume = stdin.isPaused()
      let settled = false
      let buffer = ''
      let timer: NodeJS.Timeout | undefined

      const cleanup = () => {
        stdin.off('data', onData)
        if (timer) clearTimeout(timer)
        if (shouldToggleRaw && !wasRaw) stdin.setRawMode(false)
        if (shouldResume) stdin.pause()
      }

      const finish = (value: string | null) => {
        if (settled) return
        settled = true
        cleanup()
        resolve(value)
      }

      const onData = (chunk: Buffer | string) => {
        buffer += typeof chunk === 'string' ? chunk : chunk.toString('utf8')
        const match = buffer.match(
          new RegExp(`\\x1b\\]4;${index};([^\\x07\\x1b]+)(?:\\x07|\\x1b\\\\)`, 'i'),
        )
        if (!match) return
        finish(this.parseOsc4QueryColor(match[1]))
      }

      stdin.on('data', onData)
      if (shouldToggleRaw && !wasRaw) stdin.setRawMode(true)
      if (shouldResume) stdin.resume()

      timer = setTimeout(() => finish(null), Math.max(10, timeoutMs))
      process.stdout.write(`\x1b]4;${index};?\x07`)
    })
  }

  private async readBasePalette(timeoutMs: number): Promise<Partial<Record<BaseThemeKey, string>>> {
    const keys: BaseThemeKey[] = [
      'black',
      'red',
      'green',
      'yellow',
      'blue',
      'magenta',
      'cyan',
      'white',
      'gray',
    ]
    const palette: Partial<Record<BaseThemeKey, string>> = {}

    for (const key of keys) {
      const index = this.resolveIndex(key)
      if (index < 0) continue
      const color = await this.queryOsc4Color(index, timeoutMs)
      if (!color) continue
      palette[key] = color
    }

    return palette
  }

  private doesPaletteMatchTheme(
    palette: Partial<Record<BaseThemeKey, string>>,
    theme: BuiltinThemeConfig,
  ): boolean {
    const keys = Object.keys(theme) as BaseThemeKey[]
    return keys.every((key) => {
      const paletteColor = palette[key]
      if (!paletteColor) return false
      const themeColor = this.toHex6(theme[key])
      return !!themeColor && paletteColor === themeColor
    })
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

  async detectBuiltinTheme(timeoutMs = 80): Promise<BuiltinTheme | undefined> {
    if (this.activeBuiltinTheme) return this.activeBuiltinTheme
    if (!this.isSupported) return undefined

    const palette = await this.readBasePalette(timeoutMs)
    if (Object.keys(palette).length === 0) return undefined

    for (const themeName of Object.keys(BUILTIN_THEMES) as BuiltinTheme[]) {
      const theme = BUILTIN_THEMES[themeName]
      if (!this.doesPaletteMatchTheme(palette, theme)) continue
      this.activeBuiltinTheme = themeName
      return themeName
    }

    return undefined
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
