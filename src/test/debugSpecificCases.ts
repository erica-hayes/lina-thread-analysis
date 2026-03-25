/**
 * Debug specific failing test cases
 */

import { ToneSubLabel } from "../types";
import { scoreCommentHeuristic } from "../features/heuristicScorer";
import { classifyToneWithConfidence } from "../features/classifyTone";
import { classifyIntentWithConfidence } from "../features/classifyIntent";

interface DebugCase {
  name: string;
  text: string;
  expectedIntent?: string;
  expectedTone?: string;
  expectedToneSubLabel?: ToneSubLabel;
}

const cases: DebugCase[] = [
  {
    name: "Passive-agg c1 (expect neutral intent)",
    text: "Well, maybe they're just trying to help. If you say so.",
    expectedIntent: "neutral"
  },
  {
    name: "Emotional anxiety (expect supportive intent + anxious sublabel)",
    text: "I'm so scared about this too. I'm panicking every day and can't focus. What if something happens? I'm so worried.",
    expectedIntent: "supportive",
    expectedToneSubLabel: "anxious"
  },
  {
    name: "Mixed support-criticism (expect supportive intent + positive tone)",
    text: "I'm so sorry you're going through this. Have you tried just exercising more? That usually helps.",
    expectedIntent: "supportive",
    expectedTone: "positive"
  }
];

console.log("=== SPECIFIC CASE DIAGNOSTICS ===\n");

for (const testCase of cases) {
  console.log(`\n${testCase.name}`);
  console.log(`Text: "${testCase.text}"`);
  
  const heuristic = scoreCommentHeuristic({
    body: testCase.text,
    depth: 0,
    authorActivityCount: 1
  });
  
  console.log(`\nScore: ${heuristic.score.toFixed(2)}`);
  console.log(`Signals (${heuristic.detectedSignals.length}):`);
  for (const sig of heuristic.detectedSignals) {
    console.log(`  - ${sig.ruleName} (${sig.category}/${sig.family}) contribution=${sig.riskContribution}`);
  }
  
  const signalTags = [
    ...heuristic.flags,
    ...heuristic.detectedSignals.map(s => s.category),
    ...heuristic.detectedSignals.map(s => s.family),
    ...heuristic.detectedSignals.map(s => s.ruleName)
  ];
  
  let riskLevel: "none" | "low" | "moderate" | "high" = "none";
  if (heuristic.score >= 6) riskLevel = "high";
  else if (heuristic.score >= 3.5) riskLevel = "moderate";
  else if (heuristic.score >= 0.5) riskLevel = "low";
  
  const tone = classifyToneWithConfidence(testCase.text, signalTags, riskLevel);
  const intent = classifyIntentWithConfidence(testCase.text, signalTags, riskLevel);
  
  console.log(`\nClassification:`);
  console.log(`  Tone: ${tone.label} [${tone.subLabels.join(", ")}]`);
  console.log(`  Intent: ${intent.label} [${intent.subLabels.join(", ")}]`);
  console.log(`  Risk: ${riskLevel}`);
  
  console.log(`\nExpected vs Actual:`);
  if (testCase.expectedIntent) {
    console.log(`  Intent: expected "${testCase.expectedIntent}", got "${intent.label}" ${testCase.expectedIntent === intent.label ? "✓" : "✗"}`);
  }
  if (testCase.expectedTone) {
    console.log(`  Tone: expected "${testCase.expectedTone}", got "${tone.label}" ${testCase.expectedTone === tone.label ? "✓" : "✗"}`);
  }
  if (testCase.expectedToneSubLabel) {
    const hasSubLabel = tone.subLabels.includes(testCase.expectedToneSubLabel);
    console.log(`  Tone sublabel: expected "${testCase.expectedToneSubLabel}", got [${tone.subLabels.join(", ")}] ${hasSubLabel ? "✓" : "✗"}`);
  }
}
