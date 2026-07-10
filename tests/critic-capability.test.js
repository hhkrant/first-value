// Critic capability battery. This is the live-model proof that the critic is a
// real adversary, not theater: it feeds the critic several audits that each
// carry a known, specific flaw and asserts the critic catches them, plus one
// clean audit it must pass without inventing an objection.
//
// Unlike the deterministic pipeline tests (which inject a fake transport and
// prove the wiring), this suite makes real Anthropic API calls, because the
// critic's judgment is model behavior and can only be exercised against the
// live model. So it is KEY-GATED: with no ANTHROPIC_API_KEY it skips, and
// `npm test` stays green and keyless. Run it in a live session:
//
//   ANTHROPIC_API_KEY=sk-ant-... npm test -- tests/critic-capability.test.js
//
// It is assertion-based and repeatable, so it systematically probes several
// flaw types on every run rather than relying on one lucky capture. Model output
// varies, so the flaws are chosen to be unambiguous and the aggregate bar allows
// one miss; a systematic failure still reds the suite.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { runCritic } from '../src/lib/anthropic.js'

const KEY = process.env.ANTHROPIC_API_KEY
const skip = KEY ? false : 'no ANTHROPIC_API_KEY: skipping the live critic capability battery'

// Each case pairs a realistic flow with an audit that carries one clear flaw,
// and names the critic target that flaw should surface under. The flaw is real
// relative to the flow, so a correct critic has a concrete fault to name.
const FLAWED = [
  {
    label: 'business-milestone value moment',
    expectTarget: 'first-value-moment',
    description:
      'A self-serve e-signature tool. A new user signs up, lands on a dashboard, uploads a PDF, adds a recipient email and a signature field, and clicks Send. The recipient signs, and the signed copy returns to the sender account.',
    audit: {
      firstValueMoment: 'The user creates an account and reaches the dashboard.',
      frictionScore: 30,
      frictionRationale: 'Short self-serve path: sign up, then the dashboard loads.',
      recurrenceSignal: 'weak',
      durableValue:
        'Retention: senders return when they have another document to sign. Expansion: paid plans add templates and bulk send.',
      topDropOff: 'The signup form.',
      scopeNote: 'Covers signup through the signed copy returning to the sender, the whole path from arrival to value.',
      experiments: [
        { hypothesis: 'Speed up signup with SSO.', rationale: 'Fewer fields to reach the dashboard.', lever: 'value-moment' },
        { hypothesis: 'Add a template gallery for repeat senders.', rationale: 'A saved template is a reason to return.', lever: 'durable-value' },
        { hypothesis: 'Add a progress bar on the send flow.', rationale: 'Nudge completion of the send.', lever: 'funnel-only' },
      ],
    },
  },
  {
    label: 'generic experiment the flow does not support',
    expectTarget: 'experiment',
    description:
      'A free online invoice generator. One page: business name, client name, line items, and a Download PDF button. No account, no collaboration, no saved data. Fill the form, click Download, and a formatted invoice PDF downloads.',
    audit: {
      firstValueMoment: 'The finished invoice PDF downloads to the user.',
      frictionScore: 16,
      frictionRationale: 'A short self-serve path: one form, one download.',
      recurrenceSignal: 'absent',
      durableValue:
        'Retention: nothing recurs on its own, the flow gives no reason to return. Expansion: an optional account could save invoices, but it sits after the download. This will not retain, so the work is a reason to come back, not a shorter path to a first download that is already short.',
      topDropOff: 'The moment right after the download.',
      scopeNote: 'Covers the single form through the PDF download, complete from arrival to value.',
      experiments: [
        { hypothesis: 'Invite a teammate to collaborate on the invoice in a shared workspace.', rationale: 'Collaboration drives return visits.', lever: 'durable-value' },
        { hypothesis: 'Save the client so the next invoice pre-fills.', rationale: 'A saved client is a reason to return.', lever: 'durable-value' },
        { hypothesis: 'Add a completion nudge above the Download button.', rationale: 'Lift the download rate.', lever: 'funnel-only' },
      ],
    },
  },
  {
    label: 'funnel-only lever ranked first',
    expectTarget: 'ranking',
    description:
      'A note-taking app. A new user signs up, lands in an empty workspace, and types their first note, which saves automatically and syncs across devices. The felt value is a note that persists and is there on the next visit.',
    audit: {
      firstValueMoment: 'The first note saves and is there on the next visit.',
      frictionScore: 20,
      frictionRationale: 'A short self-serve path: sign up, type a note, it saves.',
      recurrenceSignal: 'strong',
      durableValue:
        'Retention: the saved notes are a reason to return daily. Expansion: paid plans add more storage and collaborators, which matters more here than a faster first note.',
      topDropOff: 'The empty first workspace.',
      scopeNote: 'Covers signup through the first saved note, the whole path from arrival to value.',
      experiments: [
        { hypothesis: 'Add a progress bar to the signup form to lift completion.', rationale: 'A funnel-metric lift on signup.', lever: 'funnel-only' },
        { hypothesis: 'Prompt the user to create a second note the next day.', rationale: 'Builds the return habit.', lever: 'durable-value' },
        { hypothesis: 'Preload a starter template so the workspace is not empty.', rationale: 'Faster path to a first saved note.', lever: 'value-moment' },
      ],
    },
  },
  {
    label: 'friction score in the wrong band',
    expectTarget: 'friction-score',
    description:
      'A payments product. A new business signs up, then must verify email, enter business details, and connect and verify a bank account before any payout can move. Verification can take a day or more and depends on a third-party check.',
    audit: {
      firstValueMoment: 'The first real payout settles into the connected bank account.',
      frictionScore: 8,
      frictionRationale: 'Value is reachable in a single obvious step with no wait.',
      recurrenceSignal: 'strong',
      durableValue:
        'Retention: payouts recur per billing cycle once live. Expansion: higher volume tiers and added products, which matters more than shaving the first payout.',
      topDropOff: 'Bank verification.',
      scopeNote: 'Covers signup through the first payout, including the email, business, and bank verification gates. Complete from arrival to value.',
      experiments: [
        { hypothesis: 'Let a developer move a test charge before verification.', rationale: 'A felt result before the gate.', lever: 'value-moment' },
        { hypothesis: 'Pre-fill business details from the email domain.', rationale: 'Shorten the verification path.', lever: 'value-moment' },
        { hypothesis: 'Add a checklist progress indicator.', rationale: 'Lift setup completion.', lever: 'funnel-only' },
      ],
    },
  },
]

const CLEAN = {
  description:
    'A free online invoice generator. One page: business name, client name, line items, and a Download PDF button. No account. Fill the form, click Download, and a formatted invoice PDF downloads.',
  audit: {
    firstValueMoment:
      'The finished invoice PDF lands in the downloads folder, a correct formatted invoice in hand with no account between arrival and that file.',
    frictionScore: 16,
    frictionRationale: 'A short self-serve path: one form on one screen, then the download produces the value directly.',
    recurrenceSignal: 'absent',
    durableValue:
      'Retention: value does not recur on its own, nothing is saved and the flow gives no reason to return. Expansion: the only path off the one-time hit is an optional account that saves invoices. This is real, fast activation that will not retain, so the work is a reason to come back, not a shorter path to a first download that is already short.',
    topDropOff: 'The moment right after the download, when the page offers nothing that pulls the user back.',
    scopeNote: 'Covers the single form through the PDF download, the whole path from arrival to value with nothing omitted.',
    experiments: [
      { hypothesis: 'Save the client and line items to a lightweight account created from the invoice itself, so the next invoice for that client is one click.', rationale: 'The gap is recurrence, not activation, so turning a one-off into a saved client is the move most likely to make a return happen.', lever: 'durable-value' },
      { hypothesis: 'Pre-fill the business details from the email domain on first load.', rationale: 'Shaves the small friction that remains before an already-fast first download.', lever: 'value-moment' },
      { hypothesis: 'Add a completion nudge above the Download button.', rationale: 'A funnel-metric lift that does not fix the missing reason to return, so it ranks last.', lever: 'funnel-only' },
    ],
  },
}

test('critic capability battery (live model)', { skip }, async (t) => {
  const caught = []

  for (const flaw of FLAWED) {
    await t.test(`catches: ${flaw.label}`, async () => {
      const critique = await runCritic({
        apiKey: KEY,
        description: flaw.description,
        images: [],
        audit: flaw.audit,
      })
      const objected = critique.verdict !== 'clean' || critique.objections.length > 0
      if (objected) caught.push(flaw.label)
      // Report the critic's read for this case so a live run is legible.
      t.diagnostic(
        `${flaw.label}: verdict=${critique.verdict}, objections=${critique.objections
          .map((o) => o.target)
          .join('|') || 'none'}`,
      )
      // Soft per-case signal: the business-milestone slip is the clearest and
      // most reliable, so it is the one hard target assertion. The others feed
      // the aggregate bar below, which tolerates a single model miss.
      if (flaw.expectTarget === 'first-value-moment') {
        assert.ok(objected, 'the business-milestone value moment must draw an objection')
        assert.ok(
          critique.objections.some((o) => o.target === 'first-value-moment'),
          'the objection names the first-value-moment target',
        )
      }
    })
  }

  await t.test('aggregate: catches at least three of four flaws', () => {
    assert.ok(
      caught.length >= 3,
      `critic caught ${caught.length} of ${FLAWED.length} flaws (${caught.join(', ')})`,
    )
  })

  await t.test('does not rubber-stamp: a clean audit passes without invented objections', async () => {
    const critique = await runCritic({
      apiKey: KEY,
      description: CLEAN.description,
      images: [],
      audit: CLEAN.audit,
    })
    t.diagnostic(
      `clean audit: verdict=${critique.verdict}, objections=${critique.objections
        .map((o) => o.target)
        .join('|') || 'none'}`,
    )
    assert.equal(critique.verdict, 'clean', 'a correct audit gets a clean verdict')
    assert.equal(critique.objections.length, 0, 'no objections invented on a clean audit')
  })
})
