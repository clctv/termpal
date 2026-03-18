import { emitKeypressEvents } from 'node:readline'
import colors from 'picocolors'

type SelectStyleRenderer<T> = (value: T) => string

type SelectTheme<T> = {
  style?: {
    description?: SelectStyleRenderer<T>
  }
}

type SelectChoice<Value, Description = Value> = {
  value: Value
  name?: string
  description?: Description
  disabled?: boolean | string
}

type SelectConfig<Value, Description = Value> = {
  message: string
  choices: SelectChoice<Value, Description>[]
  default?: Value
  pageSize?: number
  theme?: SelectTheme<Description>
}

class ExitPromptError extends Error {
  constructor() {
    super('Prompt cancelled')
    this.name = 'ExitPromptError'
  }
}

const ANSI = {
  hideCursor: '\x1b[?25l',
  showCursor: '\x1b[?25h',
  clearLine: '\x1b[2K',
  moveLineStart: '\r',
}

const isChoiceDisabled = <Value, Description>(choice: SelectChoice<Value, Description>): boolean =>
  Boolean(choice.disabled)

const isEqual = <T>(left: T, right: T): boolean => Object.is(left, right)

const countLines = (content: string): number => {
  if (content === '') return 0
  return content.split('\n').length
}

const clearRenderedLines = (lineCount: number): void => {
  if (lineCount <= 0) return

  for (let line = 0; line < lineCount; line += 1) {
    process.stdout.write(ANSI.moveLineStart)
    process.stdout.write(ANSI.clearLine)
    if (line < lineCount - 1) {
      process.stdout.write('\x1b[1A')
    }
  }
}

const findFirstEnabledIndex = <Value, Description>(
  choices: SelectChoice<Value, Description>[],
): number => choices.findIndex((choice) => !isChoiceDisabled(choice))

const findDefaultIndex = <Value, Description>(
  choices: SelectChoice<Value, Description>[],
  defaultValue: Value | undefined,
): number => {
  if (defaultValue === undefined) return -1
  return choices.findIndex(
    (choice) => !isChoiceDisabled(choice) && isEqual(choice.value, defaultValue),
  )
}

const findNextEnabledIndex = <Value, Description>(
  choices: SelectChoice<Value, Description>[],
  currentIndex: number,
  direction: -1 | 1,
): number => {
  if (choices.length === 0) return -1
  let nextIndex = currentIndex

  for (let attempt = 0; attempt < choices.length; attempt += 1) {
    nextIndex = (nextIndex + direction + choices.length) % choices.length
    if (!isChoiceDisabled(choices[nextIndex])) return nextIndex
  }

  return currentIndex
}

const getVisibleWindowStart = (
  selectedIndex: number,
  choiceCount: number,
  pageSize: number,
): number => {
  if (choiceCount <= pageSize) return 0
  const centerOffset = Math.floor(pageSize / 2)
  const start = selectedIndex - centerOffset
  const maxStart = choiceCount - pageSize
  return Math.max(0, Math.min(start, maxStart))
}

const formatChoiceLine = <Value, Description>(
  choice: SelectChoice<Value, Description>,
  isSelected: boolean,
): string => {
  const cursor = isSelected ? colors.cyan('❯') : ' '
  const label = choice.name ?? String(choice.value)
  if (isChoiceDisabled(choice)) {
    return `${cursor} ${colors.dim(label)}`
  }
  if (isSelected) {
    return `${cursor} ${colors.cyan(label)}`
  }
  return `${cursor} ${label}`
}

const formatAnsweredLine = <Value, Description>(
  message: string,
  choice: SelectChoice<Value, Description>,
): string => {
  const label = choice.name ?? String(choice.value)
  return `${colors.bold(message)} ${colors.cyan(label)}`
}

const renderPrompt = <Value, Description>(
  message: string,
  choices: SelectChoice<Value, Description>[],
  selectedIndex: number,
  pageSize: number,
  styleDescription?: SelectStyleRenderer<Description>,
): { output: string; lines: number } => {
  const outputLines: string[] = [colors.bold(message)]
  const windowStart = getVisibleWindowStart(selectedIndex, choices.length, pageSize)
  const windowEnd = Math.min(windowStart + pageSize, choices.length)

  for (let index = windowStart; index < windowEnd; index += 1) {
    const choice = choices[index]
    outputLines.push(formatChoiceLine(choice, index === selectedIndex))
  }

  const selectedChoice = choices[selectedIndex]
  if (selectedChoice?.description !== undefined && styleDescription) {
    const styled = styleDescription(selectedChoice.description)
    if (styled !== '') {
      outputLines.push(styled)
    }
  } else if (selectedChoice?.description !== undefined) {
    outputLines.push(String(selectedChoice.description))
  }

  const output = outputLines.join('\n')
  return { output, lines: countLines(output) }
}

const select = async <Value, Description = Value>(
  config: SelectConfig<Value, Description>,
): Promise<Value> => {
  const { message, choices, default: defaultValue, pageSize = 7, theme } = config

  if (choices.length === 0) {
    throw new Error('Select prompt requires at least one choice.')
  }

  const firstEnabledIndex = findFirstEnabledIndex(choices)
  if (firstEnabledIndex < 0) {
    throw new Error('Select prompt requires at least one enabled choice.')
  }

  const defaultIndex = findDefaultIndex(choices, defaultValue)
  const initialIndex = defaultIndex >= 0 ? defaultIndex : firstEnabledIndex

  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    return choices[initialIndex].value
  }

  return new Promise<Value>((resolve, reject) => {
    const input = process.stdin
    const styleDescription = theme?.style?.description
    let selectedIndex = initialIndex
    let renderedLineCount = 0
    const shouldRestoreRawMode = input.isTTY
    const previousRawMode = shouldRestoreRawMode ? input.isRaw : false
    let settled = false

    const cleanup = ({
      clear,
      appendNewline,
    }: {
      clear: boolean
      appendNewline: boolean
    }): void => {
      input.removeListener('keypress', onKeypress)
      if (shouldRestoreRawMode) {
        input.setRawMode(previousRawMode)
      }
      input.pause()
      if (clear) {
        clearRenderedLines(renderedLineCount)
        renderedLineCount = 0
      }
      process.stdout.write(ANSI.showCursor)
      if (appendNewline) {
        process.stdout.write('\n')
      }
    }

    const settleResolve = (value: Value): void => {
      if (settled) return
      settled = true
      const choice = choices[selectedIndex]
      cleanup({ clear: true, appendNewline: false })
      process.stdout.write(`${formatAnsweredLine(message, choice)}\n`)
      resolve(value)
    }

    const settleReject = (error: Error): void => {
      if (settled) return
      settled = true
      cleanup({ clear: false, appendNewline: true })
      reject(error)
    }

    const draw = (): void => {
      clearRenderedLines(renderedLineCount)
      const rendered = renderPrompt(
        message,
        choices,
        selectedIndex,
        Math.max(1, pageSize),
        styleDescription,
      )
      renderedLineCount = rendered.lines
      process.stdout.write(rendered.output)
    }

    const onKeypress = (_str: string, key: { name?: string; ctrl?: boolean }): void => {
      if (key.ctrl && key.name === 'c') {
        settleReject(new ExitPromptError())
        return
      }

      if (key.name === 'escape') {
        settleReject(new ExitPromptError())
        return
      }

      if (key.name === 'return' || key.name === 'enter') {
        settleResolve(choices[selectedIndex].value)
        return
      }

      if (key.name === 'up' || key.name === 'k') {
        selectedIndex = findNextEnabledIndex(choices, selectedIndex, -1)
        draw()
        return
      }

      if (key.name === 'down' || key.name === 'j') {
        selectedIndex = findNextEnabledIndex(choices, selectedIndex, 1)
        draw()
      }
    }

    process.stdout.write(ANSI.hideCursor)
    emitKeypressEvents(input)
    if (shouldRestoreRawMode) {
      input.setRawMode(true)
    }
    input.resume()
    input.on('keypress', onKeypress)
    draw()
  })
}

export default select
