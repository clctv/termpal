#!/usr/bin/env node

import select from '@inquirer/select'
import colors from 'picocolors'
import { BUILTIN_THEMES, termpal, type BuiltinTheme } from './index'

type ThemeSelectValue = BuiltinTheme | 'System'
const themeNames: ThemeSelectValue[] = [
  'System',
  ...(Object.keys(BUILTIN_THEMES) as BuiltinTheme[]),
]

let lastPreviewTheme: ThemeSelectValue | undefined

const applyPreviewTheme = (next: ThemeSelectValue): string => {
  if (lastPreviewTheme !== next) {
    if (next === 'System') {
      termpal.reset()
    } else {
      termpal.use(next)
    }
    lastPreviewTheme = next
  }

  return ''
}

const isPromptExitError = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && 'name' in error && error.name === 'ExitPromptError'

const run = async () => {
  const currentTheme = await termpal.detectBuiltinTheme()
  const currentSelection: ThemeSelectValue = currentTheme ?? 'System'
  lastPreviewTheme = currentSelection

  try {
    await select<ThemeSelectValue>({
      message: 'Pick a theme:',
      choices: themeNames.map((themeName) => ({
        value: themeName,
        name:
          themeName === currentSelection ? `${themeName} ${colors.dim('(current)')}` : themeName,
        description: themeName,
      })),
      default: currentSelection,
      theme: {
        style: {
          description: applyPreviewTheme,
        },
      },
    })
  } catch (error) {
    if (isPromptExitError(error)) {
      if (currentSelection === 'System') {
        termpal.reset()
      } else {
        termpal.use(currentSelection)
      }
      return
    }
    throw error
  }
}

run()
