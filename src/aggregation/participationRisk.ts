import { AlignmentSummary, ConversationClimate, ParticipationRisk, RiskBand, TopicRisk } from "../types";

function bandToScore(level: RiskBand): number {
  if (level === "critical") {
    return 1;
  }
  if (level === "high") {
    return 0.78;
  }
  if (level === "moderate") {
    return 0.56;
  }
  if (level === "low") {
    return 0.3;
  }
  return 0;
}

function scoreToBand(score: number): RiskBand {
  if (score >= 0.82) {
    return "critical";
  }
  if (score >= 0.64) {
    return "high";
  }
  if (score >= 0.42) {
    return "moderate";
  }
  if (score >= 0.2) {
    return "low";
  }
  return "none";
}

export function computeParticipationRisk(
  climate: ConversationClimate,
  alignment: AlignmentSummary,
  topicRisk: TopicRisk,
  commentRisk: number
): ParticipationRisk {
  const topicScore = bandToScore(topicRisk.level);

  const hostileBoost = climate.label === "hostile" ? 0.26 : climate.label === "volatile" ? 0.2 : 0.08;
  const adversarialBoost = climate.socialIntent === "adversarial" ? 0.2 : climate.socialIntent === "mixed" ? 0.1 : 0;
  const polarizationBoost = alignment.label === "polarized" ? 0.22 : alignment.label === "fragmented" ? 0.15 : 0.06;

  const disagreeingScore = Math.min(
    1,
    commentRisk * 0.28 + topicScore * 0.3 + hostileBoost + adversarialBoost + alignment.dissentPressure * 0.35 + polarizationBoost * 0.8
  );

  const agreeingScore = Math.min(
    1,
    commentRisk * 0.22 + topicScore * 0.28 + hostileBoost * 0.7 + Math.max(0, polarizationBoost - 0.05) + (climate.label === "supportive" ? -0.12 : 0)
  );

  const neutralScore = Math.min(
    1,
    commentRisk * 0.18 + topicScore * 0.25 + hostileBoost * 0.5 + polarizationBoost * 0.6 + (alignment.label === "polarized" ? 0.1 : 0)
  );

  return {
    agreeing: scoreToBand(agreeingScore),
    stayingNeutral: scoreToBand(neutralScore),
    disagreeing: scoreToBand(disagreeingScore),
    factors: [
      `topic_level:${topicRisk.level}`,
      `climate:${climate.label}`,
      `alignment:${alignment.label}`,
      `comment_risk:${commentRisk.toFixed(3)}`
    ]
  };
}