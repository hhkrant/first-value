# Notion audit (a fast first block, no reason to return)

A text example, described from public knowledge. The input is the Notion first-run flow as a step-by-step walkthrough: the user signs up with email or Google and lands in an empty personal workspace with a sidebar and a blank "Getting Started" page; onboarding offers three templates (personal notes, task list, team wiki) and a short walkthrough that has the user type a line, turn it into a heading, and add a checklist; the user is nudged to create their first real page and, optionally, to invite a teammate. Nothing is pre-filled, so the workspace stays empty until the user decides what to build.

The committed run for this input is in [`captures/notion.response.json`](./captures/notion.response.json); the audit below walks the framework on the same flow.

## First Value Moment

The user types a line, turns it into a heading, adds a checklist, and sees that first formatted block render cleanly. The felt value is the workspace doing what they meant: structure appears as they type, and the blank page becomes something with shape. Not the sign-up and not the empty workspace they landed in, the moment is the first block that holds their own structure.

## Friction to reach value

**Moderate band.** The walkthrough puts real value three self-guided actions in: type a line, make it a heading, add a checklist, with no account gate beyond sign-up, no data-entry prerequisite, and no wait. The distance from arrival to a first formatted block is short and the flow guides every step of it. What keeps this out of the lowest band is that the value is a demonstration inside the walkthrough, not yet a page the user came to build.

## Recurring, lasting value

recurrenceSignal: **weak**. Retention: what would compound here is a page the user runs on a cadence, a task list they check every morning, a doc they reopen to keep editing. The walkthrough shows the mechanics but does not connect them to a real use case, so the user leaves with a formatted block and no artifact they have a reason to return to tomorrow. There is a plausible return (a note or a task list the user decides to keep), but the flow does not build it; it asks the user to invent it. Expansion: the "invite a teammate" nudge sits at the end as optional, so the path to paid team seats depends on a collaboration reason the flow never makes.

Weighed together, the reads point the same way and recurrence is the one that decides the priority: friction is moderate, but even a user who reaches a first formatted block has no cadence pulling them back. A fast first block with no daily reason to return is worse than a slower first page that becomes a daily habit, so the work is the return reason, not only the speed to the first line. On the business side, that daily habit is what later converts a free workspace into paid team seats, so building recurrence here feeds expansion, not just activation.

## Top Drop-Off Risk

The moment the walkthrough ends and the user is left in the empty workspace with no next step. The flow has shown what Notion can do but has not tied it to a reason the user has for being there, so a user who finishes the demo can close the tab before building anything of their own.

## 3 Experiments (ranked by impact, funnel-last)

1. **lever: durable-value.** Seed the workspace with a pre-filled page tied to the user's stated role or goal, so the first page they open already contains something they would plausibly edit and refer back to, not a blank they must fill.
   **Why:** The gap here is a reason to return, not speed to the first block. A page that already holds relevant structure is the artifact a user reopens, and reopening is the habit this flow is missing. It ranks first because the walkthrough already delivers a fast first block, so the scarce thing is a page worth coming back to.

2. **lever: value-moment.** Replace the generic walkthrough with a choose-your-own path that delivers the first formatting action inside a use-case-specific template, so the user's first formatted block is also their first real page.
   **Why:** Folding the demo into a real page gets more users to value that is theirs rather than a throwaway example. It ranks second because it speeds and grounds the first hit but still leans on the user to keep the page alive after.

3. **lever: durable-value.** Right after the first page is created, prompt a second, related page framed as the next step in the same use case, so the user builds a second artifact before the session ends.
   **Why:** A second artifact in the same session is the start of a workspace the user operates, which is what turns a one-time visit into a return. It ranks third because it depends on the first page landing first, but it directly targets the weak return cadence rather than the already-fast first block.
