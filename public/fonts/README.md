# Fonts

The UI uses **Pixel Operator** as its primary typeface. Both formats ship in
this directory:

- `PixelOperator.woff2` + `.ttf` — regular weight
- `PixelOperator-Bold.woff2` + `.ttf` — bold weight

The loader prefers woff2 (~73% smaller) and falls back to ttf if the woff2
fetch fails. To regenerate the woff2 files from the ttf source:

```bash
brew install woff2
cd public/fonts
woff2_compress PixelOperator.ttf
woff2_compress PixelOperator-Bold.ttf
```

## Where to get it

Pixel Operator is by Jayvee D. Enaguas (HarvettFox96) and licensed CC0 / public
domain. Canonical source: https://www.dafont.com/pixel-operator.font

## What happens without it

`src/index.js` loads the font via the FontFace API. If the file is missing,
the load promise rejects silently and SVG text renders in the fallback chain
(`'DM Mono', monospace`). The app still works — it just won't have the
bitmap aesthetic.
