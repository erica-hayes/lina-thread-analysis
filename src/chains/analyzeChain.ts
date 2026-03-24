import { Stage1ScoredComment } from "../types";
import { Chain, ChainAnalysis } from "./types";

export function analyzeChain(
  chain: Chain,
  scoreByCommentId: Map<string, Stage1ScoredComment>
): ChainAnalysis {
  let peakCommentId = chain.commentIds[0] ?? "";
  let peakScore = -1;

  let previousScore = 0;
  let hasPrevious = false;
  let increaseCount = 0;
  let deltaCount = 0;

  let aggressionSum = 0;
  let targetingSum = 0;
  let intensitySum = 0;
  let disagreementSum = 0;
  let included = 0;

  for (const commentId of chain.commentIds) {
    const score = scoreByCommentId.get(commentId);
    if (!score) {
      continue;
    }

    included += 1;
    aggressionSum += score.signals.aggression;
    targetingSum += score.signals.targeting;
    intensitySum += score.signals.intensity;
    disagreementSum += score.signals.disagreement;

    if (score.score > peakScore) {
      peakScore = score.score;
      peakCommentId = commentId;
    }

    if (hasPrevious) {
      deltaCount += 1;
      if (score.score > previousScore) {
        increaseCount += 1;
      }
    }

    previousScore = score.score;
    hasPrevious = true;
  }

  const divisor = Math.max(included, 1);
  const avgAggression = aggressionSum / divisor;
  const avgTargeting = targetingSum / divisor;
  const avgIntensity = intensitySum / divisor;
  const avgDisagreement = disagreementSum / divisor;
  const trendScore = deltaCount > 0 ? increaseCount / deltaCount : 0;
  const twoPersonBackAndForthBonus = chain.participants.length === 2 && chain.commentIds.length >= 4 ? 0.15 : 0;

  const escalationRaw =
    avgAggression * 0.3 +
    avgTargeting * 0.25 +
    avgIntensity * 0.2 +
    trendScore * 0.25 +
    twoPersonBackAndForthBonus;

  const escalationScore = Math.min(1, Number(escalationRaw.toFixed(3)));

  let interactionType: ChainAnalysis["interactionType"] = "neutral";
  if (escalationScore >= 0.6 || avgAggression >= 0.55 || avgTargeting >= 0.5) {
    interactionType = "conflict";
  } else if (avgDisagreement >= 0.3 || chain.participants.length >= 3) {
    interactionType = "discussion";
  }

  return {
    chainId: chain.id,
    escalationScore,
    peakCommentId,
    participants: chain.participants,
    interactionType
  };
}

export function analyzeChains(
  chains: Chain[],
  scoreByCommentId: Map<string, Stage1ScoredComment>
): ChainAnalysis[] {
  const analyses: ChainAnalysis[] = [];
  for (const chain of chains) {
    analyses.push(analyzeChain(chain, scoreByCommentId));
  }
  analyses.sort((a, b) => b.escalationScore - a.escalationScore);
  return analyses;
}