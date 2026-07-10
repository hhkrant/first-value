# The keyless-demo proxy

The app is bring-your-own-key by default: a visitor pastes their Anthropic key
and it stays in their browser. To stand up a demo that runs without asking each
visitor for a key, put one key server-side in a proxy and point the app at it.
A key in client code is readable by anyone who opens the page, so a shared key
belongs only here.

Two implementations, pick one:

- [`cloudflare-worker.js`](./cloudflare-worker.js): a Cloudflare Worker.
- [`vercel-function.js`](./vercel-function.js): a Vercel serverless function.

Both hold the key as a server-side secret, pin the model, cap `max_tokens`, cap
the images and body size of a request, add prompt-cache hints to the repeated
prefix, and pass the Messages API response straight through, including
`stop_reason` and `usage`, so the app's truncation guard and shape validation see
real fields. See "Hardening and cost control" below.

## Cloudflare Worker

The worker ships with a [`wrangler.toml`](./wrangler.toml). Deploy from the
`proxy/` directory:

```bash
npm i -g wrangler
wrangler login                             # opens the browser to your Cloudflare account
cd proxy
wrangler secret put ANTHROPIC_API_KEY      # paste the key when prompted
wrangler deploy
```

That gives a working proxy with the model pin, token cap, image and body caps,
and prompt caching. Two steps before you make it public:

1. **Turn on rate limiting.** Create the KV namespace and bind it:

   ```bash
   wrangler kv namespace create RATE_LIMIT
   ```

   Uncomment the `[[kv_namespaces]]` block in `wrangler.toml`, paste the returned
   id, and `wrangler deploy` again. Tune `RATE_LIMIT_PER_IP` and
   `GLOBAL_DAILY_CAP` at the top of `cloudflare-worker.js` to taste.

2. **Lock the origin.** Set `ALLOWED_ORIGINS` in `cloudflare-worker.js` to your
   deployed app URL (not `localhost`), then `wrangler deploy` once more.

Then build the app pointed at the worker:

```bash
VITE_PROXY_URL=https://first-value-proxy.<you>.workers.dev npm run build
```

### Deploying the site itself (Cloudflare Pages)

The static site is a separate deploy from the proxy Worker above, on Cloudflare's
Git-connected Pages pipeline:

1. Cloudflare dashboard, Workers & Pages, Create, Pages, Connect to Git, and pick
   this repo (private repos work).
2. Build command `npm run build`, output directory `dist`, root path `/`.
3. Environment variable `VITE_PROXY_URL` set to the Worker URL from the step
   above.
4. Deploy. Every push to the connected branch rebuilds and redeploys
   automatically from then on.

This deploy step needs Vite 6 or later: Cloudflare's build auto-detects a Vite
project and tries to wire its own Vite integration during `wrangler deploy`,
which requires Vite 6+. If the build fails with a message naming the Vite
version, that is why. This repo is already pinned to a Vite 6 release for this
reason.

## Vercel function

```bash
cp proxy/vercel-function.js api/audit.js
# In the Vercel dashboard, set ANTHROPIC_API_KEY for the project.
VITE_PROXY_URL=/api/audit npm run build
npx vercel --prod
```

`/api/audit` is same-origin, so no CORS config is needed.

## What the app does with it

When the app is built with `VITE_PROXY_URL` set, it runs keyless: the key field
is gone, every audit routes through the proxy, and the browser never holds a key.
Built without it, the app is unchanged, straight to the Anthropic API with the
visitor's own key. The switch is [`src/App.jsx`](../src/App.jsx) reading
`import.meta.env.VITE_PROXY_URL`; the request path is
[`src/lib/anthropic.js`](../src/lib/anthropic.js) `runAudit`, which drops the key
and the browser-access header in proxy mode.

## Hardening and cost control

A shared key spends your money, so the proxy already limits what one request can
do and cuts the cost of the repeated parts:

- **Model pin and output cap.** A caller cannot swap in a more expensive model or
  raise `max_tokens` on your key.
- **Origin allowlist.** Casual use from other pages is blocked. Note this is not
  a strong control against a script: a non-browser client can send any `Origin`
  header, so treat the allowlist as a nuisance filter, not a wall.
- **Image and body caps.** One request is limited to ten images (the app's own
  cap) and about 12MB, so the expensive image-heavy path cannot be abused with an
  oversized payload. On Vercel, note the platform also caps the body near 4.5MB by
  default, below a full ten-screenshot flow, so the image-heavy path suits the
  Cloudflare Worker.
- **Prompt caching.** The system prompt is identical on every audit and the
  screenshots repeat across re-runs of the same flow, so the proxy marks that
  prefix with `cache_control`. When many visitors run the same preselected
  example, the large repeated tokens are billed once per cache window, not once
  per visitor. Caching is best-effort: a prefix below the model minimum is simply
  not cached.

### For go-live

- **Rate limiting.** Built into the Cloudflare Worker: per-IP to stop one visitor
  hammering Run, plus a global daily cap as a budget ceiling (a per-IP limit alone
  does nothing against IP rotation). Turn it on by binding the KV namespace, as in
  the Cloudflare steps above. On Vercel this is not wired up; it would need Vercel
  KV or Upstash.
- **A spend limit on the key.** Set a hard monthly cap in the Anthropic console.
  This is the one guarantee that holds even if a limit above has a gap, so do it
  regardless of the rate limiting.
- **Optional: pin the system prompt.** The proxy forwards whatever `system` the
  client sends, so in principle it could be driven with other prompts. To close
  that, validate `system` against the three committed prompts (auditor, critic,
  reconciler) before forwarding. This couples the proxy to the prompt text, so it
  is left off by default.

For a private, unshared portfolio demo the built-in caps are usually enough. Add
the go-live controls before posting the URL anywhere public, or keep the app
bring-your-own-key.
