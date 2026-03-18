# Termpal

> Shape your terminal theme in real time

## Highlights

- Elegant **built-in themes**
- Semantic color keys (`red`, `blue`, `green`, etc.)
- RGB or hex color input
- Safe environment detection (TTY / CI / `NO_COLOR`)

## CLI

### Install globally

```bash
npm i -g termpal
```

Open interactive picker (applies theme to the current terminal session only):

```bash
termpal
```

### Persistence

Install auto-apply into your shell profile:

```bash
termpal install
```

Remove auto-apply from your shell profile:

```bash
termpal uninstall
```

## API

### Install

```bash
npm i termpal
```

### Use built-in themes

```ts
import { termpal } from 'termpal'

termpal.use('Catppuccin')
```

#### Supported themes

- `Catppuccin`
- `Dracula`
- `TokyoNight`
- `Nord`
- `OneDark`
- `Gruvbox`
- `SolarizedDark`
- `MonokaiPro`
- `MonokaiDimmed`
- `GitHubDark`
- `AyuDark`

### Set colors manually

```ts
import { termpal } from 'termpal'

termpal.set({
  red: '#f38ba8',
  green: '#a6e3a1',
  yellow: [255, 200, 0],
})
```

#### Supported keys

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

### Reset palette

```ts
import { termpal } from 'termpal'

termpal.reset()
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
