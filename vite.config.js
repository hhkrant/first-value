import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Standard React setup. No backend in v1: the app calls the Anthropic
// Messages API directly from the browser with a key the visitor supplies.
// No Cloudflare-specific plugin here on purpose: this SPA calls the proxy
// Worker over plain fetch and uses no Workers bindings inside Vite itself, so
// `npm install && npm run dev` stays free of any Cloudflare dependency for
// the local and bring-your-own-key paths. The deployed site's Worker config
// lives in wrangler.jsonc and is applied by `wrangler deploy`, independent of
// this file.
//
// base is relative so the built dist/ runs from any host and any path: a
// project subpath on GitHub Pages (/first-value/), the root of a Netlify or
// Vercel site, or a file opened locally. Absolute /assets paths would 404 on a
// subpath, so relative is the portable choice for a static, backend-free app.
export default defineConfig({
  base: './',
  plugins: [react()],
})