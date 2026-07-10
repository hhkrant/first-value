// audit.js
// Small helpers shared across the audit surface, kept in a plain lib module so
// both the UI (src/components/ResultCards.jsx) and the runtime
// (src/lib/anthropic.js) import the same source of truth. Keeping this out of a
// .jsx component means anthropic.js can reuse it without pulling in React.

// Split the durableValue string into its two labeled reads. The system prompt
// requires the model to begin the retention part with "Retention:" and the
// expansion part with "Expansion:", so the card can render them as two separate
// judgments rather than one paragraph. If the labels are absent (for example the
// refusal case, where no value is delivered so there is nothing to split), this
// returns null. That null is also the structural signal the runtime uses to
// detect a refusal: no labels means no value moment was described, so there is
// no retention read to split and no activation ranking to red-team.
export function splitDurableValue(text) {
  const t = (text || '').trim()
  const rMatch = t.match(/Retention:/i)
  const eMatch = t.match(/Expansion:/i)
  if (!rMatch || !eMatch) return null
  const rIdx = rMatch.index
  const eIdx = eMatch.index
  if (eIdx <= rIdx) return null
  const retention = t.slice(rIdx + rMatch[0].length, eIdx).trim()
  const expansion = t.slice(eIdx + eMatch[0].length).trim()
  if (!retention || !expansion) return null
  return { retention, expansion }
}
