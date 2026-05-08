# Fonts

The UI uses **Pixel Operator** as its primary typeface. The font isn't checked
in — drop the files here yourself:

- `PixelOperator.woff2` (or `.ttf`) — regular weight
- `PixelOperator-Bold.woff2` (or `.ttf`) — bold weight

Either format works; the loader tries woff2 first, falls back to ttf.

## Where to get it

Pixel Operator is by Jayvee D. Enaguas (HarvettFox96) and licensed CC0 / public
domain. Canonical source: https://www.dafont.com/pixel-operator.font

## What happens without it

`src/index.js` loads the font via the FontFace API. If the file is missing,
the load promise rejects silently and SVG text renders in the fallback chain
(`'DM Mono', monospace`). The app still works — it just won't have the
bitmap aesthetic.
