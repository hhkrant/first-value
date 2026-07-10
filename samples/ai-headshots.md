# AI headshots audit (a funnel win that is genuinely tempting, and still last)

A text example, on purpose. The other samples make the funnel-only lever easy
to rank last because it is plainly the weakest move on the board. This one is
built to be harder: the tempting experiment sits on the paywall, the exact
place the money changes hands, and it is a change that would move revenue this
week. The point of the sample is that it still ranks last, and why.

The input is a consumer AI headshot generator. The user uploads twelve selfies,
waits about twenty minutes while a model trains, and then sees a grid of about
forty generated headshots. Viewing the grid is free. Downloading is paywalled
behind a $29 one-time unlock or a $9 per month subscription, and the checkout is
a full billing form. A line under the grid offers a monthly refresh with new
styles for subscribers.

The committed run for this input is in
[`captures/ai-headshots.response.json`](./captures/ai-headshots.response.json);
the audit below walks the framework on the same flow.

## First Value Moment

The user scrolls the generated grid and finds a headshot that looks like a real,
professional photo of them, seen on screen before any payment. Not the upload
and not the checkout: the felt value is a usable photo of themselves that did
not exist twenty minutes earlier.

## Friction to reach value

**High band.** The value is gated behind a long setup: twelve selfies uploaded,
then a wait of around twenty minutes while the model trains, before a single
result appears. Arrival to first felt value is most of that distance, and none
of it is at the paywall. The user has not reached the grid yet when they give
up.

## Recurring, lasting value

recurrenceSignal: **weak**. Retention: a headshot is close to a one-time need,
so nothing in this flow pulls the user back next month. They unlock a set of
photos, use one, and the reason to return is thin. There is no artifact they
operate on a cadence and no scheduled moment that reopens the app. Expansion:
the $9 per month subscription is the only path past a one-time hit, but it sits
on the paywall with no reason attached, so it asks for a recurring charge
against a need that does not recur on its own.

Weighed together, friction is high and recurrence is weak, and these do not
cancel out. A user who pushes through the wait still has no reason to come back,
so the deeper problem is the weak recurrence, not only the distance to the first
photo. Making the subscription honest means giving the trained model a job that
returns: new styles, a seasonal refresh, and a way to push the chosen photo into
the places the user actually uses it.

## Top Drop-Off Risk

The twenty-minute training wait after the twelve-selfie upload. The user has done
the work and handed over their photos, but sees nothing yet, so a first-time
user can close the tab believing it stalled and never reach the grid that carries
the value.

## 3 Experiments (ranked by speed-to-value impact, funnel-last)

1. **lever: value-moment.** Stream partial results: drop the upload minimum to
   six selfies, start generating as soon as the first batch is ready, and show a
   handful of finished headshots within the first few minutes instead of holding
   everything behind a twenty-minute wall.
   **Why:** The value moment is a usable photo on screen, and right now nothing
   appears until the full batch finishes. Showing real results early, on fewer
   inputs, compresses the longest stretch of the flow and gets more users to a
   photo they can judge before they lose patience. This moves more users to felt
   value than any change at the paywall does, because the paywall is not where
   they are dropping.

2. **lever: durable-value.** Tie the trained model to a returning job: a monthly
   refreshed set in new styles and backgrounds, and a one-tap "update my
   LinkedIn, Slack, and team directory" that pushes the chosen headshot into the
   places the user's photo lives.
   **Why:** The gap here is a reason to come back, not the first photo. A
   headshot is close to a one-time need, so the flow has to build recurrence:
   pushing the output into the user's real profiles, and refreshing it on a
   cadence, is what gives the $9 subscription something to deliver each month
   instead of charging for a need that does not repeat. It ranks second because
   the first-hit wait is the larger constraint on this specific flow.

3. **lever: funnel-only.** Add a fifteen-minute countdown timer and a "40% off
   your first unlock" banner on the paywall to lift purchase conversion at the
   moment of decision.
   **Why:** This is the tempting one, and it is tempting for a real reason. The
   paywall is the revenue event, urgency with a discount lifts checkout
   conversion, and the result would show up fast in the numbers. It still ranks
   last. It moves paid-conversion inside a single session without getting one
   more user to the on-screen grid sooner, because the upload and the
   twenty-minute wait are untouched, and without giving anyone a reason to
   return. Discounting a one-time unlock also pulls revenue forward from users
   who were already going to buy. Tagged funnel-only and pinned last, which is
   where a conversion lever belongs when the constraints are the wait before
   value and the missing reason to come back.
