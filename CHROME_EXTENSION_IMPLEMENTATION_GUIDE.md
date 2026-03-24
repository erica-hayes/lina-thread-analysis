# Lina Thread Analysis Integration Guide (Chrome Extension)

## Goal
Integrate lina-thread-analysis into a Chrome extension codebase so the extension can analyze Reddit-like thread JSON and return:

- Tone (primary + sub-labels)
- Intent (primary + sub-labels)
- Nuance (primary + secondary)
- Risk outputs and thread summary

This guide is written for a coding agent to execute safely and consistently.

## Package Artifact
This library is consumed as a local tarball.

Example artifact name:

- lina-thread-analysis-0.1.0.tgz

## Install In Chrome Extension Project
From the Chrome extension project root:

```bash
npm install /absolute/path/to/lina-thread-analysis-0.1.0.tgz
```

Verify install:

```bash
npm ls lina-thread-analysis
```

## Import Strategy
Use one of the following based on extension build setup.

### Option A: CommonJS-compatible

```js
const { analyzeThread } = require("lina-thread-analysis");
```

### Option B: ESM/bundler-safe direct path

```js
import { analyzeThread } from "lina-thread-analysis/dist/core/analyzeThread";
```

If one import style fails in your extension tooling, switch to the other.

## Recommended Integration Architecture
Use a service module plus message bridge.

1. Add analyzer service module in extension source.
2. Call analyzer in background/service-worker context, not content script when possible.
3. Expose a typed message action for UI/content script calls.

### Example Analyzer Service Module

```ts
// src/services/threadAnalyzer.ts
import { analyzeThread } from "lina-thread-analysis/dist/core/analyzeThread";

export function runThreadAnalysis(rawThreadJson: unknown) {
  return analyzeThread(rawThreadJson, { debug: false });
}
```

### Example Message Handler In Background

```ts
// src/background/messages.ts
import { runThreadAnalysis } from "../services/threadAnalyzer";

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "ANALYZE_THREAD") {
    return;
  }

  try {
    const result = runThreadAnalysis(message.payload);
    sendResponse({ ok: true, result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    sendResponse({ ok: false, error: msg });
  }

  return true;
});
```

### Example Caller From UI Or Content Script

```ts
chrome.runtime.sendMessage(
  { type: "ANALYZE_THREAD", payload: threadJson },
  (response) => {
    if (!response?.ok) {
      console.error("analysis failed", response?.error);
      return;
    }

    const analysis = response.result;
    console.log("summary", analysis.summary);
    console.log("comments", analysis.comments);
  }
);
```

## Expected Output Fields To Use In UI
For each analyzed comment:

- tone
- toneSubLabels
- intent
- intentSubLabels
- nuance
- nuanceSecondary
- riskLevel
- toneConfidence
- intentConfidence
- nuanceConfidence
- signals
- signalEvidence

For thread-level rendering:

- summary
- uiIndex
- quickScan

## Guardrails For Correct Usage
Do not merge channels in UI logic.

1. Tone = emotional sound/feel.
2. Intent = communicative goal.
3. Nuance = latent behavioral subtext.

Allowed presentation pattern:

- Combined display text like Negative - passive_aggressive for readability.

Not allowed as data model:

- Creating a new blended classifier field that merges tone and nuance.

## Data Contract Recommendation In Extension
Create local interfaces in the extension to enforce usage.

```ts
type Tone = "positive" | "negative" | "neutral";

type Intent = "supportive" | "critical" | "curious" | "adversarial" | "neutral";

type Nuance =
  | "neutral"
  | "supportive"
  | "passive_aggressive"
  | "guilt_tripping"
  | "backhanded_compliment"
  | "polite_masking"
  | "dismissive"
  | "invalidating"
  | "possessive"
  | "coercive"
  | "gaslighting"
  | "sarcastic"
  | "love_bombing"
  | "stalking"
  | "boundary_violation"
  | "betrayal"
  | "comparative"
  | "derogatory"
  | "hurt"
  | "manipulative"
  | "probing"
  | "deflective"
  | "self_effacing"
  | "passive_compliance"
  | "sarcastic_praise"
  | "conflicted_emotion";
```

## Performance Notes
For large threads:

1. Analyze in background/service-worker.
2. Cache results by thread id + timestamp hash.
3. Debounce repeated analysis triggers.
4. Avoid rerendering the entire UI on small filter changes.

## Security And Privacy Notes
1. Keep analysis local; do not transmit raw user thread text unless explicitly required.
2. If persisting analysis, store only needed fields and prune raw payload where possible.
3. Validate incoming payload shape before analysis call.

## Update Workflow For New Analyzer Versions
When analyzer code changes:

1. In lina-thread-analysis repo:

```bash
npm run build
npm pack
```

2. In chrome extension repo:

```bash
npm install /absolute/path/to/new/lina-thread-analysis-x.y.z.tgz
```

3. Rebuild extension and run smoke tests.

## Smoke Test Checklist
1. Extension can import analyzeThread without bundling error.
2. ANALYZE_THREAD message returns success.
3. Summary object is present.
4. Comment entries include tone, intent, nuance channels separately.
5. UI can filter by tone, intent, and nuance independently.
6. No overlap field is reintroduced in extension mapping layer.

## Suggested Agent Prompt For Extension Repo
Use this prompt inside your Chrome extension workspace:

Implement lina-thread-analysis integration using a background message handler and a threadAnalyzer service module. Install from local tarball dependency already present in package.json. Add strict types for tone, intent, and nuance channels and keep them separate in UI state. Add a small analyzer panel showing summary metrics plus per-comment tone/intent/nuance chips. Include error handling and a basic smoke test command.
