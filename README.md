# echoo

Draw a line. Echo a song.

Echoo is a small static musical instrument for the browser. Draw on the grid and a black playhead moves from left to right. Every time it crosses a line, it plays a softly quantized piano note and marks the intersection with a black dot.

## Run locally

```bash
npm install
npm run dev
```

Build the static site with:

```bash
npm run build
```

## Share a song

The current composition, tempo, and drawing geometry are encoded in the `piece` query parameter. The Share button uses the native share sheet on supported mobile browsers and falls back to copying the URL to the clipboard.

No account, database, or server is required. Audio begins only after the user presses Play, which keeps the experience compatible with mobile autoplay policies.

## GitHub Pages

The included GitHub Actions workflow publishes the `dist` folder to GitHub Pages whenever `main` is updated. In the repository settings, set **Pages > Build and deployment > Source** to **GitHub Actions**.

The Vite base path is configured for this repository at `/echoo/`.