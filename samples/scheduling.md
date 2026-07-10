# Scheduling PLG audit (screenshot-grounded)

Grounded in `screenshots/scheduling-onboarding.png`, a synthetic reconstruction of a Calendly-style setup page ("Set up your booking page," Step 2 of 4), drawn by `screenshots/generate.py`. The left column configures a "30 Minute Meeting" event type with a `calendly.com/you/30min` link, five weekday availability toggles set to 9:00am to 5:00pm, and an amber "Connect your calendar to go live" gate that reads "Bookings are paused until Google or Outlook is connected." The right column is a live "Preview of your public page" with a "Meet with You / 30 min" header, a month grid, and the line "No times shown until a day is picked and the calendar is connected." This is self-serve scheduling, and the calls below reference the exact elements on that reconstructed screen.

The committed run for this flow is in [`captures/scheduling.response.json`](./captures/scheduling.response.json); the audit below walks the framework on the same screen.

## First Value Moment

Someone else books a slot on the user's page and the user gets the confirmation. Not the moment the page goes live, and not the moment the calendar connects: the felt value is a real meeting landing on the user's calendar because a booker chose a time. The `calendly.com/you/30min` link in the capture is the thing that produces it.

## Friction to reach value

**Very high band.** This is the non-obvious call, and it is where a generic funnel read would misjudge the screen. A funnel tool sees the amber "Connect your calendar to go live" gate, notes the drop, and says "move calendar-connect earlier to lift activation." But the value moment is not the user connecting a calendar. It is a third party booking. Connecting the calendar is a prerequisite the user has to clear before the value can even start, and the capture makes the distance visible: the preview page already looks done, yet the gate says "Bookings are paused" and the grid says "No times shown." The user has done real setup (event type named, five days of hours toggled on) and still cannot receive the one thing that matters. That gap between an apparently finished page and a page that cannot take a booking is the friction, and it sits in the highest band because the value depends on both a prerequisite the user controls and a third party who then has to act.

## Recurring, lasting value

recurrenceSignal: **strong**. What compounds here is the shared booking link, and the cadence is per-booking: every meeting that lands creates the occasion for the next one. Once bookings start arriving, the user keeps sharing the `calendly.com/you/30min` link, and each booker who reschedules or books again pulls them back without any new feature shipping. The public link is the durable surface, and it keeps working after setup ends. The expansion path sits on top of it: a user whose link fills up is the one who needs team routing, paid event types, and integrations, so a strong recurrence here is also the entry to an upgrade.

Weighed against the friction read, the two pull in opposite directions and recurrence is what makes the flow worth fixing: friction is in the highest band because of the calendar-connect gate, but the recurrence, once a user clears that gate, is strong. High friction guarding strong recurrence is the profile that most rewards getting users past the gate, because every user who makes it through enters a durable, expanding relationship rather than a one-time hit. That is why the friction here is worth attacking directly, which the first experiment does.

## Top Drop-Off Risk

The "Connect your calendar to go live" gate. A user who has just toggled five days of availability and sees an apparently finished preview, then hits "Bookings are paused until Google or Outlook is connected," can leave believing they are done, or stall on granting calendar access. It is the single spot on the capture where the page looks live but cannot actually take a booking.

## 3 Experiments (ranked by speed-to-value impact, funnel-last)

1. **lever: value-moment.** Let the user share the `calendly.com/you/30min` link and take a real booking against their set hours immediately, holding the confirmed meeting in a pending state, and prompt the calendar connection only when the first booking actually arrives ("someone booked Thursday 2pm, connect your calendar to lock it in").
   **Why:** This is the defensible, non-obvious move. It puts a real booking, the true value moment, ahead of the calendar-connect chore instead of behind it. The user feels the product work (a slot got taken) before doing the prerequisite, which is the opposite of what the captured gate does. Getting more users to a first booking sooner is the whole point.

2. **lever: durable-value.** After the first booking lands, prompt the user to add a second event type from the one they already configured (a 15-minute variant of the "30 Minute Meeting" on screen), pre-filled from their existing hours.
   **Why:** More event types on the same shared link means more reasons for the same and new bookers to return, which strengthens the already-strong recurrence. Ranks second: it builds repeat value rather than speeding the first booking.

3. **lever: funnel-only.** Add a "Step 2 of 4" style progress bar and a completion percentage to the setup header.
   **Why:** A progress meter can lift setup-completion rate, a funnel metric, but it does nothing to get a real booking onto the user's calendar or to make bookings recur. Funnel-only, so it is tagged and ranked last, exactly the lever the framework refuses to promote.
