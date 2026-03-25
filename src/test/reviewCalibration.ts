/**
 * Calibration Review Helper
 * Analyzes patterns in the calibration mismatches
 * Helps identify which actual outputs should be trusted
 */

import { generateCalibrationReport } from "./calibrateMasterTest";

export function analyzePatterns() {
  const reports = generateCalibrationReport();

  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║              MISMATCH PATTERN ANALYSIS                    ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  const patterns = {
    positiveToNegative: [] as any[],
    positiveToNeutral: [] as any[],
    supportiveToNeutral: [] as any[],
    supportiveToAdversarial: [] as any[],
    neutralToAdversarial: [] as any[],
    neutralToNegative: [] as any[],
    noneToLow: [] as any[],
    noneToModerate: [] as any[],
    lowToModerate: [] as any[],
    other: [] as any[]
  };

  for (const report of reports) {
    for (const comment of report.comments) {
      const exp = comment.expected;
      const act = comment.actual;

      if (exp.tone === "positive" && act.tone === "negative") {
        patterns.positiveToNegative.push({ scenario: report.scenarioId, id: comment.id, text: comment.text.substring(0, 60) });
      } else if (exp.tone === "positive" && act.tone === "neutral") {
        patterns.positiveToNeutral.push({ scenario: report.scenarioId, id: comment.id, text: comment.text.substring(0, 60) });
      } else if (exp.intent === "supportive" && act.intent === "neutral") {
        patterns.supportiveToNeutral.push({ scenario: report.scenarioId, id: comment.id, text: comment.text.substring(0, 60) });
      } else if (exp.intent === "supportive" && act.intent === "adversarial") {
        patterns.supportiveToAdversarial.push({ scenario: report.scenarioId, id: comment.id, text: comment.text.substring(0, 60) });
      } else if (exp.intent === "neutral" && act.intent === "adversarial") {
        patterns.neutralToAdversarial.push({ scenario: report.scenarioId, id: comment.id, text: comment.text.substring(0, 60) });
      } else if (exp.tone === "neutral" && act.tone === "negative") {
        patterns.neutralToNegative.push({ scenario: report.scenarioId, id: comment.id, text: comment.text.substring(0, 60) });
      } else if (exp.risk === "none" && act.risk === "low") {
        patterns.noneToLow.push({ scenario: report.scenarioId, id: comment.id, text: comment.text.substring(0, 60) });
      } else if (exp.risk === "none" && act.risk === "moderate") {
        patterns.noneToModerate.push({ scenario: report.scenarioId, id: comment.id, text: comment.text.substring(0, 60) });
      } else if (exp.risk === "low" && act.risk === "moderate") {
        patterns.lowToModerate.push({ scenario: report.scenarioId, id: comment.id, text: comment.text.substring(0, 60) });
      } else if (!comment.matches.tone || !comment.matches.intent || !comment.matches.nuance || !comment.matches.risk) {
        patterns.other.push({ scenario: report.scenarioId, id: comment.id, text: comment.text.substring(0, 60) });
      }
    }
  }

  console.log("🔴 POSITIVE → NEGATIVE (High Risk)");
  console.log(`   Count: ${patterns.positiveToNegative.length}`);
  console.log(`   Examples: ${patterns.positiveToNegative.slice(0, 3).map(p => `${p.scenario}:${p.id}`).join(", ")}`);
  console.log(`   Assessment: These are LIKELY CORRECT comments being INCORRECTLY classified as negative`);
  console.log(`   → Classifier is over-escalating based on context\n`);

  console.log("🟠 POSITIVE → NEUTRAL (High Risk)");
  console.log(`   Count: ${patterns.positiveToNeutral.length}`);
  console.log(`   Examples: ${patterns.positiveToNeutral.slice(0, 3).map(p => `${p.scenario}:${p.id}`).join(", ")}`);
  console.log(`   Assessment: These are LIKELY CORRECT comments being UNDER-classified as neutral`);
  console.log(`   → Missing supportive tone patterns\n`);

  console.log("🟡 SUPPORTIVE → NEUTRAL (High Risk)");
  console.log(`   Count: ${patterns.supportiveToNeutral.length}`);
  console.log(`   Examples: ${patterns.supportiveToNeutral.slice(0, 3).map(p => `${p.scenario}:${p.id}`).join(", ")}`);
  console.log(`   Assessment: These SHOULD be supportive intent but classifier threshold too high`);
  console.log(`   → Need to lower intent thresholds OR identif missing support patterns\n`);

  console.log("🔶 SUPPORTIVE → ADVERSARIAL (HIGH ALERT)");
  console.log(`   Count: ${patterns.supportiveToAdversarial.length}`);
  console.log(`   Examples: ${patterns.supportiveToAdversarial.slice(0, 3).map(p => `${p.scenario}:${p.id}`).join(", ")}`);
  console.log(`   Assessment: MAJOR classifier bug - supportive comments misclassifed as hostile`);
  console.log(`   → Likely caused by context boosting or signal rule interaction\n`);

  console.log("📊 RISK ESCALATION");
  console.log(`   none→low: ${patterns.noneToLow.length} (context-based boost)`);
  console.log(`   none→moderate: ${patterns.noneToModerate.length} (aggressive boost)`);
  console.log(`   Assessment: Tone/Intent being affected by risk boost\n`);

  console.log("═══════════════════════════════════════════════════════════\n");
  console.log("DECISION FRAMEWORK:\n");
  console.log("1️⃣  POSITIVE/SUPPORTIVE COMMENTS (t1, m1, p1, par1, w1, etc.)\n");
  console.log("   ✅ ACCEPT ACTUAL as ground truth IF:");
  console.log("      - You believe the analyzer is correctly being conservative");
  console.log("      - You want to tune it to only flag high-confidence positives\n");
  console.log("   ❌ FIX CLASSIFIER if:");
  console.log("      - These comments are OBVIOUSLY positive/supportive");
  console.log("      - Context shouldn't override clear sentiment\n");

  console.log("2️⃣  RISK ESCALATION (none→low, none→moderate)\n");
  console.log("   ✅ ACCEPT ACTUAL if:");
  console.log("      - Trauma/mental health topics SHOULD raise baseline risk\n");
  console.log("   ❌ FIX CLASSIFIER if:");
  console.log("      - Risk boost shouldn't affect tone/intent classification");
  console.log("      - Positive comments should stay positive regardless of topic\n");

  console.log("RECOMMENDATION:\n");
  console.log("Review the obvious cases first:");
  console.log("• t1: 'I'm so proud of you...' - IS THIS ACTUALLY NEGATIVE? NO");
  console.log("• m1: 'Thank you for sharing...' - IS THIS ACTUALLY ADVERSARIAL? NO");
  console.log("• par1: 'You're doing great!' - IS THIS ACTUALLY ADVERSARIAL? NO\n");
  console.log("If these should be positive/supportive, then FIX THE CLASSIFIER.");
  console.log("If these calibrations somehow make sense, then UPDATE EXPECTATIONS.");
}

// Run if executed directly
if (require.main === module) {
  analyzePatterns();
}
