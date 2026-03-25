/**
 * Quick diagnostic to see what signals are being detected
 */

import { analyzeThread } from "../core/analyzeThread";
import { nuanceTestThreads } from "./nuanceTestData";

const threadData = nuanceTestThreads["passive-aggressive-dismissal"];
const result = analyzeThread(threadData);

console.log("\n=== PASSIVE-AGGRESSIVE-DISMISSAL SCENARIO ===\n");

for (const comment of result.comments) {
  console.log(`Comment ${comment.id}: "${comment.signals.length} signals detected"`);
  console.log(`  Text snippet: "${threadData[0].data.children.find((c: any) => c.data.id === comment.id)?.data.body.substring(0, 60)}"`);
  console.log(`  Risk Level: ${comment.riskLevel}`);
  console.log(`  Tone: ${comment.tone}, Nuance: ${comment.nuance}, Intent: ${comment.intent}`);
  console.log(`  Detected Signals:`);
  
  if (comment.detectedSignals.length === 0) {
    console.log(`    (NONE)`);
  } else {
    for (const signal of comment.detectedSignals) {
      console.log(`    - ${signal.ruleName} (${signal.category}/${signal.family}) risk=${signal.riskContribution}`);
    }
  }
  console.log("");
}

console.log("\n=== EXPECTED vs ACTUAL ===\n");
console.log("c1 should have: passive_aggression/snark");
console.log("c2 should have: hostility/invalidation");
console.log("c3 should have: passive_aggression/snark");
