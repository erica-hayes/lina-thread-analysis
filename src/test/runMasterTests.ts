/**
 * Master Test Runner
 * Executes all scenarios and validates against expected outputs
 */

import { analyzeThread } from "../core/analyzeThread";
import { masterTestScenarios } from "./masterTestScenarios";

interface CommentResult {
  id: string;
  passed: boolean;
  mismatches: string[];
  actual: {
    tone?: string;
    intent?: string;
    nuance?: string;
    risk?: string;
  };
  expected: {
    tone: string;
    intent: string;
    nuance: string;
    risk: string;
  };
}

interface ScenarioResult {
  id: string;
  title: string;
  topic: string;
  passed: number;
  failed: number;
  comments: CommentResult[];
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

export function runMasterTests() {
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║         MASTER TEST SUITE - VALIDATION                    ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  const results: ScenarioResult[] = [];
  let totalPassed = 0;
  let totalFailed = 0;

  for (const scenario of masterTestScenarios) {
    const mockJson = buildMockThreadJson(scenario);
    const analysis = analyzeThread(mockJson);
    const commentsById = new Map(analysis.comments.map((comment) => [comment.id, comment]));

    const commentResults: CommentResult[] = [];
    let scenarioPassed = 0;
    let scenarioFailed = 0;

    for (const expected of scenario.comments) {
      const actual = commentsById.get(expected.id);

      const mismatches: string[] = [];

      if (!actual) {
        mismatches.push(`comment: expected analyzed result for "${expected.id}", got none`);
      }

      if (actual && actual.tone !== expected.expectedTone) {
        mismatches.push(`tone: expected "${expected.expectedTone}", got "${actual.tone}"`);
      }
      if (actual && actual.intent !== expected.expectedIntent) {
        mismatches.push(`intent: expected "${expected.expectedIntent}", got "${actual.intent}"`);
      }
      if (actual && actual.nuance !== expected.expectedNuance) {
        mismatches.push(`nuance: expected "${expected.expectedNuance}", got "${actual.nuance}"`);
      }
      if (actual && actual.riskLevel !== expected.expectedRisk) {
        mismatches.push(`risk: expected "${expected.expectedRisk}", got "${actual.riskLevel}"`);
      }

      const passed = mismatches.length === 0;
      if (passed) {
        scenarioPassed++;
        totalPassed++;
      } else {
        scenarioFailed++;
        totalFailed++;
      }

      commentResults.push({
        id: expected.id,
        passed,
        mismatches,
        actual: {
          tone: actual?.tone,
          intent: actual?.intent,
          nuance: actual?.nuance,
          risk: actual?.riskLevel
        },
        expected: {
          tone: expected.expectedTone,
          intent: expected.expectedIntent,
          nuance: expected.expectedNuance,
          risk: expected.expectedRisk
        }
      });
    }

    results.push({
      id: scenario.id,
      title: scenario.title,
      topic: scenario.expectedTopic,
      passed: scenarioPassed,
      failed: scenarioFailed,
      comments: commentResults
    });
  }

  // Print results
  for (const result of results) {
    const status = result.failed === 0 ? "✓ PASS" : "✗ FAIL";
    console.log(`${status} ${result.id}`);
    console.log(`  ${result.title}`);
    console.log(`  Topic: ${result.topic}`);
    console.log(`  Passed: ${result.passed}/${result.passed + result.failed}\n`);

    // Show failures for this scenario
    for (const comment of result.comments) {
      if (!comment.passed) {
        console.log(`  ❌ ${comment.id}: ${comment.mismatches.join(", ")}`);
      }
    }

    if (result.failed > 0) {
      console.log();
    }
  }

  // Summary
  const totalTests = totalPassed + totalFailed;
  const passRate = ((totalPassed / totalTests) * 100).toFixed(1);

  console.log(`\n╔════════════════════════════════════════════════════════════╗`);
  console.log(`║                    SUMMARY                                 ║`);
  console.log(`╚════════════════════════════════════════════════════════════╝`);
  console.log(`Total Scenarios: ${results.length}`);
  console.log(`Total Comments: ${totalTests}`);
  console.log(`Passed: ${totalPassed}`);
  console.log(`Failed: ${totalFailed}`);
  console.log(`Pass Rate: ${passRate}%\n`);

  return {
    scenarios: results.length,
    totalTests,
    passed: totalPassed,
    failed: totalFailed,
    passRate: parseFloat(passRate),
    details: results
  };
}

// Run if executed directly
if (require.main === module) {
  runMasterTests();
}
