import React, { useState, useEffect, useRef } from 'react'
import { EXAMPLES } from './lib/framework.js'
import { runPipeline, coherenceFlags } from './lib/anthropic.js'
import ResultCards from './components/ResultCards.jsx'

// If the build was configured with a proxy URL, the app runs keyless: every
// audit routes through a server-side key and the visitor pastes nothing. This
// is what turns a deployed URL into a click-through demo. With no proxy set, the
// app is bring-your-own-key, exactly as before.
const PROXY_URL = import.meta.env.VITE_PROXY_URL || ''
const KEYLESS = Boolean(PROXY_URL)

// Bundle the screenshot-driven examples' captures so the vision path runs on
// click. Vite resolves these imports to served asset URLs in dev and build. The
// Docusign example is the real premium-trial flow, ten curated screens in step
// order; the Calendly example is one synthetic reconstruction.
import docusign01 from '../samples/screenshots/docusign-trial/01-marketing-home.png'
import docusign02 from '../samples/screenshots/docusign-trial/02-email-entry.png'
import docusign03 from '../samples/screenshots/docusign-trial/03-personal-info.png'
import docusign05 from '../samples/screenshots/docusign-trial/05-phone-entry.png'
import docusign07 from '../samples/screenshots/docusign-trial/07-set-password.png'
import docusign08 from '../samples/screenshots/docusign-trial/08-premium-vs-free.png'
import docusign10 from '../samples/screenshots/docusign-trial/10-plan-comparison.png'
import docusign12 from '../samples/screenshots/docusign-trial/12-payment-info.png'
import docusign15 from '../samples/screenshots/docusign-trial/15-home-welcome-back.png'
import docusign16 from '../samples/screenshots/docusign-trial/16-set-up-envelope.png'
import schedulingShot from '../samples/screenshots/scheduling-onboarding.png'

const KEY_STORAGE = 'first-value:anthropic-key'

// The example buttons are grouped by onboarding flow type so a visitor can see
// the range at a glance. Order and captions live here; each example carries its
// group label in framework.js.
const EXAMPLE_GROUPS = [
  {
    label: 'Multi-step setup',
    caption: 'Sign up, then several steps to first value',
  },
  { label: 'Single-step tools', caption: 'One action, immediate output' },
  {
    label: 'Trial with sales handoff',
    caption: 'Self-serve start, gated behind an admin and a sales call',
  },
]

// Maps an example's screenshot filename to its bundled asset URL. An example
// carries an ordered screenshots array, and each name resolves here; text
// examples have none.
const EXAMPLE_SHOTS = {
  'docusign-trial/01-marketing-home.png': docusign01,
  'docusign-trial/02-email-entry.png': docusign02,
  'docusign-trial/03-personal-info.png': docusign03,
  'docusign-trial/05-phone-entry.png': docusign05,
  'docusign-trial/07-set-password.png': docusign07,
  'docusign-trial/08-premium-vs-free.png': docusign08,
  'docusign-trial/10-plan-comparison.png': docusign10,
  'docusign-trial/12-payment-info.png': docusign12,
  'docusign-trial/15-home-welcome-back.png': docusign15,
  'docusign-trial/16-set-up-envelope.png': docusign16,
  'scheduling-onboarding.png': schedulingShot,
}

// Load an example's screenshots (if any) into the { mediaType, base64, name }
// shape run() sends, preserving the step order in the screenshots array. Returns
// an empty array for a text-only example. Promise.all keeps the order regardless
// of which fetch resolves first, so numbered screens stay numbered.
async function loadExampleShots(example) {
  const names = example.screenshots || []
  const pairs = names
    .map((name) => ({ name, url: EXAMPLE_SHOTS[name] }))
    .filter((p) => p.url)
  return Promise.all(pairs.map((p) => urlToImage(p.url, p.name)))
}

// Reads a File as base64 without the data-URL prefix, plus its media type.
// The API source field wants raw base64, not a data URL.
function fileToImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result || '')
      const base64 = result.includes(',') ? result.split(',')[1] : result
      resolve({ mediaType: file.type || 'image/png', base64, name: file.name })
    }
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`))
    reader.readAsDataURL(file)
  })
}

// Fetch a bundled screenshot URL and turn it into the { mediaType, base64, name }
// shape runAudit sends. Used to preload the screenshot-driven example so the
// vision path fires on the first click, the same way an uploaded file would.
async function urlToImage(url, name) {
  const res = await fetch(url)
  const blob = await res.blob()
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error(`Could not read ${name}.`))
    reader.readAsDataURL(blob)
  })
  const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl
  return { mediaType: blob.type || 'image/png', base64, name }
}

// How many screenshots one flow can attach. A multi-step onboarding (a signup
// gauntlet through a paid gate to the first value moment) needs the whole
// ordered sequence to score friction correctly, so the cap covers a full flow
// rather than a single hero screen.
const MAX_SCREENSHOTS = 10

export default function App() {
  const [apiKey, setApiKey] = useState('')
  const [description, setDescription] = useState('')
  const [images, setImages] = useState([]) // { mediaType, base64, name }
  const [loading, setLoading] = useState(false)
  const [loadingLabel, setLoadingLabel] = useState('')
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  // The key is set once and stays static across example runs, so it collapses to
  // a compact "saved" row after entry and reopens on Change, keeping it out of
  // the way of the flow input.
  const [editingKey, setEditingKey] = useState(false)
  const fileInputRef = useRef(null)

  // Load a previously entered key from localStorage. The key stays in the
  // browser and is never committed or sent anywhere except the model API.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(KEY_STORAGE)
      if (saved) setApiKey(saved)
    } catch (e) {
      // localStorage can be blocked; the key field still works in memory.
    }
  }, [])

  // Preselect the screenshot-driven example so the page opens with a real flow
  // already staged: the description filled and its screenshot loaded. Clicking
  // Run then exercises the vision path with no typing. The visitor can clear it
  // and paste their own flow whenever they want.
  useEffect(() => {
    const first = EXAMPLES[0]
    if (!first) return
    setDescription(first.description)
    if (!first.screenshots || first.screenshots.length === 0) return
    let cancelled = false
    loadExampleShots(first)
      .then((imgs) => {
        if (!cancelled && imgs.length > 0) setImages(imgs)
      })
      .catch(() => {
        // Leave the description in place; text alone still runs.
      })
    return () => {
      cancelled = true
    }
  }, [])

  function handleKeyChange(value) {
    setApiKey(value)
    try {
      if (value) window.localStorage.setItem(KEY_STORAGE, value)
      else window.localStorage.removeItem(KEY_STORAGE)
    } catch (e) {
      // Ignore storage failures; state still holds the key for this session.
    }
  }

  async function handleFiles(fileList) {
    const files = Array.from(fileList || []).slice(0, MAX_SCREENSHOTS)
    if (files.length === 0) return
    try {
      const next = await Promise.all(files.map(fileToImage))
      setImages((prev) => [...prev, ...next].slice(0, MAX_SCREENSHOTS))
      setError('')
    } catch (e) {
      setError(e.message || 'Could not read one of the screenshots.')
    }
  }

  function removeImage(index) {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  async function run(descText, imgs) {
    if (!KEYLESS && !apiKey.trim()) {
      setError('Add your Anthropic API key to run an audit.')
      return
    }
    if (!descText.trim() && (!imgs || imgs.length === 0)) {
      setError('Describe the onboarding flow or add at least one screenshot.')
      return
    }
    setError('')
    setResult(null)
    setLoading(true)
    setLoadingLabel(
      imgs && imgs.length > 0
        ? 'The first agent is auditing the onboarding flow and screenshots...'
        : 'The first agent is auditing the onboarding flow...',
    )
    try {
      // runPipeline drives the audit through the adversarial chain: auditor,
      // then an independent critic, then the auditor revising under the critic's
      // pushback. onStage moves the loading label through the three stages so
      // the chain is visible while it runs.
      const pipeline = await runPipeline({
        apiKey: apiKey.trim(),
        description: descText,
        images: imgs,
        proxyUrl: PROXY_URL,
        onStage: setLoadingLabel,
      })
      setResult(pipeline)
    } catch (e) {
      setError(e.message || 'The audit failed. Check your key and try again.')
    } finally {
      setLoading(false)
      setLoadingLabel('')
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    run(description, images)
  }

  // Load an example into the input without running it: the flow text and any
  // screenshot are staged so the user can read them first, then click Run audit
  // to start the pipeline. Any prior result is cleared so a staged example does
  // not sit above a stale read.
  async function previewExample(example) {
    setDescription(example.description)
    setResult(null)
    setError('')
    if (!example.screenshots || example.screenshots.length === 0) {
      setImages([])
      return
    }
    try {
      setImages(await loadExampleShots(example))
    } catch (e) {
      // If the bundled screenshots cannot be read, stage the text alone rather
      // than failing the click. The text describes the same flow.
      setImages([])
    }
  }

  return (
    <div className="app">
      {loading && (
        <div className="progress-overlay" role="status" aria-live="polite">
          <div className="progress-modal">
            <span className="progress-modal__dot" />
            <p className="progress-modal__label">{loadingLabel}</p>
          </div>
        </div>
      )}

      <header className="masthead">
        <div className="masthead__mark">First Value</div>
        <p className="masthead__tagline">
          Strong onboarding isn't just a faster funnel. It should get users to
          real value frictionlessly, and give them a compelling reason to come
          back.
        </p>
      </header>

      <main className="layout">
        <section className="intro" aria-label="What this tool does and how it works">
          <div className="intro__col">
            <h2 className="intro__head">What it does</h2>
            <p className="intro__lead">
              First Value audits an onboarding flow for how quickly a new user
              reaches real product value, and whether anything brings them back.
              You get:
            </p>
            <ul className="intro__list">
              <li>The first value moment, named concretely.</li>
              <li>A friction score for how hard that moment is to reach.</li>
              <li>
                An assessment of whether users have a reason to come back, and
                whether there's room to grow beyond that first use.
              </li>
              <li>
                Three ranked experiments to get more users to that value faster
                and make it recur.
              </li>
            </ul>
          </div>
          <div className="intro__col">
            <h2 className="intro__head">How it works</h2>
            {!KEYLESS && (
              <p className="intro__lead">
                First, add your Anthropic API key above. It stays in your
                browser and is only used to run the audit.
              </p>
            )}
            <ol className="intro__steps">
              <li>
                <strong>Step 1. Provide the input:</strong> Describe an
                onboarding flow step by step or choose one of the pre-built
                examples. Add up to ten screenshots if you have them, labeled
                by step. Keep in mind that the audit will be only as good as
                the input.
              </li>
              <li>
                <strong>Step 2. Click Run audit</strong>
              </li>
              <li>
                <strong>Step 3. Wait as the app runs:</strong> (1) an auditor
                scores the flow and writes the first read. (2) an independent
                critic tries to break that first read. (3) the auditor reviews
                the critic's challenges, then revisits and updates the read,
                incorporating the fair objections and passing on the rest. (4)
                the app runs an automated cross-check in code before displaying
                the results.
              </li>
              <li>
                <strong>Step 4. View the Results:</strong> You see the final
                audit results, a summary of what the critic challenged and what
                the auditor changed, and the three recommended experiments.
              </li>
            </ol>
          </div>
        </section>

        {KEYLESS ? (
          <div className="keyblock keyblock--demo">
            <span className="keyblock__eyebrow">Live demo</span>
            <p className="keyblock__hint">
              This build runs keyless: audits route through a shared server-side
              key, so you can run one without providing your own API key. Pick
              an example or paste a flow, then Run audit.
            </p>
          </div>
        ) : apiKey && !editingKey ? (
          <div className="keyblock keyblock--set">
            <div className="keyblock__set-text">
              <span className="keyblock__eyebrow">Anthropic API key</span>
              <span className="keyblock__status">Saved in this browser</span>
            </div>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => setEditingKey(true)}
            >
              Change key
            </button>
          </div>
        ) : (
          <div className="keyblock">
            <label className="keyblock__eyebrow" htmlFor="apiKey">
              Anthropic API key
            </label>
            <input
              id="apiKey"
              className="field__input"
              type="password"
              value={apiKey}
              onChange={(e) => handleKeyChange(e.target.value)}
              onBlur={() => apiKey.trim() && setEditingKey(false)}
              placeholder="sk-ant-..."
              autoComplete="off"
              spellCheck="false"
            />
            <p className="keyblock__hint">
              Stored only in your browser. It is never committed and only goes to
              the Anthropic API.
            </p>
          </div>
        )}

        <form className="panel" onSubmit={handleSubmit}>
          <div className="field">
            <label className="field__label" htmlFor="description">
              Describe the onboarding flow (required)
            </label>
            <p className="field__hint">
              Describe the flow step by step, ideally as a numbered list. The
              output is only as good as the input you provide.
            </p>
            <textarea
              id="description"
              className="field__textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={'1. The user lands on...\n2. They...\n3. They reach the first value...'}
              rows={12}
            />
          </div>

          <div className="field">
            <span className="field__label">Screenshots (optional)</span>
            <p className="field__hint">
              Add up to {MAX_SCREENSHOTS} screenshots, labeled or numbered by
              step.
            </p>
            <div className="upload">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
              >
                Add screenshots
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="upload__input"
                onChange={(e) => {
                  handleFiles(e.target.files)
                  e.target.value = ''
                }}
              />
              <span className="upload__count">
                {images.length > 0 ? `${images.length} added` : ''}
              </span>
            </div>
            {images.length > 0 && (
              <ul className="thumbs">
                {images.map((img, i) => (
                  <li key={i} className="thumb">
                    <img
                      src={`data:${img.mediaType};base64,${img.base64}`}
                      alt={img.name || `Screenshot ${i + 1}`}
                    />
                    <button
                      type="button"
                      className="thumb__remove"
                      onClick={() => removeImage(i)}
                      aria-label={`Remove ${img.name || 'screenshot'}`}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button type="submit" className="btn btn--primary" disabled={loading}>
            {loading ? 'Running...' : 'Run audit'}
          </button>

          <div className="examples">
            <span className="examples__label">
              Or pick an example to load it, then Run audit
            </span>
            <div className="examples__groups">
              {EXAMPLE_GROUPS.map((g) => {
                const items = EXAMPLES.filter((ex) => ex.group === g.label)
                if (items.length === 0) return null
                return (
                  <div key={g.label} className="examples__group">
                    <div className="examples__group-head">
                      <span className="examples__group-label">{g.label}</span>
                      {g.caption && (
                        <span className="examples__group-caption">{g.caption}</span>
                      )}
                    </div>
                    <div className="examples__row">
                      {items.map((ex) => (
                        <button
                          key={ex.id}
                          type="button"
                          className="btn btn--example"
                          onClick={() => previewExample(ex)}
                          disabled={loading}
                          title={ex.description}
                        >
                          {ex.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </form>

        <div className="output">
          {error && (
            <div className="alert" role="alert">
              {error}
            </div>
          )}

          {!loading && result && (
            <ResultCards
              final={result.final}
              critique={result.critique}
              reconciled={result.reconciled}
              degraded={result.degraded}
              degradedReason={result.degradedReason}
              coherence={coherenceFlags(result.final)}
            />
          )}

        </div>
      </main>

      <footer className="footer">
        <p>
          {KEYLESS
            ? 'Live demo: audits route through a shared server-side key. Clone the repo to run it with your own key and no proxy.'
            : 'Runs in your browser. No backend, no data stored beyond your key.'}
        </p>
      </footer>
    </div>
  )
}
