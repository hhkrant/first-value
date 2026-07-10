# Stripe audit (strong recurrence, so the fast hit is worth widening)

A text example, described from public knowledge. The input is the Stripe first-run flow as a step-by-step walkthrough: the user creates an account and lands on a dashboard in test mode; a setup checklist appears (verify email, add business details, connect a bank account, get API keys); onboarding surfaces a test payment flow and sample code so a developer can run a charge before going live; a developer can push a test charge through in minutes; real payouts stay gated behind identity and bank verification for the business account.

The committed run for this input is in [`captures/stripe.response.json`](./captures/stripe.response.json); the audit below walks the framework on the same flow.

## First Value Moment

A test charge goes through in the dashboard. The developer sees the integration work and money move as expected, in test mode, before any business verification or bank connection. The felt value is proof that a payment can run through their own account, seen on the dashboard, not the account creation and not the checklist.

## Friction to reach value

**Moderate band.** A developer can run a test charge in minutes through self-serve actions: create an account, grab API keys, paste the sample code, watch the charge appear. There is no counterparty, no wait, and no verification gate before this first value moment. The setup checklist and test mode reduce friction rather than add it, because they let the developer prove the integration before clearing any real-money gates. What holds it out of the lowest band is that the value still depends on the developer running the sample code, not a charge that is already on screen when they arrive.

## Recurring, lasting value

recurrenceSignal: **strong**. What compounds here is the integration itself, and the cadence is continuous: a developer runs a test charge, wires the call into their own code, and from then on every request their app makes is a return to Stripe. The value is not a session they choose to repeat, it is a dependency their product now carries, which is the most durable recurrence a flow can have. The expansion path is built into it: once real charges flow, volume grows with the developer's own business, and Stripe's revenue rides that same curve, so activation here feeds expansion directly rather than needing a separate upsell.

Set against the friction read, the two diverge and recurrence decides the priority: friction is moderate because the checklist front-loads verification, but the recurrence is as strong as it gets. Moderate friction with a dependency-grade return reason is a good position, better than a frictionless flow that produces a one-time hit. That profile is what makes it worth widening the first charge to more developers, because each one who reaches it enters a dependency rather than a one-time hit, and then protecting and extending that dependency is where the durable moves come in.

## Top Drop-Off Risk

The point where the developer has to leave Stripe and integrate the API into their own codebase. The sample code and test mode reduce this friction, but the flow still depends on the developer writing code and deploying it, a step Stripe cannot complete for them. If the integration feels too heavy or fails, the developer churns here, before ever running a real charge.

## 3 Experiments (ranked by speed-to-value impact, funnel-last)

1. **lever: value-moment.** Seed the dashboard with a completed test charge on arrival, so a developer sees money move in one click instead of having to run the sample code first.
   **Why:** The first value moment is a test charge going through, and right now reaching it still requires running the curl. Putting a successful charge on screen the moment the developer arrives gets more of them to felt value before they decide the setup is too much. It ranks first because widening the fast hit reaches developers who would not have run the code themselves.

2. **lever: durable-value.** Surface a second test transaction type on the same dashboard visit, a refund or a payout, so the developer sees Stripe handle the full payment lifecycle, not only a charge.
   **Why:** Showing more of what the integration will carry builds the return reason, because a developer who has run a charge, a refund, and a payout in test mode is wiring more of their product onto Stripe. It ranks second: it deepens the dependency rather than speeding the first charge.

3. **lever: durable-value.** Offer a one-click business verification flow from the dashboard right after the first test charge, so the path to live payouts starts at the moment the developer already has value.
   **Why:** Verification is the gate between a test charge and real money, and tying it to the moment the developer just saw a charge succeed converts felt value into a live account. It ranks third because it moves a developer who is already retained toward expansion, rather than getting a new one to a first charge.
