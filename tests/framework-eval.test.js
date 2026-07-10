// Framework eval. These tests read the committed live-run captures under
// samples/captures/ and the sample teardowns under samples/, and assert the
// point of view holds across every one of them, not just in a hand-picked case:
//
//   - a funnel-only lever always lands last,
//   - the friction score stays an integer 0 to 100 and separate from recurrence,
//   - the recurrence signal is one of the three allowed values,
//   - an absent-recurrence flow is actually flagged as such (vanity activation),
//   - the hard style rules hold: no em-dashes, no banned jargon.
//
// Run with: npm test

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { parseAudit, validateAudit, enforceRanking } from '../src/lib/anthropic.js'
import { SYSTEM_PROMPT, EXAMPLES } from '../src/lib/framework.js'

const here = dirname(fileURLToPath(import.meta.url))
const capturesDir = join(here, '..', 'samples', 'captures')
const samplesDir = join(here, '..', 'samples')

const EM_DASH = '—'
const BANNED = ['delve', 'robust', 'streamline', 'synergy', 'cutting-edge']

// Pull the audit text out of a committed .response.json (the Messages API
// envelope), the same way the app reads a live response.
function auditFromResponseFile(path) {
  const body = JSON.parse(readFileSync(path, 'utf8'))
  const text = (body.content || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('')
  return parseAudit(text)
}

function responseFiles() {
  return readdirSync(capturesDir)
    .filter((f) => f.endsWith('.response.json'))
    .map((f) => join(capturesDir, f))
}

function checkStyle(label, text) {
  assert.ok(!text.includes(EM_DASH), `${label} contains an em-dash`)
  const lower = text.toLowerCase()
  for (const word of BANNED) {
    assert.ok(!lower.includes(word), `${label} contains banned word "${word}"`)
  }
  // "leverage" is banned as a verb; the samples avoid the word entirely, so a
  // plain presence check is the safe guard here.
  assert.ok(!lower.includes('leverage'), `${label} contains "leverage"`)
}

test('at least the docusign screenshot run and one text run are committed', () => {
  const ids = responseFiles().map((p) => p.split('/').pop().replace('.response.json', ''))
  assert.ok(ids.includes('docusign-self-serve'), 'docusign-self-serve capture is committed')
  assert.ok(ids.length >= 2, 'at least two captures are committed')
})

test('every committed capture validates and holds the funnel-last ranking', () => {
  for (const path of responseFiles()) {
    const audit = enforceRanking(validateAudit(auditFromResponseFile(path)))

    // friction is an integer 0..100 and a number, not the recurrence read.
    assert.equal(typeof audit.frictionScore, 'number', `${path} frictionScore is a number`)
    assert.ok(Number.isInteger(audit.frictionScore), `${path} frictionScore is an integer`)
    assert.ok(audit.frictionScore >= 0 && audit.frictionScore <= 100, `${path} frictionScore in range`)

    // recurrence is one of the three allowed values, a separate read.
    assert.ok(
      ['strong', 'weak', 'absent'].includes(audit.recurrenceSignal),
      `${path} recurrenceSignal is allowed`,
    )

    // scopeNote bounds the read: it names what the audit covers and where it stops.
    assert.ok(
      typeof audit.scopeNote === 'string' && audit.scopeNote.trim().length > 0,
      `${path} carries a scopeNote`,
    )

    // exactly three experiments, and any funnel-only lever is last.
    assert.equal(audit.experiments.length, 3, `${path} has exactly 3 experiments`)
    const funnelIndex = audit.experiments.findIndex((e) => e.lever === 'funnel-only')
    if (funnelIndex !== -1) {
      assert.equal(funnelIndex, 2, `${path} pins the funnel-only lever last`)
    }
  }
})

test('experiments vary the levers across captures, with no default opener pattern', () => {
  // The system prompt tells the model to vary the experiments: pull different
  // levers and do not default to the same "seed the first page" move every
  // time. That instruction is only demonstrated if the committed runs actually
  // show range, so it is checked here alongside the ranking and style rules.
  const REFUSAL = 'no-value-moment' // an empty input has no flow to vary against
  const audits = responseFiles().map((path) => ({
    id: path.split('/').pop().replace('.response.json', ''),
    audit: auditFromResponseFile(path),
  }))

  const scored = audits.filter((a) => a.id !== REFUSAL)
  assert.ok(scored.length >= 4, 'enough scored captures to judge range')

  // The winning (rank 1) lever is not the same across every capture: at least
  // two different levers take the top slot, so value-moment-first is a call the
  // flow earns, not a fixed template.
  const topLevers = new Set(scored.map((a) => a.audit.experiments[0].lever))
  assert.ok(topLevers.size >= 2, `top-ranked lever varies across captures (saw ${[...topLevers].join(', ')})`)

  // At least one scored capture ranks a durable-value move first, proving the
  // ranking is not always "put the value moment ahead of the prerequisite."
  assert.ok(
    scored.some((a) => a.audit.experiments[0].lever === 'durable-value'),
    'at least one capture ranks a durable-value experiment first',
  )

  // No two captures share an identical rank-1 hypothesis: the model is not
  // pasting the same opening experiment into every teardown.
  const topHyps = scored.map((a) => a.audit.experiments[0].hypothesis.trim().toLowerCase())
  assert.equal(new Set(topHyps).size, topHyps.length, 'each capture opens with a distinct experiment')

  // Within each scored capture the three experiments pull at least two distinct
  // levers, and all three hypotheses are distinct from one another.
  for (const { id, audit } of scored) {
    const levers = new Set(audit.experiments.map((e) => e.lever))
    assert.ok(levers.size >= 2, `${id} experiments pull at least two distinct levers`)
    const hyps = new Set(audit.experiments.map((e) => e.hypothesis.trim().toLowerCase()))
    assert.equal(hyps.size, 3, `${id} experiments are distinct from one another`)
  }
})

test('the one-off tool capture flags vanity activation, not a healthy product', () => {
  // The point of a retention read is that it bites: a fast first hit with no
  // reason to return is named as such rather than celebrated.
  const audit = auditFromResponseFile(join(capturesDir, 'invoice-generator.response.json'))
  assert.equal(audit.recurrenceSignal, 'absent', 'invoice generator recurrence is absent')
  assert.ok(audit.frictionScore <= 33, 'invoice generator activation is genuinely fast')
  assert.match(
    audit.durableValue.toLowerCase(),
    /return|recur|come back|retain/,
    'the durable-value read names the missing return',
  )
})

test('the empty-input capture refuses to invent a value moment', () => {
  const audit = auditFromResponseFile(join(capturesDir, 'no-value-moment.response.json'))
  assert.equal(audit.frictionScore, 0, 'no measurable friction with no flow')
  assert.equal(audit.recurrenceSignal, 'absent', 'no recurrence with no flow')
  assert.match(
    audit.firstValueMoment.toLowerCase(),
    /does not describe|no (real )?value moment|no specific/,
    'the first value moment says plainly that none is described',
  )
})

test('every committed response preserves the real API envelope fields', () => {
  // The capture claim rests on these being real Messages API responses, not
  // stripped stubs: the truncation guard reads stop_reason and the usage object
  // is what the capture README calls an estimate. If either goes missing, the
  // guard and the provenance note are no longer grounded in real output.
  for (const path of responseFiles()) {
    const body = JSON.parse(readFileSync(path, 'utf8'))
    assert.ok(
      ['end_turn', 'stop_sequence'].includes(body.stop_reason),
      `${path} carries a complete-run stop_reason`,
    )
    assert.ok(body.usage, `${path} carries a usage object`)
    assert.equal(typeof body.usage.input_tokens, 'number', `${path} usage.input_tokens`)
    assert.equal(typeof body.usage.output_tokens, 'number', `${path} usage.output_tokens`)
    // The id is normalized on purpose; the prefix declares that it is a
    // reference run, not a live msg_01 capture. The capture README documents it.
    assert.match(body.id, /^msg_reference_/, `${path} id declares itself a reference run`)
  }
})

test('scored captures carry the two-part retention/expansion read', () => {
  // The durable-value card renders retention and expansion as separate reads by
  // splitting the string on those labels, so the model output has to carry both.
  // The refusal case is exempt: it delivers no value, so there is nothing to
  // split, and the card falls back to the whole string.
  for (const path of responseFiles()) {
    const id = path.split('/').pop().replace('.response.json', '')
    if (id === 'no-value-moment') continue
    const audit = auditFromResponseFile(path)
    assert.match(audit.durableValue, /Retention:/i, `${id} names the retention read`)
    assert.match(audit.durableValue, /Expansion:/i, `${id} names the expansion read`)
    const rIdx = audit.durableValue.search(/Retention:/i)
    const eIdx = audit.durableValue.search(/Expansion:/i)
    assert.ok(eIdx > rIdx, `${id} orders retention before expansion`)
  }
})

test('captured model output obeys the hard style rules', () => {
  for (const path of responseFiles()) {
    const body = JSON.parse(readFileSync(path, 'utf8'))
    const text = (body.content || [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('')
    checkStyle(path, text)
  }
})

test('sample teardowns obey the hard style rules', () => {
  const mdFiles = readdirSync(samplesDir).filter((f) => f.endsWith('.md'))
  for (const f of mdFiles) {
    checkStyle(f, readFileSync(join(samplesDir, f), 'utf8'))
  }
})

test('the system prompt asks the auditor to bound the read with a scopeNote', () => {
  assert.match(SYSTEM_PROMPT, /scopeNote/)
  assert.match(SYSTEM_PROMPT, /where it stops/)
})

test('the system prompt keeps friction, recurrence, and expansion as separate reads', () => {
  assert.match(SYSTEM_PROMPT, /recurrenceSignal from the retention read alone/)
  assert.match(SYSTEM_PROMPT, /do not fold retention into frictionScore/i)
  assert.match(SYSTEM_PROMPT, /Do not merge "value recurs" and "there is an upgrade path"/)
})

test('each committed request.json is the request the shipped code sends', () => {
  // The captures are only proof if the request in them is the one the app sends.
  // Rebuild the expected body from the committed framework.js and compare.
  const requestFiles = readdirSync(capturesDir).filter((f) => f.endsWith('.request.json'))
  assert.ok(requestFiles.length >= 2, 'at least two request files are committed')

  for (const f of requestFiles) {
    const id = f.replace('.request.json', '')
    const example = EXAMPLES.find((e) => e.id === id)
    assert.ok(example, `capture ${id} maps to a real example`)

    const req = JSON.parse(readFileSync(join(capturesDir, f), 'utf8'))
    assert.equal(req.model, 'claude-sonnet-4-5-20250929', `${id} uses the shipped model`)
    assert.equal(req.system, SYSTEM_PROMPT, `${id} carries the exact system prompt`)

    const blocks = req.messages[0].content
    const textBlock = blocks.find((b) => b.type === 'text')
    assert.equal(
      textBlock.text,
      `Audit this onboarding flow.\n\n${example.description.trim()}`,
      `${id} sends the trimmed description under the shipped lead`,
    )
    // A screenshot example carries one image block per screen, in step order; a
    // text example carries none. The committed request must send exactly the
    // screens the example declares, so a multi-shot flow is proven to send all
    // of them, not just the first.
    const imageCount = blocks.filter((b) => b.type === 'image').length
    const expectedImages = example.screenshots ? example.screenshots.length : 0
    assert.equal(imageCount, expectedImages, `${id} sends one image block per declared screenshot`)
  }
})

test('the harness and the app send the same browser-access header', () => {
  const harness = readFileSync(join(here, '..', 'samples', 'captures', 'capture.mjs'), 'utf8')
  const app = readFileSync(join(here, '..', 'src', 'lib', 'anthropic.js'), 'utf8')
  const header = 'anthropic-dangerous-direct-browser-access'
  assert.ok(harness.includes(header), 'capture.mjs sets the direct-browser-access header')
  assert.ok(app.includes(header), 'anthropic.js sets the direct-browser-access header')
})
