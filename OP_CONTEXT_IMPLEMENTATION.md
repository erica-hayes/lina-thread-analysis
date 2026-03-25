# OP Context Integration - Technical Implementation Plan

## Problem Statement
Comments that dismiss, invalidate, or minimize the OP's concerns in sensitive thread contexts (trauma, abuse, mental health, boundary violations) are not receiving appropriately elevated risk scores.

## Current Behavior
```typescript
// Thread context is analyzed:
const context = analyzeThreadContext(op.title, op.body);
// { topic: "trauma_safety", sensitivity: 0.94, baselineRisk: 0.78 }

// But comments are scored WITHOUT this context:
const score = scoreCommentHeuristic({
  body: comment.body,
  depth: comment.depth,
  authorActivityCount: activity
});
// No reference to thread topic, sensitivity, or the OP's situation
```

## Required Changes

### 1. Pass Context Through Pipeline

**File**: `src/analysis/stage1.ts`

```typescript
export function runStage1(tree: CommentTree, context: ThreadContext): Stage1Result {
  const authorCommentCount = new Map<string, number>();

  for (const node of tree.byId.values()) {
    authorCommentCount.set(node.author, (authorCommentCount.get(node.author) ?? 0) + 1);
  }

  const scored: Stage1ScoredComment[] = [];
  const scoreByCommentId = new Map<string, Stage1ScoredComment>();

  for (const node of tree.byId.values()) {
    const analysis = scoreCommentHeuristic({
      body: node.body,
      depth: node.depth,
      authorActivityCount: authorCommentCount.get(node.author) ?? 1,
      threadContext: context  // NEW
    });
    // ... rest of function
  }
}
```

**File**: `src/features/heuristicScorer.ts`

```typescript
export interface HeuristicInput {
  body: string;
  depth: number;
  authorActivityCount: number;
  threadContext?: ThreadContext;  // NEW - optional to avoid breaking changes
}

export function scoreCommentHeuristic(input: HeuristicInput): HeuristicScore {
  let score = BASE_SCORE;
  // ... existing scoring logic ...

  // NEW: Context-aware risk adjustment
  if (input.threadContext) {
    const contextAdjustment = applyContextRiskAdjustment(
      lowerBody,
      detectedSignals,
      input.threadContext
    );
    score += contextAdjustment;
    if (contextAdjustment > 0) {
      flags.push("context-elevated-risk");
    }
  }

  // ... rest of function
}
```

### 2. Context Risk Adjustment Function

**File**: `src/features/heuristicScorer.ts` (add new function)

```typescript
interface ThreadContext {
  topic: string;
  sensitivity: number;
  baselineRisk: number;
}

function applyContextRiskAdjustment(
  commentText: string,
  signals: DetectedSignal[],
  context: ThreadContext
): number {
  let adjustment = 0;

  // High sensitivity topics (trauma, mental health, abuse)
  const isHighSensitivity = context.sensitivity >= 0.85;

  // Invalidation signals in sensitive contexts
  const hasInvalidation = signals.some(
    (s) => s.family === "invalidation" || s.category === "passive_aggression"
  );

  if (isHighSensitivity && hasInvalidation) {
    adjustment += 3.5; // Significant boost
    // "You're overreacting" in trauma thread → critical
  }

  // Dismissive language in sensitive contexts
  const dismissivePatterns = [
    /\b(just|simply|only|all you have to do)\b/gi,
    /\b(everyone|lots of people|we all)\b/gi,
    /\b(not that bad|could be worse|at least)\b/gi,
    /\b(get over|move on|let it go)\b/gi
  ];

  if (isHighSensitivity) {
    for (const pattern of dismissivePatterns) {
      if (pattern.test(commentText)) {
        adjustment += 2.0;
        break; // Don't stack multiple dismissive patterns
      }
    }
  }

  // Boundary minimization in relationship/privacy contexts
  const isBoundaryContext = ["relationship_boundary", "privacy_violation", "trauma_safety"].includes(
    context.topic
  );

  const boundaryMinimizingPatterns = [
    /\b(he'?s just|she'?s just|they'?re just|probably just)\b/gi,
    /\b(that'?s normal|that'?s how|that'?s what [a-z]+ do)\b/gi,
    /\b(you'?re lucky|at least they|could be worse)\b/gi
  ];

  if (isBoundaryContext) {
    for (const pattern of boundaryMinimizingPatterns) {
      if (pattern.test(commentText)) {
        adjustment += 2.5;
        break;
      }
    }
  }

  // Victim blaming in trauma contexts
  if (context.topic === "trauma_safety") {
    const victimBlamingPatterns = [
      /\b(why did(n'?t)? you|why didn'?t you|you should have)\b/gi,
      /\b(if you really|if you actually|if it was that bad)\b/gi,
      /\b(waited so long|took so long|why now)\b/gi
    ];

    for (const pattern of victimBlamingPatterns) {
      if (pattern.test(commentText)) {
        adjustment += 4.0; // Major risk increase
        break;
      }
    }
  }

  // Scale adjustment by thread sensitivity
  adjustment = adjustment * context.sensitivity;

  return adjustment;
}
```

### 3. Update Classification Functions

**File**: `src/features/classifyTone.ts`, similar changes to Intent and Nuance

```typescript
export function classifyToneWithConfidence(
  text: string,
  signals: string[],
  riskLevel: RiskBand,
  threadContext?: ThreadContext  // NEW optional parameter
): ToneClassification {
  const lowerText = (text ?? "").toLowerCase();
  const normalized = signals.map((item) => item.toLowerCase());

  // ... existing logic ...

  // NEW: Context-aware adjustments
  if (threadContext && threadContext.sensitivity >= 0.85) {
    // In highly sensitive contexts, dismissive language should be negative
    const hasDismissive = /\b(just|simply|only|get over|move on)\b/.test(lowerText);
    if (hasDismissive && !hasPositive) {
      return {
        label: "negative",
        subLabels: ["critical"],
        confidence: round3(0.62 + signalDensity)
      };
    }
  }

  // ... rest of existing logic ...
}
```

### 4. Update Core Pipeline

**File**: `src/core/analyzeThread.ts`

```typescript
export function analyzeThread(
  rawRedditJson: unknown,
  options: AnalyzeThreadOptions = {}
): AnalyzeThreadResult {
  const op = extractOriginalPostContext(rawRedditJson);
  const context = analyzeThreadContext(op.title, op.body);

  const parsedComments = parseRedditJson(rawRedditJson);
  const tree = buildCommentTree(parsedComments);

  const stage1 = runStage1(tree, context);  // CHANGED: pass context

  const chains = extractChains(tree);
  const chainAnalyses = analyzeChains(chains, stage1.scoreByCommentId);

  const userRoles = detectUserRoles(chains, chainAnalyses, stage1.scoreByCommentId, tree.byId);
  const summary = summarizeThread(context, tree, chains, chainAnalyses, stage1.scored, userRoles);

  const escalationPoints = summary.escalationPoints;

  const analyzedComments: AnalyzedComment[] = stage1.scored.map((score) => {
    const node = tree.byId.get(score.commentId);
    const riskLevel = scoreToRiskLevel(score.score);
    const signalTags = Array.from(
      new Set([
        ...score.flags,
        ...score.detectedSignals.map((item) => item.category),
        ...score.detectedSignals.map((item) => item.family),
        ...score.detectedSignals.map((item) => item.ruleName)
      ])
    );
    const signalEvidence = score.detectedSignals
      .slice()
      .sort((a, b) => b.riskContribution - a.riskContribution)
      .slice(0, 3)
      .map((item) => `${item.matchedText} (${item.family})`);

    // CHANGED: pass context to classifiers
    const toneResult = classifyToneWithConfidence(node?.body ?? "", signalTags, riskLevel, context);
    const nuanceResult = classifyNuanceWithConfidence(node?.body ?? "", signalTags, riskLevel, context);
    const intentResult = classifyIntentWithConfidence(node?.body ?? "", signalTags, riskLevel, context);

    // ... rest of function
  });
  
  // ... rest of function
}
```

## Testing Strategy

### Test Case 1: Trauma Invalidation
```typescript
Thread: "When I was 12, my uncle molested me"
Comment: "Why did you wait so long to say something?"

Expected:
- Before: risk=low, nuance=neutral, intent=curious
- After: risk=high/critical, nuance=invalidating, intent=adversarial
```

### Test Case 2: Boundary Minimization
```typescript
Thread: "My partner tracks my location without asking"
Comment: "They're just worried about you. That's normal."

Expected:
- Before: risk=low, nuance=neutral, intent=neutral
- After: risk=moderate, nuance=dismissive, intent=neutral
```

### Test Case 3: Mental Health Dismissal
```typescript
Thread: "Struggling with depression, can't get out of bed"
Comment: "Just push through it. We all have bad days."

Expected:
- Before: risk=low, nuance=neutral, intent=supportive
- After: risk=low, nuance=invalidating, intent=supportive
```

## Implementation Checklist

- [ ] Update `HeuristicInput` interface to include `threadContext`
- [ ] Create `applyContextRiskAdjustment()` function
- [ ] Update `scoreCommentHeuristic()` to call context adjustment
- [ ] Update `runStage1()` signature to accept context
- [ ] Update classification function signatures (tone, intent, nuance)
- [ ] Add context-aware logic to each classifier
- [ ] Update `analyzeThread()` to pass context through pipeline
- [ ] Add test cases to `nuanceTestScenarios.ts`
- [ ] Run `npm run test:nuance` and validate improvements
- [ ] Update types if needed (ThreadContext export, etc.)

## Rollout Strategy

### Phase 1: Scoring Only
1. Add context to heuristic scorer
2. Test that risk scores increase appropriately
3. Don't change classifiers yet

### Phase 2: Classification
4. Add context to tone/intent/nuance classifiers
5. Test classification improvements
6. Adjust thresholds if needed

### Phase 3: Refinement
7. Tune context adjustment weights based on real data
8. Add more contextual patterns
9. Consider adding context-specific nuance labels

## Potential Issues

1. **Over-correction**: Context adjustment might be too aggressive
   - Mitigation: Start with conservative multipliers, tune based on testing

2. **False positives**: Well-intentioned advice might be flagged
   - Mitigation: Look for invalidation signals first, then apply context

3. **Type breaking changes**: Adding required parameter breaks existing code
   - Mitigation: Make context optional, gradual rollout

4. **Performance**: More pattern matching per comment
   - Mitigation: Minimal impact, patterns are simple regex

## Success Metrics

- Reduction in "neutral" classifications for dismissive comments in sensitive threads
- Increase in appropriate risk elevation for invalidation in trauma contexts
- Test suite pass rate improvement (target: >80% on nuance tests)
- No false positive increase in non-sensitive threads
