# paper_web

A static paper project page template (Nerfies-style structure).

## Usage

- Open `index.html` directly in your browser, or
- Start a local static server in this directory (optional)

Example:

```bash
cd /data/zhaoshuyu/paper_web
python3 -m http.server 8000
```

Then visit: `http://localhost:8000/`

## Where to edit

- Title/authors/links: the Hero section in `index.html`
- Abstract/Method/Qualitative: corresponding sections in `index.html`
- Results images: the "Results Images" section (replace `static/images/placeholder.svg` with your own paths)
- Results carousel data: `groups` array in `static/results_images.js`
- Metrics examples: `examples` array in `static/metrics_gallery.js`
