#!/usr/bin/env node
// Capture a real, unedited model run for one of the preloaded examples.
//
// This is what makes the samples verifiable rather than trust-me. It sends the
// exact request the app sends (same system prompt, same model, same image and
// text), then writes the raw request and the raw model response to disk with no
// editing. A reviewer runs it with their own key and confirms the tool produces
// the sample quality directly.
//
// Two modes:
//
//   Single audit (the original, one call):
//     ANTHROPIC_API_KEY=sk-ant-... node samples/captures/capture.mjs docusign-self-serve
//     npm run capture -- docusign-self-serve
//   Writes next to this script:
//     <id>.request.json    the request body sent (image base64 replaced by a note)
//     <id>.response.json   the raw, unedited response from the API
//
//   Full pipeline (auditor, then independent critic, then reconciler):
//     ANTHROPIC_API_KEY=sk-ant-... node samples/captures/capture.mjs docusign-self-serve --pipeline
//     npm run capture:pipeline -- docusign-self-serve
//   Drives the real runPipeline through a recording transport and writes one
//   request/response pair per stage under a per-id subfolder:
//     pipeline/<id>/audit.request.json      pipeline/<id>/audit.response.json
//     pipeline/<id>/critic.request.json     pipeline/<id>/critic.response.json
//     pipeline/<id>/reconcile.request.json  pipeline/<id>/reconcile.response.json
//   The subfolder keeps these out of the flat *.response.json glob the eval tests
//   read for the single-call audit captures, so adding pipeline runs does not
//   change what those tests see. The critic and reconcile files only appear when
//   the critic raised at least one objection: a clean pass records the audit and
//   the critic and skips the reconcile, the same way the app does.
//
//   Ad-hoc input (a realistic flow that is not a committed example):
//     ANTHROPIC_API_KEY=sk-ant-... node samples/captures/capture.mjs \
//       --description "A B2B tool. A new user signs up, ... connect your data ..." --id acme
//     # or read the flow from a file, and attach one or more screenshots
//     # (pass --image once per file; numbered screens go in the order given):
//     node samples/captures/capture.mjs --file ./flow.txt \
//       --image ./01.png --image ./02.png --id acme
//   Ad-hoc always runs the full pipeline and writes to pipeline/<id>/ (default id
//   "adhoc"), plus an input.txt so the exact flow is reproducible. This is how a
//   live session hunts a genuine critic catch on realistic input without adding
//   anything to the committed EXAMPLES.
//
// The key is read from the environment. It is never printed, never written to
// the output files, and never committed.

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { SYSTEM_PROMPT, CRITIC_PROMPT, RECONCILER_PROMPT, EXAMPLES } from '../../src/lib/framework.js'
import { runPipeline } from '../../src/lib/anthropic.js'

const API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-5-20250929'
const ANTHROPIC_VERSION = '2023-06-01'
// Match src/lib/anthropic.js so the captured request is the shipped one.
const MAX_TOKENS = 4096

const here = dirname(fileURLToPath(import.meta.url))
const screenshotsDir = join(here, '..', 'screenshots')

// The headers src/lib/anthropic.js sends from the browser, including the
// direct-browser-access flag, so the captured request is the shipped one.
function apiHeaders(key) {
  return {
    'x-api-key': key,
    'anthropic-version': ANTHROPIC_VERSION,
    'anthropic-dangerous-direct-browser-access': 'true',
    'content-type': 'application/json',
  }
}

// Which stage a call belongs to, read from the system prompt it carries. The
// three stages send three distinct system prompts, so the transport can label
// each captured pair without the pipeline having to tell it.
function stageForSystem(system) {
  if (system === SYSTEM_PROMPT) return 'audit'
  if (system === CRITIC_PROMPT) return 'critic'
  if (system === RECONCILER_PROMPT) return 'reconcile'
  return 'unknown'
}

// A stable, self-describing id for a captured stage, matching the
// msg_reference_* prefix the envelope test asserts. A live call returns a
// volatile id; normalizing it keeps re-runs to a content diff, not id churn.
function referenceId(id, stage) {
  return `msg_reference_${id.replace(/-/g, '_')}_${stage}`
}

// Replace every image block's base64 with a readable pointer, so the saved
// request stays legible. labels names where each image's real bytes live (a
// committed screenshot path, or an ad-hoc image path), in the same order the
// blocks were added, so a multi-screen request stays traceable screen by screen.
function redactImages(requestBody, labels) {
  const saved = structuredClone(requestBody)
  const names = labels || []
  let i = 0
  for (const block of saved.messages[0].content) {
    if (block.type === 'image') {
      block.source.data = `<base64 of ${names[i] || 'the provided image'}, omitted from the saved request>`
      i++
    }
  }
  return saved
}

// Read the value that follows a --flag, or null if the flag is absent.
function argValue(args, name) {
  const i = args.indexOf(name)
  return i !== -1 && i + 1 < args.length ? args[i + 1] : null
}

// Read every value that follows a repeated --flag, in order. A flow can attach
// several screenshots by passing --image once per file, so the numbered screens
// of a multi-step onboarding go in as one ordered sequence.
function argValues(args, name) {
  const out = []
  for (let i = 0; i < args.length; i++) {
    if (args[i] === name && i + 1 < args.length) out.push(args[i + 1])
  }
  return out
}

// Load an image file into the { mediaType, base64, name } shape the runtime
// sends, guessing the media type from the extension.
async function loadImage(path) {
  const buf = await readFile(path)
  const ext = (path.split('.').pop() || '').toLowerCase()
  const mediaType =
    ext === 'jpg' || ext === 'jpeg'
      ? 'image/jpeg'
      : ext === 'webp'
        ? 'image/webp'
        : ext === 'gif'
          ? 'image/gif'
          : 'image/png'
  return { mediaType, base64: buf.toString('base64'), name: path.split('/').pop() }
}

// Resolve the flow to capture, from one of two sources:
//   - a preloaded example id (positional arg), or
//   - ad-hoc input: --description "..." or --file <path>, optional --image <path>
//     and --id <name>. Ad-hoc lets a live session throw arbitrary realistic
//     flows at the pipeline without adding them to the committed EXAMPLES.
// Returns { id, description, images, imageLabels, adHoc }.
async function resolveFlow(args) {
  const description = argValue(args, '--description')
  const file = argValue(args, '--file')
  const imagePaths = argValues(args, '--image')
  const adHoc = Boolean(description || file || imagePaths.length)

  if (adHoc) {
    let text = description
    if (!text && file) text = await readFile(file, 'utf8')
    if (!text || !text.trim()) {
      console.error('Ad-hoc capture needs --description "..." or --file <path> with text in it.')
      process.exit(1)
    }
    // Attach screenshots in the order given, so a numbered multi-step flow keeps
    // its sequence. Promise.all preserves array order regardless of read order.
    const images = await Promise.all(imagePaths.map((p) => loadImage(p)))
    return {
      id: argValue(args, '--id') || 'adhoc',
      description: text.trim(),
      images,
      imageLabels: imagePaths,
      adHoc: true,
    }
  }

  const id = args.find((a) => !a.startsWith('--')) || 'docusign-self-serve'
  const example = EXAMPLES.find((e) => e.id === id)
  if (!example) {
    console.error(
      `No example with id "${id}". Options: ${EXAMPLES.map((e) => e.id).join(', ')}`,
    )
    process.exit(1)
  }
  // An example carries an ordered screenshots array (one entry for a single-shot
  // example, up to ten for a full multi-step flow). Load them in step order, the
  // same order the app sends, so the captured request is the shipped one screen
  // by screen. Promise.all preserves array order regardless of read order.
  const names = example.screenshots || []
  const images = await Promise.all(names.map((name) => loadImage(join(screenshotsDir, name))))
  const imageLabels = names.map((name) => `screenshots/${name}`)
  return { id: example.id, description: example.description.trim(), images, imageLabels, adHoc: false }
}

// Single-audit capture: one call, the original behavior, for a committed
// example. Kept so the flat <id>.request.json / <id>.response.json captures the
// eval tests read can still be regenerated. Ad-hoc input never lands here: it
// always routes through capturePipeline, so it cannot pollute the flat glob.
async function captureAudit(flow, key) {
  const content = []
  for (const img of flow.images) {
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: img.mediaType, data: img.base64 },
    })
  }
  // Match src/lib/anthropic.js exactly: it sends the trimmed description under
  // the same "Audit this onboarding flow." lead, so the request here is the one
  // the browser sends, not a look-alike.
  content.push({ type: 'text', text: `Audit this onboarding flow.\n\n${flow.description}` })

  const requestBody = {
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content }],
  }

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: apiHeaders(key),
    body: JSON.stringify(requestBody),
  })
  const raw = await res.text()

  // Normalize the volatile message id to the stable msg_reference_<id> the
  // committed captures and the envelope test use, so a re-capture is a content
  // diff, not id churn. On a non-JSON error body, write it through untouched.
  let bodyOut = raw
  try {
    const parsed = JSON.parse(raw)
    if (parsed && parsed.id) {
      parsed.id = `msg_reference_${flow.id.replace(/-/g, '_')}`
      bodyOut = JSON.stringify(parsed, null, 2)
    }
  } catch {
    // not JSON (an error page, for example): leave it as returned
  }

  const savedRequest = redactImages(requestBody, flow.imageLabels)
  await writeFile(join(here, `${flow.id}.request.json`), JSON.stringify(savedRequest, null, 2) + '\n')
  await writeFile(join(here, `${flow.id}.response.json`), bodyOut.endsWith('\n') ? bodyOut : bodyOut + '\n')

  console.log(
    `HTTP ${res.status}. Wrote ${flow.id}.request.json and ${flow.id}.response.json.`,
  )
}

// Full-pipeline capture: drive the real runPipeline through a recording
// transport. The transport is the injected callMessages the pipeline calls for
// each stage; it sends the exact request the app sends, records the request and
// the response, normalizes the response id, and hands the real response back to
// the pipeline so the chain proceeds on live output.
async function capturePipeline(flow, key) {
  const outDir = join(here, 'pipeline', flow.id)
  await mkdir(outDir, { recursive: true })

  const records = []
  const transport = async ({ system, messages, maxTokens = MAX_TOKENS }) => {
    const stage = stageForSystem(system)
    const requestBody = { model: MODEL, max_tokens: maxTokens, system, messages }

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: apiHeaders(key),
      body: JSON.stringify(requestBody),
    })
    const raw = await res.json()

    // Normalize the id for the saved copy; hand the real response back to the
    // pipeline unchanged so the chain runs on live output.
    const saved = { ...raw, id: referenceId(flow.id, stage) }
    records.push({ stage, requestBody, response: saved, status: res.status })
    return raw
  }

  const result = await runPipeline({
    apiKey: key,
    description: flow.description,
    images: flow.images,
    callMessages: transport,
  })

  // Save the ad-hoc input text alongside the capture, so a committed ad-hoc
  // catch is reproducible: the exact flow that produced it is on disk.
  if (flow.adHoc) {
    await writeFile(join(outDir, 'input.txt'), flow.description + '\n')
  }

  for (const rec of records) {
    const savedRequest = redactImages(rec.requestBody, flow.imageLabels)
    await writeFile(
      join(outDir, `${rec.stage}.request.json`),
      JSON.stringify(savedRequest, null, 2) + '\n',
    )
    await writeFile(
      join(outDir, `${rec.stage}.response.json`),
      JSON.stringify(rec.response, null, 2) + '\n',
    )
  }

  // The reconcile response is only the patch, so also write the merged final
  // audit. This is the audit after the reconciler's changes are applied, or the
  // auditor audit unchanged on a clean pass. Written as the plain audit object
  // (not an envelope) so it can be read back directly.
  await writeFile(join(outDir, 'final.json'), JSON.stringify(result.final, null, 2) + '\n')

  // Report whether this run is a real critic catch: the critic raised at least
  // one objection and the reconciler changed the audit. That is the committed
  // sample the build needs, so the harness says plainly whether it produced one.
  const stages = records.map((r) => `${r.stage} (HTTP ${r.status})`).join(', ')
  const objections = result.critique?.objections?.length || 0
  const changed = result.reconciled && result.final.firstValueMoment !== result.audit.firstValueMoment
  const changeCount = result.reconciled?.changes?.length || 0

  console.log(`Wrote pipeline/${flow.id}/ for stages: ${stages}.`)
  if (result.degraded) {
    console.log(`Note: the run degraded at the ${result.degradedReason} stage.`)
  }
  console.log(
    `Critic verdict: ${result.critique?.verdict ?? 'unavailable'}, ` +
      `objections: ${objections}, reconciler changes: ${changeCount}.`,
  )
  if (objections > 0 && changeCount > 0) {
    console.log(
      changed
        ? 'This run is a genuine critic catch: the critic objected and the reconciler changed the first value moment.'
        : 'The critic objected and the reconciler logged changes. Read the changes to confirm the catch is genuine.',
    )
  } else {
    console.log('Clean pass: the critic found nothing to change. Run another example to look for a genuine catch.')
  }
}

async function main() {
  const args = process.argv.slice(2)

  const flow = await resolveFlow(args)
  // Ad-hoc input always runs the full pipeline: it exists to hunt a genuine
  // critic catch, and routing it through the pipeline subfolder keeps it out of
  // the flat committed-capture glob the eval tests read.
  const usePipeline = args.includes('--pipeline') || flow.adHoc

  // --dry-run resolves the flow and prints what would be sent, without a key and
  // without calling the API. Use it to sanity-check an ad-hoc flow before
  // spending calls on it.
  if (args.includes('--dry-run')) {
    const preview = flow.description.length > 160 ? flow.description.slice(0, 160) + '...' : flow.description
    console.log(
      `Dry run. Would ${usePipeline ? 'run the full pipeline' : 'run a single audit'} for id "${flow.id}"` +
        `${flow.adHoc ? ' (ad-hoc)' : ''}.\n` +
        `Images: ${flow.images.length}. Description (${flow.description.length} chars):\n  ${preview}`,
    )
    return
  }

  const key = process.env.ANTHROPIC_API_KEY
  if (!key) {
    console.error('Set ANTHROPIC_API_KEY to capture a live run. Nothing was sent.')
    process.exit(1)
  }

  if (usePipeline) {
    await capturePipeline(flow, key)
  } else {
    await captureAudit(flow, key)
  }
}

main().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
