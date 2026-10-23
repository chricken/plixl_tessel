# plixl tessel

Web app that creates an image mosaic from many images. Pure HTML/CSS/vanilla JS
(ES2023 modules), image processing via the Canvas API, compute-heavy steps run
in a web worker.

## Running

The app needs a local web server (default source images are loaded via `fetch`):

```sh
# Option 1
python -m http.server 8000

# Option 2
npx serve .
```

Then open http://localhost:8000.

Without a server, drag & drop and file selection still work — only the default
source images under `images/source/` are unreachable.

## Configuration

All defaults live in `assets/js/settings.js`:

```js
export const settings = {
  defaultWidth: 1280, // rendered image width (height defaults to 16:9)
  defaultStrategy: 'brightness-color',
  defaultLayout: 'grid',
  defaultKeepAspectRatio: false,
  defaultNumberOfImages: 200,
  defaultSourceFolders: ['space', 'animals'],
  fileNameTemplate: 'img_####.jpg',
};
```

## Default source images

Place images in `images/source/<folder>/` (one of `defaultSourceFolders`) and name
them according to `fileNameTemplate` — the first run of `#` is replaced by the
zero-padded image number, starting at 1. With the default template
`img_####.jpg` the files must be named:

```
images/source/space/img_0001.jpg
images/source/space/img_0002.jpg
images/source/space/img_0003.jpg
...
```

Loading stops at the first missing number (404), so the numbering must be
gapless. "Load default images" fetches all configured folders.

## Usage

1. Load source images: drag & drop into the drop zone or click to select.
   Alternatively click "Load default images" to load the configured folders.
2. Select a target image (a single image). If "Adjust resolution to target image
   aspect ratio" is checked, the target resolution is adapted to the image's
   aspect ratio (the pixel count stays roughly the same) — and while you edit
   width or height manually, the other value follows automatically.
3. Adjust settings: target resolution, number of images (slider up to 10000, or
   type a larger number manually), strategy (random / brightness / color /
   brightness and color), layout (grid / stochastic — with an extra slider for
   the image size as a percentage of the total area, adjustable in 0.001 steps),
   angle range, overlap, aspect ratio, background color (custom color or the
   target's average color).
4. Click "Create mosaic" — a progress bar shows the rendering progress — and
   download the result as PNG. The slider below the output fades the mosaic in
   and out — underneath it, the target image preview shows through.

The same image is never placed directly next to itself when enough source
images are available.

## Architecture

- `assets/js/settings.js` — central defaults
- `assets/js/components/` — UI components (Mosaic, inputs, Progress, ImagePreview)
- `assets/js/utils/` — helpers, color utils, tile-source abstraction
- `assets/js/workers/processImages.js` — processes source images in the background
  (scales them, analyzes color/brightness via a 1×1 pixel render)

The tile source is abstract (`TileSource` in `utils/tileSource.js`): ASCII art or
emojis can be added later as mosaic material without changing the engine.
