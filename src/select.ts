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
  disabled?: boolean
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
  clearToScreenEnd: '\x1b[J',
  moveLineStart: '\r',
}

const isChoiceDisabled = <Value, Description>(choice: SelectChoice<Value, Description>): boolean =>
  choice.disabled === true

const isEqual = <T>(left: T, right: T): boolean => Object.is(left, right)

const countLines = (content: string): number => {
  if (content === '') return 0
  return content.split('\n').length
}

const getRenderPrefix = (lineCount: number): string => {
  if (lineCount <= 0) return ''
  if (lineCount === 1) {
    return `${ANSI.moveLineStart}${ANSI.clearToScreenEnd}`
  }
  return `\x1b[${lineCount - 1}F${ANSI.clearToScreenEnd}`
}

const getMoveToTopPrefix = (lineCount: number): string => {
  if (lineCount <= 1) return ANSI.moveLineStart
  return `\x1b[${lineCount - 1}F`
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

const createNextEnabledIndexMap = <Value, Description>(
  choices: SelectChoice<Value, Description>[],
  direction: -1 | 1,
): number[] => {
  return choices.map((_, index) => findNextEnabledIndex(choices, index, direction))
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

type RenderFrame = {
  output: string
  windowStart: number
  windowEnd: number
  hasDescription: boolean
  lineCount: number
  selectedIndex: number
}

const renderDescription = <Description>(
  choice: SelectChoice<unknown, Description>,
  styleDescription?: SelectStyleRenderer<Description>,
): string | undefined => {
  if (choice.description === undefined) return undefined
  if (styleDescription) return styleDescription(choice.description)
  return String(choice.description)
}

const renderPrompt = <Value, Description>(
  message: string,
  getChoiceLine: (index: number, isSelected: boolean) => string,
  choices: SelectChoice<Value, Description>[],
  selectedIndex: number,
  pageSize: number,
  styleDescription?: SelectStyleRenderer<Description>,
  renderedDescription?: string,
): RenderFrame => {
  const outputLines: string[] = [colors.bold(message)]
  const windowStart = getVisibleWindowStart(selectedIndex, choices.length, pageSize)
  const windowEnd = Math.min(windowStart + pageSize, choices.length)

  for (let index = windowStart; index < windowEnd; index += 1) {
    outputLines.push(getChoiceLine(index, index === selectedIndex))
  }

  const selectedChoice = choices[selectedIndex]
  const effectiveDescription =
    renderedDescription ?? renderDescription(selectedChoice, styleDescription)

  if (effectiveDescription !== undefined && effectiveDescription !== '') {
    outputLines.push(effectiveDescription)
  }

  const output = outputLines.join('\n')
  const hasDescription = effectiveDescription !== undefined && effectiveDescription !== ''
  return {
    output,
    windowStart,
    windowEnd,
    hasDescription,
    lineCount: countLines(output),
    selectedIndex,
  }
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
    const effectivePageSize = Math.max(1, pageSize)
    const nextUpIndexMap = createNextEnabledIndexMap(choices, -1)
    const nextDownIndexMap = createNextEnabledIndexMap(choices, 1)
    const normalChoiceLines = choices.map((choice) => formatChoiceLine(choice, false))
    const selectedChoiceLines = choices.map((choice) => formatChoiceLine(choice, true))
    const getChoiceLine = (index: number, isSelected: boolean): string =>
      isSelected ? selectedChoiceLines[index] : normalChoiceLines[index]
    let selectedIndex = initialIndex
    let renderedLineCount = 0
    let lastFrame: RenderFrame | null = null
    const shouldRestoreRawMode = input.isTTY
    const previousRawMode = shouldRestoreRawMode ? input.isRaw : false
    let settled = false
    let pendingDrawScheduled = false
    let pendingDrawTask: NodeJS.Immediate | null = null

    const cleanup = ({
      clear,
      appendNewline,
    }: {
      clear: boolean
      appendNewline: boolean
    }): void => {
      input.removeListener('keypress', onKeypress)
      if (pendingDrawTask) {
        clearImmediate(pendingDrawTask)
        pendingDrawTask = null
      }
      pendingDrawScheduled = false
      if (shouldRestoreRawMode) {
        input.setRawMode(previousRawMode)
      }
      input.pause()
      if (clear) {
        process.stdout.write(getRenderPrefix(renderedLineCount))
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
      let selectedRenderedDescription: string | undefined
      if (lastFrame && lastFrame.selectedIndex !== selectedIndex) {
        const nextWindowStart = getVisibleWindowStart(
          selectedIndex,
          choices.length,
          effectivePageSize,
        )
        const nextWindowEnd = Math.min(nextWindowStart + effectivePageSize, choices.length)
        selectedRenderedDescription = renderDescription(choices[selectedIndex], styleDescription)
        const nextHasDescription =
          selectedRenderedDescription !== undefined && selectedRenderedDescription !== ''
        if (
          !lastFrame.hasDescription &&
          !nextHasDescription &&
          lastFrame.windowStart === nextWindowStart &&
          lastFrame.windowEnd === nextWindowEnd
        ) {
          const previousIndex = lastFrame.selectedIndex
          const previousRow = 1 + (previousIndex - nextWindowStart)
          const currentRow = 1 + (selectedIndex - nextWindowStart)
          if (previousRow === currentRow) {
            lastFrame = {
              ...lastFrame,
              selectedIndex,
            }
            return
          }

          const firstRow = Math.min(previousRow, currentRow)
          const secondRow = Math.max(previousRow, currentRow)
          let output = getMoveToTopPrefix(renderedLineCount)
          let currentRowOffset = 0
          for (const row of [firstRow, secondRow]) {
            const rowOffset = row - currentRowOffset
            if (rowOffset > 0) {
              output += `\x1b[${rowOffset}E`
            }
            const choiceIndex = nextWindowStart + row - 1
            const isSelected = choiceIndex === selectedIndex
            output += `${ANSI.clearLine}${getChoiceLine(choiceIndex, isSelected)}`
            currentRowOffset = row
          }

          if (currentRowOffset < renderedLineCount - 1) {
            output += `\x1b[${renderedLineCount - 1 - currentRowOffset}E`
          }

          process.stdout.write(output)
          lastFrame = {
            ...lastFrame,
            selectedIndex,
          }
          return
        }
      }

      const rendered = renderPrompt(
        message,
        getChoiceLine,
        choices,
        selectedIndex,
        effectivePageSize,
        styleDescription,
        selectedRenderedDescription,
      )
      const clearOutput = getRenderPrefix(renderedLineCount)
      renderedLineCount = rendered.lineCount
      process.stdout.write(`${clearOutput}${rendered.output}`)
      lastFrame = { ...rendered, selectedIndex }
    }

    const requestDraw = (): void => {
      if (pendingDrawScheduled || settled) return
      pendingDrawScheduled = true
      pendingDrawTask = setImmediate(() => {
        pendingDrawTask = null
        pendingDrawScheduled = false
        if (settled) return
        draw()
      })
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
        const nextIndex = nextUpIndexMap[selectedIndex]
        if (nextIndex === selectedIndex) return
        selectedIndex = nextIndex
        requestDraw()
        return
      }

      if (key.name === 'down' || key.name === 'j') {
        const nextIndex = nextDownIndexMap[selectedIndex]
        if (nextIndex === selectedIndex) return
        selectedIndex = nextIndex
        requestDraw()
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
