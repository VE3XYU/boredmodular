import React from 'react';
import ReactDOM from 'react-dom/client';
import BoredModularEmulator from './BoredModularEmulator';

// Load the Pixel Operator bitmap typeface from public/fonts/.
// The PUBLIC_URL prefix ensures the path resolves under GitHub Pages's
// /boredmodular/ subpath. If the font file isn't present, .load() rejects
// silently and the fallback chain (DM Mono → system monospace) renders.
const _fontBase = process.env.PUBLIC_URL || '';
[
  { weight: 'normal', file: 'PixelOperator' },
  { weight: 'bold',   file: 'PixelOperator-Bold' },
].forEach(({ weight, file }) => {
  const face = new FontFace(
    'Pixel Operator',
    `url(${_fontBase}/fonts/${file}.woff2) format('woff2'),
     url(${_fontBase}/fonts/${file}.ttf) format('truetype')`,
    { weight }
  );
  face.load()
    .then((loaded) => document.fonts.add(loaded))
    .catch(() => { /* file missing — fallback chain handles it */ });
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BoredModularEmulator />
  </React.StrictMode>
);
