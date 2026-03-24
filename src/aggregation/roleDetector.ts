import { Chain, ChainAnalysis } from "../chains/types";
import { CommentNode } from "../graph/types";
import { Stage1ScoredComment, UserRole } from "../types";

interface UserStats {
  involvement: number;
  instigatorPoints: number;
  escalatorPoints: number;
  defenderPoints: number;
  hostileEvents: number;
  supportEvents: number;
  curiosityEvents: number;
  highRiskEntries: number;
}

export function detectUserRoles(
  chains: Chain[],
  chainAnalyses: ChainAnalysis[],
  scoreByCommentId: Map<string, Stage1ScoredComment>,
  commentById: Map<string, CommentNode>
): Record<string, UserRole> {
  const statsByAuthor = new Map<string, UserStats>();

  const analysisByChainId = new Map<string, ChainAnalysis>();
  for (const analysis of chainAnalyses) {
    analysisByChainId.set(analysis.chainId, analysis);
  }

  for (const chain of chains) {
    const analysis = analysisByChainId.get(chain.id);
    if (!analysis) {
      continue;
    }

    for (const participant of chain.participants) {
      const stats = statsByAuthor.get(participant) ?? {
        involvement: 0,
        instigatorPoints: 0,
        escalatorPoints: 0,
        defenderPoints: 0,
        hostileEvents: 0,
        supportEvents: 0,
        curiosityEvents: 0,
        highRiskEntries: 0
      };
      stats.involvement += 1;
      statsByAuthor.set(participant, stats);
    }

    let firstHighRiskAuthor: string | null = null;
    let previousIntensity: number | null = null;
    let previousAuthor: string | null = null;

    for (const commentId of chain.commentIds) {
      const score = scoreByCommentId.get(commentId);
      const node = commentById.get(commentId);
      if (!score || !node) {
        continue;
      }

      const userStats = statsByAuthor.get(node.author) ?? {
        involvement: 0,
        instigatorPoints: 0,
        escalatorPoints: 0,
        defenderPoints: 0,
        hostileEvents: 0,
        supportEvents: 0,
        curiosityEvents: 0,
        highRiskEntries: 0
      };

      const hostileSignalCount = score.detectedSignals.filter(
        (item) => item.category === "hostility" || item.category === "risk"
      ).length;
      const supportSignalCount = score.detectedSignals.filter((item) => item.category === "support").length;
      const curiositySignalCount = score.detectedSignals.filter((item) => item.category === "curiosity").length;

      userStats.hostileEvents += hostileSignalCount;
      userStats.supportEvents += supportSignalCount;
      userStats.curiosityEvents += curiositySignalCount;
      if (score.priority === "high" || score.score >= 8) {
        userStats.highRiskEntries += 1;
      }

      if (!firstHighRiskAuthor && (score.priority === "high" || score.score >= 8)) {
        firstHighRiskAuthor = node.author;
      }

      if (previousIntensity !== null && previousAuthor !== null && previousAuthor !== node.author) {
        const intensityDelta = score.signals.intensity - previousIntensity;
        if (intensityDelta >= 0.2) {
          userStats.escalatorPoints += 1;
        } else if (intensityDelta <= -0.15) {
          userStats.defenderPoints += 1;
        }
      }

      previousIntensity = score.signals.intensity;
      previousAuthor = node.author;
      statsByAuthor.set(node.author, userStats);
    }

    if (firstHighRiskAuthor) {
      const stats = statsByAuthor.get(firstHighRiskAuthor) ?? {
        involvement: 0,
        instigatorPoints: 0,
        escalatorPoints: 0,
        defenderPoints: 0,
        hostileEvents: 0,
        supportEvents: 0,
        curiosityEvents: 0,
        highRiskEntries: 0
      };
      stats.instigatorPoints += analysis.interactionType === "conflict" ? 2 : 1;
      statsByAuthor.set(firstHighRiskAuthor, stats);
    }
  }

  const roles: Record<string, UserRole> = {};

  for (const [author, stats] of statsByAuthor.entries()) {
    if (
      stats.involvement <= 1 &&
      stats.instigatorPoints === 0 &&
      stats.escalatorPoints === 0 &&
      stats.defenderPoints === 0 &&
      stats.hostileEvents === 0 &&
      stats.supportEvents === 0 &&
      stats.curiosityEvents === 0
    ) {
      roles[author] = "observer";
      continue;
    }

    if (stats.instigatorPoints >= Math.max(stats.escalatorPoints, stats.defenderPoints) && stats.instigatorPoints > 0) {
      roles[author] = "instigator";
      continue;
    }

    if (stats.escalatorPoints > stats.defenderPoints && stats.escalatorPoints > 0) {
      roles[author] = "escalator";
      continue;
    }

    if (stats.hostileEvents >= 2 || (stats.highRiskEntries > 0 && stats.hostileEvents > stats.supportEvents)) {
      roles[author] = "escalator";
      continue;
    }

    if (stats.defenderPoints > 0) {
      roles[author] = "defender";
      continue;
    }

    if (stats.supportEvents > 0 && stats.hostileEvents === 0) {
      roles[author] = "supporter";
      continue;
    }

    if (stats.curiosityEvents > 0 && stats.hostileEvents === 0 && stats.supportEvents === 0) {
      roles[author] = "information_seeker";
      continue;
    }

    roles[author] = "neutral";
  }

  return roles;
}