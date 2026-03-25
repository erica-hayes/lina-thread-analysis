# Gap Analysis and Improvement Roadmap

## Summary of Changes Made

### 1. Removed Stage 2 Analysis
- Deleted `src/analysis/stage2.ts` (was a stub)
- Removed `DeepCommentAnalysis` interface from types
- Removed `deepAnalysis` field from `HighRiskComment`
- Updated pipeline documentation in README
- Streamlined `analyzeThread` to remove stage2 processing

**Rationale**: Stage 2 was never implemented beyond a stub. All meaningful analysis happens in Stage 1 + classification layer.

---

## Identified Gaps

### 1. **OP Context Not Influencing Comment Risk Assessment**

**Problem**: Thread context (OP title/body) is analyzed but not used to adjust risk levels for individual comments.

**Current State**:
- Thread context is classified (trauma_safety, relationship_boundary, etc.)
- ThreadTopicRisk is calculated at summary level
- Comments are scored independently without considering OP context

**Expected Behavior**:
- Comments that invalidate/dismiss OP's concerns should have elevated risk in sensitive threads
- Example: "You're overreacting" in a trauma disclosure thread should be high/critical risk
- Example: Boundary violations minimized in stalking/abuse context should elevate risk

**Test Case**: `op-context-carryover` scenario
- Thread: Privacy violation (tracking location)
- Comment: "He's just worried about you. Parents do that."
- **Expected**: moderate risk (minimizing boundary violation)
- **Likely Getting**: low risk (marked as neutral supportive)

**Proposed Fix**:
1. Pass thread context to classification functions
2. Add context-aware risk multipliers in `heuristicScorer.ts`
3. Create context + signal interaction rules

---

### 2. **Too Many "Neutral" Nuance Classifications**

**Problem**: Subtle behavioral patterns default to "neutral" instead of specific nuance labels.

**Current State**:
- Nuance classifier has good coverage for explicit patterns
- Falls back to "neutral" when no strong signal matches
- Missing mid-range patterns between obvious and neutral

**Gaps in Signal Rules**:
- Dismissiveness without explicit passive-aggression markers
- Subtle invalidation ("just try harder", "everyone goes through that")
- Minimizing serious topics ("it's not that bad", "could be worse")
- Comparative statements that undermine ("others have it worse")
- Deflection patterns ("let's not make this about X")

**Test Cases**:
- `mixed-support-criticism`: Support + dismissiveness
- `op-context-carryover`: Boundary minimization
- `passive-aggressive-dismissal`: "If you say so" patterns (currently detected, but edge cases)

**Proposed Fix**:
1. Add "dismissive" signal rule for minimizing phrases
2. Add "invalidating" as distinct from gaslighting (lighter version)
3. Enhance comparative language detection
4. Lower confidence threshold for nuance classification OR add "uncertain" label

---

### 3. **Missing Signal Patterns**

**Currently Missing from signalRules.ts**:

#### Minimizing/Dismissiveness
- "it's not that bad", "could be worse", "at least", "just"
- "everyone goes through", "this is normal", "that's just how it is"
- "you'll get over it", "it'll pass", "give it time"

#### Comparative Invalidation  
- "others have it worse", "some people", "compared to"
- "first world problems", "must be nice to worry about"

#### Subtle Control
- "I just want what's best for you" (in controlling context)
- "I'm only trying to help" (when unwanted)
- "Don't be like that" (tone policing)

#### Emotional Manipulation (beyond gaslighting)
- "You're going to make me [do X]"
- "After everything I've done for you"
- "You obviously don't care about me"
- Love bombing patterns ("you're so perfect", "I can't live without you")

#### Self-Harm References
- Direct and indirect self-harm language
- Suicidal ideation markers
- Should trigger critical risk regardless of other signals

**Proposed Fix**: Add rule sets for each category above

---

### 4. **Confidence Threshold Gaps**

**Problem**: Tone and Intent have confidence thresholds (0.55, 0.58) but Nuance doesn't.

**Current State**:
- `toneLabel` can be null if confidence < 0.55
- `intentLabel` can be null if confidence < 0.58  
- `nuance` is always returned, even at low confidence

**Inconsistency**: This makes nuance appear more certain than it actually is.

**Proposed Fix**:
1. Add `nuanceLabel` field (nullable) with threshold ~0.60
2. Add `nuanceConfidence` to output (already tracked internally)
3. OR keep nuance always present but add confidence to UI for transparency

---

### 5. **Parent Comment Context Missing**

**Problem**: Comments are analyzed in isolation, not considering parent/preceding context.

**Example Scenario**:
```
Parent: "I'm struggling with anxiety attacks"
Reply: "Just breathe. Everyone gets stressed."
```

**Current**: Reply analyzed independently → likely "supportive" or "neutral"
**Expected**: Reply analyzed in context → "dismissive" (minimizing mental health)

**Proposed Fix**:
1. Pass parent comment to classification functions
2. Add context modifiers based on parent tone/topic
3. Detect pattern shifts (support → dismissal, question → deflection)

---

### 6. **Chain Context Not Fed Back to Comment Analysis**

**Problem**: Chain escalation detection happens AFTER comment classification.

**Opportunity**: Use chain dynamics to refine comment risk assessment.

**Current Flow**:
1. All comments classified independently
2. Chains extracted and analyzed
3. Summary aggregates chain data

**Proposed Flow**:
1. All comments scored (Stage 1)
2. Chains extracted and analyzed
3. **Re-score peak comments with chain context** ← NEW
4. Refine classifications for escalation points

---

## Priority Order for Implementation

### Phase 1: Foundation (High Impact, Low Risk)
1. **Add Missing Signal Rules** - Expand signalRules.ts with patterns above
2. **Add Nuance Confidence Threshold** - Make it consistent with tone/intent
3. **Document Test Results** - Run `npm run test:nuance` and document failures

### Phase 2: Context Awareness (High Impact, Medium Risk)
4. **Thread Context → Comment Risk Adjustment** - Pass context through pipeline
5. **Parent Comment Context** - Pass parent to classifiers
6. **OP Context Integration** - Adjust risk based on topic sensitivity

### Phase 3: Refinement (Medium Impact, Higher Risk)
7. **Chain Context Feedback** - Use escalation data to refine classifications
8. **Multi-Label Support** - Handle mixed signals better (supportive + dismissive)
9. **Cultural/Contextual Variations** - Handle regional language differences

---

## Testing Strategy

### Current Test Files
- `src/test/mockRedditJson.ts` - Basic format test
- `src/test/nuanceTestScenarios.ts` - Expected outcomes for edge cases
- `src/test/nuanceTestData.ts` - Mock Reddit JSON for scenarios
- `src/test/validateNuanceDetection.ts` - Validation script

### How to Test
```bash
npm run test:nuance
```

This will:
- Run analysis on all test scenarios
- Compare actual vs expected signals
- Report pass/fail for each comment
- Highlight missing signals and classification mismatches

### Next Steps
1. Run initial test to establish baseline
2. Implement Phase 1 improvements
3. Re-run tests to measure improvement
4. Iterate based on results

---

## Notes on "Neutral" Problem

The "too many neutrals" issue stems from:
1. Conservative fallback behavior (default to neutral when uncertain)
2. Missing mid-tier signal patterns (between obvious hostility and support)
3. No context weighting (same phrase means different things in different threads)
4. Single-label constraint (can't express "supportive but dismissive")

**Philosophy Question**: Should we:
- **Option A**: Add more granular labels and reduce neutrals?
- **Option B**: Keep neutrals but add confidence scores to show uncertainty?
- **Option C**: Add secondary/sub-labels to capture complexity?

**Current implementation uses Option C** - primary label + sub-labels. This is good! But we need:
- More aggressive primary label assignment (less neutral fallback)
- Better sub-label coverage for nuance
- Context-aware risk adjustment even when label is neutral
