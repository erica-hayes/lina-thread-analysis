import { computeAlignment } from "./alignment";
import { computeConversationClimate } from "./conversationClimate";
import { computeParticipationRisk } from "./participationRisk";
import { assessThreadTopicRisk } from "./topicRisk";
import { Chain, ChainAnalysis } from "../chains/types";
import { ThreadContext } from "../context/threadContextAnalyzer";
import { CommentTree } from "../graph/types";
import { Stage1ScoredComment, ThreadSummary, UserRole } from "../types";

function resolveOverallRisk(
  context: ThreadContext,
  scoredComments: Stage1ScoredComment[],
  chainAnalyses: ChainAnalysis[],
  topicRiskScore: number,
  climateRiskScore: number,
  alignmentRiskScore: number
): number {
  let mediumOrHighCount = 0;
  for (const score of scoredComments) {
    if (score.priority !== "low") {
      mediumOrHighCount += 1;
    }
  }

  const meanScore =
    scoredComments.length > 0
      ? scoredComments.reduce((sum, item) => sum + item.score, 0) / scoredComments.length
      : 0;
  const topChainEscalation = chainAnalyses[0]?.escalationScore ?? 0;
  const highConflictChains = chainAnalyses.filter((item) => item.interactionType === "conflict").length;

  const commentRisk = Math.min(1, (meanScore / 10) * 0.5 + (mediumOrHighCount / Math.max(scoredComments.length, 1)) * 0.5);
  const chainRisk = Math.min(1, topChainEscalation * 0.7 + Math.min(highConflictChains, 5) * 0.06);

  const overallRisk =
    context.baselineRisk * 0.22 +
    commentRisk * 0.22 +
    chainRisk * 0.2 +
    topicRiskScore * 0.18 +
    climateRiskScore * 0.1 +
    alignmentRiskScore * 0.08;
  return Number(Math.min(1, overallRisk).toFixed(3));
}

function buildKeyDynamics(
  context: ThreadContext,
  chainAnalyses: ChainAnalysis[],
  scoredComments: Stage1ScoredComment[]
): string[] {
  const dynamics: string[] = [];

  dynamics.push(`topic:${context.topic}`);

  const conflictChains = chainAnalyses.filter((item) => item.interactionType === "conflict").length;
  if (conflictChains > 0) {
    dynamics.push(`conflict_chains:${conflictChains}`);
  }

  const highPriorityCount = scoredComments.filter((item) => item.priority === "high").length;
  if (highPriorityCount > 0) {
    dynamics.push(`high_priority_comments:${highPriorityCount}`);
  }

  const highTargetingCount = scoredComments.filter((item) => item.signals.targeting >= 0.45).length;
  if (highTargetingCount > 0) {
    dynamics.push(`targeting_signals:${highTargetingCount}`);
  }

  return dynamics;
}

export function summarizeThread(
  context: ThreadContext,
  tree: CommentTree,
  chains: Chain[],
  chainAnalyses: ChainAnalysis[],
  stage1Scores: Stage1ScoredComment[],
  userRoles: Record<string, UserRole>
): ThreadSummary {
  const topicRisk = assessThreadTopicRisk(context);
  const climate = computeConversationClimate([...tree.byId.values()], stage1Scores, chainAnalyses);
  const alignment = computeAlignment(tree, stage1Scores);

  const highRiskChainIdSet = new Set(
    chainAnalyses
      .filter((analysis) => analysis.escalationScore >= 0.65 || analysis.interactionType === "conflict")
      .map((analysis) => analysis.chainId)
  );

  const highRiskChains = chains.filter((chain) => highRiskChainIdSet.has(chain.id));

  const escalationPoints = chainAnalyses
    .filter((analysis) => analysis.escalationScore >= 0.55)
    .slice(0, 10)
    .map((analysis) => ({
      chainId: analysis.chainId,
      peakCommentId: analysis.peakCommentId
    }));

  const topicRiskScoreByLevel: Record<string, number> = {
    none: 0,
    low: 0.25,
    moderate: 0.5,
    high: 1
  };
  const topicRiskScore = topicRiskScoreByLevel[topicRisk.level] ?? 0;

  const climateRiskScore =
    climate.label === "hostile"
      ? 0.85
      : climate.label === "volatile"
        ? 0.7
        : climate.label === "mixed"
          ? 0.5
          : climate.label === "supportive"
            ? 0.2
            : 0.3;

  const alignmentRiskScore =
    alignment.label === "polarized"
      ? 0.78
      : alignment.label === "fragmented"
        ? 0.66
        : alignment.label === "mixed"
          ? 0.5
          : 0.25;

  const commentRisk =
    stage1Scores.length > 0
      ? stage1Scores.reduce((sum, item) => sum + item.score, 0) / Math.max(1, stage1Scores.length * 10)
      : 0;

  const participationRisk = computeParticipationRisk(climate, alignment, topicRisk, commentRisk);

  const keyDynamics = buildKeyDynamics(context, chainAnalyses, stage1Scores);
  keyDynamics.push(`climate:${climate.label}`);
  keyDynamics.push(`alignment:${alignment.label}`);
  keyDynamics.push(`topic_risk:${topicRisk.level}`);

  return {
    overallRisk: resolveOverallRisk(
      context,
      stage1Scores,
      chainAnalyses,
      topicRiskScore,
      climateRiskScore,
      alignmentRiskScore
    ),
    topic: context.topic,
    sensitivity: context.sensitivity,
    threadTopicRisk: topicRisk,
    conversationClimate: climate,
    alignment,
    participationRisk,
    keyDynamics,
    highRiskChains,
    escalationPoints,
    userRoles
  };
}