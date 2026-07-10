import React from 'react'
import { splitDurableValue } from '../lib/audit.js'

function FirstValueCard({ moment }) {
  return (
    <article className="card card--value">
      <header className="card__head">
        <span className="card__index">1</span>
        <h3 className="card__title">First Value Moment</h3>
      </header>
      <p className="card__desc">
        This is the point a user first sees and feels real product value. The
        goal is to get more users here faster.
      </p>
      <p className="card__lead">{moment}</p>
    </article>
  )
}

// The four friction bands the score is read against, matching the rubric in the
// system prompt (src/lib/framework.js). Each band pairs a plain level word with
// the phrase that describes it and the numeric range that defines it. The score
// still lives in the data (the ranking rule and the code cross-check use the
// number); the card reads the band, not the digit, because the model's number
// wobbles a few points between runs.
const FRICTION_BANDS = [
  { level: 'Low', phrase: 'Value in one step', range: '0-15', max: 15, tone: 'low' },
  { level: 'Moderate', phrase: 'Short self-serve path', range: '16-33', max: 33, tone: 'low' },
  { level: 'High', phrase: 'A gate to clear', range: '34-66', max: 66, tone: 'mid' },
  { level: 'Very high', phrase: 'Depends on others', range: '67-100', max: 100, tone: 'high' },
]

function frictionActiveIndex(score) {
  const i = FRICTION_BANDS.findIndex((b) => score <= b.max)
  return i === -1 ? FRICTION_BANDS.length - 1 : i
}

function FrictionCard({ score, rationale }) {
  const clamped = Math.max(0, Math.min(100, Number(score) || 0))
  const active = frictionActiveIndex(clamped)
  const band = FRICTION_BANDS[active]
  return (
    <article className="card card--friction">
      <header className="card__head">
        <span className="card__index">2</span>
        <h3 className="card__title">Friction to reach value</h3>
      </header>
      <p className="card__desc">
        A measure of how quickly a user gets from arrival to first-value, not
        whether the value gives them a reason to come back.
      </p>
      <div
        className="bandscale bandscale--friction"
        role="img"
        aria-label={`Friction: ${band.level}, ${band.phrase}, score ${clamped} of 100`}
      >
        {FRICTION_BANDS.map((b, i) => {
          const on = i === active
          return (
            <div
              key={b.level}
              className={`band ${on ? `band--active band--${b.tone}` : ''}`}
            >
              <span className="band__level">{b.level}</span>
              <span className="band__range">{b.range}</span>
              {on && <span className="band__phrase">{b.phrase}</span>}
              {on && <span className="band__num">score {clamped}/100</span>}
            </div>
          )
        })}
      </div>
      <p className="card__lead">{rationale}</p>
      <p className="card__note">
        The band is more meaningful than the score, which can move a few points
        between runs because it is the model's judgment.
      </p>
    </article>
  )
}

// The three recurrence bands, most durable first. The signal word is the card's
// headline read. "None" is the display label for the `absent` signal; the
// underlying value stays `absent` because validation and the tests key on that
// word.
const RECURRENCE_BANDS = [
  { key: 'strong', label: 'Strong', gloss: 'they keep coming back', tone: 'low' },
  { key: 'weak', label: 'Weak', gloss: 'some pull to return, not much', tone: 'mid' },
  { key: 'absent', label: 'None', gloss: 'one-time value', tone: 'high' },
]

function DurableValueCard({ durableValue, recurrenceSignal }) {
  const found = RECURRENCE_BANDS.findIndex((b) => b.key === recurrenceSignal)
  const activeIdx = found === -1 ? 2 : found
  const active = RECURRENCE_BANDS[activeIdx]
  const split = splitDurableValue(durableValue)
  return (
    <article className="card card--durable">
      <header className="card__head">
        <span className="card__index">4</span>
        <h3 className="card__title">Recurring, lasting value</h3>
      </header>
      <p className="card__desc">
        A measure of whether the value gives users a reason to come back, and
        whether usage can grow beyond the first use.
      </p>
      <div className="durable__read-out">
        <span className="bandscale__label">Reason to return</span>
        <div
          className="bandscale bandscale--recurrence"
          role="img"
          aria-label={`Reason to return: ${active.label}, ${active.gloss}`}
        >
          {RECURRENCE_BANDS.map((b, i) => {
            const on = i === activeIdx
            return (
              <div
                key={b.key}
                className={`band ${on ? `band--active band--${b.tone}` : ''}`}
              >
                <span className="band__level">{b.label}</span>
                {on && <span className="band__gloss">{b.gloss}</span>}
              </div>
            )
          })}
        </div>
      </div>
      {split ? (
        <div className="durable__reads">
          <div className="durable__read">
            <p className="durable__q">Will they come back?</p>
            <p className="durable__a">{split.retention}</p>
          </div>
          <div className="durable__read">
            <p className="durable__q">Is there room to grow?</p>
            <p className="durable__a">{split.expansion}</p>
          </div>
        </div>
      ) : (
        <p className="card__lead">{durableValue}</p>
      )}
      <p className="card__note">
        Two separate reads: whether users return at all, and whether a returning
        user has a path to a bigger plan.
      </p>
    </article>
  )
}

function DropOffCard({ dropOff }) {
  return (
    <article className="card card--dropoff">
      <header className="card__head">
        <span className="card__index">3</span>
        <h3 className="card__title">Top Drop-Off Risk</h3>
      </header>
      <p className="card__desc">
        The single place users most likely churn before reaching value.
      </p>
      <p className="card__lead">{dropOff}</p>
    </article>
  )
}

// Maps an experiment's lever to the goal it is trying to move, stated as a plain
// goal rather than the framework's internal term. The funnel goal keeps its
// "ranked last" note: a funnel change is labeled and pinned to the bottom rank,
// so the value-first, funnel-last stance shows in the output, not only in prose.
function leverTag(lever) {
  if (lever === 'durable-value') {
    return { label: 'Goal: strengthen the reason to return', tone: 'durable' }
  }
  if (lever === 'funnel-only') {
    return { label: 'Goal: optimize the funnel (ranked last)', tone: 'funnel' }
  }
  return { label: 'Goal: get more users to value', tone: 'value' }
}

function ExperimentsCard({ experiments }) {
  const list = Array.isArray(experiments) ? experiments : []
  return (
    <article className="card card--experiments">
      <header className="card__head">
        <span className="card__index">5</span>
        <h3 className="card__title">Experiments</h3>
      </header>
      <p className="card__desc">
        Ordered by how many more users each would get to value, biggest impact
        first. When two are close, the one that builds repeat value ranks higher.
        Funnel-only tweaks are labeled and always placed last.
      </p>
      <ol className="experiments">
        {list.map((exp, i) => {
          const tag = leverTag(exp.lever)
          return (
            <li key={i} className="experiment">
              <span className="experiment__rank">{i + 1}</span>
              <div className="experiment__body">
                <span className={`experiment__lever experiment__lever--${tag.tone}`}>
                  {tag.label}
                </span>
                <p className="experiment__hypothesis">{exp.hypothesis}</p>
                <p className="experiment__rationale">{exp.rationale}</p>
              </div>
            </li>
          )
        })}
      </ol>
    </article>
  )
}

// Human labels for the critic's target enum, so an objection reads "First value
// moment" rather than the raw "first-value-moment" key.
const TARGET_LABELS = {
  'first-value-moment': 'First value moment',
  experiment: 'Experiment',
  ranking: 'Ranking',
  'friction-score': 'Friction score',
  'durable-value': 'Durable value',
  'drop-off': 'Drop-off',
  scope: 'Scope',
}

function targetLabel(target, targetIndex) {
  const base = TARGET_LABELS[target] || target
  if (target === 'experiment' && typeof targetIndex === 'number') {
    return `${base} ${targetIndex + 1}`
  }
  return base
}

// Plain-English meaning of the critic's overall pushback level, shown inline
// next to the level so the bare word is not left to interpretation.
const VERDICT_MEANING = {
  clean: 'Nothing worth changing',
  minor: 'Worth addressing, but the main conclusion holds',
  significant: 'The critic thinks the main conclusion should change',
}

// Objections are ordered most serious first. The severity itself is no longer
// shown as a badge (it read as noise next to the overall pushback level); it
// only sets the order.
const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 }

function bySeverity(a, b) {
  const av = SEVERITY_ORDER[a.severity] ?? 3
  const bv = SEVERITY_ORDER[b.severity] ?? 3
  return av - bv
}

// The reconciler's reason sometimes opens by conceding ("The critic is
// right..."). The Accepted tag already says that, so the opener is stripped and
// only the rationale is shown, per the ask to show why rather than restate that
// the critic was right.
function stripConcession(reason) {
  if (!reason) return ''
  return String(reason).replace(/^\s*the critic is (right|correct)[.,:;-]*\s*/i, '')
}

// A small numbered step wrapper so the three agents read as a sequence, not a
// stack of unlabeled panels. Each step names what it is and why it is there.
function Step({ n, title, what, children, tone }) {
  return (
    <section className={`step ${tone ? `step--${tone}` : ''}`} aria-label={title}>
      <header className="step__head">
        <span className="step__num">{n}</span>
        <div>
          <h4 className="step__title">{title}</h4>
          {what && <p className="step__what">{what}</p>}
        </div>
      </header>
      <div className="step__body">{children}</div>
    </section>
  )
}

// The three-agent process, shown after the read so a reader sees the answer
// first and then how it was stress-tested. Step 1 is the auditor's first pass,
// step 2 the independent critic, step 3 the auditor reconciling under that
// pushback. The code-side cross-check follows as a fourth, non-model layer.
function ProcessSteps({ critique, reconciled, degraded, degradedReason, coherence }) {
  const objections =
    critique && Array.isArray(critique.objections) ? critique.objections : []
  const changes =
    reconciled && Array.isArray(reconciled.changes) ? reconciled.changes : []
  const criticFailed = !critique && degraded && degradedReason === 'critic'

  return (
    <div className="process">
      <Step
        n="1"
        title="First read"
        what="The auditor makes the first pass: it scores the flow and writes an initial read."
      >
        <p className="step__note">
          What you see in Results above is that read after the critic's accepted
          objections are applied in step 3. The changes listed there show what
          moved from the original draft.
        </p>
      </Step>

      <Step
        n="2"
        title="An independent critic challenges it"
        what="A separate agent tries to break the first read. Because it didn't write that read, it has no stake in defending it, so it looks for what's wrong instead of confirming what's there."
        tone="critic"
      >
        {criticFailed ? (
          <p className="step__muted">
            The independent critic could not complete its pass this run, so only
            the read above stands. Run it again to see the second read.
          </p>
        ) : objections.length === 0 ? (
          <>
            <p className="pushback">
              <span className="pushback__label">Critic pushback</span>
              <span className="chip chip--verdict chip--verdict-clean">
                Clean
              </span>
              <span className="pushback__meaning">{VERDICT_MEANING.clean}</span>
            </p>
            <p className="step__clean">
              The critic tried to break this audit and found nothing to change.
            </p>
            {critique && critique.summary && (
              <p className="step__summary">{critique.summary}</p>
            )}
          </>
        ) : (
          <>
            <p className="pushback">
              <span className="pushback__label">Critic pushback</span>
              <span
                className={`chip chip--verdict chip--verdict-${critique.verdict}`}
              >
                {critique.verdict}
              </span>
              <span className="pushback__meaning">
                {VERDICT_MEANING[critique.verdict]}
              </span>
            </p>
            {critique.summary && (
              <p className="step__summary">{critique.summary}</p>
            )}
            <ul className="objections">
              {[...objections].sort(bySeverity).map((o, i) => (
                <li key={i} className="objection">
                  <p className="objection__text">
                    <span className="objection__target">
                      {targetLabel(o.target, o.targetIndex)}:
                    </span>{' '}
                    {o.objection}
                  </p>
                </li>
              ))}
            </ul>
          </>
        )}
      </Step>

      <Step
        n="3"
        title="The auditor reconciles"
        what="The auditor revisits its own read against each objection above, accepting the ones it agrees with and holding the rest. The section labels match the critic's, so you can line up each response to its challenge."
        tone="reconcile"
      >
        {degraded && degradedReason === 'reconciler' ? (
          <p className="step__muted">
            The revision step could not complete this run, so the objections in
            step 2 are shown without the auditor's response. The read above is
            the original.
          </p>
        ) : objections.length === 0 ? (
          <p className="step__note">
            Nothing to reconcile: the critic raised no objections, so the first
            read stood unchanged.
          </p>
        ) : changes.length === 0 ? (
          <p className="step__note">
            The auditor reviewed the objections and made no change to the read.
          </p>
        ) : (
          <ul className="changes">
            {changes.map((c, i) => {
              const held = c.after === c.before
              const reason = stripConcession(c.reason)
              return (
                <li key={i} className="change">
                  <p className="change__line">
                    <span
                      className={`chip chip--decision chip--decision-${held ? 'held' : 'accepted'}`}
                    >
                      {held ? 'Held' : 'Accepted'}
                    </span>
                    <span className="change__target">
                      {targetLabel(c.target)}:
                    </span>{' '}
                    {held ? (
                      <span className="change__reason-inline">
                        {reason || 'kept as originally read'}
                      </span>
                    ) : (
                      <span className="change__diff-inline">
                        <span className="change__before">{c.before}</span>
                        <span className="change__arrow" aria-hidden="true">
                          {' → '}
                        </span>
                        <span className="change__after">{c.after}</span>
                      </span>
                    )}
                  </p>
                </li>
              )
            })}
          </ul>
        )}
      </Step>

      <CoherenceStep coherence={coherence} />
    </div>
  )
}

// The code-side cross-check: a fourth layer that is not a model. It re-checks
// the finished read against the framework's own rules in code, so the point of
// view holds even when a single model response drifts. Framed as a check, not a
// step in the model chain, and visually distinct for that reason.
function CoherenceStep({ coherence }) {
  const flags = Array.isArray(coherence) ? coherence : []
  return (
    <section className="step step--code" aria-label="Automated cross-check">
      <header className="step__head">
        <span className="step__num step__num--code">✓</span>
        <div>
          <h4 className="step__title">Automated cross-check</h4>
          <p className="step__what">
            Run in code, not by a model: it re-checks the finished read against
            the value-first, funnel-last rules and flags any contradiction.
          </p>
        </div>
      </header>
      <div className="step__body">
        {flags.length === 0 ? (
          <p className="step__clean">
            The ranking and the scores hold against the framework. No
            contradiction between friction, recurrence, and the experiment
            order.
          </p>
        ) : (
          <ul className="coherence__list">
            {flags.map((f, i) => (
              <li key={i} className="coherence__item">
                <span className={`chip chip--flag chip--flag-${f.level}`}>
                  {f.level === 'watch' ? 'Watch' : 'Note'}
                </span>
                <span className="coherence__msg">{f.message}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

// scopeNote is the auditor's own boundary on the read: which steps it was given,
// and whether the input looks like the whole flow or stops short of value. It is
// surfaced above the cards so a reader knows the audit is only as complete as the
// flow they provided. The tool cannot score a gate it was never shown, so it says
// what it was shown instead.
function ScopeNote({ note }) {
  if (!note) return null
  return (
    <aside className="scope-note" aria-label="Scope of this read">
      <span className="scope-note__eyebrow">Scope of this read</span>
      <p className="scope-note__body">{note}</p>
    </aside>
  )
}

export default function ResultCards({
  final,
  critique,
  reconciled,
  degraded,
  degradedReason,
  coherence,
}) {
  if (!final) return null
  return (
    <section className="results" aria-label="Audit results">
      <div className="results__block">
        <header className="section-head">
          <h2 className="section-head__title">Results</h2>
          <p className="section-head__sub">
            This is a summary of the final audit, reflecting the original audit
            updated with the adversarial critic's feedback. Details for both are
            shown below the summary.
          </p>
        </header>
        <ScopeNote note={final.scopeNote} />
        <FirstValueCard moment={final.firstValueMoment} />
        <FrictionCard
          score={final.frictionScore}
          rationale={final.frictionRationale}
        />
        <DropOffCard dropOff={final.topDropOff} />
        <DurableValueCard
          durableValue={final.durableValue}
          recurrenceSignal={final.recurrenceSignal}
        />
        <ExperimentsCard experiments={final.experiments} />
      </div>

      <div className="results__block">
        <header className="section-head">
          <h2 className="section-head__title">How this read was built</h2>
          <p className="section-head__sub">
            Not one prompt. Three agents run in sequence, then the app checks the
            result in code, so the read is challenged before you see it.
          </p>
        </header>
        <ProcessSteps
          critique={critique}
          reconciled={reconciled}
          degraded={degraded}
          degradedReason={degradedReason}
          coherence={coherence}
        />
      </div>
    </section>
  )
}
