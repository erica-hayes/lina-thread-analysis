/**
 * Dedicated tone classification test scenarios
 * Focuses on testing tone detection with various input types:
 * - Emojis (standard, variants, skin tones)
 * - Slang and acronyms (lol, imo, btw, omg, etc.)
 * - Mixed signals
 * - Edge cases
 */

import { classifyToneWithConfidence } from "../features/classifyTone";

export interface ToneTestCase {
  id: string;
  description: string;
  text: string;
  signals: string[];
  riskLevel: "none" | "low" | "moderate" | "high";
  expectedTone: "positive" | "negative" | "neutral";
  expectedSubLabels: string[];
  notes?: string;
}

export const toneTestScenarios: ToneTestCase[] = [
  // ===== SUPPORTIVE ADVICE PATTERNS =====
  {
    id: "supportive-advice-clean",
    description: "Standard supportive advice pattern (no emojis)",
    text: "I'm so sorry you're going through this. Have you tried just exercising more? That always works for me.",
    signals: [],
    riskLevel: "low",
    expectedTone: "positive",
    expectedSubLabels: ["supportive"],
    notes: "Should trigger hasSupportiveAdvice branch"
  },
  {
    id: "supportive-advice-with-emoji",
    description: "Supportive advice with positive emoji",
    text: "I'm so sorry you're going through this 😞 Have you tried just exercising more? That always works for me 💪",
    signals: [],
    riskLevel: "low",
    expectedTone: "positive",
    expectedSubLabels: ["supportive"],
    notes: "Emoji should not break pattern matching"
  },
  {
    id: "supportive-advice-with-lol",
    description: "Supportive advice with 'lol' slang",
    text: "I'm so sorry you're going through this lol. Have you tried just exercising more? That always works for me.",
    signals: [],
    riskLevel: "low",
    expectedTone: "positive",
    expectedSubLabels: ["supportive"],
    notes: "Slang between patterns should not break detection"
  },
  {
    id: "supportive-advice-with-imo",
    description: "Supportive advice with 'imo' (in my opinion)",
    text: "I'm so sorry you're going through this. Have you tried just exercising more? Imo that always works for me.",
    signals: [],
    riskLevel: "low",
    expectedTone: "positive",
    expectedSubLabels: ["supportive"],
    notes: "Acronym before suggestion phrase should work"
  },
  {
    id: "supportive-advice-with-ngl",
    description: "Supportive advice with 'ngl' (not gonna lie)",
    text: "I'm so sorry you're going through this. Have you tried just exercising more? Ngl that always works for me.",
    signals: [],
    riskLevel: "low",
    expectedTone: "positive",
    expectedSubLabels: ["supportive"],
    notes: "Acronym variant with capital letters"
  },
  {
    id: "supportive-advice-casual-sorry",
    description: "Casual sorry with supportive advice",
    text: "ugh i'm so sorry you're going through this. have you tried just exercising more? honestly that always works for me.",
    signals: [],
    riskLevel: "low",
    expectedTone: "positive",
    expectedSubLabels: ["supportive"],
    notes: "Lowercase and casual language"
  },

  // ===== EMOJI INTENSIVE TESTS =====
  {
    id: "emoji-empathy-emoji-advice",
    description: "Emojis surrounding core phrases",
    text: "❤️ I'm so sorry you're going through this 😢 💔 Have you tried just exercising more? 🏋️ That always works for me ✨",
    signals: [],
    riskLevel: "low",
    expectedTone: "positive",
    expectedSubLabels: ["supportive"],
    notes: "Multiple emojis interspersed should not break pattern"
  },
  {
    id: "emoji-only-sentiment",
    description: "Emojis with minimal text",
    text: "😢 I'm so sorry you're going through this. Have you tried exercise? That works for me 💪",
    signals: [],
    riskLevel: "low",
    expectedTone: "positive",
    expectedSubLabels: ["supportive"],
    notes: "Text between emojis should still match"
  },
  {
    id: "eyes-emoji-joke",
    description: "Potentially confusing emoji context",
    text: "👀 I'm so sorry you're going through this. Have you tried just exercising more? 👀 That always works for me.",
    signals: [],
    riskLevel: "low",
    expectedTone: "positive",
    expectedSubLabels: ["supportive"],
    notes: "Non-sentiment emojis shouldn't interfere"
  },

  // ===== ACRONYM TESTS =====
  {
    id: "acronym-asap",
    description: "ASAP acronym in supportive context",
    text: "I'm so sorry you're going through this. Have you tried just exercising ASAP? That always works for me.",
    signals: [],
    riskLevel: "low",
    expectedTone: "positive",
    expectedSubLabels: ["supportive"],
    notes: "ASAP should not break matching"
  },
  {
    id: "acronym-omg",
    description: "OMG expresses empathy",
    text: "omg I'm so sorry you're going through this. Have you tried just exercising more? That always works for me.",
    signals: [],
    riskLevel: "low",
    expectedTone: "positive",
    expectedSubLabels: ["supportive"],
    notes: "Start with OMG empathy marker"
  },
  {
    id: "acronym-btw",
    description: "BTW between lead-in and suggestion",
    text: "I'm so sorry you're going through this btw. Have you tried just exercising more? That always works for me.",
    signals: [],
    riskLevel: "low",
    expectedTone: "positive",
    expectedSubLabels: ["supportive"],
    notes: "BTW interrupts but shouldn't break pattern"
  },
  {
    id: "mixed-emoji-acronym",
    description: "Both emojis and acronyms together",
    text: "omg 😢 I'm so sorry you're going through this. Have you tried just exercising more? Ngl that always works for me 💪",
    signals: [],
    riskLevel: "low",
    expectedTone: "positive",
    expectedSubLabels: ["supportive"],
    notes: "Combined emoji+acronym challenge"
  },

  // ===== NEGATIVE TESTS (should NOT be supportive tone) =====
  {
    id: "missing-lead-in",
    description: "Just advice without empathy lead-in",
    text: "Have you tried just exercising more? That always works for me.",
    signals: [],
    riskLevel: "low",
    expectedTone: "neutral",
    expectedSubLabels: [],
    notes: "Without lead-in, should be neutral with no sublabel"
  },
  {
    id: "missing-suggestion",
    description: "Empathy without advice suggestion",
    text: "I'm so sorry you're going through this. You're going to be okay.",
    signals: [],
    riskLevel: "low",
    expectedTone: "positive",
    expectedSubLabels: ["respectful"],
    notes: "Just empathy without advice should be positive/respectful not supportive"
  },
  {
    id: "sarcastic-sorry",
    description: "Sarcastic 'sorry' before criticism",
    text: "I'm so sorry you're apparently so fragile. Have you considered you're just too sensitive?",
    signals: ["passive_aggression"],
    riskLevel: "moderate",
    expectedTone: "negative",
    expectedSubLabels: ["critical"],
    notes: "Sarcasm inverts the supportive pattern meaning"
  },

  // ===== EDGE CASES WITH SPACING/PUNCTUATION =====
  {
    id: "extra-punctuation",
    description: "Multiple punctuation marks",
    text: "I'm so sorry you're going through this!!! Have you tried just exercising more??? That always works for me!!!",
    signals: [],
    riskLevel: "low",
    expectedTone: "positive",
    expectedSubLabels: ["supportive"],
    notes: "Extra punctuation shouldn't break pattern"
  },
  {
    id: "line-breaks",
    description: "Line breaks between phrases",
    text: "I'm so sorry you're going through this.\n\nHave you tried just exercising more?\n\nThat always works for me.",
    signals: [],
    riskLevel: "low",
    expectedTone: "positive",
    expectedSubLabels: ["supportive"],
    notes: "Line breaks shouldn't prevent pattern matching"
  },
  {
    id: "mixed-case",
    description: "MiXeD cAsE tExT",
    text: "I'M So SORRY you're GOING through this. HAVE you TRIED just EXERCISING more? THAT always WORKS for me.",
    signals: [],
    riskLevel: "low",
    expectedTone: "positive",
    expectedSubLabels: ["supportive"],
    notes: "Should be case-insensitive"
  },

  // ===== POSITIVE TEXT VARIANT TESTS =====
  {
    id: "am-variant",
    description: "Using 'I am' instead of 'I'm'",
    text: "I am so sorry you are going through this. Have you tried just exercising more? That always works for me.",
    signals: [],
    riskLevel: "low",
    expectedTone: "positive",
    expectedSubLabels: ["supportive"],
    notes: "Full form should match as well"
  },
  {
    id: "expanded-suggestion",
    description: "Expanded exercise suggestion",
    text: "I'm so sorry you're going through this. Have you tried just exercising more regularly? That always works for me.",
    signals: [],
    riskLevel: "low",
    expectedTone: "positive",
    expectedSubLabels: ["supportive"],
    notes: "Suggestion pattern should be flexible"
  },
];

export function runToneTests() {
  console.log("\n=== TONE CLASSIFICATION TESTS ===\n");
  let passed = 0;
  let failed = 0;
  const failureDetails: string[] = [];

  for (const testCase of toneTestScenarios) {
    const result = classifyToneWithConfidence(testCase.text, testCase.signals, testCase.riskLevel);
    const tonePassed = result.label === testCase.expectedTone;
    const subLabelsPassed = 
      result.subLabels.length === testCase.expectedSubLabels.length &&
      result.subLabels.every(label => testCase.expectedSubLabels.includes(label));

    if (tonePassed && subLabelsPassed) {
      console.log(`✅ ${testCase.id}`);
      passed++;
    } else {
      console.log(
        `❌ ${testCase.id}\n   Expected: tone=${testCase.expectedTone}, subLabels=${JSON.stringify(testCase.expectedSubLabels)}\n   Got: tone=${result.label}, subLabels=${JSON.stringify(result.subLabels)}`
      );
      failureDetails.push(
        `${testCase.id}: ${testCase.description}\nText: "${testCase.text}"\nNotes: ${testCase.notes || "N/A"}`
      );
      failed++;
    }
  }

  console.log(`\n\n=== SUMMARY ===`);
  console.log(`Passed: ${passed}/${toneTestScenarios.length}`);
  console.log(`Failed: ${failed}/${toneTestScenarios.length}`);
  console.log(`Pass Rate: ${((passed / toneTestScenarios.length) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log(`\n=== FAILURE DETAILS ===\n`);
    failureDetails.forEach(detail => console.log(detail + "\n"));
  }
}

// Run if executed directly
if (require.main === module) {
  runToneTests();
}
