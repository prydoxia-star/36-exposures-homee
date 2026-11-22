# 36 EXPOSURES — Multi-page website

A Vite-built multi-page site for the fictional Singapore analogue photography studio 36 EXPOSURES.

## Pages

- `index.html` — Home / hero page
- `about.html` — Company history, mission, vision and values
- `products.html` — Film-strip product and service catalogue
- `contact.html` — Contact information

Each page contains its own real HTML structure and links to the same shared stylesheet at the shared root-level `styles.css` file. Page-specific behaviour lives in small TypeScript entry files:

- `src/main.tsx` — Three.js camera, intro transition and 3D hanging bulb
- `src/about.ts` — About Us selector
- `src/products.ts` — Draggable / scrollable seamless film catalogues and product detail modal

## Run locally

```bash
npm install
npm run dev
```

## Build for hosting

```bash
npm run build
npm run preview
```

The multi-page build produces separate `index.html`, `about.html`, `products.html` and `contact.html` files in `dist/`. Navigation uses direct `.html` links, so the About and Products pages do not depend on a single-page-app fallback rewrite. Upload the **contents of `dist/`** to a static host such as Netlify, Vercel or Cloudflare Pages.

## Notes

- The intro animation plays on fresh entry and reload. Clicking an internal navigation link sets a one-use session flag so the next page skips the intro.
- The site hides visible scrollbars while keeping normal page scrolling enabled.
- Product photography uses remote Unsplash image URLs.
- `hello@36exposures.sg` is a placeholder studio email and should be replaced if a real address is assigned.
