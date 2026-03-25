# Test Validation Priorities

## Status After Risk Threshold Adjustments

### New Risk Bands (implemented):
- **none**: < 0.5
- **low**: >= 0.5 (was 1.5)  ← More sensitive
- **moderate**: >= 2.5 (was 6)  ← More sensitive
- **high**: >= 6 (was 10)  ← More sensitive
- **critical**: >= 10 (was 14)  ← More sensitive

### Risk Contribution Updates (implemented):
- gaslighting-invalidation: 1.8 → 2.2
- coercive-control-language: 2.5 → 3.5
- blame-shifting-language: 1.0 → 1.3
- victim-blaming-questions: 2.0 → 2.5

---

## Test Scenarios Analysis

### ✅ Should Pass Now (signal detection + adjusted thresholds)

1. **passive-aggressive-dismissal** (3 cases)
   - Single passive-aggressive (0.7) → "low" ✓
   - Multiple signals → "low" to "moderate" ✓
   - No context required

2. **mixed-support-criticism** c1 (1 case)
   - Low score → "low" with new threshold ✓
   - But still has classification issues (tone/nuance/intent)

### ⚠️ Partial Pass (needs classification fixes)

3. **gaslighting-with-care-concern** (2 cases)
   - c2: Passing (nuance=gaslighting, intent=supportive, risk=moderate) ✓
   - c1: Expected "moderate" risk, getting "low"
     - Needs score >= 2.5
     - Pattern fires but might need multiple matches

4. **blame-shifting-in-conflict** (2 cases)
   - "This is your fault. You made me..." → 2 matches × 1.3 = 2.6 = "moderate" ✓
   - "Look what you made me do. You started it." → 2 matches × 1.3 = 2.6 = "moderate" ✓
   - Should pass with new thresholds

5. **backhanded-compliments** (2 cases)
   - Signals fire correctly
   - **Issue**: Classification order problem
   - DEROGATORY_MARKERS checked before BACKHANDED_PATTERN
   - Need to fix classifyNuance precedence

6. **emotional-intensity-anxious** (1 case)
   - emotional-intensity-anxiety rule exists with correct patterns
   - **Issue**: Classification not recognizing signals properly
   - Should get tone sublabel "anxious" and intent "supportive"

### ❌ Requires OP Context Integration

7. **coercive-control-subtle** (2 cases)
   - c1: "Don't tell anyone..." → Expected "high", getting "low"
   - c2: "You're mine..." → Expected "critical", getting "moderate"
   - **Without context**: 2-3 signals × 3.5 = 7-10.5 → "high" to "critical"
   - **Should be closer** with new contributions
   - **With context**: Relationship abuse → +3 modifier = "high"/"critical" ✓

8. **trauma-disclosure-context** (2 cases)
   - Explicitly requires OP context
   - victim-blaming + trauma context → should be "high"/"critical"
   - Without context: getting "low"
   - With context: +4 modifier for trauma = much higher

9. **op-context-carryover** (2 cases)
   - c1: Expected "moderate", getting "low"
   - c2: Passing (nuance=neutral, supportive, none) ✓
   - Requires parent abuse context to elevate "He's just worried" from dismissive to dangerous

---

## Action Items

### High Priority (can fix without OP context):

1. **Fix classification precedence in classifyNuance.ts**
   - Move BACKHANDED_PATTERN check before DEROGATORY_MARKERS
   - Or add backhanded signals to bypass derogatory classification
   - Target: backhanded-compliments scenario

2. **Fix emotional intensity classification**
   - Verify emotional-intensity-anxiety signals are firing
   - Check why hasIntensitySignal isn't triggering "anxious" sublabel
   - Check intent classification for support-seeking patterns
   - Target: emotional-intensity-anxious scenario

3. **Run test:debug to diagnose exact signal firing**
   - See which signals match for each failing test
   - Verify score calculations
   - Identify gaps in pattern matching

### Medium Priority (OP context required):

4. **Implement OP context integration** (see OP_CONTEXT_IMPLEMENTATION.md)
   - Parse OP post for sensitive topics
   - Pass ThreadContext through pipeline
   - Elevate risk scores based on context
   - Target: trauma-disclosure, coercive-control, op-context-carryover scenarios

5. **Add parent comment context**
   - Check if replying to OP
   - Check parent comment sentiment
   - Adjust classification based on conversation flow

---

## Expected Pass Rate After Each Fix

| Stage | Scenarios Passing | Cases Passing | Pass Rate |
|-------|------------------|---------------|-----------|
| Current (threshold fix) | 1-2 / 9 | 3-5 / 18 | ~20-25% |
| + Classification fixes | 5-6 / 9 | 10-11 / 18 | ~55-60% |
| + OP context | 8-9 / 9 | 16-18 / 18 | ~90-100% |

---

## Notes

- **Signal detection is working** ✓ (verified by test:signals)
- **Risk thresholds adjusted** ✓ (should help 6-8 test cases)
- **Risk contributions increased** ✓ (coercive and gaslighting patterns)
- **Main remaining issues**: Classification logic and OP context
