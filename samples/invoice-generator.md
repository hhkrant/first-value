# Invoice generator audit (activation is real, retention is not)

A text example with no screenshot, on purpose. The screenshot-grounded samples in this folder land on products where the work is to get more users to a value moment that already recurs. A retention read only proves it can bite when it flags the opposite: a flow where activation is genuinely fast and the product still will not retain. This is that flow.

The input is a free online invoice generator: one form (business name, client name, line items, amounts), a "Download PDF" button, no account required. Fill it, click, and a formatted invoice downloads. A footnote offers to email or save the invoice if the user makes an account.

The committed run for this input is in [`captures/invoice-generator.response.json`](./captures/invoice-generator.response.json); the audit below walks the framework on the same flow.

## First Value Moment

The finished invoice PDF downloads. The felt value is a correct, formatted invoice in hand, seen the moment the file lands in the user's downloads, with no account and no setup between arrival and that file.

## Friction to reach value

**Low band.** One form to one download. Business name, client, and line items are all on a single screen, and "Download PDF" produces the value directly, so the arrival-to-first-value distance is short. This is the trap: a low friction band reads as a healthy flow, and a funnel tool would call it done.

## Recurring, lasting value

recurrenceSignal: **absent**. This is where the audit separates from the friction read, and where it earns its place.

Retention: value does not recur on its own. The user got one invoice and the flow gives no reason to return. Nothing is saved by default, there is no client list, and a freelancer who needs one invoice may not be back for weeks.

Expansion: the only path off the one-time hit is the optional account that saves and emails invoices, but it sits after the download as a footnote and asks for signup with no reason attached.

The call this flow forces: activation is real and fast, and it will not retain. Do not optimize this funnel. A higher download rate on a tool no one returns to still produces a one-time hit. The work is a reason to come back, saved clients and recurring invoices, not a shorter path to a first download that is already short. That is why a low friction band is not the good news it looks like: friction measures arrival to first value, and this flow has almost none, but recurrence is absent, and recurrence is what decides whether there is a business here.

## Top Drop-Off Risk

The moment right after the download. The user has the file and the page offers nothing that pulls them back, so the drop-off is not before value, it is right after the single value the flow delivers.

## 3 Experiments (ranked by impact, funnel-last)

1. **lever: durable-value.** On download, save the client and line items to a lightweight account created from the invoice itself (magic-link, no password), so the next invoice for that client is one click.
   **Why:** The gap here is recurrence, not activation. Turning a one-off invoice into a saved client that pre-fills the next one is the move most likely to make a return happen. It ranks first because the first value is already fast, so a faster first download does not fix a tool with no reason to come back.

2. **lever: value-moment.** Auto-fill the user's business details from their email domain on first load, so the form opens partly complete.
   **Why:** This shaves the small friction that remains before the first download. It ranks second because the first value is already fast, so speeding it further moves less than creating a reason to return.

3. **lever: funnel-only.** Add a progress bar and a "you are almost done" nudge above the Download button.
   **Why:** A completion nudge can lift the download rate, a funnel metric, but the download already happens for most users, and lifting it further still leaves a tool with no reason to return. Tagged funnel-only and ranked last, which is where a conversion nudge belongs when the problem is recurrence, not activation.
