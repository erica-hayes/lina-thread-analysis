/**
 * Debug failing test cases to see actual scores and signals
 */

import { scoreCommentHeuristic } from "../features/heuristicScorer";

const failingCases = [
  {
    name: "Passive-aggressive c1",
    text: "Well, maybe they're just trying to help. If you say so.",
    expectedRisk: "low"
  },
  {
    name: "Passive-aggressive c3",
    text: "Whatever makes you happy. Do what you want.",
    expectedRisk: "low"
  },
  {
    name: "Coercive control c1",
    text: "Don't tell anyone we talked about this, it's between us. You have to respond to me immediately.",
    expectedRisk: "high"
  },
  {
    name: "Coercive control c2",
    text: "You're mine and you can't ignore me. Answer me.",
    expectedRisk: "high"
  },
  {
    name: "Blame shifting c1",
    text: "This is your fault. You made me do this by nagging constantly.",
    expectedRisk: "moderate"
  },
  {
    name: "Trauma disclosure c1",
    text: "Why did you wait so long to say something? That doesn't make sense.",
    expectedRisk: "high"
  },
  {
    name: "Trauma disclosure c2",
    text: "Are you sure that's what happened? Kids misremember things.",
    expectedRisk: "high"
  }
];

console.log("=== FAILING TEST CASE ANALYSIS ===\n");

for (const test of failingCases) {
  console.log(`\n${test.name}`);
  console.log(`Text: "${test.text}"`);
  console.log(`Expected risk: ${test.expectedRisk}`);
  
  const result = scoreCommentHeuristic({
    body: test.text,
    depth: 0,
    authorActivityCount: 1
  });
  
  console.log(`Actual score: ${result.score.toFixed(2)}`);
  console.log(`Signals (${result.detectedSignals.length}):`);
  
  for (const signal of result.detectedSignals) {
    console.log(`  - ${signal.ruleName} (${signal.family}) risk=${signal.riskContribution} match="${signal.matchedText}"`);
  }
  
  // Show what risk level this would get
  let actualRisk = "none";
  if (result.score >= 6) actualRisk = "high";
  else if (result.score >= 3.5) actualRisk = "moderate";
  else if (result.score >= 0.5) actualRisk = "low";
  
  console.log(`Actual risk band: ${actualRisk}`);
  console.log(`Gap: Need ${test.expectedRisk} but got ${actualRisk}`);
}
