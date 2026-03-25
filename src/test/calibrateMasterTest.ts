/**
 * Calibration Script
 * Runs master test scenarios and captures actual analyzer outputs
 * Generates a calibration report showing expected vs actual
 */

import { analyzeThread } from "../core/analyzeThread";
import { masterTestScenarios } from "./masterTestScenarios";

interface CalibratedComment {
  id: string;
  text: string;
  expected: {
    tone: string;
    intent: string;
    nuance: string;
    risk: string;
  };
  actual: {
    tone: string;
    intent: string;
    nuance: string;
    risk: string;
  };
  matches: {
    tone: boolean;
    intent: boolean;
    nuance: boolean;
    risk: boolean;
  };
}

interface CalibrationReport {
  scenarioId: string;
  title: string;
  comments: CalibratedComment[];
}

function buildMockThreadJson(scenario: typeof masterTestScenarios[0]) {
  return {
    kind: "Listing",
    data: {
      title: scenario.title,
      selftext: scenario.body,
      children: scenario.comments.map(comment => ({
        kind: "t1",
        data: {
          id: comment.id,
          parent_id: "t3_post",
          author: comment.author,
          body: comment.text,
          created_utc: 1710000000,
          replies: ""
        }
      }))
    }
  };
}

export function generateCalibrationReport() {
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║     CALIBRATION REPORT - EXPECTED vs ACTUAL OUTPUTS       ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  const reports: CalibrationReport[] = [];

  for (const scenario of masterTestScenarios) {
    const mockJson = buildMockThreadJson(scenario);
    const analysis = analyzeThread(mockJson);
    const commentsById = new Map(analysis.comments.map((comment) => [comment.id, comment]));

    const comments: CalibratedComment[] = [];

    for (const expected of scenario.comments) {
      const actual = commentsById.get(expected.id);

      if (!actual) {
        comments.push({
          id: expected.id,
          text: expected.text,
          expected: {
            tone: expected.expectedTone,
            intent: expected.expectedIntent,
            nuance: expected.expectedNuance,
            risk: expected.expectedRisk
          },
          actual: {
            tone: "missing",
            intent: "missing",
            nuance: "missing",
            risk: "missing"
          },
          matches: {
            tone: false,
            intent: false,
            nuance: false,
            risk: false
          }
        });
        continue;
      }

      const matches = {
        tone: actual.tone === expected.expectedTone,
        intent: actual.intent === expected.expectedIntent,
        nuance: actual.nuance === expected.expectedNuance,
        risk: actual.riskLevel === expected.expectedRisk
      };

      comments.push({
        id: expected.id,
        text: expected.text,
        expected: {
          tone: expected.expectedTone,
          intent: expected.expectedIntent,
          nuance: expected.expectedNuance,
          risk: expected.expectedRisk
        },
        actual: {
          tone: actual.tone || "none",
          intent: actual.intent || "none",
          nuance: actual.nuance || "none",
          risk: actual.riskLevel || "none"
        },
        matches
      });
    }

    reports.push({
      scenarioId: scenario.id,
      title: scenario.title,
      comments
    });
  }

  // Print calibration report in easy-to-read format
  for (const report of reports) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📋 ${report.scenarioId}`);
    console.log(`   ${report.title}\n`);

    for (const comment of report.comments) {
      const allMatch = Object.values(comment.matches).every(m => m);
      const icon = allMatch ? "✅" : "⚠️";

      console.log(`${icon} [${comment.id}]`);
      console.log(`   Text: "${comment.text}"\n`);

      console.log(`   TONE:   ${comment.expected.tone.padEnd(12)} → ${comment.actual.tone}  ${comment.matches.tone ? "✓" : "✗"}`);
      console.log(`   INTENT: ${comment.expected.intent.padEnd(12)} → ${comment.actual.intent}  ${comment.matches.intent ? "✓" : "✗"}`);
      console.log(`   NUANCE: ${comment.expected.nuance.padEnd(12)} → ${comment.actual.nuance}  ${comment.matches.nuance ? "✓" : "✗"}`);
      console.log(`   RISK:   ${comment.expected.risk.padEnd(12)} → ${comment.actual.risk}  ${comment.matches.risk ? "✓" : "✗"}\n`);
    }
  }

  // Summary
  let totalExpected = 0;
  let totalMatches = 0;

  for (const report of reports) {
    for (const comment of report.comments) {
      totalExpected++;
      if (Object.values(comment.matches).every(m => m)) {
        totalMatches++;
      }
    }
  }

  console.log(`\n╔════════════════════════════════════════════════════════════╗`);
  console.log(`║                 CALIBRATION SUMMARY                        ║`);
  console.log(`╚════════════════════════════════════════════════════════════╝`);
  console.log(`Total Comments: ${totalExpected}`);
  console.log(`Matching: ${totalMatches}`);
  console.log(`Mismatches: ${totalExpected - totalMatches}`);
  console.log(`Match Rate: ${((totalMatches / totalExpected) * 100).toFixed(1)}%`);
  console.log(`\n💡 Review mismatches above and decide:`);
  console.log(`   - If ACTUAL is correct → update expected in masterTestScenarios.ts`);
  console.log(`   - If ACTUAL is wrong → investigate the classifier\n`);

  return reports;
}

// Run if executed directly
if (require.main === module) {
  generateCalibrationReport();
}
