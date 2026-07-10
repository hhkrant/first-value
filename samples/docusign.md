# Docusign premium-trial audit (screenshot-grounded)

Grounded in ten real, numbered screenshots of the Docusign eSignature premium
free-trial flow, captured screen by screen and committed under
[`screenshots/docusign-trial/`](./screenshots/docusign-trial/). The ten screens
run in step order: the marketing home ("Everything you need to agree"), email
entry, personal details, phone verification, set password, the premium-vs-free
modal, the plan comparison (Personal $11, Standard $30, Business Pro $45), the
payment screen (credit card required, $0 due today), the product home ("Welcome
back," with Get Signatures / Sign a Document / Use a Template), and the Set Up
Envelope send flow. The flow is 18 steps end to end; the six low-signal screens
(the two verification-code screens, the two duplicate plan-select modals, the
loading modal, and the getting-started modal) are carried in the text and left
out of the images.

This is the self-serve segment Hilary worked on at Docusign, so the audit reasons
about a flow she knows from the inside, here read from live captures rather than a
reconstruction. The committed run is in
[`captures/docusign-self-serve.response.json`](./captures/docusign-self-serve.response.json);
the audit below walks the framework on the same ten screens. Read it as analysis,
not a swipe at a former employer: the tension it names, a real value moment sitting
behind a card wall, is the interesting part.

## First Value Moment

The first signed document arrives in the user's inbox, completing the signature
loop they came to close. Not "account created," not "trial started," and not the
click on Send: the felt value is a completed, executed agreement landing back with
the user, which is why they opened Docusign in the first place. The home screen
also offers Sign a Document, a self-sign path that reaches a smaller version of the
same value without a counterparty, but the flow routes a first-time trial user
toward sending for signature, where the returned copy depends on the other party
acting.

## Friction to reach value

**High band.** The score lands at 78. The path from the marketing home to a
returned signature runs fourteen self-serve steps before the send even begins:
email, a 6-digit email code, personal details, a phone number, an SMS code, a
password, a premium-vs-free modal, a plan selection, a plan comparison, a second
plan selection, and a payment screen. Then the value itself depends on a recipient
receiving the envelope, opening it, and signing, which sits entirely outside the
user's control.

Two of those steps are load-bearing gates. Plan selection is required before the
product opens, and the payment screen requires a credit card to start the trial.
The "$0 due today, free for 14 days" framing softens the card gate, but the card is
still mandatory before the user has sent a single document. That is the structural
reason the band is high rather than moderate: a long, gated arrival stacked on top
of a counterparty dependency for the value moment.

## Recurring, lasting value

recurrenceSignal: **weak.** Docusign is a per-agreement tool, not a daily habit, so
return tracks contract cadence: a hiring manager or a landlord comes back monthly
or quarterly, and a one-time signer does not come back at all. The flow supports
repeat use but makes no argument for it. The home screen offers "Send your first
document," not a reason to send a second, and the "Trial ends in 14 days" banner is
a billing reminder, not a retention hook. The signed copy lands as a finished
artifact with no shared workspace, saved template, or standing recipient
relationship that pulls the user back. That is what keeps recurrence weak rather
than strong: some users return because they happen to have another contract, but
nothing in the flow raises that likelihood.

Expansion is real but sits downstream of that gap. The trial captures the card up
front and converts to a $132/year Personal plan after fourteen days unless
cancelled, and the premium features it gates (templates, SMS delivery, AI
assistance) are a clear upgrade path for a user who returns and needs them. The
catch is sequencing: expansion depends on retention, retention depends on the user
having a second agreement to sign, and the flow does nothing to create that need.
Because payment intent is taken before any value is delivered, the trial
front-loads monetization onto users already willing to enter a card, which selects
for high-intent users and against a solopreneur just testing whether signing works.

Friction and recurrence together: a long path to first value is manageable when
value recurs, but here a high-friction arrival meets weak recurrence, and the
recurrence read is the one that should set priority. The user clears fourteen steps
and waits on a counterparty to reach a value moment the flow gives them no reason
to repeat. The work is not shaving the first-envelope path further; it is giving
the user a reason to send a second envelope, which is what would turn weak
recurrence into strong and make the up-front activation cost pay off.

## Top Drop-Off Risk

The payment screen at step 14. A credit card is required to start the trial,
fourteen steps in, before the user has sent a document or seen a signature. The
"$0 due today" line lowers the felt cost, but requiring a card before any value is
delivered loses the users who are still evaluating the tool or do not have a card
on hand, which are exactly the low-commitment trial users who might have found
value and returned.

## 3 Experiments (ranked by speed-to-value impact, funnel-last)

1. **lever: durable-value.** Move the user into a shared envelope view where they
   watch signature status update in real time, and after the first envelope
   completes, prompt them to send a second with the recipient prefilled and a
   template suggested from the first document's type.
   **Why:** Recurrence is the weak read that decides priority here, and the flow
   currently offers no reason to return after the first signature. A live status
   view keeps the user connected to the value moment, and a prompted, prefilled
   second send turns "sign one contract" into "run my signing process," which is
   the mechanism that converts a one-time signer into a returning one and feeds the
   paid templates surface.

2. **lever: value-moment.** After email verification, let the user skip phone
   verification, password, plan selection, and payment, and drop them straight into
   a send flow with a sample document and one recipient field, so they send a first
   envelope in a couple of minutes. Collect payment only when the trial ends or the
   user sends a second envelope.
   **Why:** The real first value depends on nothing but the user sending and getting
   back one signature, yet the flow gates it behind fourteen steps and a card. Pulling
   the value moment in front of the payment wall gets more trial users to a felt
   signature. It ranks below the durable-value move because a faster first hit that
   still does not recur is a smaller win than building the reason to return.

3. **lever: value-moment.** On the product home after the trial starts, replace the
   generic "Send your first document" card with a contract-type picker (NDA, offer
   letter, sales agreement, lease) that loads a prefilled template and a recipient
   field, so the user sends a real envelope instead of stalling on what to send.
   **Why:** It removes the blank-page hesitation at the home screen and speeds the
   first real send. It ranks last of the three because it acts only after the user
   has already cleared the trial's hardest gates, so it reaches fewer additional
   users than pulling the value moment in front of the card, and it builds no repeat
   value on its own.
