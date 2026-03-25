/**
 * Simple test to verify signal detection is working
 */

import { scoreCommentHeuristic } from "../features/heuristicScorer";

const testCases = [
  {
    text: "Well, maybe they're just trying to help. If you say so.",
    expectedSignal: "passive-aggressive-snark / snark"
  },
  {
    text: "I'm sorry but have you considered they might have a point? Maybe you're being too sensitive.",
    expectedSignal: "gaslighting-invalidation / invalidation"
  },
  {
    text: "Whatever makes you happy. Do what you want.",
    expectedSignal: "passive-aggressive-snark / snark"
  }
];

console.log("=== SIGNAL DETECTION TEST ===\n");

for (const test of testCases) {
  console.log(`Text: "${test.text}"`);
  console.log(`Expected: ${test.expectedSignal}`);
  
  const result = scoreCommentHeuristic({
    body: test.text,
    depth: 0,
    authorActivityCount: 1
  });
  
  console.log(`Score: ${result.score}`);
  console.log(`Detected ${result.detectedSignals.length} signals:`);
  
  if (result.detectedSignals.length === 0) {
    console.log(`  ❌ NO SIGNALS DETECTED`);
  } else {
    for (const signal of result.detectedSignals) {
      const match = signal.ruleName.includes("passive-aggressive") || signal.ruleName.includes("gaslighting") || signal.ruleName.includes("invalidation");
      console.log(`  ${match ? '✓' : ' '} ${signal.ruleName} (${signal.category}/${signal.family}) risk=${signal.riskContribution}`);
    }
  }
  console.log("");
}
