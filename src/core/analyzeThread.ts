import { detectUserRoles } from "../aggregation/roleDetector";
import { summarizeThread } from "../aggregation/threadSummary";
import { buildUIIndex } from "../aggregation/uiIndex";
import { runStage1 } from "../analysis/stage1";
import { runStage2 } from "../analysis/stage2";
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
  if (score >= 14) {
    return "critical";
  }
  if (score >= 10) {
    return "high";
  }
  if (score >= 6) {
    return "moderate";
  }
  if (score >= 2) {
    return "low";
  }
  return "none";
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

  const peakChainCommentIds = new Set<string>();
  for (const analysis of chainAnalyses) {
    peakChainCommentIds.add(analysis.peakCommentId);
  }

  const stage2CommentIds = new Set<string>();
  for (const comment of stage1.scored) {
    if (comment.priority === "high") {
      stage2CommentIds.add(comment.commentId);
    }
  }
  for (const commentId of peakChainCommentIds) {
    stage2CommentIds.add(commentId);
  }

  const stage2DeepAnalysis = runStage2([...stage2CommentIds], tree);

  const userRoles = detectUserRoles(chains, chainAnalyses, stage1.scoreByCommentId, tree.byId);
  const summary = summarizeThread(context, tree, chains, chainAnalyses, stage1.scored, userRoles);

  const escalationPoints = summary.escalationPoints;

  const analyzedComments: AnalyzedComment[] = stage1.scored.map((score) => {
    const node = tree.byId.get(score.commentId);
    const riskLevel = scoreToRiskLevel(score.score);
    const signalTags = Array.from(
      new Set([
        ...score.flags,
        ...score.detectedSignals.map((item) => item.category),
        ...score.detectedSignals.map((item) => item.family),
        ...score.detectedSignals.map((item) => item.ruleName)
      ])
    );
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
      signalEvidence
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
      highRiskAdversarial: analyzedComments.filter(
        (item) => (item.riskLevel === "high" || item.riskLevel === "critical") && item.intent === "adversarial"
      ).length,
      highRiskNegativeTone: analyzedComments.filter(
        (item) => (item.riskLevel === "high" || item.riskLevel === "critical") && item.tone === "negative"
      ).length,
      supportiveInRiskyContext: analyzedComments.filter(
        (item) => (item.riskLevel === "high" || item.riskLevel === "critical") && item.intent === "supportive"
      ).length
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
      signals: score.signals,
      deepAnalysis: stage2DeepAnalysis.get(score.commentId) ?? {
        tone: "neutral",
        intent: "unknown",
        nuance: "stage2-not-run",
        risk: "low"
      }
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