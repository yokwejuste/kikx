# kikx brand

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="kikx-mark-white.svg">
    <img alt="The kikx mark" src="kikx-mark.svg" width="128">
  </picture>
</p>

The mark is a lowercase **k** whose lower stroke bends into a kicking foot, with the ball just leaving it.
It reads as the first letter of the name and as the action the tool performs: kicking real files into your
project.

## Files

| File | Use |
|-|-|
| `kikx-mark.svg` | The mark in black, on light backgrounds |
| `kikx-mark-white.svg` | The mark in white, on dark backgrounds |
| `kikx-favicon.svg` | Browser icon; follows the system light or dark theme |
| `kikx-app-icon.svg` | App icon: white mark on a black rounded square |
| `kikx.ico` | Windows icon, 16 to 256 px; embedded in `kikx.exe` |
| `kikx-social.png` | Repository social preview, 1280 × 640 |
| `png/` | The mark and app icon rendered at common sizes |

The SVG files are the masters. Everything else is generated from them:

```bash
make -C brand
make -C brand social FONT_DIR=/path/to/geist
```

`make` renders `png/` and `kikx.ico` and copies the icons into the dashboard, the docs and the CLI.
`social` redraws the social preview and needs the Geist Regular and Bold `.ttf` files.

## Colour

kikx is black and white. There is no accent colour.

| Name | Hex | Use |
|-|-|-|
| Ink | `#0a0a0a` | The mark, text and dark backgrounds |
| Paper | `#fafafa` | The mark on dark backgrounds |
| White | `#ffffff` | Light backgrounds |
| Muted | `#737373` | Secondary text on light backgrounds |
| Muted dark | `#a1a1a1` | Secondary text on dark backgrounds |
| Line | `#e5e5e5` | Borders and dividers |

## Type

The wordmark and interface use [Geist](https://vercel.com/font), set in lowercase: **kikx**, never
"Kikx" or "KIKX". Code and commands use Geist Mono.

## Usage

- Keep clear space around the mark equal to the diameter of the ball.
- Smallest sizes: 16 px for the app icon, 24 px for the mark on its own.
- Beside the wordmark, set the mark as tall as the wordmark's letters and leave half the mark's width
  between them.
- Use the black mark on light backgrounds and the white mark on dark ones. Do not place it on photos or patterns.
- Do not recolour, outline, rotate, stretch, add shadows to or redraw the mark.
