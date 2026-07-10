# Failing-input audit (the refuse-to-invent branch firing)

Not every input describes a real value moment. The system prompt tells the model: "If the input does not describe a real value moment, say so plainly in firstValueMoment rather than inventing one." This sample shows that branch firing, so the tool is demonstrably auditing what it is shown rather than always manufacturing a moment.

## Input given to the tool

A vague, business-metric-only description with no user experience in it:

> "Our onboarding is great. We hit our activation KPI last quarter and the funnel converts well. We want to keep the numbers moving up and to the right. Users love it."

There is no screen, no step, no moment where a user gets felt value: only asserted metrics and sentiment.

## Captured model output (the branch firing)

This is the committed run for this input, in
[`captures/no-value-moment.response.json`](./captures/no-value-moment.response.json).
Reproduce it against your own key with `npm run capture -- no-value-moment`. It
is the model's actual output on empty input.

```json
{
  "firstValueMoment": "This input does not describe a real value moment. It states activation metrics and sentiment ('hit our activation KPI', 'users love it') but names no specific point where a user gets felt value: no screen, no first action, no result the user sees. Show the actual flow, ideally a screenshot or a step-by-step walkthrough, and this can name the moment.",
  "frictionScore": 0,
  "frictionRationale": "No arrival-to-value distance can be measured because no value moment is described.",
  "recurrenceSignal": "absent",
  "durableValue": "Cannot judge whether value recurs: the input describes no value being delivered in the first place, only a KPI that already moved. Retention and expansion both need a described moment to read from, and there is none here.",
  "topDropOff": "Cannot locate a drop-off without a described flow to place it in.",
  "experiments": [
    {
      "hypothesis": "Describe the first three screens a new user walks through, or drop in one to four screenshots of them.",
      "rationale": "The tool audits what you show it. With a real flow it can name where felt value lands.",
      "lever": "value-moment"
    },
    {
      "hypothesis": "Name the single action after which a user would say the product worked for them.",
      "rationale": "That action is the value moment. Naming it is the input this read needs.",
      "lever": "value-moment"
    },
    {
      "hypothesis": "State what pulls a user back a day later.",
      "rationale": "That return reason is the durable-value read; without it, recurrence cannot be judged.",
      "lever": "durable-value"
    }
  ]
}
```

## Why this matters

A tool that always produces a confident first value moment is a tool that will invent one on empty input. Grounding the read in what is actually shown, and saying so plainly when nothing is shown, is the difference between an audit and a generator. The `frictionScore` of 0 with a rationale that names the reason, and `recurrenceSignal: "absent"`, are the honest outputs here, not a fabricated moment.
