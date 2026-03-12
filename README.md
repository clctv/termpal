# 🎨 Termpal

> Shape your terminal theme in real time

## ✨ Features

- 🎯 Modify **ANSI palette colors (0–15)**
- 🏷️ Semantic color keys (`red`, `blue`, `green`, etc.)
- 📦 Batch theme updates
- 🌈 RGB or hex color input
- 🛡️ Safe environment detection (TTY / CI / `NO_COLOR`)

## 📦 Install

```bash
npm install termpal
```

## 🚀 Usage

```ts
import { palette } from 'termpal'

palette.setColor('red', '#ff0000')
```

## 🎨 Built-in Theme

```ts
import { palette } from 'termpal'

palette.use('Catppuccin')
```

## 🎛️ Set Multiple Colors

```ts
palette.setTheme({
  red: '#f38ba8',
  green: '#a6e3a1',
  yellow: '#f9e2af',
})
```

This sends a single **OSC 4 sequence** to update multiple palette slots.

## 🌈 RGB Input

You can also pass RGB tuples:

```ts
palette.setColor('yellow', [255, 200, 0])
```

Which becomes:

```
rgb:ff/c8/00
```

## 🧩 Supported Keys

The following ANSI palette keys are available:

| Key           | ANSI Index |
| ------------- | ---------- |
| black         | 0          |
| red           | 1          |
| green         | 2          |
| yellow        | 3          |
| blue          | 4          |
| magenta       | 5          |
| cyan          | 6          |
| white         | 7          |
| gray          | 8          |
| redBright     | 9          |
| greenBright   | 10         |
| yellowBright  | 11         |
| blueBright    | 12         |
| magentaBright | 13         |
| cyanBright    | 14         |
| whiteBright   | 15         |

## 🔍 Environment Detection

The library automatically disables itself when the terminal environment is unsuitable.

It will **not send OSC sequences** if:

- ❌ output is not a **TTY**
- 🤖 running in **CI**
- 🚫 the `NO_COLOR` environment variable is set

## ⚙️ How It Works

The library sends the **OSC 4 escape sequence**:

```
ESC ] 4 ; index ; color BEL
```

Example:

```
ESC ] 4 ; 1 ; #ff0000 BEL
```

This instructs the terminal to change **palette slot 1 (red)**.

## 🖥️ Terminal Support

OSC palette modification is supported by many modern terminals including:

- 🍎 iTerm2
- 🐱 kitty
- ⚡ WezTerm
- 🧪 xterm
- 🪟 Windows Terminal

Support may vary across terminals.

## 🎨 Example: Theme

```ts
palette.setTheme({
  red: '#f38ba8',
  green: '#a6e3a1',
  yellow: '#f9e2af',
  blue: '#89b4fa',
  magenta: '#ee90db',
  cyan: '#94e2d5',
  gray: '#6c7086',
})
```

## 📄 License

MIT
