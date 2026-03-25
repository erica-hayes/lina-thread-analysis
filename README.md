# lina-thread-analysis

Deterministic, high-performance Reddit thread analysis engine for:

- tone shifts
- intent patterns
- escalation
- conversational risk

This codebase is backend-only and intentionally avoids sending full threads to LLMs.

## Stack

- TypeScript
- Node.js
- npm

## Pipeline

1. Extract OP context (title/body) and classify thread context
2. Parse raw Reddit JSON into normalized comments
3. Build parent/child comment tree with depth and parent references
4. Run Stage 1 heuristic scoring across all comments
5. Classify tone, intent, and nuance for all comments using signals and context
6. Extract conversational chains from reply paths and interaction pairs
7. Analyze chain dynamics for escalation and interaction type
8. Aggregate context + comment signals + chain dynamics into thread summary

## Layers

1. Thread context: what kind of conversation this is
2. Comment signals: which individual comments carry risk signals
3. Chain dynamics: how users interact over time
4. Aggregation: overall thread risk and user behavior profile

## Structure

```
src/
	ingestion/
		redditParser.ts
	graph/
		buildCommentTree.ts
		types.ts
	features/
		heuristicScorer.ts
		signalTypes.ts
		signalRules.ts
		detectSignals.ts
		classifyTone.ts
		classifyIntent.ts
		classifyNuance.ts
	analysis/
		stage1.ts
	aggregation/
		escalationDetector.ts
		roleDetector.ts
		threadSummary.ts
	core/
		analyzeThread.ts
	types/
		index.ts
	utils/
		helpers.ts
	test/
		mockRedditJson.ts
		runAnalyzeThread.ts
```

## Scripts

- `npm run build` compile TypeScript
- `npm run lint` run ESLint
- `npm run test:basic` run the example analysis pipeline

## Debug mode

`analyzeThread(data, { debug: true })` includes:

- per-comment scoring breakdown
- detected chains
- chain escalation calculations