/**
 * Test validation script for nuance detection scenarios
 * Runs analysis on test threads and compares against expected outcomes
 */

import { analyzeThread } from "../core/analyzeThread";
import { nuanceTestScenarios, ExpectedSignal, ExpectedClassification } from "./nuanceTestScenarios";
import { nuanceTestThreads } from "./nuanceTestData";

interface ValidationResult {
  scenarioId: string;
  description: string;
  passed: number;
  failed: number;
  details: CommentValidation[];
}

interface CommentValidation {
  commentId: string;
  body: string;
  passed: boolean;
  missingSignals: ExpectedSignal[];
  unexpectedNuance: boolean;
  classificationMismatches: string[];
  actual: {
    signals: string[];
    tone?: string;
    toneSubLabels?: string[];
    nuance?: string;
    nuanceSecondary?: string[];
    intent?: string;
    intentSubLabels?: string[];
    riskLevel?: string;
  };
  expected: ExpectedClassification;
}

function validateSignals(
  detectedSignals: Array<{ category: string; family: string; ruleName: string; riskContribution: number }>,
  expectedSignals: ExpectedSignal[]
): ExpectedSignal[] {
  const missing: ExpectedSignal[] = [];

  for (const expected of expectedSignals) {
    const found = detectedSignals.find((detected) => {
      const categoryMatch = detected.category === expected.category;
      const familyMatch = detected.family === expected.family;
      const ruleMatch = !expected.ruleName || detected.ruleName === expected.ruleName;
      const riskMatch =
        expected.minRiskContribution === undefined || detected.riskContribution >= expected.minRiskContribution;

      return categoryMatch && familyMatch && ruleMatch && riskMatch;
    });

    if (!found) {
      missing.push(expected);
    }
  }

  return missing;
}

function validateClassification(
  actual: {
    tone?: string;
    toneSubLabels?: string[];
    nuance?: string;
    nuanceSecondary?: string[];
    intent?: string;
    intentSubLabels?: string[];
    riskLevel?: string;
  },
  expected: ExpectedClassification
): string[] {
  const mismatches: string[] = [];

  if (expected.tone && actual.tone !== expected.tone) {
    mismatches.push(`tone: expected "${expected.tone}", got "${actual.tone}"`);
  }

  if (expected.toneSubLabels && actual.toneSubLabels) {
    const missingSubLabels = expected.toneSubLabels.filter((label) => !actual.toneSubLabels?.includes(label));
    if (missingSubLabels.length > 0) {
      mismatches.push(`toneSubLabels missing: ${missingSubLabels.join(", ")}`);
    }
  }

  if (expected.nuance && actual.nuance !== expected.nuance) {
    mismatches.push(`nuance: expected "${expected.nuance}", got "${actual.nuance}"`);
  }

  if (expected.nuanceSecondary && actual.nuanceSecondary) {
    const missingSecondary = expected.nuanceSecondary.filter((label) => !actual.nuanceSecondary?.includes(label));
    if (missingSecondary.length > 0) {
      mismatches.push(`nuanceSecondary missing: ${missingSecondary.join(", ")}`);
    }
  }

  if (expected.intent && actual.intent !== expected.intent) {
    mismatches.push(`intent: expected "${expected.intent}", got "${actual.intent}"`);
  }

  if (expected.intentSubLabels && actual.intentSubLabels) {
    const missingIntentLabels = expected.intentSubLabels.filter((label) => !actual.intentSubLabels?.includes(label));
    if (missingIntentLabels.length > 0) {
      mismatches.push(`intentSubLabels missing: ${missingIntentLabels.join(", ")}`);
    }
  }

  if (expected.riskLevel && actual.riskLevel !== expected.riskLevel) {
    mismatches.push(`riskLevel: expected "${expected.riskLevel}", got "${actual.riskLevel}"`);
  }

  return mismatches;
}

function runValidation(): ValidationResult[] {
  const results: ValidationResult[] = [];

  for (const scenario of nuanceTestScenarios) {
    const threadData = nuanceTestThreads[scenario.id as keyof typeof nuanceTestThreads];
    if (!threadData) {
      console.warn(`No test data found for scenario: ${scenario.id}`);
      continue;
    }

    const analysisResult = analyzeThread(threadData);
    const details: CommentValidation[] = [];
    let passed = 0;
    let failed = 0;

    for (const expectedComment of scenario.comments) {
      const actualComment = analysisResult.comments.find((c) => c.id === expectedComment.id);
      if (!actualComment) {
        failed++;
        details.push({
          commentId: expectedComment.id,
          body: expectedComment.body,
          passed: false,
          missingSignals: expectedComment.expectedSignals,
          unexpectedNuance: false,
          classificationMismatches: ["Comment not found in analysis results"],
          actual: { signals: [] },
          expected: expectedComment.expectedClassification
        });
        continue;
      }

      const missingSignals = validateSignals(actualComment.detectedSignals, expectedComment.expectedSignals);

      const classificationMismatches = validateClassification(
        {
          tone: actualComment.tone,
          toneSubLabels: actualComment.toneSubLabels,
          nuance: actualComment.nuance,
          nuanceSecondary: actualComment.nuanceSecondary,
          intent: actualComment.intent,
          intentSubLabels: actualComment.intentSubLabels,
          riskLevel: actualComment.riskLevel
        },
        expectedComment.expectedClassification
      );

      const commentPassed = missingSignals.length === 0 && classificationMismatches.length === 0;

      if (commentPassed) {
        passed++;
      } else {
        failed++;
      }

      details.push({
        commentId: expectedComment.id,
        body: expectedComment.body,
        passed: commentPassed,
        missingSignals,
        unexpectedNuance: expectedComment.expectedClassification.nuance
          ? actualComment.nuance !== expectedComment.expectedClassification.nuance
          : false,
        classificationMismatches,
        actual: {
          signals: actualComment.signals,
          tone: actualComment.tone,
          toneSubLabels: actualComment.toneSubLabels,
          nuance: actualComment.nuance,
          nuanceSecondary: actualComment.nuanceSecondary,
          intent: actualComment.intent,
          intentSubLabels: actualComment.intentSubLabels,
          riskLevel: actualComment.riskLevel
        },
        expected: expectedComment.expectedClassification
      });
    }

    results.push({
      scenarioId: scenario.id,
      description: scenario.description,
      passed,
      failed,
      details
    });
  }

  return results;
}

function printReport(results: ValidationResult[]): void {
  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║       NUANCE DETECTION VALIDATION REPORT                     ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  let totalPassed = 0;
  let totalFailed = 0;

  for (const result of results) {
    totalPassed += result.passed;
    totalFailed += result.failed;

    const status = result.failed === 0 ? "✓ PASS" : "✗ FAIL";
    const statusColor = result.failed === 0 ? "\x1b[32m" : "\x1b[31m";
    console.log(`${statusColor}${status}\x1b[0m ${result.scenarioId}`);
    console.log(`  ${result.description}`);
    console.log(`  Passed: ${result.passed}/${result.passed + result.failed}\n`);

    if (result.failed > 0) {
      for (const detail of result.details) {
        if (!detail.passed) {
          console.log(`  Comment: ${detail.commentId}`);
          console.log(`  Body: "${detail.body.substring(0, 80)}${detail.body.length > 80 ? "..." : ""}"`);

          if (detail.missingSignals.length > 0) {
            console.log(`  Missing Signals:`);
            for (const signal of detail.missingSignals) {
              console.log(`    - ${signal.category}/${signal.family}${signal.ruleName ? ` (${signal.ruleName})` : ""}`);
            }
          }

          if (detail.classificationMismatches.length > 0) {
            console.log(`  Classification Mismatches:`);
            for (const mismatch of detail.classificationMismatches) {
              console.log(`    - ${mismatch}`);
            }
          }

          console.log(`  Actual: tone=${detail.actual.tone}, nuance=${detail.actual.nuance}, intent=${detail.actual.intent}, risk=${detail.actual.riskLevel}`);
          console.log("");
        }
      }
    }
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`TOTAL: ${totalPassed} passed, ${totalFailed} failed`);
  const passRate = ((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1);
  console.log(`Pass Rate: ${passRate}%\n`);
}

// Run validation
const results = runValidation();
printReport(results);

// Export for programmatic use
export { runValidation, ValidationResult, CommentValidation };
