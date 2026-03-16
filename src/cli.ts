#!/usr/bin/env node

import select from '@inquirer/select'
import { BUILTIN_THEMES, termpal, type BuiltinThemeName } from './index'

const themeNames = Object.keys(BUILTIN_THEMES) as BuiltinThemeName[]

let lastTheme: BuiltinThemeName | undefined

const applyPreviewTheme = (nextTheme: BuiltinThemeName): string => {
  if (lastTheme !== nextTheme) {
    termpal.use(nextTheme)
    lastTheme = nextTheme
  }

  return ''
}

const isPromptExitError = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && 'name' in error && error.name === 'ExitPromptError'

const run = async () => {
  try {
    await select<BuiltinThemeName>({
      message: 'Pick a theme',
      choices: themeNames.map((themeName) => ({
        value: themeName,
        name: themeName,
        description: themeName,
      })),
      theme: {
        style: {
          description: applyPreviewTheme,
        },
      },
    })
  } catch (error) {
    termpal.reset()
    if (isPromptExitError(error)) {
      return
    }
    throw error
  }
}

run()
