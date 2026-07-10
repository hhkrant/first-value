// Vercel serverless function: the keyless-demo proxy, same job as the Cloudflare
// Worker, for a Vercel deploy. Copy this to api/audit.js in the project, set the
// ANTHROPIC_API_KEY environment variable in the Vercel dashboard, and build the
// app with VITE_PROXY_URL=/api/audit. Same-origin, so no CORS config is needed.
//
// A key in client code is readable by anyone who opens the page, so the shared
// key lives here, server-side, never in the bundle.

const MAX_TOKENS_CEILING = 4096
const MODEL = 'claude-sonnet-4-5-20250929'

// Hardening for a shared demo key, on top of the model pin and token ceiling.
// The image cap bounds one request's cost; withCaching cuts the per-audit cost by
// reusing the repeated prefix (the system prompt and any screenshots). Note that
// Vercel serverless caps the request body near 4.5MB by default, below a full
// ten-screenshot flow, so the image-heavy path suits the Cloudflare Worker; this
// function fits text and light-image flows. Per-IP and daily-total rate limiting
// is the go-live step (Vercel KV or Upstash) plus a spend limit on the key.
const MAX_IMAGES = 10 // matches the app's screenshot cap (MAX_SCREENSHOTS)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: { message: 'Use POST.' } })
    return
  }
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) {
    res.status(500).json({ error: { message: 'Proxy is missing its key.' } })
    return
  }

  const payload = req.body || {}
  if (!Array.isArray(payload.messages)) {
    res.status(400).json({ error: { message: 'Request needs a messages array.' } })
    return
  }
  if (countImages(payload.messages) > MAX_IMAGES) {
    res.status(413).json({ error: { message: `Too many images; the demo caps at ${MAX_IMAGES}.` } })
    return
  }

  // Pin the model and cap the output on a shared key. withCaching adds
  // prompt-cache breakpoints to the repeated prefix.
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
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify(upstreamBody),
    })
  } catch {
    res.status(502).json({ error: { message: 'Could not reach the Anthropic API.' } })
    return
  }

  // Pass the response straight through, including stop_reason and usage, so the
  // app's truncation guard and shape validation see the real API fields.
  const text = await upstream.text()
  res.status(upstream.status)
  res.setHeader('content-type', 'application/json')
  res.send(text)
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
