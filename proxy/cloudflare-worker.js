// Cloudflare Worker: the keyless-demo proxy.
//
// This holds one Anthropic API key server-side (as a Worker secret) and forwards
// the app's request to the Messages API, so a deployed First Value URL can run a
// real audit without asking each visitor for a key. The app points at this
// Worker when it is built with VITE_PROXY_URL set to the Worker URL.
//
// A key in client code is readable by anyone who opens the page, so a shared key
// only belongs here, server-side, behind an origin allowlist. This is the proxy
// the README refers to, built rather than described.
//
// Deploy (Wrangler, one time):
//   npm i -g wrangler
//   wrangler deploy proxy/cloudflare-worker.js --name first-value-proxy \
//     --compatibility-date 2024-11-01
//   wrangler secret put ANTHROPIC_API_KEY   # paste the key when prompted
// Then set ALLOWED_ORIGINS below to your deployed app origin and redeploy, and
// build the app with VITE_PROXY_URL=https://first-value-proxy.<you>.workers.dev

// Origins allowed to call this proxy. Lock this to your deployed app so the
// shared key cannot be spent from arbitrary pages. '*' is for local testing
// only; do not ship it. localhost stays listed alongside the live site so
// `npm run dev` against this deployed proxy still works.
const ALLOWED_ORIGINS = ['http://localhost:5173', 'https://first-value.hhkrant.workers.dev']

// A shared key should not fund arbitrary long generations, so cap the output.
// The app asks for 4096; this ceiling matches it.
const MAX_TOKENS_CEILING = 4096
const MODEL = 'claude-sonnet-4-5-20250929'

// Hardening for a shared demo key, on top of the model pin and token ceiling.
// The caps bound what one request can cost; the cache hints cut the per-audit
// cost by reusing the large repeated prefix (the system prompt, and any
// screenshots) that every audit and every re-run of the same flow send again.
const MAX_IMAGES = 10 // matches the app's screenshot cap (MAX_SCREENSHOTS)
const MAX_BODY_BYTES = 12 * 1024 * 1024 // about 12MB, generous for ten screenshots

// Rate limiting. Applied only when a RATE_LIMIT KV namespace is bound (see
// proxy/README.md); without it the worker still runs, just unthrottled. Each
// audit is two to three requests, so the limits below are in requests. KV is
// eventually consistent, so treat these as deterrents on top of the hard spend
// cap set on the key itself, not exact guarantees.
const RATE_WINDOW_SECONDS = 60
const RATE_LIMIT_PER_IP = 20 // about seven audits per minute from one IP
const GLOBAL_DAILY_CAP = 900 // about three hundred audits per day, all visitors

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'access-control-allow-origin': allow,
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'access-control-max-age': '86400',
  }
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('origin') || ''
    const cors = corsHeaders(origin)

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors })
    }
    if (request.method !== 'POST') {
      return json({ error: { message: 'Use POST.' } }, 405, cors)
    }
    if (ALLOWED_ORIGINS[0] !== '*' && !ALLOWED_ORIGINS.includes(origin)) {
      return json({ error: { message: 'Origin not allowed.' } }, 403, cors)
    }
    if (!env.ANTHROPIC_API_KEY) {
      return json({ error: { message: 'Proxy is missing its key.' } }, 500, cors)
    }

    // Rate limiting, checked before the body is read so a throttled caller costs
    // as little as possible. Skipped when no KV namespace is bound.
    if (env.RATE_LIMIT) {
      const ip = request.headers.get('cf-connecting-ip') || 'unknown'
      const nowSec = Math.floor(Date.now() / 1000)

      // Per IP: cap requests in a short rolling window so one visitor cannot
      // hammer Run. A 429 tells the app to wait and retry.
      const ipKey = `ip:${ip}:${Math.floor(nowSec / RATE_WINDOW_SECONDS)}`
      const ipCount = Number(await env.RATE_LIMIT.get(ipKey)) || 0
      if (ipCount >= RATE_LIMIT_PER_IP) {
        return json({ error: { message: 'Too many requests from here. Wait a minute and try again.' } }, 429, cors)
      }
      await env.RATE_LIMIT.put(ipKey, String(ipCount + 1), { expirationTtl: RATE_WINDOW_SECONDS * 2 })

      // Global: a daily ceiling across all visitors so a shared key cannot be run
      // up without bound. The day is UTC. Returned as 503 with a clear message,
      // which the app surfaces directly (it passes a non-429 error through).
      const dayKey = `global:${new Date().toISOString().slice(0, 10)}`
      const dayCount = Number(await env.RATE_LIMIT.get(dayKey)) || 0
      if (dayCount >= GLOBAL_DAILY_CAP) {
        return json(
          { error: { message: 'The shared demo has reached its limit for today. Try again tomorrow, or run it locally with your own key.' } },
          503,
          cors,
        )
      }
      await env.RATE_LIMIT.put(dayKey, String(dayCount + 1), { expirationTtl: 172800 })
    }

    const raw = await request.text()
    if (raw.length > MAX_BODY_BYTES) {
      return json({ error: { message: 'Request is too large for the demo.' } }, 413, cors)
    }
    let payload
    try {
      payload = JSON.parse(raw)
    } catch {
      return json({ error: { message: 'Body must be JSON.' } }, 400, cors)
    }
    if (!payload || !Array.isArray(payload.messages)) {
      return json({ error: { message: 'Request needs a messages array.' } }, 400, cors)
    }
    if (countImages(payload.messages) > MAX_IMAGES) {
      return json({ error: { message: `Too many images; the demo caps at ${MAX_IMAGES}.` } }, 413, cors)
    }

    // Pin the model and cap the output server-side. The client sends the
    // committed system prompt; forward it, but do not let a caller raise the
    // token ceiling or swap in a different, more expensive model on a shared key.
    // withCaching adds prompt-cache breakpoints to the repeated prefix.
    const upstreamBody = withCaching({
      model: MODEL,
      max_tokens: Math.min(Number(payload.max_tokens) || MAX_TOKENS_CEILING, MAX_TOKENS_CEILING),
      system: payload.system,
      messages: payload.messages,
    })

    let upstream
    try {
      upstream = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify(upstreamBody),
      })
    } catch {
      return json({ error: { message: 'Could not reach the Anthropic API.' } }, 502, cors)
    }

    // Pass the Messages API response straight through, including stop_reason and
    // usage, so the app's truncation guard and shape validation see real fields.
    const body = await upstream.text()
    return new Response(body, {
      status: upstream.status,
      headers: { ...cors, 'content-type': 'application/json' },
    })
  },
}

function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...cors, 'content-type': 'application/json' },
  })
}

// Count image blocks across all messages, so one shared request cannot send more
// screenshots than the app itself allows.
function countImages(messages) {
  let n = 0
  for (const m of messages) {
    if (!m || !Array.isArray(m.content)) continue
    for (const b of m.content) if (b && b.type === 'image') n++
  }
  return n
}

// Add prompt-cache breakpoints to the large, repeated parts of the request. The
// system prompt is identical on every audit, and screenshots repeat across a
// flow's re-runs, so caching that prefix means the shared key is not billed full
// price for the same tokens again within the cache window. Prompt caching is
// generally available, so no beta header is needed, and it is best-effort: a
// prefix below the model's minimum is simply not cached, with no error.
function withCaching(body) {
  if (typeof body.system === 'string' && body.system.length > 0) {
    body.system = [{ type: 'text', text: body.system, cache_control: { type: 'ephemeral' } }]
  }
  for (const m of body.messages) {
    if (!m || !Array.isArray(m.content)) continue
    const images = m.content.filter((b) => b && b.type === 'image')
    if (images.length) {
      images[images.length - 1].cache_control = { type: 'ephemeral' }
      break // one cached image prefix (the first user message) is enough
    }
  }
  return body
}
