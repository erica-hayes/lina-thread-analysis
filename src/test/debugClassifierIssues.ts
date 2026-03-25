/**
 * Debug Classifier Issues
 * Traces specific failing cases through the full pipeline
 * to identify root causes of misclassification
 */

import { analyzeThread } from "../core/analyzeThread";

function debugComment(
  scenarioId: string,
  text: string,
  postTopic: string,
  category: string,
  expected: any
) {
  console.log(`\n╔════════════════════════════════════════════════════════════╗`);
  console.log(`║ ${scenarioId.padEnd(56)} ║`);
  console.log(`╚════════════════════════════════════════════════════════════╝`);

  const mockJson = {
    kind: "Listing",
    data: {
      title: postTopic,
      selftext: "Post body for context",
      children: [
        {
          kind: "t1",
          data: {
            id: "test_comment",
            parent_id: "t3_post",
            author: "test_author",
            body: text,
            created_utc: 1710000000,
            replies: ""
          }
        }
      ]
    }
  };

  const analysis = analyzeThread(mockJson);
  const actual = analysis.comments[0];

  console.log(`\nCOMMENT TEXT:\n"${text}"\n`);
  console.log(`EXPECTED vs ACTUAL:`);
  console.log(`  Tone:    ${expected.tone.padEnd(12)} → ${actual.tone}`);
  console.log(`  Intent:  ${expected.intent.padEnd(12)} → ${actual.intent}`);
  console.log(`  Nuance:  ${expected.nuance.padEnd(12)} → ${actual.nuance}`);
  console.log(`  Risk:    ${expected.risk.padEnd(12)} → ${actual.riskLevel}`);

  console.log(`\nSIGNALS DETECTED:`);
  if (actual.signals && actual.signals.length > 0) {
    console.log(`  ${actual.signals.join(", ")}`);
  } else {
    console.log(`  none`);
  }

  console.log(`\nCLASSIFICATION DETAILS:`);
  console.log(`  Tone Confidence: ${actual.toneConfidence}`);
  console.log(`  Tone SubLabels: ${(actual.toneSubLabels || []).join(", ") || "none"}`);
  console.log(`  Intent Confidence: ${actual.intentConfidence}`);
  console.log(`  Intent SubLabels: ${(actual.intentSubLabels || []).join(", ") || "none"}`);
  console.log(`  Nuance Confidence: ${actual.nuanceConfidence}`);

  return actual;
}

export function debugFailingCases() {
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║        DEBUGGING CRITICAL CLASSIFIER FAILURES              ║");
  console.log("╚════════════════════════════════════════════════════════════╝");

  // Critical case 1: Clearly positive/supportive marked negative
  debugComment(
    "t1: Genuine Support",
    "I'm so proud of you for leaving. That took incredible strength 💪 You're going to heal. Please reach out to a crisis line if you need support.",
    "Surviving abuse",
    "trauma_safety",
    { tone: "positive", intent: "supportive", nuance: "supportive", risk: "none" }
  );

  // Critical case 2: Positive tone marked as positive but intent marked as adversarial
  debugComment(
    "m1: Ally with Resources",
    "Thank you for sharing your story. You're not alone 💙 Please keep reaching out. National Suicide Prevention Lifeline: 988",
    "I've been hospitalized for suicidal ideation",
    "mental_health",
    { tone: "positive", intent: "supportive", nuance: "supportive", risk: "none" }
  );

  // Case 3: Directive advice with supportive intent marked as neutral
  debugComment(
    "par1: Parental Support",
    "You're doing great! 👏 2 hours is actually reasonable. Your boundaries are healthy and you should feel good about that 💚",
    "Is 2 hours of screen time per day too much for a 6yo?",
    "parenting",
    { tone: "positive", intent: "supportive", nuance: "supportive", risk: "none" }
  );

  // Case 4: Low-risk topic positive comment
  debugComment(
    "g1: Pizza Support",
    "Pineapple pizza is amazing! 🍕 Sweet and savory is the best combo.",
    "Pineapple on pizza: hot take or crime against food?",
    "general",
    { tone: "positive", intent: "supportive", nuance: "supportive", risk: "none" }
  );

  // Case 5: Sarcastic/dismissive marked as positive
  debugComment(
    "t6: False Empathy",
    "Oh wow, I'm SO sorry you had to deal with that. Have you tried just being happier? 🙄",
    "Surviving abuse",
    "trauma_safety",
    { tone: "negative", intent: "adversarial", nuance: "dismissive", risk: "low" }
  );
}

// Run if executed directly
if (require.main === module) {
  debugFailingCases();
}
