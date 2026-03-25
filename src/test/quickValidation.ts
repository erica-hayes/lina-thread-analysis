/**
 * Quick validation test - verifies key fixes through the full pipeline
 * Tests the three most critical failing cases
 */

import { analyzeThread } from "../core/analyzeThread";

export function quickValidation() {
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║           QUICK VALIDATION - KEY FIXES                     ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  const testCases = [
    {
      id: "t1",
      text: "I'm so proud of you for leaving. That took incredible strength 💪 You're going to heal. Please reach out to a crisis line if you need support.",
      expectedTone: "positive",
      expectedIntent: "supportive",
      context: "trauma_safety (high risk)"
    },
    {
      id: "m1",
      text: "Thank you for sharing your story. You're not alone 💙 Please keep reaching out. National Suicide Prevention Lifeline: 988",
      expectedTone: "positive",
      expectedIntent: "supportive",
      context: "mental_health (high risk)"
    },
    {
      id: "par1",
      text: "You're doing great! 👏 2 hours is actually reasonable. Your boundaries are healthy and you should feel good about that 💚",
      expectedTone: "positive",
      expectedIntent: "supportive",
      context: "parenting (low risk)"
    }
  ];

  const passMarkers: boolean[] = [];

  for (const test of testCases) {
    const mockJson = {
      kind: "Listing",
      data: {
        title: test.context,
        selftext: "Validation context",
        children: [
          {
            kind: "t1",
            data: {
              id: test.id,
              parent_id: "t3_post",
              author: "validator",
              body: test.text,
              created_utc: 1710000000,
              replies: ""
            }
          }
        ]
      }
    };
    const analysis = analyzeThread(mockJson);
    const actual = analysis.comments.find((comment) => comment.id === test.id);

    if (!actual) {
      passMarkers.push(false);
      console.log(`❌ [${test.id}] ${test.context}`);
      console.log(`   Text: "${test.text.substring(0, 80)}..."`);
      console.log("   Error: analyzed comment was not returned by the pipeline\n");
      continue;
    }

    const tonePasses = actual.tone === test.expectedTone;
    const intentPasses = actual.intent === test.expectedIntent;

    const passed = tonePasses && intentPasses;
    passMarkers.push(passed);

    console.log(`${passed ? "✅" : "❌"} [${test.id}] ${test.context}`);
    console.log(`   Text: "${test.text.substring(0, 80)}..."`);
    console.log(`   Tone:   ${test.expectedTone.padEnd(12)} → ${actual.tone.padEnd(12)} ${tonePasses ? "✓" : "✗"}`);
    console.log(`   Intent: ${test.expectedIntent.padEnd(12)} → ${actual.intent.padEnd(12)} ${intentPasses ? "✓" : "✗"}\n`);
  }

  const passCount = passMarkers.filter(p => p).length;
  const total = passMarkers.length;

  console.log(`╔════════════════════════════════════════════════════════════╗`);
  console.log(`║                   VALIDATION SUMMARY                       ║`);
  console.log(`╚════════════════════════════════════════════════════════════╝`);
  console.log(`Critical Cases: ${passCount}/${total} passing`);

  if (passCount === total) {
    console.log(`\n🎉 All critical fixes verified! Master test should improve significantly.`);
  } else {
    console.log(`\n⚠️  Some fixes need more work. Investigate remaining failures.`);
  }
}

// Run if executed directly
if (require.main === module) {
  quickValidation();
}
