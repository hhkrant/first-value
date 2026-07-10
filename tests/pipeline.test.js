// Pipeline tests: the adversarial chain (auditor, critic, reconciler), its
// parse and validate layers, its graceful degradation, and the worst-case
// reconciler truncation. These run with the built-in Node test runner and need
// no network and no key: the transport is injected as a fake callMessages that
// returns canned Messages API envelopes, dispatched on which system prompt the
// stage sent.
//
//   npm test

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  parseCritique,
  validateCritique,
  parseReconciled,
  validateReconciled,
  runPipeline,
} from '../src/lib/anthropic.js'
import { SYSTEM_PROMPT, CRITIC_PROMPT, RECONCILER_PROMPT } from '../src/lib/framework.js'

// ---------------------------------------------------------------- fixtures

function goodExperiments() {
  return [
    { hypothesis: 'h1', rationale: 'r1', lever: 'value-moment' },
    { hypothesis: 'h2', rationale: 'r2', lever: 'durable-value' },
    { hypothesis: 'h3', rationale: 'r3', lever: 'funnel-only' },
  ]
}

// An auditor audit that leads with a business milestone, not a felt-value
// moment. This is the slip the critic is built to catch in the adversarial
// proof below.
function businessMilestoneAudit(overrides = {}) {
  return {
    firstValueMoment: 'The account is created and the user reaches the dashboard.',
    frictionScore: 20,
    frictionRationale: 'Short self-serve path: a signup form, then the dashboard.',
    recurrenceSignal: 'weak',
    durableValue:
      'Retention: the user may return to check status. Expansion: paid tiers exist above the free plan.',
    topDropOff: 'The signup form.',
    scopeNote: 'Covers signup through the dashboard. The flow appears complete for this read.',
    experiments: goodExperiments(),
    ...overrides,
  }
}

function cleanCritique() {
  return {
    verdict: 'clean',
    summary: 'The audit holds. The value moment is felt, the ranking is value-first.',
    objections: [],
  }
}

function fvmCritique() {
  return {
    verdict: 'significant',
    summary: 'The first value moment names a business milestone, not felt value.',
    objections: [
      {
        target: 'first-value-moment',
        targetIndex: null,
        severity: 'high',
        objection: 'Reaching the dashboard is a milestone, not a moment the user feels value.',
        fix: 'Name the first point the user gets a result they can see and feel.',
      },
    ],
  }
}

const FELT_VALUE_MOMENT = "The user's first report renders with their own connected data in it."

function fvmReconciled() {
  return {
    patch: { firstValueMoment: FELT_VALUE_MOMENT },
    changes: [
      {
        target: 'first-value-moment',
        before: 'The account is created and the user reaches the dashboard.',
        after: FELT_VALUE_MOMENT,
        reason: 'The business milestone is replaced with the moment the user first sees real value.',
      },
    ],
  }
}

// Wrap a value in a Messages API envelope the stages read. An object is
// serialized as the model would return it; a string is sent verbatim (used to
// feed loose or unparseable text). stopReason defaults to a complete run.
function env(value, stopReason = 'end_turn') {
  const text = typeof value === 'string' ? value : JSON.stringify(value)
  return {
    id: 'msg_test',
    type: 'message',
    role: 'assistant',
    model: 'claude-sonnet-4-5-20250929',
    content: [{ type: 'text', text }],
    stop_reason: stopReason,
    stop_sequence: null,
    usage: { input_tokens: 1, output_tokens: 1 },
  }
}

// Build an injectable transport. `stages` maps each stage to its canned
// response: an envelope to return, or a function to call (which may throw to
// simulate a network or transport failure). It also counts calls per stage so a
// test can assert the reconcile was skipped or run.
function makeTransport(stages) {
  const calls = { audit: 0, critic: 0, reconcile: 0, total: 0 }
  const resolve = (r) => (typeof r === 'function' ? r() : r)
  const fn = async ({ system }) => {
    calls.total++
    if (system === SYSTEM_PROMPT) {
      calls.audit++
      return resolve(stages.audit)
    }
    if (system === CRITIC_PROMPT) {
      calls.critic++
      return resolve(stages.critic)
    }
    if (system === RECONCILER_PROMPT) {
      calls.reconcile++
      return resolve(stages.reconcile)
    }
    throw new Error('unexpected system prompt')
  }
  fn.calls = calls
  return fn
}

const RUN_ARGS = { apiKey: 'sk-ant-test', description: 'a real onboarding flow to audit', images: [] }

// --------------------------------------------------------- parse/validate critique

test('validateCritique accepts a clean pass with empty objections', () => {
  assert.doesNotThrow(() => validateCritique(cleanCritique()))
})

test('validateCritique accepts a well-formed objection', () => {
  assert.doesNotThrow(() => validateCritique(fvmCritique()))
})

test('validateCritique rejects a malformed verdict', () => {
  assert.throws(() => validateCritique({ ...cleanCritique(), verdict: 'nope' }), /verdict/)
})

test('validateCritique rejects a malformed objection', () => {
  const bad = fvmCritique()
  bad.objections[0].severity = 'critical'
  assert.throws(() => validateCritique(bad), /severity/)

  const noText = fvmCritique()
  noText.objections[0].objection = ''
  assert.throws(() => validateCritique(noText), /objection/)
})

test('parseCritique recovers loose and fenced JSON', () => {
  const fenced = '```json\n' + JSON.stringify(cleanCritique()) + '\n```'
  assert.equal(parseCritique(fenced).verdict, 'clean')

  const chatty = 'Here is my critique:\n' + JSON.stringify(fvmCritique()) + '\nThanks.'
  assert.equal(parseCritique(chatty).objections.length, 1)
})

// ------------------------------------------- validateCritique target/targetIndex coupling

test('validateCritique accepts an experiment target with a valid index 0-2', () => {
  const c = cleanCritique()
  c.verdict = 'minor'
  c.objections = [
    {
      target: 'experiment',
      targetIndex: 2,
      severity: 'medium',
      objection: 'The third experiment is a generic progress-bar move the flow does not need.',
      fix: 'Replace it with a retention move the flow actually supports.',
    },
  ]
  assert.doesNotThrow(() => validateCritique(c))
})

test('validateCritique rejects a non-experiment target carrying a non-null index', () => {
  const c = fvmCritique()
  c.objections[0].targetIndex = 0 // first-value-moment must have a null index
  assert.throws(() => validateCritique(c), /targetIndex/)
})

test('validateCritique accepts a scope objection challenging an incomplete flow', () => {
  const c = cleanCritique()
  c.verdict = 'significant'
  c.objections = [
    {
      target: 'scope',
      targetIndex: null,
      severity: 'medium',
      objection: 'The audit treats a partial flow as complete: the input stops before value is delivered.',
      fix: 'Bound the read to the steps shown and say the friction may understate the real path.',
    },
  ]
  assert.doesNotThrow(() => validateCritique(c))
})

test('validateCritique rejects an experiment target with a null or out-of-range index', () => {
  const nullIdx = cleanCritique()
  nullIdx.verdict = 'minor'
  nullIdx.objections = [
    { target: 'experiment', targetIndex: null, severity: 'low', objection: 'x', fix: 'y' },
  ]
  assert.throws(() => validateCritique(nullIdx), /targetIndex/)

  const outOfRange = cleanCritique()
  outOfRange.verdict = 'minor'
  outOfRange.objections = [
    { target: 'experiment', targetIndex: 3, severity: 'low', objection: 'x', fix: 'y' },
  ]
  assert.throws(() => validateCritique(outOfRange), /targetIndex/)
})

// ------------------------------------------------------ parse/validate reconciled

test('validateReconciled merges a patch onto the base audit and validates the result', () => {
  const base = businessMilestoneAudit()
  const { final, changes } = validateReconciled(
    { patch: { frictionScore: 45 }, changes: [
      { target: 'friction-score', before: '20', after: '45', reason: 'A real gate sits before value.' },
    ] },
    base,
  )
  assert.equal(final.frictionScore, 45)
  // The unpatched fields carry through from the base audit.
  assert.equal(final.firstValueMoment, base.firstValueMoment)
  assert.equal(changes.length, 1)
})

test('validateReconciled runs enforceRanking so a funnel-only patch cannot lead', () => {
  const base = businessMilestoneAudit()
  const { final } = validateReconciled(
    {
      patch: {
        experiments: [
          { hypothesis: 'f', rationale: 'r', lever: 'funnel-only' },
          { hypothesis: 'v', rationale: 'r', lever: 'value-moment' },
          { hypothesis: 'd', rationale: 'r', lever: 'durable-value' },
        ],
      },
      changes: [
        { target: 'ranking', before: 'funnel first', after: 'funnel last', reason: 'Value-first ranking.' },
      ],
    },
    base,
  )
  // The funnel-only lever the reconciler tried to lead with is pinned to
  // position 3 by enforceRanking.
  assert.equal(final.experiments[2].lever, 'funnel-only')
})

test('validateReconciled rejects a patch that breaks the audit shape', () => {
  const base = businessMilestoneAudit()
  assert.throws(
    () => validateReconciled({ patch: { frictionScore: 140 }, changes: [] }, base),
    /frictionScore/,
  )
})

test('validateReconciled rejects a non-object patch or non-array changes', () => {
  const base = businessMilestoneAudit()
  assert.throws(() => validateReconciled({ patch: [], changes: [] }, base), /patch/)
  assert.throws(() => validateReconciled({ patch: {}, changes: 'nope' }, base), /changes/)
})

test('parseReconciled recovers fenced JSON', () => {
  const fenced = '```json\n' + JSON.stringify(fvmReconciled()) + '\n```'
  assert.equal(parseReconciled(fenced).patch.firstValueMoment, FELT_VALUE_MOMENT)
})

// -------------------------------------------------------- pipeline happy path (proof)

test('runPipeline: business-milestone audit, critic objection, reconciled felt-value moment', async () => {
  // The adversarial proof, no key needed. The auditor leads with a business
  // milestone, the critic raises one first-value-moment objection, and the
  // reconciler revises the moment to felt value with a changes entry. This
  // demonstrates a critic catch driving a reconciliation, deterministically.
  const transport = makeTransport({
    audit: env(businessMilestoneAudit()),
    critic: env(fvmCritique()),
    reconcile: env(fvmReconciled()),
  })
  const result = await runPipeline({ ...RUN_ARGS, callMessages: transport })

  assert.equal(result.degraded, false)
  assert.equal(result.audit.firstValueMoment, 'The account is created and the user reaches the dashboard.')
  assert.equal(result.final.firstValueMoment, FELT_VALUE_MOMENT)
  assert.notEqual(result.final.firstValueMoment, result.audit.firstValueMoment)
  assert.equal(result.reconciled.changes.length, 1)
  assert.equal(transport.calls.total, 3)
})

// --------------------------------------------------------------- degradation

test('runPipeline degrades on a critic failure and still renders the audit', async () => {
  // The critic returns unparseable text: runCritic throws, the pipeline records
  // the degradation and skips the reconcile, and final is the auditor audit.
  const transport = makeTransport({
    audit: env(businessMilestoneAudit()),
    critic: env('not json at all'),
    reconcile: env(fvmReconciled()),
  })
  const result = await runPipeline({ ...RUN_ARGS, callMessages: transport })

  assert.equal(result.degraded, true)
  assert.equal(result.degradedReason, 'critic')
  assert.equal(result.critique, null)
  assert.equal(result.final, result.audit)
  assert.equal(transport.calls.reconcile, 0)
})

test('runPipeline degrades on a reconciler max_tokens truncation and still renders the audit', async () => {
  // The reconciler response is cut off at the output limit: extractAuditText
  // throws, runReconcile throws, and the pipeline falls back to the auditor
  // audit rather than dropping the whole result.
  const transport = makeTransport({
    audit: env(businessMilestoneAudit()),
    critic: env(fvmCritique()),
    reconcile: env(fvmReconciled(), 'max_tokens'),
  })
  const result = await runPipeline({ ...RUN_ARGS, callMessages: transport })

  assert.equal(result.degraded, true)
  assert.equal(result.degradedReason, 'reconciler')
  assert.equal(result.reconciled, null)
  assert.equal(result.final, result.audit)
  assert.equal(transport.calls.reconcile, 1)
})

test('runPipeline skips the reconcile when the critique has zero objections', async () => {
  // A clean critique drives the reconcile decision off objections.length: with
  // none, the reconcile call is never made and the run is not degraded.
  const transport = makeTransport({
    audit: env(businessMilestoneAudit()),
    critic: env(cleanCritique()),
    reconcile: env(fvmReconciled()),
  })
  const result = await runPipeline({ ...RUN_ARGS, callMessages: transport })

  assert.equal(result.degraded, false)
  assert.equal(result.reconciled, null)
  assert.equal(result.final, result.audit)
  assert.equal(transport.calls.critic, 1)
  assert.equal(transport.calls.reconcile, 0)
})

test('runPipeline reconciles the off-nominal clean verdict with a non-empty objections array', async () => {
  // A model can contradict itself: verdict "clean" but objections present. The
  // reconcile decision is driven off objections.length, not the verdict, so the
  // objections are still reconciled rather than shown unaddressed.
  const contradictory = { ...fvmCritique(), verdict: 'clean' }
  const transport = makeTransport({
    audit: env(businessMilestoneAudit()),
    critic: env(contradictory),
    reconcile: env(fvmReconciled()),
  })
  const result = await runPipeline({ ...RUN_ARGS, callMessages: transport })

  assert.equal(transport.calls.reconcile, 1)
  assert.equal(result.final.firstValueMoment, FELT_VALUE_MOMENT)
})

test('runPipeline throws if the auditor fails, since there is nothing to show', async () => {
  const transport = makeTransport({
    audit: env('not json at all'),
    critic: env(cleanCritique()),
    reconcile: env(fvmReconciled()),
  })
  await assert.rejects(() => runPipeline({ ...RUN_ARGS, callMessages: transport }), /valid JSON/)
})

// ----------------------------------------------------- worst-case patch budget

test('a full-size reconciler patch stays within the 4096-token budget', async () => {
  // The reconciler is the fattest call. The patch/merge shape keeps it small: a
  // worst-case patch that rewrites every field plus a change entry per target is
  // still far under the 4096 max_tokens ceiling the proxy caps at, so the audit
  // body cannot truncate the way a full re-emit could. Estimate tokens at four
  // characters each, the rough English ratio.
  const longExperiments = [0, 1, 2].map((i) => ({
    hypothesis:
      `Experiment ${i}: ` + 'name a concrete move the specific flow supports and say why it ranks here. '.repeat(3),
    rationale: 'This ranks where it does because '.repeat(4),
    lever: i === 2 ? 'funnel-only' : 'value-moment',
  }))
  const fullPatch = {
    patch: {
      firstValueMoment: 'The first report renders with the user connected data in it. '.repeat(3),
      frictionScore: 45,
      frictionRationale: 'A real gate sits between arrival and value: '.repeat(3),
      recurrenceSignal: 'weak',
      durableValue:
        'Retention: ' + 'the value returns on a nameable cadence and here is the artifact. '.repeat(4) +
        'Expansion: ' + 'the retained user moves to more seats gated behind this. '.repeat(4),
      topDropOff: 'The single place users churn before value is '.repeat(3),
      scopeNote: 'This read covers only the steps shown and may understate the real path. '.repeat(3),
      experiments: longExperiments,
    },
    changes: [
      'first-value-moment',
      'experiment',
      'ranking',
      'friction-score',
      'durable-value',
      'drop-off',
      'scope',
    ].map((target) => ({
      target,
      before: 'the original text or value here '.repeat(3),
      after: 'the corrected text or value here '.repeat(3),
      reason: 'why this changed, stated plainly '.repeat(3),
    })),
  }
  const serialized = JSON.stringify(fullPatch)
  const estimatedTokens = Math.ceil(serialized.length / 4)
  assert.ok(
    estimatedTokens < 4096,
    `a full-size patch is ${estimatedTokens} estimated tokens, within the 4096 budget`,
  )

  // And it still merges and validates cleanly onto a base audit.
  const { final } = validateReconciled(fullPatch, businessMilestoneAudit())
  assert.equal(final.experiments[2].lever, 'funnel-only')
})
