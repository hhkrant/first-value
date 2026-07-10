// Unit tests for the code that enforces the point of view: the JSON parse, the
// shape validation, and the funnel-last ranking. These run with the built-in
// Node test runner and need no network and no key:
//
//   npm test
//
// The framework is only demonstrated if the artifact holds the line, so the
// line is tested here rather than asserted in prose.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import {
  parseAudit,
  validateAudit,
  enforceRanking,
  extractAuditText,
  coherenceFlags,
  runAudit,
} from '../src/lib/anthropic.js'

const here = dirname(fileURLToPath(import.meta.url))
const capturesDir = join(here, '..', 'samples', 'captures')

function auditFromCapture(id) {
  const body = JSON.parse(readFileSync(join(capturesDir, `${id}.response.json`), 'utf8'))
  const text = (body.content || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('')
  return parseAudit(text)
}

function goodExperiments() {
  return [
    { hypothesis: 'h1', rationale: 'r1', lever: 'value-moment' },
    { hypothesis: 'h2', rationale: 'r2', lever: 'durable-value' },
    { hypothesis: 'h3', rationale: 'r3', lever: 'funnel-only' },
  ]
}

function goodAudit(overrides = {}) {
  return {
    firstValueMoment: 'The signed copy returns to the sender.',
    frictionScore: 38,
    frictionRationale: 'One screen to send; the wait is the recipient.',
    recurrenceSignal: 'strong',
    durableValue: 'Retention: per agreement. Expansion: the paid templates surface.',
    topDropOff: 'The quiet after the send.',
    scopeNote: 'Covers arrival through the first send. The flow looks complete from landing to value.',
    experiments: goodExperiments(),
    ...overrides,
  }
}

// -------------------------------------------------------------- parseAudit
test('parseAudit reads clean JSON', () => {
  const audit = parseAudit(JSON.stringify(goodAudit()))
  assert.equal(audit.frictionScore, 38)
})

test('parseAudit recovers JSON wrapped in prose or fences', () => {
  const fenced = '```json\n' + JSON.stringify(goodAudit()) + '\n```'
  assert.equal(parseAudit(fenced).recurrenceSignal, 'strong')

  const chatty =
    'Here is the audit you asked for:\n' +
    JSON.stringify(goodAudit()) +
    '\nLet me know if you want changes.'
  assert.equal(parseAudit(chatty).frictionScore, 38)
})

test('parseAudit throws a plain error on unparseable text', () => {
  assert.throws(() => parseAudit('no json here at all'), /valid JSON/)
})

// ------------------------------------------------------------ validateAudit
test('validateAudit accepts a well-formed audit', () => {
  assert.doesNotThrow(() => validateAudit(goodAudit()))
})

test('validateAudit rejects the wrong number of experiments', () => {
  assert.throws(
    () => validateAudit(goodAudit({ experiments: goodExperiments().slice(0, 2) })),
    /exactly 3/,
  )
})

test('validateAudit rejects a non-integer or out-of-range friction score', () => {
  assert.throws(() => validateAudit(goodAudit({ frictionScore: 38.5 })), /frictionScore/)
  assert.throws(() => validateAudit(goodAudit({ frictionScore: 140 })), /frictionScore/)
  assert.throws(() => validateAudit(goodAudit({ frictionScore: -1 })), /frictionScore/)
})

test('validateAudit rejects a recurrence signal outside the allowed set', () => {
  assert.throws(
    () => validateAudit(goodAudit({ recurrenceSignal: 'medium' })),
    /recurrenceSignal/,
  )
})

test('validateAudit rejects an experiment missing its lever or fields', () => {
  const missingLever = goodExperiments()
  missingLever[1] = { hypothesis: 'h', rationale: 'r' }
  assert.throws(() => validateAudit(goodAudit({ experiments: missingLever })), /lever/)

  const missingHypothesis = goodExperiments()
  missingHypothesis[0] = { rationale: 'r', lever: 'value-moment' }
  assert.throws(
    () => validateAudit(goodAudit({ experiments: missingHypothesis })),
    /hypothesis/,
  )
})

test('validateAudit requires a scopeNote that bounds the read', () => {
  assert.throws(() => validateAudit(goodAudit({ scopeNote: '' })), /scopeNote/)
  assert.throws(() => validateAudit(goodAudit({ scopeNote: 42 })), /scopeNote/)
})

test('validateAudit keeps friction and recurrence as separate required reads', () => {
  // A retention signal must not stand in for a friction score, and vice versa.
  assert.throws(() => validateAudit(goodAudit({ frictionScore: 'strong' })), /frictionScore/)
  assert.throws(() => validateAudit(goodAudit({ recurrenceSignal: 38 })), /recurrenceSignal/)
})

// -------------------------------------------------------- extractAuditText
test('extractAuditText joins the text blocks of a complete response', () => {
  const body = {
    stop_reason: 'end_turn',
    content: [
      { type: 'text', text: '{"a":' },
      { type: 'text', text: '1}' },
    ],
  }
  assert.equal(extractAuditText(body), '{"a":1}')
})

test('extractAuditText rejects a max_tokens-truncated response with a plain error', () => {
  // A long durableValue plus three experiments can hit the output ceiling. When
  // that happens the JSON is cut mid-object, so the failure has to name the
  // length limit rather than surface a generic parse error.
  const body = {
    stop_reason: 'max_tokens',
    content: [{ type: 'text', text: '{"firstValueMoment": "the signed copy ret' }],
  }
  assert.throws(() => extractAuditText(body), /cut off|length limit|incomplete/i)
})

// ----------------------------------------------------------- enforceRanking
test('enforceRanking pins a funnel-only lever to position 3', () => {
  const audit = goodAudit({
    experiments: [
      { hypothesis: 'f', rationale: 'r', lever: 'funnel-only' },
      { hypothesis: 'v', rationale: 'r', lever: 'value-moment' },
      { hypothesis: 'd', rationale: 'r', lever: 'durable-value' },
    ],
  })
  enforceRanking(audit)
  assert.equal(audit.experiments[2].lever, 'funnel-only')
  // The two non-funnel experiments keep their returned order ahead of it.
  assert.equal(audit.experiments[0].lever, 'value-moment')
  assert.equal(audit.experiments[1].lever, 'durable-value')
})

test('enforceRanking is stable when no funnel-only lever is present', () => {
  const audit = goodAudit({
    experiments: [
      { hypothesis: 'd', rationale: 'r', lever: 'durable-value' },
      { hypothesis: 'v', rationale: 'r', lever: 'value-moment' },
      { hypothesis: 'v2', rationale: 'r', lever: 'value-moment' },
    ],
  })
  enforceRanking(audit)
  assert.deepEqual(
    audit.experiments.map((e) => e.hypothesis),
    ['d', 'v', 'v2'],
  )
})

// ------------------------------------------------------------ coherenceFlags
test('coherenceFlags is silent on a coherent audit', () => {
  // friction 38 (moderate), strong recurrence, a durable-value experiment
  // present, no divergence: nothing to flag.
  assert.deepEqual(coherenceFlags(goodAudit()), [])
})

test('coherenceFlags catches a value-moment lead when recurrence is absent', () => {
  const audit = goodAudit({
    recurrenceSignal: 'absent',
    durableValue: 'Retention: nothing recurs. Expansion: none in this flow.',
    experiments: [
      { hypothesis: 'speed the first hit', rationale: 'r', lever: 'value-moment' },
      { hypothesis: 'build a habit', rationale: 'r', lever: 'durable-value' },
      { hypothesis: 'nudge', rationale: 'r', lever: 'funnel-only' },
    ],
  })
  const flags = coherenceFlags(audit)
  assert.ok(
    flags.some((f) => f.level === 'watch' && /absent/i.test(f.message)),
    'flags speeding a first hit that has no return',
  )
})

test('coherenceFlags names vanity activation: fast, absent, no durable experiment', () => {
  const audit = goodAudit({
    frictionScore: 18,
    recurrenceSignal: 'absent',
    durableValue: 'Retention: one-time. Expansion: none.',
    experiments: [
      { hypothesis: 'a', rationale: 'r', lever: 'value-moment' },
      { hypothesis: 'b', rationale: 'r', lever: 'value-moment' },
      { hypothesis: 'c', rationale: 'r', lever: 'funnel-only' },
    ],
  })
  const flags = coherenceFlags(audit)
  assert.ok(
    flags.some((f) => f.level === 'watch' && /retain/i.test(f.message)),
    'flags a funnel the ranking will not retain',
  )
})

test('coherenceFlags notes an unaddressed friction-recurrence divergence', () => {
  const audit = goodAudit({
    frictionScore: 74,
    recurrenceSignal: 'strong',
    // no priority word (decides/outweigh/matters more), so the single judgment is missing
    durableValue: 'Retention: recurs weekly. Expansion: seats and SSO.',
  })
  const flags = coherenceFlags(audit)
  assert.ok(
    flags.some((f) => f.level === 'note' && /priorit|decides/i.test(f.message)),
    'flags that the priority call is not stated',
  )
})

// ------------------------------------------------ coherenceFlags bug #1 regression
test('coherenceFlags does not misfire on the committed refusal capture', () => {
  // Bug #1: on the no-value-moment refusal the old heuristics raised an
  // activation-ranking watch and a divergence note against a flow that has no
  // ranking to red-team. The refusal branch now returns one clarifying note and
  // no watches.
  const flags = coherenceFlags(auditFromCapture('no-value-moment'))
  assert.ok(
    !flags.some((f) => f.level === 'watch'),
    'no spurious watch on the refusal',
  )
  assert.equal(flags.length, 1, 'exactly the one clarifying note')
  assert.match(flags[0].message, /no activation ranking to red-team/i)
})

test('coherenceFlags does not misfire on the committed invoice-generator capture', () => {
  // Bug #1: the invoice-generator read resolves the friction/recurrence tension
  // in the framework's own language, so the broadened priority detection sees it
  // and raises no spurious divergence note.
  const flags = coherenceFlags(auditFromCapture('invoice-generator'))
  assert.deepEqual(flags, [], 'no spurious flags on a read that states the priority')
})

// ---------------------------------------------------------------- runAudit
test('runAudit in proxy mode does not require a key', async () => {
  // With a proxyUrl set, the key requirement is bypassed. The empty-description
  // guard still fires, and it fires before any network call, so this proves the
  // key check is skipped in keyless mode without needing to mock fetch.
  await assert.rejects(
    () => runAudit({ apiKey: '', description: '   ', proxyUrl: 'https://proxy.example' }),
    /Paste an onboarding flow/,
  )
})

test('runAudit refuses empty input before any network call', async () => {
  await assert.rejects(
    () => runAudit({ apiKey: 'sk-ant-test', description: '   ', images: [] }),
    /Paste an onboarding flow/,
  )
})

test('runAudit refuses a missing key before any network call', async () => {
  await assert.rejects(
    () => runAudit({ apiKey: '', description: 'a real flow', images: [] }),
    /API key/,
  )
})
