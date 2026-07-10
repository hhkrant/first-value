# Reference captures

The audits in `samples/` walk the framework on each onboarding flow. This
folder holds committed reference runs of them, so the sample quality can be read
against the model's own JSON, not asserted, and without needing your own key
first.

## What these files are, plainly

These are reference runs, not live API captures. Each `<id>.response.json` is
model output produced by applying the exact committed system prompt from
`src/lib/framework.js` to each input through Claude (claude-sonnet-4-5, the model
family the app calls), then wrapped in the Messages API envelope the app reads.
The content is model output. Two fields are normalized, and this folder is the
place that says so:

- **The message `id` is normalized.** A live call returns a volatile id like
  `msg_01AbCd...`; these files carry a stable, self-describing id
  (`msg_reference_docusign_self_serve`) instead, so re-running the capture script
  produces a diff on the content, not churn on an id nobody checks. The prefix
  says what the file is.
- **The `usage` token counts are estimates** from the generating run, not billed
  metering.

Everything else is the real envelope. Each response preserves the fields a live
run returns, including `stop_reason` (`end_turn` on a complete run) and the
`usage` object, so the app's truncation guard (which refuses a
`stop_reason: "max_tokens"` response) and its shape validation run against
realistic output, not a stripped-down stub. The load-bearing part is the model's
output text and the card surface it renders to.

To get a genuine live capture with the real API id, run the script below with
your own key; it overwrites the file in front of you.

## What is committed here

Every preloaded example ships a reference run: its request and its response. So
each sample audit in `samples/` can be checked against the model output it walks
through, not only read as prose.

- `docusign-self-serve` runs the vision path against ten real, numbered
  screenshots of the Docusign eSignature premium-trial flow, from the marketing
  home through the credit-card gate to the Set Up Envelope send flow. It is the
  segment Hilary scaled, read here from live product captures rather than a
  reconstruction.
- `scheduling` runs the vision path against a synthetic booking-setup screen. Its
  call is the non-obvious one: the value moment is a third party booking, not the
  user connecting a calendar, so a real booking is put ahead of the prerequisite.
- `notion` and `stripe` are the two public-knowledge products, both run as text
  flows. Notion reads the value as the first formatted block and flags a weak
  return cadence; Stripe widens the fast test charge first, because recurrence is
  already dependency-strong.
- `invoice-generator` is a one-off tool where activation is fast and nothing
  recurs, so the retention read flags vanity activation instead of celebrating a
  low friction band.
- `ai-headshots` is a paywalled consumer flow built to test the point of view
  under pressure: the tempting experiment sits on the paywall and would move
  revenue this week, and it still ranks last because it does not shorten the wait
  before value or build a reason to return.
- `plg-sales-handoff` is a B2B analytics trial with two value moments pulling
  against each other: a fast sandbox chart on sample data, and a slow, gated
  first chart on the team's own production data that needs a data admin and, for
  the full rollout, a sales conversation. It is here to show the framework holds
  on a messy, multi-step activation, not only a clean single value moment: the
  read names the production chart as the real value, scores the friction high
  because it waits on someone outside the flow, and puts the sandbox chart in its
  place.
- `no-value-moment` is an empty, metrics-only input, so the refusal branch can be
  seen firing on a run rather than described.

Each is two files:

- `<id>.request.json` is the request body the app sends: the value-first system
  prompt from `src/lib/framework.js`, the model id, and the image and text. The
  image base64 is replaced by a pointer to keep the file readable, and the
  screenshot it points to is committed in `samples/screenshots/`, so the exact
  bytes sent are still checkable. A test in `tests/framework-eval.test.js`
  rebuilds this request from the committed code and asserts it matches, so
  request fidelity is proven, not claimed.
- `<id>.response.json` is the model output wrapped in the Messages API envelope
  the app reads, in the shape a live call returns, with the `id` normalized and
  `usage` estimated as noted above and every other field, including
  `stop_reason`, left as returned.

## Get a live capture with your own key

To replace any reference run with a genuine live one, hitting
`https://api.anthropic.com/v1/messages` and keeping the real API id, run:

```bash
ANTHROPIC_API_KEY=sk-ant-... npm run capture -- docusign-self-serve
```

Valid ids: `docusign-self-serve`, `scheduling`, `notion`, `stripe`,
`invoice-generator`, `ai-headshots`, `plg-sales-handoff`, `no-value-moment`. The
key is read from the environment, never printed, and never written into the
output files. Run it and the output in this folder is yours, produced in front of
you, and every run varies.

To run the vision path on your own product, drop a screenshot of a live onboarding
screen into the app and click Run, or point the capture harness at your own image.
The Docusign screens committed here are real product captures; the Calendly screen
is a synthetic reconstruction. Either way every committed screen is checkable pixel
by pixel, and the tool reads whatever screen you give it.

## Why the script instead of only pre-baked files

The request the script sends is the one `src/lib/anthropic.js` sends from the
browser: same system prompt, same model, same trimmed description, same
direct-browser-access header. So a capture proves the shipped path, not a
separate harness written to look good.
