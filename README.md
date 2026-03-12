# termpal

**Terminal ANSI palette controller via OSC 4**

Modify the terminal **ANSI color palette** at runtime using the **OSC 4 escape sequence**.

This allows CLI tools to dynamically change the terminal theme or redefine standard ANSI colors.

---

## Features

* Modify **ANSI palette colors (0–15)**
* Semantic color keys (`red`, `blue`, `green`, etc.)
* Batch theme updates
* RGB or hex color input
* Safe environment detection (TTY / CI / `NO_COLOR`)

---

## Install

```bash
npm install termpal
```

---

## Usage

```ts
import { palette } from 'termpal'

palette.setColor('red', '#ff0000')
```

---

## Set Multiple Colors

```ts
palette.setTheme({
  red: '#f38ba8',
  green: '#a6e3a1',
  blue: '#89b4fa',
})
```

This sends a single **OSC 4 sequence** to update multiple palette slots.

---

## RGB Input

You can also pass RGB tuples:

```ts
palette.setColor('yellow', [255, 200, 0])
```

Which becomes:

```
rgb:ff/c8/00
```

---

## Supported Keys

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

Example:

```ts
palette.setColor('blueBright', '#89b4fa')
```

---

## Environment Detection

The library automatically disables itself when the terminal environment is unsuitable.

It will **not send OSC sequences** if:

* output is not a **TTY**
* running in **CI**
* the `NO_COLOR` environment variable is set

---

## How It Works

The library sends the **OSC 4 escape sequence**:

```
ESC ] 4 ; index ; color BEL
```

Example:

```
ESC ] 4 ; 1 ; #ff0000 BEL
```

This instructs the terminal to change **palette slot 1 (red)**.

---

## Terminal Support

OSC palette modification is supported by many modern terminals including:

* iTerm2
* kitty
* WezTerm
* xterm
* Windows Terminal

Support may vary across terminals.

---

## Example: Theme

```ts
palette.setTheme({
  red: '#F38BA8',
  green: '#A6E3A1',
  yellow: '#F9E2AF',
  blue: '#89B4FA',
  magenta: '#EE90DB',
  cyan: '#89DCEB',
  gray: '#6C7086',
})
```

---

## License

MIT
