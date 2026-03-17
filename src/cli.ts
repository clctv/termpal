#!/usr/bin/env node

import select from '@inquirer/select'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import colors from 'picocolors'
import { BUILTIN_THEMES, termpal, type BuiltinTheme } from './index'

type ThemeSelectValue = BuiltinTheme | 'System'
const themeNames: ThemeSelectValue[] = [
  'System',
  ...(Object.keys(BUILTIN_THEMES) as BuiltinTheme[]),
]

let lastPreviewTheme: ThemeSelectValue | undefined
const AUTO_APPLY_START = '# >>> termpal >>>'
const AUTO_APPLY_END = '# <<< termpal <<<'
const AUTO_APPLY_COMMAND = 'termpal --apply'

const getStateFilePath = (): string | undefined => {
  const xdgConfigHome = process.env.XDG_CONFIG_HOME?.trim()
  if (xdgConfigHome) return join(xdgConfigHome, 'termpal', 'state.json')

  if (process.platform === 'win32') {
    const appData = process.env.APPDATA?.trim()
    if (appData) return join(appData, 'termpal', 'state.json')

    const userProfile = process.env.USERPROFILE?.trim() || homedir()
    if (!userProfile) return undefined
    return join(userProfile, 'AppData', 'Roaming', 'termpal', 'state.json')
  }

  const home = process.env.HOME?.trim() || homedir()
  if (!home) return undefined

  if (process.platform === 'darwin') {
    return join(home, 'Library', 'Application Support', 'termpal', 'state.json')
  }

  return join(home, '.config', 'termpal', 'state.json')
}

const isThemeSelectValue = (value: unknown): value is ThemeSelectValue =>
  value === 'System' ||
  (typeof value === 'string' && Object.hasOwn(BUILTIN_THEMES, value as BuiltinTheme))

const applySelection = (selection: ThemeSelectValue): void => {
  if (selection === 'System') {
    termpal.reset()
    return
  }
  termpal.use(selection)
}

const readPersistedSelection = (): ThemeSelectValue | undefined => {
  const stateFilePath = getStateFilePath()
  if (!stateFilePath) return undefined
  if (!existsSync(stateFilePath)) return undefined

  try {
    const content = readFileSync(stateFilePath, 'utf8')
    const parsed = JSON.parse(content) as { theme?: unknown }
    if (!isThemeSelectValue(parsed.theme)) return undefined
    return parsed.theme
  } catch {
    return undefined
  }
}

const writePersistedSelection = (selection: ThemeSelectValue): void => {
  const stateFilePath = getStateFilePath()
  if (!stateFilePath) return
  mkdirSync(dirname(stateFilePath), { recursive: true })
  writeFileSync(stateFilePath, JSON.stringify({ theme: selection }), 'utf8')
}

const readTextFile = (filePath: string): string => {
  if (!existsSync(filePath)) return ''
  try {
    return readFileSync(filePath, 'utf8')
  } catch {
    return ''
  }
}

const readVersion = (): string => {
  try {
    const packageJson = readFileSync(new URL('../package.json', import.meta.url), 'utf8')
    const parsed = JSON.parse(packageJson) as { version?: unknown }
    return typeof parsed.version === 'string' ? parsed.version : 'unknown'
  } catch {
    return 'unknown'
  }
}

const resolveShellProfilePath = (): string | undefined => {
  const shell = process.env.SHELL?.toLowerCase() ?? ''
  const home = process.env.HOME?.trim() || process.env.USERPROFILE?.trim() || homedir()
  if (!home) return undefined

  if (shell.includes('zsh')) return join(home, '.zshrc')
  if (shell.includes('bash')) return join(home, '.bashrc')
  if (shell.includes('fish')) return join(home, '.config', 'fish', 'config.fish')

  if (process.platform === 'win32') {
    if (process.env.PSModulePath) {
      return join(home, 'Documents', 'PowerShell', 'Microsoft.PowerShell_profile.ps1')
    }
    return undefined
  }

  if (process.platform === 'darwin') return join(home, '.zshrc')
  return join(home, '.bashrc')
}

const buildAutoApplyBlock = (): string =>
  `${AUTO_APPLY_START}\n${AUTO_APPLY_COMMAND}\n${AUTO_APPLY_END}\n`

const removeAutoApplyBlock = (content: string): { next: string; removed: boolean } => {
  const lines = content.split(/\r?\n/)
  const kept: string[] = []
  let inside = false
  let removed = false

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed === AUTO_APPLY_START) {
      inside = true
      removed = true
      continue
    }
    if (trimmed === AUTO_APPLY_END && inside) {
      inside = false
      continue
    }
    if (!inside) kept.push(line)
  }

  while (kept.length > 0 && kept[kept.length - 1] === '') {
    kept.pop()
  }

  const next = kept.length > 0 ? `${kept.join('\n')}\n` : ''
  return { next, removed }
}

const installAutoApply = (): void => {
  const profilePath = resolveShellProfilePath()
  if (!profilePath) {
    console.log('Unable to determine shell profile for auto apply on this environment.')
    return
  }

  const current = readTextFile(profilePath)
  if (current.includes(AUTO_APPLY_START) && current.includes(AUTO_APPLY_END)) {
    console.log(`Auto apply is already installed in ${profilePath}.`)
    return
  }

  const prefix = current === '' || current.endsWith('\n') ? current : `${current}\n`
  const next = `${prefix}${buildAutoApplyBlock()}`
  mkdirSync(dirname(profilePath), { recursive: true })
  writeFileSync(profilePath, next, 'utf8')
  console.log(`Installed auto apply to ${profilePath}.`)
}

const uninstallAutoApply = (): void => {
  const profilePath = resolveShellProfilePath()
  if (!profilePath) {
    console.log('Unable to determine shell profile for auto apply on this environment.')
    return
  }

  const current = readTextFile(profilePath)
  if (current === '') {
    console.log(`No profile found at ${profilePath}.`)
    return
  }

  const { next, removed } = removeAutoApplyBlock(current)
  if (!removed) {
    console.log(`No termpal auto apply block found in ${profilePath}.`)
    return
  }

  writeFileSync(profilePath, next, 'utf8')
  console.log(`Removed auto apply from ${profilePath}.`)
}

const applyPreviewTheme = (next: ThemeSelectValue): string => {
  if (lastPreviewTheme !== next) {
    applySelection(next)
    lastPreviewTheme = next
  }

  return ''
}

const isPromptExitError = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && 'name' in error && error.name === 'ExitPromptError'

const run = async () => {
  const cliArg = process.argv[2]
  if (cliArg === '-v') {
    console.log(readVersion())
    return
  }
  if (cliArg === 'install') {
    installAutoApply()
    return
  }
  if (cliArg === 'uninstall') {
    uninstallAutoApply()
    return
  }
  const persistedSelection = readPersistedSelection()
  if (persistedSelection) applySelection(persistedSelection)
  if (cliArg === '--apply') return
  const currentSelection = persistedSelection ?? 'System'
  lastPreviewTheme = currentSelection
  try {
    const selected = await select<ThemeSelectValue>({
      message: 'Pick a theme:',
      choices: themeNames.map((themeName) => ({
        value: themeName,
        name:
          themeName === currentSelection ? `${themeName} ${colors.dim('(current)')}` : themeName,
        description: themeName,
      })),
      pageSize: themeNames.length,
      default: currentSelection,
      theme: {
        style: {
          description: applyPreviewTheme,
        },
      },
    })
    writePersistedSelection(selected)
  } catch (error) {
    if (isPromptExitError(error)) {
      applySelection(currentSelection)
      return
    }
    throw error
  }
}

run()
