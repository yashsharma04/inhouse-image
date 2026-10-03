# Inhouse Image

Private image tools that run entirely in the browser: convert, compress, and resize.
JPEG, PNG, WebP, and HEIC in. JPEG, PNG, or WebP out. Files never leave the device.
A Quiet Labs project.

## Development

```sh
npm install
npm run dev        # http://localhost:4321
npm test           # unit + component tests
npm run check      # type check
npm run build      # static site in dist/
npm run preview    # serve dist/ (needed to test the CSP, which is not applied in dev)
```

## How it is built

- **Astro** renders static, SEO-friendly pages. The convert tool is a React island.
- **Image logic** lives in `src/lib/image`. JPEG/PNG/WebP use `createImageBitmap` and
  `OffscreenCanvas`. HEIC is decoded with `heic-decode` (libheif WASM) and never written.
- Work runs in a Web Worker (`src/workers`) behind a small typed job protocol.
- **Privacy** is enforced by a Content-Security-Policy (`astro.config.mjs`, plus `public/_headers`
  for workers) that only allows connections to this origin and Cloudflare Web Analytics.
- Product name, domain, and links: `src/site.ts`. Tool page copy and FAQs: `src/tools.ts`.

## Scripts

- `node scripts/make-og.mjs` regenerates the social preview image `public/og.png`.

## Deploying (Cloudflare Pages)

- Build command `npm run build`, output directory `dist`, Node 22.12+.
- `wrangler.jsonc` is used if you deploy as a Worker. Pages serves `404.html` on its own.
- Enable Web Analytics in the project settings (it injects the cookieless beacon the CSP allows).
- Canonical URLs, sitemap, robots.txt, and OG tags come from `src/site.ts`.
  The site uses `https://inhouse-image.pages.dev`. Change `site.url` if the host changes.

## License

MIT. The bundled HEIC decoder is [libheif](https://github.com/strukturag/libheif) (LGPL-3.0)
via [libheif-js](https://github.com/catdad-experiments/libheif-js). See [LICENSE](LICENSE).
