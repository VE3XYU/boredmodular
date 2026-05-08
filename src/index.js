import React from 'react';
import ReactDOM from 'react-dom/client';
import BoredModularEmulator from './BoredModularEmulator';

// Load the Pixel Operator bitmap typeface from public/fonts/.
// PUBLIC_URL prefix makes paths resolve under GitHub Pages's /boredmodular/
// subpath. Try woff2 first (smaller); on failure fall back to ttf. The
// FontFace API does not auto-fall-back through comma-separated url() like
// CSS @font-face does — a 404 on the first url() rejects the load even if a
// later url() would have worked. So we manually retry.
const _fontBase = process.env.PUBLIC_URL || '';
const _tryLoadFont = (family, file, weight) => {
  const make = (ext, format) => new FontFace(
    family,
    `url(${_fontBase}/fonts/${file}.${ext}) format('${format}')`,
    { weight }
  );
  return make('woff2', 'woff2').load()
    .catch(() => make('ttf', 'truetype').load())
    .then((loaded) => document.fonts.add(loaded))
    .catch(() => { /* both formats missing — fallback chain handles it */ });
};
_tryLoadFont('Pixel Operator', 'PixelOperator', 'normal');
_tryLoadFont('Pixel Operator', 'PixelOperator-Bold', 'bold');

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BoredModularEmulator />
  </React.StrictMode>
);
