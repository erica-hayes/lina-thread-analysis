import { detectUserRoles } from "../aggregation/roleDetector";
import { summarizeThread } from "../aggregation/threadSummary";
import { buildUIIndex } from "../aggregation/uiIndex";
import { runStage1 } from "../analysis/stage1";
import { analyzeChains } from "../chains/analyzeChain";
import { extractChains } from "../chains/extractChains";
import { analyzeThreadContext } from "../context/threadContextAnalyzer";
import { classifyIntentWithConfidence } from "../features/classifyIntent";
import { classifyNuanceWithConfidence } from "../features/classifyNuance";
import { classifyToneWithConfidence } from "../features/classifyTone";
import { buildCommentTree } from "../graph/buildCommentTree";
import { extractOriginalPostContext, parseRedditJson } from "../ingestion/redditParser";
import { AnalyzeThreadOptions, AnalyzeThreadResult, AnalyzedComment, HighRiskComment, RiskBand } from "../types";

const TONE_LABEL_CONFIDENCE_THRESHOLD = 0.55;
const INTENT_LABEL_CONFIDENCE_THRESHOLD = 0.58;

function scoreToRiskLevel(score: number): RiskBand {
  if (score >= 6) {
    return "high";
  }
  if (score >= 3.5) {
    return "moderate";
  }
  if (score >= 0.5) {
    return "low";
  }
  return "none";
}

function computeContextAdjustedScore(baseScore: number, text: string, signalTags: string[], topic: string): number {
  let adjusted = baseScore;
  const lowerText = (text ?? "").toLowerCase();
  const normalized = signalTags.map((item) => item.toLowerCase());

  const hasInvalidation = normalized.some(
    (item) => item.includes("invalidation") || item.includes("gaslighting") || item.includes("dismissive")
  );
  const hasTargeting = normalized.some((item) => item.includes("targeting") || item.includes("blame"));
  const hasConcernFramedMinimization = /\b(he'?s\s+just\s+worried\s+about\s+you|parents\s+do\s+that)\b/.test(lowerText);
  const hasPoliteMaskingInvalidation =
    /\b(i'?m\s+sorry\s+but\s+have\s+you\s+considered)\b/.test(lowerText) &&
    /\b(too\s+sensitive|overreacting|remembering\s+it\s+wrong)\b/.test(lowerText);
  const hasFalseEmpathy =
    /\b(oh\s+wow|i'?m\s+so\s+sorry\s+you\s+had\s+to\s+deal\s+with\s+that)\b.*\b(just\s+being\s+happier)\b|🙄/.test(lowerText) ||
    /\bjust\s+being\s+happier\b/.test(lowerText);
  const hasConcernMaskedAttack = /\b(i'?m\s+so\s+concerned\s+about\s+you)\b.*\b(just\s+weak|weak)\b/.test(lowerText);
  const hasWellnessMinimization =
    /\b(you'?ll\s+feel\s+better\s+soon|maybe\s+try\s+yoga|maybe\s+try\s+meditation|just\s+exercis(e|ing)\s+more|that\s+always\s+works\s+for\s+me)\b/.test(
      lowerText
    );
  const hasTraumaMemoryInvalidation = /\b(are\s+you\s+sure\s+that'?s\s+what\s+happened|kids\s+misremember)\b/.test(lowerText);
  const hasPrivacyGaslighting = /\b(you'?re\s+overreacting|it'?s\s+normal\s+for\s+family)\b/.test(lowerText);
  const hasConcernFramedGaslighting =
    /\b(you'?re\s+overreacting|you\s+might\s+be\s+overreacting)\b/.test(lowerText) &&
    /\b(they\s+sound\s+like\s+they\s+genuinely\s+care|didn'?t\s+mean\s+it\s+that\s+way)\b/.test(lowerText);

  if (topic === "trauma_safety" && hasInvalidation) {
    adjusted += 1.1;
  }

  if (topic === "trauma_safety" && hasTargeting) {
    adjusted += 1.6;
  } else if (topic === "mental_health" && hasInvalidation) {
    adjusted += 0.2;
  } else if (topic === "privacy_boundary" && hasInvalidation) {
    adjusted += 0.6;
    if (hasConcernFramedMinimization) {
      adjusted += 0.2;
    }
  }

  if (
    topic === "trauma_safety" &&
    /\b(kids\s+misremember|that\s+doesn'?t\s+make\s+sense|why\s+did\s+you\s+wait|are\s+you\s+sure\s+that'?s\s+what\s+happened|really\s+abuse|overreacting)\b/.test(
      lowerText
    )
  ) {
    adjusted += 1.4;
  }

  if (hasFalseEmpathy) {
    adjusted += 1.0;
  }

  if (hasPoliteMaskingInvalidation) {
    adjusted += 1.9;
  }

  if (hasConcernFramedGaslighting) {
    adjusted += 1.6;
  }

  if (hasConcernMaskedAttack) {
    adjusted += 2.9;
    if (topic === "mental_health") {
      adjusted += 0.5;
    }
  }

  if (topic === "mental_health" && hasWellnessMinimization) {
    adjusted += 0.6;
  }

  if (topic === "trauma_safety" && hasTraumaMemoryInvalidation) {
    adjusted += 1.8;
  }

  if (topic === "privacy_boundary" && hasPrivacyGaslighting) {
    adjusted += 2.0;
  }

  return Number(adjusted.toFixed(2));
}

export function analyzeThread(
  rawRedditJson: unknown,
  options: AnalyzeThreadOptions = {}
): AnalyzeThreadResult {
  const op = extractOriginalPostContext(rawRedditJson);
  const context = analyzeThreadContext(op.title, op.body);

  const parsedComments = parseRedditJson(rawRedditJson);
  const tree = buildCommentTree(parsedComments);

  const stage1 = runStage1(tree);

  const chains = extractChains(tree);
  const chainAnalyses = analyzeChains(chains, stage1.scoreByCommentId);

  const userRoles = detectUserRoles(chains, chainAnalyses, stage1.scoreByCommentId, tree.byId);
  const summary = summarizeThread(context, tree, chains, chainAnalyses, stage1.scored, userRoles);

  const escalationPoints = summary.escalationPoints;

  const analyzedComments: AnalyzedComment[] = stage1.scored.map((score) => {
    const node = tree.byId.get(score.commentId);
    const signalTags = Array.from(
      new Set([
        ...score.flags,
        ...score.detectedSignals.map((item) => item.category),
        ...score.detectedSignals.map((item) => item.family),
        ...score.detectedSignals.map((item) => item.ruleName)
      ])
    );
    const adjustedScore = computeContextAdjustedScore(score.score, node?.body ?? "", signalTags, context.topic);
    const riskLevel = scoreToRiskLevel(adjustedScore);
    const signalEvidence = score.detectedSignals
      .slice()
      .sort((a, b) => b.riskContribution - a.riskContribution)
      .slice(0, 3)
      .map((item) => `${item.matchedText} (${item.family})`);

    const toneResult = classifyToneWithConfidence(node?.body ?? "", signalTags, riskLevel);
    const nuanceResult = classifyNuanceWithConfidence(node?.body ?? "", signalTags, riskLevel);
    const intentResult = classifyIntentWithConfidence(node?.body ?? "", signalTags, riskLevel);

    return {
      id: score.commentId,
      tone: toneResult.label,
      toneSubLabels: toneResult.subLabels,
      nuance: nuanceResult.label,
      nuanceSecondary: nuanceResult.secondaryLabels,
      intent: intentResult.label,
      intentSubLabels: intentResult.subLabels,
      toneLabel: toneResult.confidence >= TONE_LABEL_CONFIDENCE_THRESHOLD ? toneResult.label : null,
      intentLabel: intentResult.confidence >= INTENT_LABEL_CONFIDENCE_THRESHOLD ? intentResult.label : null,
      toneConfidence: toneResult.confidence,
      nuanceConfidence: nuanceResult.confidence,
      intentConfidence: intentResult.confidence,
      riskLevel,
      signals: signalTags,
      signalEvidence,
      detectedSignals: score.detectedSignals
    };
  });

  const uiIndex = buildUIIndex(analyzedComments);

  const quickScan = {
    counts: {
      positive: analyzedComments.filter((item) => item.tone === "positive").length,
      negative: analyzedComments.filter((item) => item.tone === "negative").length,
      neutral: analyzedComments.filter((item) => item.tone === "neutral").length
    },
    byIntent: analyzedComments.reduce<Record<string, number>>((acc, item) => {
      acc[item.intent] = (acc[item.intent] ?? 0) + 1;
      return acc;
    }, {}),
    byRisk: analyzedComments.reduce<Record<string, number>>((acc, item) => {
      acc[item.riskLevel] = (acc[item.riskLevel] ?? 0) + 1;
      return acc;
    }, {}),
    composites: {
      highRiskAdversarial: analyzedComments.filter((item) => item.riskLevel === "high" && item.intent === "adversarial")
        .length,
      highRiskNegativeTone: analyzedComments.filter((item) => item.riskLevel === "high" && item.tone === "negative")
        .length,
      supportiveInRiskyContext: analyzedComments.filter((item) => item.riskLevel === "high" && item.intent === "supportive")
        .length
    }
  };

  const highRiskComments: HighRiskComment[] = stage1.highSignal.map((score) => {
    const node = tree.byId.get(score.commentId);

    return {
      commentId: score.commentId,
      author: score.author,
      body: node?.body ?? "",
      depth: score.depth,
      score: score.score,
      flags: score.flags,
      priority: score.priority,
      detectedSignals: score.detectedSignals,
      signals: score.signals
    };
  });

  return {
    summary,
    comments: analyzedComments,
    uiIndex,
    quickScan,
    chains,
    highRiskComments,
    escalationPoints,
    userRoles,
    ...(options.debug
      ? {
          debug: {
            commentScores: stage1.scored,
            comments: analyzedComments,
            uiIndex,
            chains,
            chainAnalyses
          }
        }
      : {})
  };
}