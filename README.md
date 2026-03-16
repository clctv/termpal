# Termpal

> Shape your terminal theme in real time

## Highlights

- Semantic color keys (`red`, `blue`, `green`, etc.)
- Elegant **built-in themes**
- RGB or hex color input
- Safe environment detection (TTY / CI / `NO_COLOR`)

## Install

```bash
npm install termpal
```

## Usage

```ts
import { termpal } from 'termpal'

termpal.set({
  red: '#f38ba8',
  green: '#a6e3a1',
  yellow: '#f9e2af',
})
```

### Supported Keys

- `black`
- `red`
- `green`
- `yellow`
- `blue`
- `magenta`
- `cyan`
- `white`
- `gray`
- `redBright`
- `greenBright`
- `yellowBright`
- `blueBright`
- `magentaBright`
- `cyanBright`
- `whiteBright`

## Built-in Themes

```ts
import { termpal } from 'termpal'

termpal.use('Catppuccin')
```

### Supported themes

- `Catppuccin`
- `Dracula`
- `TokyoNight`
- `Nord`
- `OneDark`
- `Gruvbox`
- `SolarizedDark`
- `Monokai`
- `RosePine`
- `NightOwl`

## RGB Input

You can also pass RGB tuples:

```ts
termpal.set({
  yellow: [255, 200, 0],
})
```

## Environment Detection

The library automatically disables itself when the terminal environment is unsuitable.

It will **not send OSC sequences** if:

- output is not a **TTY**
- running in **CI**
- the `NO_COLOR` environment variable is set

## How It Works

The library sends the **OSC 4 escape sequence**:

```
ESC ] 4 ; index ; color BEL
```

Example:

```
ESC ] 4 ; 1 ; #f38ba8 BEL
```

This instructs the terminal to change **palette slot 1 (red)**.

## Terminal Support

OSC palette modification is supported by many modern terminals including:

- iTerm2
- kitty
- WezTerm
- xterm
- Windows Terminal

Support may vary across terminals.

## License

MIT
