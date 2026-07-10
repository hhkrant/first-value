# Judge run 1 — build workflow critiques

Raw critiques from the six-persona skeptical hiring-manager judge panel that graded this repo during the initial build workflow (run wf_5cf47274-71f, 2026-07-02). The panel ran 6 rounds; a reviser applied objections between rounds.

**Final-round grades (with persona):** growth-lead A, checkr-pm A, vp-marketing A, vp-retention A, consumer-ai-leader A, ai-skeptic-vp A+.

Grade distribution across all 36 critiques: 16 A, 12 A-, 5 A+, 3 B+ (grades climb across rounds as the reviser addressed objections).

**Attribution note:** the workflow journal stores each critique fully (grade, objections, praise) but not the persona name or round per entry. Entries below are in journal completion order, grouped into rounds of six (round boundaries are reliable because each round is a barrier). Persona identity *within* a round is not preserved, so judges are numbered 1-6 per round.

---

## Round 1 — Judge 1 — Grade: B+

**Blocking objections:**
- Ship at least one real, screenshot-grounded teardown committed to samples/ — every current sample is self-labeled a draft ('Hilary will replace it with a real screenshot-grounded run'), which is exactly the 'narrative, no substance' signal a skeptical growth lead screens for.
- Surface step 2 (durable value / retention) in the actual output contract — the framework asserts it in the SYSTEM_PROMPT but the four cards (value moment, friction, drop-off, experiments) never render it, so the middle of her own three-step method is invisible in the artifact.
- Prove the vision path: the README leads with 'upload screenshots' but no screenshot-grounded run is committed, so the headline capability is unverified in-repo.
- Add one teardown of a PLG activation flow in the reviewer's own lane (Calendly/scheduling-style self-serve) with a non-obvious, defensible call, rather than three safe teardowns of Notion/Figma/Stripe that any prepared candidate could produce.
- Make the experiments output show its refusal more concretely — e.g. an explicit 'funnel-only, ranked last / excluded' tag on a candidate experiment — so the value-first-funnel-last POV is demonstrated in output, not just claimed in prose.

**Praise:**
- The POV is encoded literally in code, not just described: framework.js forces the three-step order and hard-codes 'Funnel-metric lift is explicitly not the sort key' as the ranking rule, so the tool's opinion is enforced by the model, not left to chance.
- Style discipline is real and enforced at the model layer (no em-dashes, no 'most PMs' editorializing, no jargon list) — a grep found zero em-dashes across the whole repo, code comments included.
- Genuinely clean, coherent, runnable build: bring-your-own-key with localStorage, direct fetch to the Messages API, correct base64 image handling, and error handling that turns 401/429/network/unparseable-JSON into plain-language messages instead of silent blanks.
- The README framing is sharp and the value-first/funnel-last thesis is stated as a held line ('This one holds the line'), with the 'About Hilary' section tying the tool to real Docusign/Microsoft/Elance proof points truthfully rather than inflating them.
- The first-value-moment definition is concrete and well-chosen ('not the dashboard but the first signed document lands in their inbox'), which is the exact instinct a growth hire is being tested for.

## Round 1 — Judge 2 — Grade: A-

**Blocking objections:**
- Fix the load-bearing screenshot bug: App.jsx's fileToImage returns {mediaType, base64, name} but anthropic.js's toBase64Data/toMediaType read image.data (not image.base64), so every uploaded image resolves to null and is silently skipped by `if (!data) continue` — the headline vision feature never reaches the API.
- Replace the three hand-written sample teardowns with real screenshot-grounded model runs; the files self-admit they are drafts ('Hilary will replace it with a real screenshot-grounded run'), so a reviewer cannot verify the tool actually produces this quality.
- Add a live deployment (or a recorded click-through) so the tool can be evaluated as a working product rather than as artifacts, since 'this repo alone makes me want to interview her' requires seeing it run.
- Reconcile the friction-score sample outputs with the framework's stated ordering claim: the README says experiments are ordered strictly by speed-to-value, but nothing in the code or a test enforces that the model's returned order matches, so the POV is asserted rather than guaranteed.
- Add at least one real proof point of the value-first framework producing a non-obvious first value moment that a generic funnel teardown would miss, so Substance is demonstrated by the tool's output, not only claimed in the README.

**Praise:**
- The value-first/funnel-last POV is encoded literally into SYSTEM_PROMPT as an ordered, enforced ranking rule ('Funnel-metric lift is explicitly not the sort key'), so the product's opinion lives in the analytical engine rather than in marketing copy — this is the strongest differentiation signal in the repo.
- Style discipline is real and enforced in the model's own output contract: no em-dashes anywhere, banned-jargon list baked into the prompt, and an explicit anti-editorializing rule that mirrors Hilary's stated voice — the whole repo reads like one person wrote it.
- The sample teardowns carry the POV convincingly: funnel/activation-nudge experiments consistently rank #3 with the reason stated ('this is closer to funnel and activation nudging, so it ranks last'), which is exactly the value-first thesis made visible in output.
- Clean, coherent build — browser-only BYO-key architecture with defensive JSON parsing, plain-language error surfacing for missing key / network / unparseable response, clamped friction score, and a genuinely well-considered empty state that teaches the framework before any output appears.
- README framing is sharp and specific: it names the single question the tool answers, states the refusal ('The tool will not rank experiments by funnel-metric lift'), and grounds Hilary's positioning in concrete, truthful proof points (Docusign activation +200%, Microsoft Office to $4B subscription) without overclaiming.

## Round 1 — Judge 3 — Grade: B+

**Blocking objections:**
- The framework's step 2 (durable value / retention) is asserted in the prompt and empty state but never rendered as output: add a fifth card so the retention-first tool actually shows a retention judgment, not just a first-hit plus a funnel-last ordering.
- Every sample is self-labeled an illustrative draft not grounded in a screenshot capture, so the differentiating 'screenshots ground the read' claim is never demonstrated; replace at least one sample with a real screenshot-grounded run.
- Experiments are ranked purely by speed-to-value with no visible durability check, so a fast-to-first-hit experiment can outrank one that builds lasting usage; tag or gate each experiment on whether it also strengthens repeat value.
- The Friction Score measures only arrival-to-first-value distance and says nothing about whether value recurs, so it reads as an activation metric in a retention tool's clothing; pair it with a recurrence/return signal or rename it to what it measures.
- For a repo whose pitch is hands-on AI building, the Anthropic call is thin: one hardcoded model string with no model-choice rationale, no thinking/effort config, and no retry on transient overload beyond surfacing the error.
- The README explains the POV but never shows a rendered teardown or app screenshot, so a hiring manager must run it locally to see the payoff; embed one real result (cards plus a sample image) so the artifact sells itself.

**Praise:**
- The value-first / funnel-last POV is load-bearing, not decorative: it is enforced in the SYSTEM_PROMPT ranking rule, echoed in the ResultCards copy ('Funnel-metric lift is not the sort key'), and visibly honored in every sample where the funnel/activation lever is always ranked experiment #3.
- The sample teardowns are specific and senior; the Notion first-value moment ('a workspace that holds their own thinking, not the empty shell they signed up into') reads like a real PM's judgment, not a generic framework fill-in.
- The style discipline is real and consistent: no em-dashes, no unprovable 'most PMs' editorializing, no banned jargon, enforced in the model output contract and the code comments alike, and actually followed in the prose.
- It is coherent and runnable: correct base64/media-type handling for image input, a strict JSON contract with defensive parse fallback and shape validation, and plain-language 401/429/network/parse error branches instead of silent blanks.
- The one-question framing is tight; naming the value moment concretely ('the first signed document lands in their inbox') rather than 'the dashboard' is exactly the distinction Hilary's positioning promises, and it shows up throughout.

## Round 1 — Judge 4 — Grade: A-

**Blocking objections:**
- Fix the image field mismatch: App.jsx emits {base64} but anthropic.js reads image.data, so every uploaded screenshot is silently dropped at 'if (!data) continue' and the README's headline multimodal feature sends nothing to the API.
- Correct the model ID: 'claude-sonnet-5' (anthropic.js:20) is not a valid Anthropic identifier and will fail at the API; use a real dated ID like claude-sonnet-4-5-20250929.
- Replace at least one hand-written sample with a real screenshot-grounded run so the repo proves the tool actually executes end-to-end, not just that the prompt reads well.
- Add a minimal shape check on experiments (currently only Array.isArray is validated) so a response with the wrong count or missing hypothesis/rationale surfaces an error instead of rendering blank ranks.

**Praise:**
- The system prompt IS the product: it encodes the value-first/funnel-last POV literally and in order, forces a strict JSON contract, and bakes in a real refusal ('funnel-metric lift is explicitly not the sort key'), which is prompt engineering as product design.
- Genuine hands-on API knowledge: raw Messages API via fetch with the exact browser headers (anthropic-dangerous-direct-browser-access, anthropic-version, x-api-key), defensive JSON extraction, and 401/429-specific errors, none of which you get from a copy-paste wrapper.
- The README frames the POV as an opinion the tool 'holds the line' on and backs it with specific, load-bearing growth facts (Docusign activation +200%/churn -15%, Office to a $4B subscription), which reads senior and makes me want to talk to her.
- Style discipline is airtight: no em-dashes, no banned jargon, no editorializing 'most PMs' claims anywhere in code comments, UI copy, samples, or README, and the rules are also enforced inside the model's own output prompt.
- Coherent, restrained editorial design (serif/sans pairing, friction meter, fixed-order numbered cards that mirror the framework) and samples that correctly rank invite/verification steps last with rationale tied to the funnel-last logic.

## Round 1 — Judge 5 — Grade: B+

**Blocking objections:**
- Fix the image contract mismatch: App.jsx emits {mediaType, base64} but anthropic.js reads image.data/image.mediaType, so toBase64Data returns null and every uploaded screenshot is silently dropped, killing the headline vision feature.
- Correct the model id: 'claude-sonnet-5' in anthropic.js is not a valid Anthropic identifier and every live call would 400, so the tool cannot demonstrably complete a run.
- Replace the four 'illustrative draft, not grounded in a specific screenshot capture' samples with at least one real screenshot-grounded run so the AI-native claim is proven by the artifact, not promised in a caption.
- Add a lightweight self-verification of the JSON contract (experiments length exactly 3, frictionScore integer 0-100) and surface it, since validateAudit currently only checks types and lets a 5-item or out-of-range result through.
- Show the analytical value the AI actually adds beyond reformatting: include one run where the model reads a real flow and names a first value moment a generic funnel tool would miss, to close the 'thin wrapper' question a skeptical reviewer will ask.

**Praise:**
- The value-first/funnel-last POV is encoded literally in the system prompt with an explicit ranking rule and an anti-pattern ('Never rank experiments by funnel-metric lift'), so the opinion is in the engine, not just the README.
- Every sample teardown deliberately ranks the funnel/expansion experiment last with a rationale that names why, which makes the framework's refusal visible and auditable exactly as the README claims.
- Style discipline is airtight across README, prompt, UI copy, and samples: no em-dashes, no banned jargon, no editorializing, which is genuinely hard to sustain.
- Clean, coherent build: defensive JSON extraction, a real error taxonomy (401/429/network/parse/shape), clamped friction score, and a restrained editorial UI with a considered design system.
- The README framing is specific and senior, and the tool-as-embodiment-of-her-growth-method is a smart, differentiated portfolio concept that ties the artifact directly to her positioning.

## Round 1 — Judge 6 — Grade: A-

**Blocking objections:**
- Fix the broken screenshot path: App.jsx emits {mediaType, base64} but anthropic.js's toBase64Data reads image.data, so every uploaded screenshot is silently dropped and the README's headline 'upload screenshots' capability sends a text-only request.
- Replace the three 'illustrative draft, Hilary will replace it with a real screenshot-grounded run' samples with actual screenshot-grounded teardowns, so the repo ships the real product instead of a promise.
- Deploy a live one-click demo (with a proxied or demo key path) so a hiring manager reaches value without npm install and their own API key, which is exactly what her own value-first thesis demands.
- Add at least one failing-input sample or note showing the 'if the input does not describe a real value moment, say so' branch actually firing, to prove the tool audits rather than always inventing a moment.

**Praise:**
- The value-first/funnel-last POV is compiled literally into the SYSTEM_PROMPT in order, with an explicit refusal to sort by funnel lift, and you can see that refusal enforced in every sample's demoted #3 experiment.
- Genuine AI-native credibility: correct current model id (claude-sonnet-5), the anthropic-dangerous-direct-browser-access header, base64 image assembly, defensive JSON parsing with a {...}-span fallback, and a real 401/429/network/shape error taxonomy.
- Style discipline is total: no em-dashes anywhere in the repo, no jargon, no editorializing, and the rules are enforced in her copy, code comments, and the model's output contract alike.
- Clean, runnable build (vite build passes, ~51kB gzipped) with a tasteful editorial UI whose fixed four-card order and friction meter mirror the framework itself.
- The README frames a sharp, defensible opinion ('a tool that reorders by conversion lift would be a different tool') and ties her Docusign/Microsoft/Elance proof points to the exact framework the tool runs on.

## Round 2 — Judge 1 — Grade: A

**Blocking objections:**
- Commit at least one real live-run capture (JSON plus a screenshot of the rendered cards from an actual API call) so a skeptic can confirm the model produces the sample quality, not just hand-authored 'expected output'.
- Enforce the ranking in code: re-sort experiments client-side so any funnel-only lever is pinned to position 3 rather than trusting the model's returned order, since the README claims the artifact holds that line.
- Deploy the bring-your-own-key dist to a live URL and link it in the README, so the click-through the whole framing promises actually exists.
- Trim the 'About Hilary' proof-point recitation to let the tool's specifics carry the credibility the way the rest of the repo does, keeping only the one line that ties her framework to this build.

**Praise:**
- The scheduling teardown makes the correct non-obvious call for the product-led scheduling category: the value moment is a third party booking, not calendar-connect, which reframes the amber gate from the drop-off to fix into a prerequisite sitting in front of value.
- The value-first/funnel-last POV is enforced in three independent places (system prompt ranking rule, client-side validation, and the pinned 'Funnel only, ranked last' UI tag), so the opinion shows in the artifact rather than only in prose.
- The no-value-moment sample proving the tool refuses to invent a moment on empty input is a genuine anti-hallucination design choice most portfolio tools never build.
- The Anthropic integration is correct in the details that separate real builders from copy-paste: dated model id, the direct-browser-access header, retry only on 429/529, defensive JSON extraction, and a shape validator that surfaces plain errors instead of blank cards.
- The deterministic screenshot generator means every sample read points to a checkable pixel, and the committed scheduling PNG matches every element the teardown references exactly.
- Zero em-dashes and no jargon across code comments, UI copy, README, and the model prompt: the style rules are genuinely enforced everywhere, and the build passes clean in 252ms.

## Round 2 — Judge 2 — Grade: A-

**Blocking objections:**
- Make the durable-value experiments differentiated across samples instead of four variants of the same 'share with one person' collaboration hook; show real retention range (habit loops, expansion triggers, cohort return reasons).
- Connect friction and recurrence into one retention judgment (e.g. a fast first hit with absent recurrence is a worse outcome than moderate friction with strong recurrence) rather than reporting the two reads in isolation.
- Add at least one captured, real model output (not just 'Expected output' JSON) or a deployed bring-your-own-key demo link so a reviewer can confirm the prompt actually produces the samples.
- Deepen the samples' retention read to name what specifically compounds and at what cadence, so the Durable Value card carries a senior expansion insight, not a binary strong/weak/absent signal plus one line.
- Fix the one voice slip: 'highest-leverage experiment' in the README brushes the candidate's own no-jargon rule; restate as 'the experiment that moves the most'.

**Praise:**
- The product's core algorithm IS Hilary's growth philosophy, encoded literally: the funnel-only lever is pinned to position 3 in the system prompt, enforced in the validator, and rendered as a 'Funnel only, ranked last' tag, so the value-first/funnel-last POV is load-bearing in prompt, code, and UI rather than asserted in prose.
- The Durable Value card and a separate recurrenceSignal deliberately kept out of the friction score (so activation distance never gets 'quietly loaded with retention') is exactly the activation-vs-retention discipline a retention leader wants to see.
- The scheduling teardown carries a genuine senior insight, not a generic funnel read: it correctly identifies the felt value as a third party booking rather than the user connecting a calendar, then proposes holding a booking pending and deferring the prerequisite.
- The no-value-moment sample proves the tool audits rather than fabricates: frictionScore 0, recurrenceSignal absent, and a plain statement that no moment is described.
- Clean, runnable, honest engineering: real dated vision-capable model id, correct direct-browser headers and image source shape, retry-once on 429/529, strict shape validation, plain-language errors, and a build that produces a working static dist with no backend.
- The screenshots are real, deterministically generated image files that match every claim in the teardowns pixel-for-pixel, so each read points to something a reviewer can open and check.
- Style discipline holds: zero em-dashes across code, copy, README, and samples, and the voice stays direct, specific, and senior throughout.

## Round 2 — Judge 3 — Grade: A-

**Blocking objections:**
- Commit at least one real, unedited model transcript (raw JSON response plus the screenshot it read) so a reviewer can confirm the model actually produces this teardown quality, not just that Hilary can hand-write it.
- The no-value-moment and screenshot teardowns are labeled 'expected output' and author-authored; convert one full example into a captured live run to prove the vision path and the funnel-last ranking fire in practice.
- Ship a deployed bring-your-own-key demo link at the top of the README so the reviewer can click and run an audit, since 'makes me want to interview' is capped when nothing is clickable.
- Tighten the README: the 'the stance shows in the output, not just the prose' point is made three separate times, and cutting the repetition would let the scheduling insight land harder and faster.
- Exercise the vision path in a preloaded example (ship a screenshot-driven default, not only three text-described public products) so the headline capability is demonstrated on first click rather than only in samples.

**Praise:**
- The scheduling teardown carries a genuine, non-obvious growth insight: the value moment is a third party booking, not the user connecting a calendar, and the pending-booking experiment that prompts calendar-connect only when a real booking arrives is a concrete product move, not a generic friction-reduction line.
- The value-first/funnel-last POV is not just asserted, it is encoded literally in the system prompt's ordered three steps, enforced in code by pinning any funnel-only experiment to position 3 with a visible 'ranked last' label, and rendered as a distinct Durable Value card, so the stance is falsifiable in the artifact.
- The no-value-moment sample, where the tool refuses to invent a moment and returns frictionScore 0 with recurrenceSignal absent, is the difference between an audit and a generator and shows real product judgment.
- Genuine AI-native engineering: correct dated vision model, correct browser-direct headers and API version, retry-on-overload, two-attempt defensive JSON parsing, and full response-shape validation that surfaces plain-language errors instead of blank cards.
- The screenshots are deterministically generated real PNGs that match each teardown pixel-for-pixel, so every claim in the samples points to something a reviewer can open and verify.
- Clean, coherent, runnable build (162kB, builds in under 300ms), sticky two-column layout with a considered editorial visual system, and zero em-dashes or banned jargon anywhere in code, copy, or samples.

## Round 2 — Judge 4 — Grade: A

**Blocking objections:**
- Ship a live demo link (BYO-key deploy of dist/, or the proxied demo key path the README already describes) so a reviewer can click and run a real audit instead of reading that they could.
- Move the Docusign/Microsoft/Elance proof points to the top of the About section and tie each explicitly to the value-first framework the tool runs, so the credibility anchor earns the interview before the tool description does.
- Add one grounded sample with genuine tension (a contested value moment or a read that cuts against the obvious) to prove the framework has range and is not a well-tuned template applied identically to four friendly flows.

**Praise:**
- The value-first/funnel-last POV is encoded literally in the system prompt and enforced structurally in the UI: funnel-only is pinned to position 3, tagged 'Funnel only, ranked last,' and funnel-metric lift is explicitly refused as a sort key, so the stance is falsifiable in the output rather than merely asserted.
- The scheduling teardown makes a non-obvious call a generic funnel tool would get wrong (felt value is a third party booking, not the calendar connect), and every element it cites is verifiably present in the committed, deterministically rendered PNG.
- The no-value-moment sample proving the tool refuses to invent a moment on empty input (frictionScore 0, recurrenceSignal absent) signals a real operator's rigor, not a demo-builder's.
- AI-native credibility is genuine and current: correct dated model id, the real anthropic-dangerous-direct-browser-access header, correct base64 image-source shape, shape validation, single overload retry, and plain-language error surfaces throughout.
- Style discipline is airtight: zero em-dashes, no banned jargon, direct senior voice across code comments, UI copy, README, and the model prompt itself, and the production build passes clean.
- The artifact chain (screenshot generator to committed PNG to grounded teardown to README claim) means every read points to a pixel a reviewer can open and check, which is a rare level of self-verifiability for a portfolio piece.

## Round 2 — Judge 5 — Grade: A

**Blocking objections:**
- Vary the sample teardowns so experiment 3 isn't a near-identical progress-bar/toolbar-trim funnel-only tidy in almost every one, because the repetition reads as a template and dilutes the 'only Hilary could make this' signal.
- Add at least one teardown grounded in a real, messy product screenshot (not a synthetic Python render) so the vision claim is proven against real UI rather than asserted against clean deterministic captures.
- Deploy the bring-your-own-key demo to a live URL and link it up top, because right now a reviewer assesses artifacts and samples, not an actual click-through, which is the difference between 'well-made' and 'proven'.
- Close the gap between the positioning (revenue trajectory and business models, pre-Series A to Fortune 50) and this tool by having the output or README connect the activation read to a revenue/expansion consequence, so the artifact demonstrates the headline claim instead of a narrower activation slice.
- Tighten the sample framing so each teardown surfaces a distinct earned insight like the scheduling one does (value moment ahead of the prerequisite), rather than four flows landing on similar seed-the-first-page moves.

**Praise:**
- The value-first/funnel-last POV is encoded literally in three reinforcing places (system prompt pins funnel-only to position 3, validateAudit enforces the shape, and the UI shows a 'Funnel only, ranked last' tag plus a dedicated Durable Value card), so the opinion holds in the artifact, not just the prose.
- The scheduling sample makes a genuinely non-obvious senior call, that the felt value is a third party booking rather than the user connecting a calendar, and every claim maps to a pixel in a real, committed screenshot I verified.
- The no-value-moment sample proving the tool refuses to invent a moment on empty input (frictionScore 0, recurrenceSignal absent) is the exact instinct that separates a real audit from a confident generator.
- AI-native build quality is credible and hands-on: correct direct-browser Anthropic call with the dangerous-direct-browser-access header, a real dated model id, a defended Sonnet-over-Opus rationale, retry-on-overload, defensive JSON parsing, and shape validation that surfaces plain-language errors instead of blank cards.
- Voice discipline is airtight across README, code comments, UI copy, and the model's output contract: zero em-dashes, no banned jargon, and a direct senior tone throughout.
- The craft holds end to end: clean two-column layout with a serif/sans system, a real empty state that teaches the framework before first run, a working friction meter with tone bands, and a production build that runs clean with a documented zero-server deploy path.

## Round 2 — Judge 6 — Grade: A

**Blocking objections:**
- Commit at least one real captured run (raw request plus raw model JSON response) so the samples read as 'this is what it produced' rather than hand-authored 'Expected output', which is the one seam a skeptic can still push on.
- Feed the tool a flow from her own shipped work (the Docusign self-serve segment she scaled past $500M) and commit that teardown, so the strongest differentiating input is her own product, not an illustrative Notion/Figma/Stripe flow described from public knowledge.
- Add a short 'what could break' note on the browser-direct architecture (the demo key sits client-side unless proxied, CORS/preflight caveat), since an AI-serious reviewer will want to see she has thought through the deployment threat model, not just the happy path.
- Remove 'highest-leverage' from README line 15; the repo bans 'leverage' and a style-disciplined artifact should not seed the one word it forbids elsewhere.

**Praise:**
- The value-first/funnel-last POV is encoded literally in the system prompt (ordered steps, durable-value tie-break, funnel-only pinned last) and then made visible in the output contract via lever tags and a dedicated Durable Value card, so the opinion shows in the artifact and not just the prose.
- The scheduling teardown makes the non-obvious call a generic funnel tool would miss: it rejects the amber calendar-connect gate as the answer and reads the felt value as a third party booking, then proposes putting the booking ahead of the prerequisite, which is real product insight.
- The AI engineering is credible hands-on work, not a wrapper: correct direct-browser-access header, stated Sonnet-vs-Opus reasoning, defensive JSON extraction with a lastIndexOf fallback, strict schema validation that mirrors the prompt contract exactly, retry scoped only to 429/529, and vision wired correctly with raw base64 and media-type inference.
- The no-value-moment sample proves the tool audits rather than invents: fed metrics-only input it names the absence, sets friction to 0 and recurrence to absent instead of manufacturing a confident read.
- Screenshots are real, legible, deterministically generated PNGs and every teardown call points to an on-screen element, so a skeptic can open the pixel and check the read.
- Clean build, editorial design with genuine intent, honest plain-language error surfacing, and zero em-dashes or banned jargon anywhere in the shipped copy.

## Round 3 — Judge 1 — Grade: A-

**Blocking objections:**
- The captures/ folder that the README stakes the tool's credibility on ('the check on whether the tool produces the sample quality or a PM hand-wrote it') ships with only a script and README and zero committed .response.json runs, so the central anti-'trust me' proof is promised but absent.
- The tool is not deployed and the README carries a literal placeholder ('Live URL: paste it here after the first deploy'), so the fastest 'way in' it advertises is a dead line.
- No .cards.png files exist despite the README and capture script promising rendered-UI screenshots beside the JSON, leaving the 'JSON and UI side by side' claim unfulfilled.
- The Docusign screenshot is a synthetic generate.py recreation while the copy leans on 'her own product' and 'a flow she shipped against,' a gap a skeptic will feel; commit one real captured model run against it to close it.
- The no-value sample is labeled 'Expected output,' which reads as hand-authored expectation rather than an actual run, undercutting the exact fabrication-resistance point it is meant to prove.

**Praise:**
- The value-first, funnel-last POV is not just asserted, it holds in code: enforceRanking pins any funnel-only experiment to position 3 with a stable sort, so the opinion survives even a mis-sorted model response. That is the single most convincing thing in the repo.
- The durable-value step is a real senior insight, not a generic funnel checklist: separating frictionScore (arrival-to-value) from recurrenceSignal and then forcing one combined judgment ('a fast first hit with absent recurrence is worse than moderate friction with strong recurrence') is exactly the read a funnel optimizer misses.
- The scheduling and Docusign samples make genuinely non-obvious calls: the value moment is a third party booking, not the calendar connect, so the fix puts the booking ahead of the prerequisite; and the Docusign read names the real tension of activation throttled to protect monetization on the same screen.
- The no-value-moment sample (frictionScore 0, recurrenceSignal absent, refuses to invent a moment) proves the tool audits what it is shown rather than always manufacturing a confident answer, which is the credibility hinge for a teardown tool.
- Build quality is clean and runnable: defensive JSON parsing with fallback, full shape validation, retry-once on 429/529, plain-language errors instead of silent blanks, correct BYOK handling, and an honest 'what could break' section on the client-side key. It builds with zero errors.
- Style discipline is total: zero em-dashes across the entire repo, no banned jargon leakage, and a consistent direct senior voice in code comments, UI copy, and README alike.

## Round 3 — Judge 2 — Grade: A-

**Blocking objections:**
- Commit actual live-run captures (the .request.json and .response.json for at least docusign-self-serve and one text example) because the README leans on samples/captures/ as the proof the tool produced the samples, and the folder currently holds only a script, leaving the teardowns unverified.
- Deploy the tool and paste a working live URL over the 'paste it here after the first deploy' placeholder, so a reviewer can click through and run a real audit instead of only reading artifacts.
- State plainly and early that the screenshots are reconstructed via generate.py, not literal product captures, so the 'real capture' and 'her own product' framing does not overstate what a reviewer opens.
- Move the revenue-trajectory proof points (Docusign 35%/yr past $500M, Microsoft $4B subscription, Elance employee #11) up near the top; the strongest interview hook currently sits in the last section of a 14KB README.
- Raise the differentiation floor on the three 'public knowledge' text samples (Notion, Figma, Stripe) or trim to the two that carry her earned POV, since three generic-product reconstructions dilute the 'only Hilary could make this' signal.

**Praise:**
- The value-first, funnel-last POV is enforced in code, not just prose: enforceRanking() pins any funnel-only experiment to position 3 client-side, which is the most credible possible proof that the opinion is structural, not a pitch.
- The Docusign teardown reads its own shipped segment and names a real tension (activation throttled to protect monetization on the same screen), and the scheduling read correctly locates the value moment at a third party booking rather than the calendar-connect gate; those are calls a generic funnel teardown misses.
- The AI-native engineering is genuinely hands-on: real dated model id, vision path, defensive JSON parsing with fallback, single overload retry, strict shape validation, and plain-language error handling for every failure mode.
- Style discipline is airtight: clean production build, zero em-dashes, no banned jargon, and the no-value-moment sample proves the refuse-to-invent branch so the tool audits what it is shown rather than always manufacturing a moment.
- The editorial visual system (serif/sans pairing, warm paper palette, friction and recurrence color bands) reads as intentional design, well above a templated default, and the copy throughout is direct and senior.

## Round 3 — Judge 3 — Grade: A-

**Blocking objections:**
- Deploy the static BYO-key site to one of the three configured hosts and fill the naked 'Live URL: paste it here' placeholder in the README hero, because the entire pitch is a live demo that does not currently exist.
- Commit at least one real capture (request + response JSON + cards.png) to samples/captures/, since the README makes that folder the centerpiece proof that 'the tool produces the sample quality or a PM hand-wrote it' and the directory currently holds only a script.
- Label the screenshots honestly as synthetic reconstructions, because the Docusign sample is framed as 'a flow Hilary shipped against' while the pixel a reviewer opens is a generated mock, and a high-taste reviewer will catch that seam.
- Close the small gap between the capture harness and the shipped request (untrimmed description, missing browser-access header) so the README's 'byte-for-byte the one anthropic.js sends' claim is literally true.
- Add a couple of tests around parseAudit/validateAudit/enforceRanking so the code that enforces the point of view is itself proven, not just asserted.

**Praise:**
- The value-first, funnel-last POV is mechanized, not just stated: the system prompt encodes it, enforceRanking pins funnel-only experiments to position 3 in code, and the lever tags show it in the UI, so it reads as only Hilary could have built it.
- The scheduling teardown makes a genuinely non-obvious senior call (the value moment is a third party booking, not the calendar connect, so put the booking ahead of the prerequisite) that a generic funnel audit would miss.
- The no-value-moment sample, with frictionScore 0 and recurrenceSignal absent instead of a fabricated read, proves the tool audits rather than generates, which is the difference between a product and a demo.
- AI-native credibility is real: dated vision-capable model id, defensive JSON parsing, shape validation, a single overload retry, plain-language error states, and a reproducible capture harness that directly answers 'did a PM hand-write these?'
- Build quality is clean and tasteful: coherent editorial aesthetic, real empty and loading and error states, and consistently senior copy with zero em-dashes or banned jargon across code, README, and samples.
- The Docusign sample owns real tension, activation throttled to protect monetization on the same screen, on a segment she actually shipped, which lands as lived product judgment rather than a template applied to friendly flows.

## Round 3 — Judge 4 — Grade: A-

**Blocking objections:**
- Commit at least one real live run (docusign-self-serve .request.json, unedited .response.json, and .cards.png) so the model's output quality is verifiable without me running a key.
- Fix the README overstatement: samples/captures/ currently holds only the harness, yet line 15 and captures/README.md describe committed capture files in present tense as if they exist.
- Deploy the BYOK page and paste a clickable live URL; the headline 'run a real audit in the browser' invitation is a placeholder TODO.
- Reconcile the samples with the tool's actual surface: the teardowns are literary markdown, but the tool emits terse JSON cards, so show how much of that depth survives the contract into a real rendered card.
- Add a small automated eval (funnel-only pins last, empty input refuses, friction and recurrence stay separate) to prove the framework holds across runs, not just in one hand-picked sample.

**Praise:**
- enforceRanking pins funnel-only to position 3 in client code, so the value-first/funnel-last POV holds in the artifact and not just the prose, which is a genuinely senior product-engineering instinct.
- The refuse-to-invent branch (friction 0, recurrence absent on metrics-only input) proves the AI adds analytical judgment rather than always manufacturing a confident read.
- The SYSTEM_PROMPT encodes Hilary's three-step framework literally and in order, with the friction-vs-recurrence tension resolved into a single retention judgment, which reads as a real point of view, not a generic funnel prompt.
- Real dated model id, working vision path, thorough shape validation, single-retry on overload, and plain-language errors show the API integration is engineered, not stubbed.
- The Docusign sample is her own shipped segment and names the true tension (the value moment fights the free-send cap and paywalled templates), and the scheduling read that puts the value moment ahead of the calendar-connect prerequisite is a non-obvious, senior call.
- Voice and style discipline is exact across code, copy, README, and prompt: no em-dashes, no banned jargon, no editorializing, and an intentional editorial design system rather than a template.

## Round 3 — Judge 5 — Grade: A-

**Blocking objections:**
- Commit at least one real capture (docusign-self-serve .request.json, .response.json, .cards.png) so the vision-path teardowns are verifiable model output rather than hand-authored prose, since the repo itself raises that exact doubt and leaves it open.
- Deploy the app and paste the live URL, because the fastest advertised path in is currently a placeholder stub and I cannot click through the vision path.
- Supplement at least one synthetic mockup with a real product onboarding screenshot so 'it audits what you show it' is demonstrated on a real screen, not a self-authored recreation.
- Add tests around parseAudit, validateAudit, and enforceRanking so the JSON-contract and funnel-last guarantees are proven, not asserted.

**Praise:**
- The direct-browser header, base64/media_type handling, 429/529 retry-but-not-401 logic, and client-side enforceRanking prove genuine hands-on Claude API experience, not name-dropping.
- The value-first/funnel-last POV is encoded literally in the SYSTEM_PROMPT, enforced in code (funnel-only pinned to position 3), and surfaced as a UI lever tag, so the opinion holds in three layers.
- The scheduling and Docusign samples carry non-obvious reads a generic funnel teardown would miss, and the Docusign one honestly flags it as her own shipped segment with real activation-vs-monetization tension.
- The no-value-moment sample deliberately demonstrates the refuse-to-invent branch, showing the tool audits rather than generates.
- Voice discipline is airtight: zero em-dashes, no banned jargon, direct and senior throughout, and the About Hilary section maps each proof point to the framework in practice.
- The capture.mjs harness is a smart credibility design that sends byte-for-byte the shipped request, and the architecture section names the client-key/CORS/rate-limit tradeoffs honestly instead of hiding them.
- Clean, coherent, runnable build with thoughtful editorial CSS, sensible error and loading states, and a preloaded screenshot example that exercises the vision path on first click.

## Round 3 — Judge 6 — Grade: A-

**Blocking objections:**
- Commit at least one real live-run capture (docusign response.json plus the rendered cards.png) so the repo's central 'verifiable, not trust-me' claim is shown, not left as an exercise requiring the reviewer's own key.
- Fix the README overclaim: samples/captures/ is described as one that 'holds live-run captures' but currently holds only the script and a README, so either commit the captures or soften the language to match reality.
- Deploy the static dist/ and paste the live URL (README line 13 still reads 'paste it here after the first deploy'), because a 20-second clickable demo is what moves a reviewer from impressed to reaching out.
- Add a sample where the verdict is 'activation is real but this will not retain, do not optimize this funnel' (fast first hit, absent recurrence), since every current real sample lands on a healthy product and a retention POV only bites when it can flag vanity activation.
- Distinguish retention from expansion mechanics more sharply in the durableValue read, since the framework currently blends 'value recurs' and 'upgrade path' into one signal where a retention leader wants them named separately.

**Praise:**
- The value-first, funnel-last POV is enforced in code, not just prose: enforceRanking pins any funnel-only experiment to position 3 with a stable sort, so the stance is structural.
- Durable Value is a first-class card and the prompt explicitly states activation without return does not build a business, which is exactly the retention instinct I screen for.
- The samples carry senior, non-obvious product judgment (scheduling puts the booking ahead of the calendar-connect prerequisite; Notion reads value as persistence not creation with weak recurrence; Stripe names dependency-grade recurrence).
- The Docusign sample uses her own shipped segment and honestly names the tension that the screen meters the very thing that builds recurrence.
- AI-native credibility is real: dated model id, vision path, browser-direct architecture with honest 'what could break' notes, defensive JSON parsing, retry on overload, shape validation, and a byte-for-byte capture harness.
- Style discipline is impeccable across README, code comments, UI copy, and the model's output prompt: zero em-dashes and zero banned-jargon violations, and the build compiles clean.
- The refuse-to-invent branch (no-value-moment sample forcing frictionScore 0 and recurrence absent) shows the tool audits what it is shown rather than manufacturing a confident read.

## Round 4 — Judge 1 — Grade: A

**Blocking objections:**
- Deploy it to a live bring-your-own-key URL: a growth tool whose thesis is speed-to-value that makes the reviewer run npm install is not taking its own advice, and the live click-through is the value moment I need to reach.
- Commit at least one run of the vision path against a real uploaded screenshot of a live product you did not draw yourself, because right now every screenshot is a synthetic reconstruction and the vision-on-real-pixels claim is a promise, not a proof.
- Add a sample where a funnel-only experiment is genuinely tempting yet still correctly ranked last, since across the samples the funnel-only lever is always the weakest option by construction, which makes the funnel-last ranking read as self-fulfilling rather than a hard call.
- Break the structural repetition in the samples where the winning move is repeatedly 'put the value moment ahead of the prerequisite' (scheduling, stripe), so the framework reads as range rather than one reliable pattern.

**Praise:**
- The value-first/funnel-last POV is not just stated, it is enforced in code (enforceRanking pins funnel-only last) and checked by a test, so the opinion holds in the artifact rather than only in the prose.
- The Docusign read names the real tension a generic teardown misses: the returned signature is the value moment, and the free-send cap plus paywalled templates throttle the exact thing that builds recurrence, which is a genuinely senior call.
- The invoice-generator sample proves the retention read can bite: friction 18, recurrence absent, verdict do not optimize this funnel, which is the framework working against its own activation bias.
- AI-native credibility is real: dated model id, vision path, browser-direct architecture with an honest 'what could break' section, retry and defensive JSON handling, and committed captures a test reconstructs from the shipped request.
- The no-value-moment refusal branch (frictionScore 0, recurrenceSignal absent, plainly states no value moment is described) is the difference between an audit and a generator, and it ships as a committed run.
- The README names its own seams up front (synthetic screenshots, client-side key limits) instead of hiding them, which reads as senior and makes the credibility claims land.
- Clean, coherent, runnable build with tasteful restrained UI copy and zero em-dashes or banned jargon, so the hard style rules hold everywhere including code comments.

## Round 4 — Judge 2 — Grade: A

**Blocking objections:**
- Deploy one live instance and link it: for an AI-forward PLG lens, a working click-through is the last proof the artifacts and captures only imply.
- Commit one vision run against a real product onboarding screenshot, not only the synthetic reconstructions, so the headline read-a-screen capability is proven on real pixels a skeptic cannot wave off.
- Tighten the README by roughly a third: the opening and the point-of-view section carry the pull, and the deploy/what-could-break detail buries them below the fold for a skimming hiring manager.
- Commit the notion and stripe runs too (not just capture-on-demand) so all five samples have a checkable model output, closing the small gap between the long-form markdown argument and the shipped JSON.
- Add one experiment-variety assertion to the eval suite so the 'vary the levers, no default seed-the-first-page pattern' claim in the prompt is test-enforced like the ranking and style rules already are.

**Praise:**
- The value-first/funnel-last POV is encoded literally in the SYSTEM_PROMPT, enforced in code via enforceRanking pinning funnel-only to position 3, and verified by tests, so the opinion holds in the artifact rather than only in prose.
- The Docusign read is real senior product judgment: naming the returned signed copy (not the send click) as the value moment, then surfacing that the free-send cap throttles the exact recurrence it depends on, is an insight a generic funnel teardown misses.
- AI-native credibility is authentic, not a wrapper: real dated Sonnet model, working vision path, strict JSON contract with defensive parse, single overload retry, and a test that rebuilds each committed request from the shipped code to prove the captures are the real path.
- The refusal branch and the invoice-generator vanity-activation case prove the framework bites: it sets frictionScore 0 and recurrenceSignal absent on empty input instead of manufacturing a confident read, and the tests assert that honesty.
- Style discipline is total and machine-checked: zero em-dashes and zero banned jargon across code, copy, README, and model output, with checkStyle enforcing it on both captures and sample markdown.
- Build quality is clean and coherent: bring-your-own-key browser-direct architecture with honest 'what could break' section, keyed localStorage handling, graceful error surfacing, and an editorial-grade card UI that renders the five-part contract clearly.

## Round 4 — Judge 3 — Grade: A

**Blocking objections:**
- Deploy it to a live bring-your-own-key URL so a reviewer can run a real audit in one click, since the README already argues deployment is one step and the 'genuinely well-made vs demo' test needs a running product, not just artifacts.
- Commit verified live captures for the scheduling, notion, and stripe teardowns too, so the showcase non-obvious call (scheduling) is a checkable model run rather than author-written markdown while only the less-flashy docusign and invoice samples are verified.
- Add at least one verified run against a real, non-reconstructed public onboarding screenshot to answer the skeptic's 'every screen is a mock you drew to fit your own framework' objection.
- Cut the README by about a third: the browser-direct key story is retold across Try it, Run locally, Deploy, and What could break, and the density buries the strongest samples below the fold.
- Surface the output visually in the first screen of the README (embed the docusign cards PNG or a short demo GIF) instead of making the reader open the samples folder to see what the tool produces.

**Praise:**
- The value-first, funnel-last POV is enforced in code (enforceRanking pins any funnel-only lever to position 3) and locked by tests, so the opinion holds even on a mis-sorted model response instead of living only in prose.
- The invoice-generator case (friction 18 but verdict 'this will not retain, do not optimize this funnel' because recurrence is absent) is a genuinely senior read that a funnel-first tool would get exactly backwards.
- The reproducibility rig is rigorous: a test rebuilds the request body from framework.js and asserts it matches the committed capture, so the samples are provably the shipped path, not a look-alike.
- It is honest about its seams rather than hiding them: synthetic screenshots are named up front, and the refuse-to-invent branch on empty input is shipped, captured, and tested rather than asserted.
- The build is clean and well-made, not a demo shell: 22 green tests, plain-language error handling for every failure mode, editorial rendered cards with the funnel-only tag pinned last in red, and zero em-dashes or banned jargon anywhere in code, copy, or samples.

## Round 4 — Judge 4 — Grade: A

**Blocking objections:**
- No live URL: the single biggest top-of-funnel lever for a portfolio piece is a one-click running demo, and its absence forces a reviewer to trust artifacts instead of clicking, so deploy the bring-your-own-key build (or the demo-key proxy) and put the URL at the top.
- The most differentiated reads (scheduling's booking-ahead-of-prerequisite, notion's persistence-as-value, stripe) exist only as hand-written prose with no committed capture, so commit live runs for all five examples so the strongest insights are proven model output, not the author's writing.
- The vision claim rests entirely on self-drawn synthetic reconstructions; run and commit at least one capture against a screenshot of a real live onboarding product so the headline 'reads a real screen' capability is verifiable without the reviewer running it.
- The README is a dense wall that buries the payoff; cut the top by half so the framework, one proof point, and the live demo land in the first screen.
- max_tokens is 2000 with no surfaced handling for a max_tokens stop_reason, so a long durableValue plus three experiments could truncate into an unparseable response; detect and message that case explicitly.

**Praise:**
- The POV is encoded literally, not decoratively: value-first/funnel-last lives in the system prompt in order, and enforceRanking() re-sorts client-side so a funnel-only lever is pinned to position 3 even if the model returns it higher, with a test proving it. That turns a stated opinion into a property of the code.
- The friction-vs-recurrence-diverge judgment is a genuinely senior insight, not generic funnel advice: 'a fast first hit with absent recurrence is worse than moderate friction with strong recurrence' carries Hilary's value-first stance and separates this from every conversion-optimizer tool.
- The invoice-generator sample is the differentiator: friction 18, recurrence absent, verdict 'do not optimize this funnel.' A retention read that bites on a flow that looks healthy is exactly the earned POV that reads as only-Hilary.
- AI-native credibility is real, not cosmetic: direct Messages API fetch, dated vision-capable model id, base64/media-type handling, retry-on-overload, defensive JSON parse plus shape validation, and an honest 'What could break' section covering client-side key exposure, CORS preflight, rate limits, and the proxy v2 path.
- The committed captures plus the test asserting each request.json equals what the shipped code sends is a rigorous move: it forecloses the 'these samples are hand-tuned' skepticism for the three captured runs.
- Style discipline holds end to end: zero em-dashes and zero banned jargon across README, prompt, and samples, enforced by tests over both model output and the teardown prose. The Docusign sample naming the free-send-cap vs recurrence conflict is real product tension.
- The synthetic-screenshot seam is named up front rather than hidden, which reads as senior honesty and raises trust in everything else.

## Round 4 — Judge 5 — Grade: A+

**Blocking objections:**


**Praise:**
- The value-first/funnel-last thesis is encoded in code, not just prose: enforceRanking pins any funnel-only lever to position 3 via a stable sort, and framework-eval.test.js proves it holds across every committed capture.
- The retention worldview is exactly a durable-growth leader's: recurrenceSignal is set from the retention read alone, retention and expansion are kept as separate reads, and the prompt states plainly that a fast first hit with absent recurrence is worse than moderate friction with strong recurrence.
- The invoice-generator sample proves the framework can bite: friction 18, recurrence absent, verdict 'activation is real and fast, and it will not retain, do not optimize this funnel' is the anti-vanity-metric call most tools never make.
- The scheduling teardown carries a genuinely non-obvious product insight (put a real booking ahead of the calendar-connect prerequisite), and the Docusign read names the real tension between the returned-signature value moment and the free-send cap that meters recurrence.
- AI-native build shows senior tradeoff judgment: real dated model id, vision path, retry-once on 429/529, defensive JSON parse, strict shape validation, and Sonnet-over-Opus reasoning stated because the read is bounded.
- Intellectual honesty throughout: synthetic-screenshot seam named up front, client-side-key security edge named in a 'What could break' section, and only real model runs committed as captures (usage tokens and message id intact).
- Style discipline is total and machine-checked: no em-dashes, no banned jargon, no editorializing claims, all enforced by tests over both the model output and the sample teardowns.
- Craft is high and coherent: editorial serif/sans design system, color-coded friction and lever tags, responsive layout, thorough plain-language error handling, and an empty state that teaches the POV before the first run.

## Round 4 — Judge 6 — Grade: A+

**Blocking objections:**


**Praise:**
- The API client is real builder work, not tutorial code: raw Messages API over fetch, the obscure anthropic-dangerous-direct-browser-access header, correct base64 image content blocks with data-URL prefix stripping, a 529 retry, and defensive JSON extraction with a first-brace fallback.
- The model choice is reasoned, not decorative: a real dated id (claude-sonnet-4-5-20250929) with a stated rationale for Sonnet over Opus, which reads as someone who has actually weighed tiers against a bounded task.
- enforceRanking pins any funnel-only lever to position 3 client-side with a stable sort, so the value-first, funnel-last POV is enforced in code as a hedge against model non-determinism, not just asserted in prose.
- The system prompt is genuine prompt engineering: strict JSON contract, an empty-input refusal branch, and a deliberate instruction to keep friction separate from recurrence and retention separate from expansion, with an explicit anti-merge rule.
- The framework is unmistakably Hilary's growth approach encoded literally, and the invoice-generator sample (friction 18 but recurrence absent, verdict 'do not optimize this funnel') is the funnel-last thesis biting exactly where a generic tool would celebrate a low friction score.
- 22 tests pass offline with no key or network, and framework-eval.test.js proves the committed capture requests are byte-identical to what the browser sends, so the samples are the shipped path rather than a look-alike.
- Intellectual honesty throughout: synthetic screenshots named up front, estimated (not billed) token usage disclosed in the captures README, and the client-side key exposure named in a 'What could break' section instead of hidden.
- Flawless style discipline: zero em-dashes across README, src, and samples by grep, no jargon leaks except inside the rule statement itself, and a direct senior voice that ties Docusign, Microsoft, and Elance straight to the framework the tool runs.
- The README makes the read credible and makes me want to interview: it connects shipped revenue work to the exact analytical engine in the code, and the no-value-moment refusal demo proves the tool audits what it is shown rather than manufacturing a confident answer.

## Round 5 — Judge 1 — Grade: A

**Blocking objections:**
- Ship a live, keyless demo URL: a tool whose entire thesis is 'get users to real value fast' should not itself require npm install plus a pasted API key before a reviewer sees anything move, so stand up the Cloudflare/Vercel proxy the README describes but did not build.
- Raise the visual craft from tasteful-conventional to distinctive: the editorial-SaaS card layout, friction meter, and lever tags are clean but safe, and nothing in the aesthetic yet reads as a signature only a high-taste builder would produce.
- Structure the Durable Value card to show the two-part retention/expansion read the system prompt works hard to keep separate, instead of rendering it as one undifferentiated paragraph.
- Exercise the headline vision capability on at least one real product capture rather than only synthetic reconstructions, since 5 of 7 samples are text and the two screenshot runs both use mocked pixels.
- Add a one-glance proof-of-authorship signal (a short Loom of a live run, or a visible deployed link at the top of the README) so the 'she built this hands-on' claim is demonstrated, not only asserted.

**Praise:**
- The value-first/funnel-last POV is not just prose: enforceRanking pins any funnel-only lever to position 3 in code, validateAudit guards the shape, and a test proves both, so the opinion holds even against a mis-sorted model response.
- The AI-headshots sample is the strongest artifact in the repo: a funnel win sitting on the paywall that would move revenue this week, ranked last with a clear reason (it does not shorten the wait before value or build a return), which proves the framework has teeth under pressure.
- Every example ships a committed request+response+rendered-cards triple plus a test that the committed request matches the shipped code, which pre-empts the exact skeptic question ('did a good PM hand-write these?') and is a genuinely senior move.
- The Docusign teardown reads like real operator thinking: naming the returned signature rather than the send click as the value moment, then surfacing that the free-send cap meters the very recurrence that builds the business.
- AI-native credibility is real and specific: a dated vision-capable model id, browser-direct fetch with the correct header, a max_tokens truncation guard, one retry on overload, and plain-language errors for every failure mode instead of silent blanks.
- The writing holds Hilary's voice cleanly across code comments, README, and model output: direct, concrete, no em-dashes, no jargon, and the proof points (Docusign, Microsoft, Elance) land in three tight sentences without overclaiming.

## Round 5 — Judge 2 — Grade: A-

**Blocking objections:**
- Ship a live click-through demo (keyless proxy per the README's own instructions) so a tool preaching fast time-to-value does not itself require clone, npm install, and a supplied key before a reviewer sees any value.
- Add a calibration or limits note on the 0-100 friction score, because a single subjective composite number reads as exactly the vanity metric the tool warns against, with no stated rubric or run-to-run stability.
- Document that the committed responses are genuine model output and why the message id is normalized (e.g. 'msg_capture_docusignselfserve'), so the 'check the output before touching a key' claim is not undercut by a hand-authored-looking id.
- Include one genuinely messy flow (a B2B multi-step activation or a PLG-to-sales-assist handoff) to prove the framework holds outside clean single-value-moment archetypes.

**Praise:**
- The value-first, funnel-last POV is enforced in code (enforceRanking pins any funnel-only lever to position 3) and locked by tests, not just asserted in prose, so the opinion is a property of the artifact.
- The teardowns are genuinely senior and non-generic: Docusign names the activation-versus-monetization conflict on the same screen, scheduling makes the non-obvious friction-71 call by refusing to treat calendar-connect as the value moment, and Stripe explicitly reasons about why its call differs from scheduling's.
- The AI-headshots and invoice-generator samples deliberately construct the hard cases (a revenue-moving funnel win that still ranks last; friction 18 that is vanity activation), which is the opposite of cherry-picking friendly flows.
- AI-native credibility is real and rigorous: dated vision-capable model id with a comment justifying Sonnet over Opus, truncation guard, overload retry, defensive JSON parsing, shape validation, and framework-eval tests that assert the prompt keeps friction/recurrence/expansion separate and that captured output obeys the style rules.
- Every example ships a committed request, response, and rendered card render, so a reviewer can verify the tool's output before supplying a key, which is a thoughtful answer to the not-yet-deployed problem.
- The writing is disciplined throughout: no em-dashes, no jargon, no unprovable editorializing, and the README's 'it holds in code, not just prose' framing plus the tie to real Docusign/Microsoft/Elance revenue outcomes makes the case to interview her.
- Clean, coherent, runnable build with tasteful editorial design and complete error handling for every failure mode (missing key, 401, overload, network, truncation, unparseable JSON, out-of-shape JSON).

## Round 5 — Judge 3 — Grade: A+

**Blocking objections:**


**Praise:**
- The POV is enforced in code, not hoped for: enforceRanking pins any funnel-only lever to position 3 client-side and a test proves it across every committed capture, with the README landing the thesis, 'A tool that reordered experiments by conversion lift would be a different tool.'
- framework-eval.test.js is a genuine LLM-as-artifact eval harness: it reads committed live runs and asserts the framework holds across all of them, funnel-last ranking, lever variety, the refusal branch firing, recurrence flagged as vanity activation, and the hard style rules, which is what AI-native credibility actually looks like rather than a single lucky demo.
- The API handling is the kind you only write after hitting the failure modes: a real dated model id (claude-sonnet-4-5-20250929) with reasoned Sonnet-over-Opus selection, a max_tokens truncation guard before the parser, retry-once on 429/529, defensive JSON fallback, correct vision base64/media-type handling, and CORS/preflight surfaced as plain errors.
- The SYSTEM_PROMPT encodes Hilary's value-first/funnel-last growth model literally and with senior nuance, splitting retention from expansion, forbidding retention from being folded into the friction score, and tying activation to a revenue consequence without inventing numbers.
- The samples carry judgment only a scaled-PLG operator would have: the Docusign read names the real tension between the returned-signature value moment and the metered free-send cap, and the ai-headshots sample is deliberately built so the tempting paywall funnel win still ranks last, with 'discounting a one-time unlock pulls revenue forward from users who were already going to buy' as the reason.
- Zero em-dashes and zero banned jargon across the entire repo (verified), with a direct, specific senior voice that reads like only Hilary could have written it.
- Reproducibility and honesty are handled with integrity: every example ships request + response + rendered cards so output is checkable without a key, the synthetic-screenshot boundary is stated plainly, and the browser-direct key model names the exact correct mitigation (a server-side proxy).
- Clean, coherent, runnable build with considered editorial design, good error and loading UX, localStorage key handling with one-click clear, and a README framing that on its own makes me want to interview her.

## Round 5 — Judge 4 — Grade: A

**Blocking objections:**
- Replace the seven committed *.response.json files, which carry synthetic ids (msg_capture_docusignselfserve, etc.) and thus read as authored not captured, with genuine live runs from capture.mjs so the 'raw, unedited response from the API' and 'verifiable rather than trust-me' claims actually hold.
- Verify (and note in the capture README) that each committed response preserves the real API fields a live run returns, such as stop_reason and usage, so the truncation guard and the capture claim are demonstrably grounded in real output.
- The tool is not yet deployed, so add a single live bring-your-own-key URL, since a working click-through would move this from 'convincing artifacts' to undeniable.

**Praise:**
- The value-first/funnel-last POV is not just described, it is enforced in code (enforceRanking pins funnel-only to position 3) and proven by a test, so the opinion holds in the artifact, not only the prose.
- The Docusign read names the returned signature over the Send click as the value moment and calls the free-send-cap vs paywalled-templates tension the real decision, which is genuine senior product insight, not a generic teardown.
- The ai-headshots sample deliberately makes the funnel win tempting and still ranks it last with a real argument (discounting pulls revenue forward from buyers who'd already convert), which is the POV under pressure.
- AI-native credibility is concrete: real dated model id, vision path, direct-browser fetch with overload retry, a max_tokens truncation guard, strict shape validation, and 25 passing offline tests.
- Style discipline is airtight: zero em-dashes and zero banned jargon across README, code comments, UI copy, and samples, and the rendered cards look like a considered editorial product, not a template.
- The README is honest about its own edges (CORS, the shared-key proxy requirement, synthetic screenshots) rather than overselling, which reads as senior.

## Round 5 — Judge 5 — Grade: A

**Blocking objections:**
- Deploy a live bring-your-own-key demo and put the URL at the top of the README, so a reviewer can run a real onboarding screenshot and watch the tool work rather than only reading committed samples.
- Reconcile the top-level README's 'That run is committed whole: the exact request the app sent, the model response' with the captures/README.md fine print (regenerated outputs, estimated token counts, synthetic message ids) so the headline provenance claim matches the honest disclosure exactly.
- Add one layer where code, not just the model, adds analytical value beyond the funnel-last sort: for example a vision self-check that the named value moment is actually supported by the uploaded pixels, or a second pass that red-teams its own experiment ranking, to prove genuine AI building at Principal depth.
- Tighten the README: the deploy and 'what could break' sections run longer than a portfolio piece needs, and a shorter cut would make the point-of-view and proof-point sections land harder.

**Praise:**
- The value-first/funnel-last POV is encoded end to end: system prompt, code-enforced ranking (enforceRanking pins funnel-only last), UI tag, and tests that assert it holds across every committed capture, so it is a property of the artifact, not a claim in prose.
- The samples show real senior growth judgment, especially the AI-headshots stress test (a revenue-moving paywall funnel win still ranked last, with the reason that a discount pulls forward revenue from users who would already buy) and the invoice-generator vanity-activation read.
- The refusal branch (no-value-moment) is a strong credibility signal: the tool says plainly when no value moment is described and refuses to invent one, which is the difference between an audit and a generator.
- Clean, coherent build: 25 passing tests over the real JSON contract, comprehensive error handling (retry, truncation guard, shape validation), 673 lines of intentional editorial CSS rather than a template, and a fast clean production build.
- The capture harness reproduces the exact shipped request (same prompt, model, header, trimmed lead) and a test rebuilds and diffs it, so the samples prove the shipped path instead of a look-alike.
- Style discipline is total: no em-dashes, no editorializing claims, no banned jargon, enforced in the prompt and independently tested against both the model outputs and the sample prose.

## Round 5 — Judge 6 — Grade: A+

**Blocking objections:**


**Praise:**
- The value-first/funnel-last POV is enforced in code, not just asserted: enforceRanking pins any funnel-only lever to position 3, and the eval suite proves that property across every committed capture.
- The retention read actually bites: the invoice-generator sample returns low friction (18) and still says 'this will not retain, do not optimize this funnel' because recurrence is absent, which is the anti-vanity-activation stance I care about most.
- The Stripe sample ranks a durable-value experiment FIRST and explains why it differs from the scheduling case (value moment already one action away vs. gated), proving the framework is a real judgment, not a template.
- The ai-headshots sample deliberately stress-tests the POV against a tempting paywall funnel win that would move revenue this week, holds it in last place, and names that discounting pulls revenue forward from users who'd already buy.
- The framework keeps retention and expansion as separate named reads and refuses to fold either into the friction score, which is the exact rigor a retention/expansion VP wants.
- Genuine AI-native chops: direct Messages API fetch, vision path, correct dated model id, max_tokens truncation guard, 429/529 retry, defensive parsing, shape validation, plus a test that reconstructs the request from shipped code to prove capture fidelity (25/25 passing).
- Intellectually honest artifacts: the captures README discloses that token counts are estimates and that screenshots are synthetic reconstructions, and shows how to reproduce live against a real key.
- Clean, coherent, runnable build with tasteful editorial design and specific, jargon-free copy in Hilary's voice; the only em-dash in the tree is the literal inside the style-rule detector test.
- The README leads with the point of view, shows it holding in code, ships reproducible committed runs, and names what could break, which is what makes me want to interview her.

## Round 6 — Judge 1 — Grade: A

**Blocking objections:**
- No live demo URL is deployed; for a growth reviewer who lives on time-to-value, a one-click keyless run beats any rendered PNG, and the proxy is built but never stood up.
- The signature feature (coherenceFlags red-teaming the model in code) never fires on any committed capture, so its value is proven only in unit tests, not in a shipped sample catching a real model miss.
- The vision path has no committed real-pixel proof: every screenshot is a synthetic reconstruction from generate.py, so 'read a live onboarding screen' is claimed but never demonstrated on an actual product capture.
- enforceRanking is only shown correcting a hand-built audit in tests; no committed capture demonstrates the code re-sorting a genuinely mis-ranked model response, so the 'holds in code, not prose' claim rests on synthetic fixtures.
- The friction score's admitted few-points-of-run-to-run drift slightly undercuts the mono 'instrument' framing; a committed multi-run band-stability capture would convert that honesty from a caveat into evidence.

**Praise:**
- The value-first/funnel-last POV is not asserted, it is enforced: enforceRanking pins funnel-only to position 3 and coherenceFlags red-teams the model against the framework's own rules, so Hilary's thesis is executable code, not a slide.
- The Docusign teardown carries real, non-generic insight: it names that the flow meters the exact free-send/template surface that builds recurrence, the tension a funnel-only teardown misses, and grounds it in the segment she actually scaled.
- The two-part retention/expansion split with recurrenceSignal kept separate from frictionScore, plus the calibrated four-band friction rubric, is a genuinely senior activation model, not a vanity-metric dashboard.
- AI-native credibility is real and hands-on: direct Messages API with a vision path, committed captures that preserve the real envelope (stop_reason, usage), a truncation guard, a built keyless proxy, and 32 passing tests including a framework-eval that reads the captures.
- Build quality is clean and coherent: it builds, tests pass, error handling is thought through (retry, CORS, truncation), the copy is tight, and the editorial serif-plus-mono design reads like a measuring instrument with a clear point of view.
- The no-value-moment refusal demo and the honest provenance note on normalized capture fields signal intellectual honesty, an audit that refuses to invent rather than a generator that always produces a confident answer.

## Round 6 — Judge 2 — Grade: A

**Blocking objections:**
- The README foregrounds "Run it live" and a demo URL but ships that URL blank, so the single most important call-to-action for a PLG portfolio piece is a visible dead end; deploy the keyless proxy and paste the working link.
- The reference captures are honestly disclosed as generated runs with two normalized fields, but nothing proves the committed prose is unedited model output, so a live, reviewer-triggered run (or a signed/logged raw capture) is needed to fully close the "did a good PM hand-write this" skeptic loop.
- The friction score hedges its own between-run variance so heavily ("read the band, not the digit") that it invites the question of why a 0-100 integer is the surfaced primitive at all instead of the four bands; either commit to the number as decision-grade or lead with the band.
- coherenceFlags is the standout AI-adds-value claim but runs only a few hardcoded heuristics, so it should either widen coverage or explicitly state its own limits in the panel so the "second read" is not oversold.

**Praise:**
- The value-first/funnel-last POV is encoded literally and in order inside the system prompt, not bolted on in the UI, and it is enforced deterministically in code (enforceRanking pins funnel-only last regardless of model order).
- coherenceFlags is genuine analytical value on top of the model, not a wrapper: it red-teams the model's own output against the framework and names vanity-activation cases the model can produce while sounding locally sensible.
- The samples are built to bite, not to flatter: the invoice-generator lands friction 18 and still returns "this will not retain," and ai-headshots deliberately puts the tempting funnel win on the paywall where it moves revenue this week and still argues it to last.
- AI-native engineering judgment is real and visible: Sonnet-vs-Opus reasoning, max_tokens ceiling reasoning, truncation guard, direct-browser-access header, keyless proxy, vision path, and a committed eval suite that asserts the POV holds across every capture.
- The Docusign sample ties the framework to a segment Hilary actually scaled and holds the true tension (returned-signature value moment against the metered free-send paywall) rather than giving a generic teardown.
- Style discipline is airtight: no em-dashes and no banned jargon anywhere in README, code, prompt, or samples, and the design system (mono for every measured value, instrument framing) reinforces the product's stance.
- Honesty is a feature throughout: normalized capture fields are disclosed plainly, the friction score's limits are stated, and the empty-input refusal branch is shipped and demonstrated.

## Round 6 — Judge 3 — Grade: A

**Blocking objections:**
- Deploy the keyless-proxy demo and put the real live URL in the README, so a reviewer can audit their own onboarding flow in one click instead of reading a placeholder line.
- Cut the defensive over-narration in the samples and captures READMEs ("a skeptic is right to ask", "the funnel win that is genuinely tempting, and still last") and let the outputs carry the point, matching the confidence of her one-line positioning.
- Reconcile the friction visual with the stated rubric: the card note describes four bands (0-15, 16-33, 34-66, 67-100) but frictionBand collapses to three, so the 'Low friction' label spans two rubric bands.
- Tighten the 'Who built this' section into a sharper top-of-funnel hook, since the revenue proof points currently sit two-thirds down the README rather than pulling a hiring manager in early.

**Praise:**
- The value-first/funnel-last POV is enforced in three layers (system prompt ordering, enforceRanking pinning funnel-only last, coherenceFlags red-teaming the model), so the stance is a property of the code, not a slogan.
- The AI-headshots sample is a POV under pressure: a paywall funnel win that would move revenue this week and still ranks last, with the reasoning spelled out, which only someone with her exact framework would build.
- The two-part durableValue read that keeps retention and expansion separate, and connects friction to recurrence into a single priority call, is senior growth thinking most PMs conflate.
- Genuine AI-native credibility: real Messages API integration with vision, a built keyless proxy, retry/truncation/CORS handling, committed reference captures with honest normalization disclosure, and 32 passing tests with no network.
- The model-choice rationale (Sonnet over Opus because the read is bounded) and the no-value-moment refusal branch prove judgment and restraint, not just wiring.
- Clean, coherent build with a polished, instrument-like card surface (serif headlines, mono for every measured value, a rubric-tick friction meter) and a first-click example that runs the vision path with no typing.

## Round 6 — Judge 4 — Grade: A+

**Blocking objections:**


**Praise:**
- coherenceFlags plus enforceRanking prove the AI-native instinct that settles the doubt: the code red-teams and re-sorts the model's own output against the framework rather than trusting the LLM as an oracle.
- Real API edge-case fluency no non-builder fakes: correct dated model id with a reasoned Sonnet-over-Opus choice, vision base64 blocks, the direct-browser-access header, a max_tokens truncation guard, overload retry, and a keyless proxy with origin allowlist and a candid abuse tradeoff.
- The value-first / funnel-last POV is genuinely differentiated and encoded literally and in order in the system prompt, with a four-band friction rubric and a retention-vs-recurrence reconciliation that reads as senior growth judgment, not generic funnel-speak.
- The ai-headshots sample is a real stress test: a paywall funnel win that would move revenue this week, ranked last, with the sharp note that a discount just pulls revenue forward from users who would have bought anyway.
- The captures system pre-empts the exact skeptic's question ('did a PM hand-write these?') with reproducible npm run capture runs, honest normalization disclosure, and framework-eval tests that assert the POV holds across every committed run, not a cherry-picked one.
- 32 passing tests with no network dependency, a request-fidelity test that rebuilds the sent body from shipped code, and hard style rules (no em-dashes, no banned jargon) enforced in prose, code, and tests.
- 925 lines of hand-built CSS with an actual design thesis (mono for every measured value so the tool reads as an instrument, not a dashboard) and a README that leads with a no-setup 'see it work' path and ties her Docusign, Microsoft, and Elance proof points to the artifact.

## Round 6 — Judge 5 — Grade: A

**Blocking objections:**
- Deploy the keyless proxy and put a real live URL in the README so a reviewer can click one button and get a real teardown instead of reading a 'add your URL here' placeholder.
- Add real screenshots (or a short capture) of the running React app rendering the five cards and coherence panel; right now every visual is a synthetic Python render or reconstruction, so the actual product surface is never shown.
- Run at least one example on a real product's actual onboarding screenshot end to end, since every shipped screenshot example is admittedly synthetic and the vision path is a headline claim.
- Reconcile the stated four-band friction rubric (0-15/16-33/34-66/67-100) with the card's three-tone color mapping (<=33/<=66/>66) so the 'calibrated four-band' claim and what the UI shows match exactly.

**Praise:**
- The value-first/funnel-last POV is enforced in code (enforceRanking), independently red-teamed (coherenceFlags), and asserted in an eval suite, so the stance is load-bearing rather than just prose.
- Real AI-native credibility: dated model, vision path, strict JSON contract with truncation guard and retry, a built keyless proxy, and committed real API captures with honestly-normalized envelope fields.
- The teardowns show senior product substance that bites: the Docusign read (the returned signature is the value moment, and the free-send cap throttles the recurrence engine) and the invoice-generator 'fast activation that will not retain' are non-obvious calls.
- Disciplined, honest style: zero em-dashes and zero banned jargon in any output or copy (they appear only in the tests that guard against them), and the README is candid about what is synthetic.
- Tasteful, intentional UX: the measuring-rule masthead motif, mono type for measured values, the calibrated friction scale with band ticks, the two-part retention/expansion split, and a coherence panel kept visually distinct from model output.

## Round 6 — Judge 6 — Grade: A

**Blocking objections:**
- Harden the coherenceFlags heuristics: the priority check is a keyword regex (/priorit|matters more.../) that throws a 'note' on invoice-generator even though that sample's durableValue makes the recurrence-over-friction call, and the 'recurrence absent + top value-moment' rule fires a 'watch' on the refusal capture where the top 'experiment' is just 'describe your flow', so the marquee code-check misfires in two of eight shipped samples.
- Suppress or special-case coherenceFlags on the no-value-moment refusal branch so the rendered card does not show a contradiction warning about an activation ranking that does not exist.
- Fill the placeholder live-demo URL and ship one keyless deployed link, since a portfolio piece whose entire thesis is speed-to-value should not make its own reviewer clone and paste a key to reach first value.
- Add one committed capture where the model genuinely drifts and the coherence layer catches a real miss (a value-moment lead on absent recurrence), so the 'code holds the line even when a response drifts' claim is shown firing on a wrong answer, not only on the refusal edge case.

**Praise:**
- The value-first/funnel-last POV is encoded in code, not just prose: enforceRanking deterministically pins any funnel-only lever to position 3, so the stance survives a mis-sorted model response instead of depending on it.
- durableValue is split into separate Retention and Expansion reads with a forced recurrenceSignal, and the prompt explicitly refuses to fold retention into the activation friction score, which is exactly the discipline a retention VP wants and most activation tools collapse.
- The ai-headshots sample is the tell of a senior operator: a paywall experiment that would move revenue this week still ranks last, with the reasoning that discounting a one-time unlock only pulls forward revenue from users who were already going to buy.
- The Docusign sample reasons about a segment she actually shipped and names the real tension, a free-send cap and paywalled templates throttling the very recurrence that builds the two-sided business, rather than optimizing the send click a funnel teardown would chase.
- Genuine AI-native rigor: vision path, strict JSON contract, truncation guard on stop_reason max_tokens, single overload retry, a keyless proxy, 32 passing tests, and committed reference captures with an honest disclosure of exactly which two fields are normalized.
- Deliberate, stated model judgment, Sonnet over Opus with the rationale that the read is bounded, which reads as someone who has actually built against the API and thinks about cost/tier tradeoffs.
- Clean execution throughout: zero em-dashes across README, source, and samples, no banned jargon, a calibrated four-band friction rubric mirrored between prompt and UI, and accessible components with aria roles.
