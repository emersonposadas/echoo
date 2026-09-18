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

The included GitHub Actions workflow builds the app and commits the generated `index.html` and `assets` to `main` automatically whenever `main` is updated. No manual workflow run or Pages source change is required: push to GitHub and the existing branch-based Pages site receives the compiled files.

The Vite base path is configured for this repository at `/echoo/`.