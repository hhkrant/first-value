import { SYSTEM_PROMPT, CRITIC_PROMPT, RECONCILER_PROMPT } from './framework.js'
import { splitDurableValue } from './audit.js'

// runAudit calls the Anthropic Messages API and returns a parsed Audit object.
// No backend needed, no SDK: one fetch, one response.
//
// Two modes, same code path:
//   1. Bring-your-own-key (default). The key is passed in by the caller (App
//      reads it from a field backed by localStorage) and is never hardcoded,
//      never logged, never committed. The call goes straight to the Anthropic
//      API with the direct-browser-access header.
//   2. Keyless proxy. If the caller passes a proxyUrl (App reads it from the
//      build-time VITE_PROXY_URL), the request goes to that proxy instead, with
//      no key in the browser. The proxy holds one key server-side and forwards
//      to the Messages API. This is the keyless click-through demo: a reviewer
//      runs a real audit without pasting anything. See proxy/ for the worker.
//
// Contract:
//   runAudit({ apiKey, description, images, proxyUrl }) -> Promise<Audit>
//   Audit = {
//     firstValueMoment: string,
//     frictionScore: number,        // integer 0-100, higher = more friction to first value
//     frictionRationale: string,    // one line
//     recurrenceSignal: string,     // 'strong' | 'weak' | 'absent' -- does value recur
//     durableValue: string,         // step 2: whether value keeps showing up
//     topDropOff: string,
//     scopeNote: string,            // what the read covers and where it stops
//     experiments: [ {
//       hypothesis: string,
//       rationale: string,
//       lever: string,              // 'value-moment' | 'durable-value' | 'funnel-only'
//     } ]                           // exactly 3, ranked by speed-to-value; funnel-only ranks last
//   }

const API_URL = 'https://api.anthropic.com/v1/messages'
// claude-sonnet-4-5 reads screenshots (vision) and returns strict JSON. This is
// a real, dated Anthropic model identifier, so a live call resolves instead of
// 400ing. Sonnet is the right tier here: the read is bounded (name a value
// moment, score friction, rank three experiments), so paying for Opus buys
// nothing the framework needs.
const MODEL = 'claude-sonnet-4-5-20250929'
// The audit is a full JSON object: a named value moment, a friction rationale, a
// two-part durableValue read, a drop-off, and three experiments each with a
// hypothesis and a rationale. A durableValue that connects friction and
// recurrence plus three full experiments runs long, so the ceiling is set well
// above a typical run to keep the JSON from being cut mid-object. If a run still
// hits the ceiling, extractAuditText catches the truncation and says so rather
// than handing a half-object to the parser.
const MAX_TOKENS = 4096
const ANTHROPIC_VERSION = '2023-06-01'
// Retry once on a transient overload (429 or 529). One retry with a short pause
// covers the common momentary spike without turning a hard failure into a hang.
const OVERLOAD_RETRY_DELAY_MS = 1500

// Read the raw base64 payload from an uploaded image. App.jsx sends
// { mediaType, base64, name }; a caller can also hand us a full data URL string
// or a { data } object. Strip any "data:image/png;base64," prefix, because the
// Anthropic image source wants the raw base64 only.
function toBase64Data(image) {
  const raw =
    typeof image === 'string'
      ? image
      : image?.base64 != null
        ? image.base64
        : image?.data
  if (!raw) return null
  const comma = raw.indexOf(',')
  return raw.startsWith('data:') && comma !== -1 ? raw.slice(comma + 1) : raw
}

function toMediaType(image) {
  // Prefer an explicit media type; otherwise read it from a data URL prefix;
  // otherwise default to PNG, which the API accepts for screenshots.
  if (image && typeof image === 'object' && image.mediaType) return image.mediaType
  const raw =
    typeof image === 'string'
      ? image
      : image?.base64 != null
        ? image.base64
        : image?.data
  if (typeof raw === 'string' && raw.startsWith('data:')) {
    const match = raw.slice(5).split(';', 1)[0]
    if (match) return match
  }
  return 'image/png'
}

// Pull a JSON object out of model response text. The system prompts forbid
// markdown fences and prose, but we parse defensively anyway: try the whole
// string first, then fall back to the first {...} span. Shared by parseAudit,
// parseCritique, and parseReconciled so all three stages recover loose or
// fenced JSON the same way.
export function parseJsonLoose(text) {
  const trimmed = (text || '').trim()

  const attempts = [trimmed]
  const first = trimmed.indexOf('{')
  const last = trimmed.lastIndexOf('}')
  if (first !== -1 && last > first) {
    attempts.push(trimmed.slice(first, last + 1))
  }

  for (const candidate of attempts) {
    try {
      return JSON.parse(candidate)
    } catch {
      // try the next candidate
    }
  }

  throw new Error(
    'The model did not return valid JSON. Try running the audit again.'
  )
}

// Parse the auditor's JSON out of the response text.
export function parseAudit(text) {
  return parseJsonLoose(text)
}

// Pull the audit text out of a Messages API response body, but refuse a
// truncated one first. When the model hits max_tokens the response comes back
// with stop_reason "max_tokens" and the JSON is cut off mid-object, so parsing
// it would fail with a confusing "not valid JSON" error that hides the real
// cause. Detect that case and say plainly that the response was cut short, so
// the message names the length limit instead of blaming the JSON. Any other
// stop_reason (end_turn, stop_sequence) is a complete response and passes
// through. Exported so the truncation guard is covered by a test.
export function extractAuditText(body) {
  if (body && body.stop_reason === 'max_tokens') {
    throw new Error(
      'The response was cut off at the output length limit before the audit finished, so it is incomplete. Run the audit again.',
    )
  }
  return (body?.content || [])
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('')
}

// Enforce the ranking in code rather than trusting the model's returned order.
// The README claims the artifact holds the value-first, funnel-last line, so the
// app has to hold it even if a response comes back mis-sorted. Any experiment
// tagged funnel-only is pinned to the last position; the value-moment and
// durable-value experiments keep their returned relative order ahead of it. A
// stable sort preserves that order (value-moment and durable-value compare
// equal here, so their model-given sequence, already the speed-to-value order
// with the durable-value tie-break, is left intact). This makes position 3 a
// property of the code, not a hope about the model.
export function enforceRanking(audit) {
  if (!audit || !Array.isArray(audit.experiments)) return audit
  const rank = (exp) => (exp && exp.lever === 'funnel-only' ? 1 : 0)
  audit.experiments = audit.experiments
    .map((exp, i) => ({ exp, i }))
    .sort((a, b) => rank(a.exp) - rank(b.exp) || a.i - b.i)
    .map(({ exp }) => exp)
  return audit
}

export function validateAudit(audit) {
  // The framework is only demonstrated if the artifact holds the line: exactly
  // three experiments, an integer friction score in range, a retention read,
  // and every experiment carrying a hypothesis, a rationale, and a durability
  // tag. Check the shape here so a malformed response surfaces a plain error
  // instead of rendering blank ranks or an out-of-range score.
  const isString = (v) => typeof v === 'string' && v.trim().length > 0

  const problems = []
  if (!audit || typeof audit !== 'object') {
    throw new Error('The model returned JSON in an unexpected shape.')
  }
  if (!isString(audit.firstValueMoment)) problems.push('firstValueMoment')
  if (!isString(audit.frictionRationale)) problems.push('frictionRationale')
  if (!isString(audit.topDropOff)) problems.push('topDropOff')
  if (!isString(audit.durableValue)) problems.push('durableValue')
  if (!isString(audit.scopeNote)) problems.push('scopeNote')

  if (
    typeof audit.frictionScore !== 'number' ||
    !Number.isInteger(audit.frictionScore) ||
    audit.frictionScore < 0 ||
    audit.frictionScore > 100
  ) {
    problems.push('frictionScore (must be an integer 0-100)')
  }

  if (
    typeof audit.recurrenceSignal !== 'string' ||
    !['strong', 'weak', 'absent'].includes(audit.recurrenceSignal)
  ) {
    problems.push('recurrenceSignal (must be strong, weak, or absent)')
  }

  if (!Array.isArray(audit.experiments) || audit.experiments.length !== 3) {
    problems.push('experiments (must be exactly 3)')
  } else {
    audit.experiments.forEach((exp, i) => {
      if (!exp || typeof exp !== 'object') {
        problems.push(`experiments[${i}]`)
        return
      }
      if (!isString(exp.hypothesis)) problems.push(`experiments[${i}].hypothesis`)
      if (!isString(exp.rationale)) problems.push(`experiments[${i}].rationale`)
      if (
        typeof exp.lever !== 'string' ||
        !['value-moment', 'durable-value', 'funnel-only'].includes(exp.lever)
      ) {
        problems.push(`experiments[${i}].lever`)
      }
    })
  }

  if (problems.length > 0) {
    throw new Error(
      `The model returned JSON in an unexpected shape. Missing or invalid: ${problems.join(', ')}. Try running the audit again.`,
    )
  }
  return audit
}

// coherenceFlags red-teams the model's own output in code, after the ranking is
// enforced. This is the layer where code, not the model, adds a second read: it
// cross-checks the friction score, the recurrence signal, and the experiment
// ranking against the framework's own rules and surfaces where they disagree.
// The model can return a locally sensible audit that still violates the stance
// (speed an already-fast flow that has no return, celebrate a low friction score
// while recurrence is absent). These checks catch that deterministically, so the
// point of view holds even when a single response drifts. Returns an array of
// { level, message }; level is 'watch' (a likely misread) or 'note' (worth an
// eye). Pure: it reads the audit and mutates nothing.
// A refusal names no value moment. The durable-value split is the primary
// signal (a refusal has nothing to put under Retention:/Expansion:), but the
// model sometimes structures even a refusal with those labels, so also read the
// refusal straight from firstValueMoment, where the prompt tells it to say
// plainly that no value moment is described. A scored flow never phrases its
// firstValueMoment this way, so the match stays specific to a real refusal.
function looksLikeRefusal(audit) {
  if (splitDurableValue(audit.durableValue) === null) return true
  const fvm = (audit.firstValueMoment || '').toLowerCase()
  return /no value moment|does not describe a value|no real value moment/.test(fvm)
}

export function coherenceFlags(audit) {
  if (!audit || !Array.isArray(audit.experiments)) return []

  // Refusal case: the input described no value moment, so there is no activation
  // ranking to red-team, and the friction and recurrence heuristics below would
  // misfire on a zero-friction, absent-recurrence refusal. Return one clarifying
  // note instead of spurious watches.
  if (looksLikeRefusal(audit)) {
    return [
      {
        level: 'note',
        message:
          'This input did not describe a value moment, so there is no activation ranking to red-team. The reads below are the refusal, not a scored flow.',
      },
    ]
  }

  const flags = []
  const exps = audit.experiments
  const top = exps[0] || {}
  const hasDurable = exps.some((e) => e && e.lever === 'durable-value')
  const friction = typeof audit.frictionScore === 'number' ? audit.frictionScore : null
  const recurrence = audit.recurrenceSignal
  const durableText = (audit.durableValue || '').toLowerCase()

  // The framework's own rule: when recurrence is absent, the work is a reason to
  // come back, not a faster first hit. A value-moment lever leading here is
  // speeding the wrong thing.
  if (recurrence === 'absent' && top.lever === 'value-moment') {
    flags.push({
      level: 'watch',
      message:
        'Recurrence reads as absent, but the top experiment speeds the first hit. With no reason to return, the leading move should build recurrence, not shorten a path to a value that does not repeat.',
    })
  }

  // A fast first hit with absent recurrence and nothing in the ranking that
  // builds return is the vanity-activation trap the tool is built to name.
  if (friction != null && friction <= 33 && recurrence === 'absent' && !hasDurable) {
    flags.push({
      level: 'watch',
      message:
        'Activation is fast and recurrence is absent, yet no experiment builds durable value. The ranking is optimizing a funnel that will not retain.',
    })
  }

  // Strong recurrence that nothing in the experiments extends is a missed lever,
  // not a contradiction, so it is a lighter note.
  if (recurrence === 'strong' && !hasDurable) {
    flags.push({
      level: 'note',
      message:
        'Recurrence reads as strong, but no experiment builds on it. A durable-value move would compound a return the flow already earns.',
    })
  }

  // Friction and recurrence pointing opposite ways is the case durableValue is
  // supposed to resolve with a stated priority. If the score is high but
  // recurrence is strong (or the reverse) and the text never names which one
  // decides, flag that the single retention judgment is missing.
  const divergent =
    friction != null &&
    ((friction >= 67 && recurrence === 'strong') ||
      (friction <= 33 && recurrence === 'absent'))
  // The read resolves the friction/recurrence tension when it either names the
  // priority directly (priorit, matters more, outweigh, decides, ...) or uses
  // the framework's own prescribed resolution language for the absent-recurrence
  // case (a reason to come back, no reason to return, activation that will not
  // retain, not a shorter path to a first hit, does not build a business). The
  // sharpened recurrence read phrases the absent case as "no reason to return",
  // so that counts as naming the priority too. The multi-word phrases are
  // preferred over single keywords: matching a bare "retain" would risk
  // suppressing this note on an audit that mentions the word without stating the
  // priority. That leaves a small false-negative window, acceptable given the
  // deterministic goal.
  const namesPriority =
    /priorit|matters more|outweigh|decides|over the|beats |reason to come back|no reason to return|will not retain|not a shorter path|does not build a business/.test(
      durableText,
    )
  if (divergent && !namesPriority) {
    flags.push({
      level: 'note',
      message:
        'Friction and recurrence point in different directions here, but the durable-value read does not say which one decides the priority. State the single retention judgment, not two numbers side by side.',
    })
  }

  return flags
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Build one user message: any images first, then a text block. The auditor, the
// critic, and the reconciler all re-send the same flow (screens plus text), so
// the image handling lives here once rather than being duplicated per stage.
// The lead line is passed in so each stage can frame the same flow for its own
// job (audit it, challenge the audit, reconcile it).
export function buildFlowContent(description, images, lead = 'Audit this onboarding flow.') {
  const content = []

  for (const image of images || []) {
    const data = toBase64Data(image)
    if (!data) continue
    content.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: toMediaType(image),
        data,
      },
    })
  }

  content.push({
    type: 'text',
    text: `${lead}\n\n${(description || '').trim()}`,
  })

  return content
}

// The shared transport. It owns the request-body build, the proxy-vs-key url and
// header selection, the two-attempt overload retry, the error-status mapping,
// and response.json(). It does not parse or validate: each stage parses the
// returned envelope to its own schema. Extracted so the auditor, the critic, and
// the reconciler make the same call the same way, and so a test can inject a
// fake transport in its place and run the whole pipeline with no network.
export async function callMessages({
  apiKey,
  proxyUrl,
  system,
  messages,
  maxTokens = MAX_TOKENS,
}) {
  const useProxy = Boolean(proxyUrl && proxyUrl.trim())

  const requestBody = JSON.stringify({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages,
  })

  // Keyless mode sends to the proxy with no key and no browser-access header:
  // the proxy holds the key server-side and adds the Anthropic headers. Key mode
  // sends straight to the Anthropic API with the caller's key.
  const url = useProxy ? proxyUrl.trim() : API_URL
  const headers = useProxy
    ? { 'content-type': 'application/json' }
    : {
        'x-api-key': (apiKey || '').trim(),
        'anthropic-version': ANTHROPIC_VERSION,
        'anthropic-dangerous-direct-browser-access': 'true',
        'content-type': 'application/json',
      }

  // One retry on a transient overload (429 rate limit, 529 overloaded). Every
  // other status is returned as-is; a 401 or a 400 will not get better by
  // retrying.
  let response
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      response = await fetch(url, {
        method: 'POST',
        headers,
        body: requestBody,
      })
    } catch {
      // fetch throws on network failure and on CORS/preflight rejection.
      throw new Error(
        'Could not reach the Anthropic API. Check your connection and try again.'
      )
    }

    const overloaded = response.status === 429 || response.status === 529
    if (overloaded && attempt === 0) {
      await sleep(OVERLOAD_RETRY_DELAY_MS)
      continue
    }
    break
  }

  if (!response.ok) {
    // Surface the API's own error message when we can read it.
    let detail = ''
    try {
      const body = await response.json()
      detail = body?.error?.message || ''
    } catch {
      // no readable body
    }

    if (response.status === 401) {
      throw new Error('That API key was rejected. Check the key and try again.')
    }
    if (response.status === 429 || response.status === 529) {
      throw new Error(
        'The API is briefly overloaded. Wait a moment, then run it again.'
      )
    }
    throw new Error(
      detail
        ? `API error (${response.status}): ${detail}`
        : `API error (${response.status}). Try again.`
    )
  }

  return response.json()
}

export async function runAudit({
  apiKey,
  description,
  images,
  proxyUrl,
  callMessages: send = callMessages,
}) {
  const useProxy = Boolean(proxyUrl && proxyUrl.trim())
  if (!useProxy && (!apiKey || !apiKey.trim())) {
    throw new Error('Add your Anthropic API key to run an audit.')
  }
  if (!description || !description.trim()) {
    throw new Error('Paste an onboarding flow, or pick an example, to run an audit.')
  }

  const content = buildFlowContent(description, images)
  const body = await send({
    apiKey,
    proxyUrl,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content }],
  })

  // Pull the text out, refusing a max_tokens-truncated response before it
  // reaches the parser so the error names the length limit, not the JSON.
  // Validate the shape, then re-sort so any funnel-only lever is pinned to
  // position 3 client-side. The ranking is enforced by the app, not assumed
  // from the response order.
  return enforceRanking(validateAudit(parseAudit(extractAuditText(body))))
}

// -------------------------------------------------------------- Critic stage

// The seven audit fields the critic may target. An objection names exactly one,
// so the reconciler knows which part of the audit the critic is challenging.
// "scope" challenges scopeNote: the critic uses it when the audit treats a
// partial flow as if it were the whole path.
const CRITIC_TARGETS = [
  'first-value-moment',
  'experiment',
  'ranking',
  'friction-score',
  'durable-value',
  'drop-off',
  'scope',
]

// Parse the critic's JSON out of the response text.
export function parseCritique(text) {
  return parseJsonLoose(text)
}

// Validate the critic's output shape. The verdict is one of three values, the
// summary is a non-empty string, and objections is an array that may be empty (a
// clean pass returns no objections). Each objection carries a valid target, a
// severity, and non-empty objection and fix strings. The target/targetIndex
// coupling is enforced here: targetIndex is an integer 0 to 2 only when the
// target is "experiment", and must be null for every other target, so a stray
// index cannot silently mis-map a fix to the wrong experiment.
export function validateCritique(critique) {
  const isString = (v) => typeof v === 'string' && v.trim().length > 0

  if (!critique || typeof critique !== 'object') {
    throw new Error('The critic returned JSON in an unexpected shape.')
  }

  const problems = []
  if (!['clean', 'minor', 'significant'].includes(critique.verdict)) {
    problems.push('verdict (must be clean, minor, or significant)')
  }
  if (!isString(critique.summary)) problems.push('summary')

  if (!Array.isArray(critique.objections)) {
    problems.push('objections (must be an array)')
  } else {
    critique.objections.forEach((obj, i) => {
      if (!obj || typeof obj !== 'object') {
        problems.push(`objections[${i}]`)
        return
      }
      if (!CRITIC_TARGETS.includes(obj.target)) {
        problems.push(`objections[${i}].target`)
      }
      if (!['high', 'medium', 'low'].includes(obj.severity)) {
        problems.push(`objections[${i}].severity`)
      }
      if (!isString(obj.objection)) problems.push(`objections[${i}].objection`)
      if (!isString(obj.fix)) problems.push(`objections[${i}].fix`)

      // target/targetIndex coupling: an index only makes sense for an
      // experiment objection, and only for indices 0, 1, or 2.
      if (obj.target === 'experiment') {
        if (
          typeof obj.targetIndex !== 'number' ||
          !Number.isInteger(obj.targetIndex) ||
          obj.targetIndex < 0 ||
          obj.targetIndex > 2
        ) {
          problems.push(`objections[${i}].targetIndex (must be an integer 0-2 for an experiment target)`)
        }
      } else if (obj.targetIndex !== null && obj.targetIndex !== undefined) {
        problems.push(`objections[${i}].targetIndex (must be null unless target is "experiment")`)
      }
    })
  }

  if (problems.length > 0) {
    throw new Error(
      `The critic returned JSON in an unexpected shape. Missing or invalid: ${problems.join(', ')}.`,
    )
  }
  return critique
}

// Run the critic: an independent adversarial pass over the auditor's audit. It
// re-sends the same flow the auditor saw plus the finished audit, under the
// critic's own system prompt, and returns the validated critique. Reuses
// extractAuditText, which is generic to the Messages envelope and already throws
// on a max_tokens truncation.
export async function runCritic({
  apiKey,
  description,
  images,
  proxyUrl,
  audit,
  callMessages: send = callMessages,
}) {
  const content = buildFlowContent(
    description,
    images,
    'Here is the onboarding flow the audit below is about.',
  )
  content.push({
    type: 'text',
    text: `Audit to challenge:\n\n${JSON.stringify(audit, null, 2)}`,
  })

  const body = await send({
    apiKey,
    proxyUrl,
    system: CRITIC_PROMPT,
    messages: [{ role: 'user', content }],
  })

  return validateCritique(parseCritique(extractAuditText(body)))
}

// ---------------------------------------------------------- Reconciler stage

// Parse the reconciler's raw patch JSON out of the response text.
export function parseReconciled(text) {
  return parseJsonLoose(text)
}

// Validate the reconciler output and merge it onto the auditor's audit. The
// reconciler returns only the fields it changed (patch) plus a changes log, so
// the audit body is never re-serialized and cannot truncate mid-object. Merge
// the patch onto the base audit, then run the same shape validation and ranking
// guard the auditor output runs through, so the merged result is held to the
// exact same contract. enforceRanking here is the guard against the reconciler
// re-introducing a funnel-above-value order. Returns { final, changes }.
export function validateReconciled(reconciled, baseAudit) {
  if (!reconciled || typeof reconciled !== 'object') {
    throw new Error('The reconciler returned JSON in an unexpected shape.')
  }
  const patch = reconciled.patch
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
    throw new Error('The reconciler returned JSON in an unexpected shape. patch must be an object.')
  }
  if (!Array.isArray(reconciled.changes)) {
    throw new Error('The reconciler returned JSON in an unexpected shape. changes must be an array.')
  }

  const isString = (v) => typeof v === 'string'
  const problems = []
  reconciled.changes.forEach((c, i) => {
    if (!c || typeof c !== 'object') {
      problems.push(`changes[${i}]`)
      return
    }
    if (!CRITIC_TARGETS.includes(c.target)) problems.push(`changes[${i}].target`)
    if (!isString(c.before)) problems.push(`changes[${i}].before`)
    if (!isString(c.after)) problems.push(`changes[${i}].after`)
    if (typeof c.reason !== 'string' || c.reason.trim().length === 0) {
      problems.push(`changes[${i}].reason`)
    }
  })
  if (problems.length > 0) {
    throw new Error(
      `The reconciler returned JSON in an unexpected shape. Missing or invalid: ${problems.join(', ')}.`,
    )
  }

  // Merge the patch onto the base audit, then hold the merged result to the same
  // contract as the auditor output. A shallow merge is correct here: any changed
  // field is sent whole (a single changed experiment is sent as the full
  // three-item experiments array), so nothing is half-updated.
  const merged = { ...baseAudit, ...patch }
  const final = enforceRanking(validateAudit(merged))
  return { final, changes: reconciled.changes }
}

// Run the reconciler: the auditor revising its own audit under the critic's
// pushback. It receives the original audit and the critic's objections and
// returns a patch plus a changes log, which validateReconciled merges and
// validates. Returns { final, changes }.
export async function runReconcile({
  apiKey,
  description,
  images,
  proxyUrl,
  audit,
  critique,
  callMessages: send = callMessages,
}) {
  const content = buildFlowContent(
    description,
    images,
    'Here is the onboarding flow your audit is about.',
  )
  content.push({
    type: 'text',
    text:
      `Your original audit:\n\n${JSON.stringify(audit, null, 2)}\n\n` +
      `The critic's objections:\n\n${JSON.stringify(critique.objections, null, 2)}`,
  })

  const body = await send({
    apiKey,
    proxyUrl,
    system: RECONCILER_PROMPT,
    messages: [{ role: 'user', content }],
  })

  return validateReconciled(parseReconciled(extractAuditText(body)), audit)
}

// --------------------------------------------------------------- Orchestrator

// Run the full adversarial chain: auditor, then an independent critic, then the
// auditor revising under the critic's pushback. The chain degrades gracefully.
// The auditor's audit is load-bearing: if it throws, the pipeline throws, since
// there is nothing to show without it. The critic and the reconciler are the
// second read: if either fails (network, truncation, bad JSON), the pipeline
// records the degradation and still returns the auditor's audit, so the primary
// result always renders.
//
// The reconcile decision is driven off the number of objections, null-safely,
// not off the verdict. verdict is display-only. This handles the off-nominal
// case where the critic returns verdict "clean" but a non-empty objections
// array (the model contradicting itself): the objections are still reconciled
// rather than shown unaddressed. When the critic fails or returns zero
// objections, the reconcile call is skipped and that is not a degradation, it is
// a clean pass.
//
// Returns { audit, critique, reconciled, final, degraded, degradedReason }.
// final is the field the five cards render: the reconciled audit when there is
// one, otherwise the auditor's audit.
export async function runPipeline({
  apiKey,
  description,
  images,
  proxyUrl,
  onStage,
  callMessages: send = callMessages,
}) {
  const stage = (label) => {
    if (typeof onStage === 'function') onStage(label)
  }

  stage(
    images && images.length > 0
      ? 'The first agent is auditing the onboarding flow and screenshots...'
      : 'The first agent is auditing the onboarding flow...',
  )
  const audit = await runAudit({ apiKey, description, images, proxyUrl, callMessages: send })

  let critique = null
  let reconciled = null
  let degraded = false
  let degradedReason = null

  stage('An independent critic agent is challenging the audit...')
  try {
    critique = await runCritic({ apiKey, description, images, proxyUrl, audit, callMessages: send })
  } catch {
    critique = null
    degraded = true
    degradedReason = 'critic'
  }

  if (critique?.objections?.length) {
    stage('The first agent is revising the audit...')
    try {
      reconciled = await runReconcile({
        apiKey,
        description,
        images,
        proxyUrl,
        audit,
        critique,
        callMessages: send,
      })
    } catch {
      reconciled = null
      degraded = true
      degradedReason = 'reconciler'
    }
  }

  const final = reconciled?.final || audit
  return { audit, critique, reconciled, final, degraded, degradedReason }
}
