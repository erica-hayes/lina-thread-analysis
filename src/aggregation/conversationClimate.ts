import { ChainAnalysis } from "../chains/types";
import { CommentNode } from "../graph/types";
import { ConversationClimate, Stage1ScoredComment } from "../types";

function toMap(scoredComments: Stage1ScoredComment[]): Map<string, Stage1ScoredComment> {
  const map = new Map<string, Stage1ScoredComment>();
  for (const score of scoredComments) {
    map.set(score.commentId, score);
  }
  return map;
}

export function computeConversationClimate(
  comments: CommentNode[],
  scoredComments: Stage1ScoredComment[],
  chains: ChainAnalysis[]
): ConversationClimate {
  if (comments.length === 0 || scoredComments.length === 0) {
    return {
      label: "neutral",
      emotionalIntensity: "calm",
      socialIntent: "neutral",
      confidence: 0.3,
      factors: ["insufficient-data"]
    };
  }

  const byId = toMap(scoredComments);

  let hostilitySignals = 0;
  let supportSignals = 0;
  let curiositySignals = 0;
  let passiveAggressionSignals = 0;

  let totalIntensity = 0;
  let totalTargeting = 0;
  let totalDisagreement = 0;

  let sampleCount = 0;
  for (const comment of comments) {
    const score = byId.get(comment.id);
    if (!score) {
      continue;
    }

    sampleCount += 1;
    totalIntensity += score.signals.intensity;
    totalTargeting += score.signals.targeting;
    totalDisagreement += score.signals.disagreement;

    for (const signal of score.detectedSignals) {
      if (signal.category === "hostility" || signal.category === "risk") {
        hostilitySignals += 1;
      } else if (signal.category === "support") {
        supportSignals += 1;
      } else if (signal.category === "curiosity") {
        curiositySignals += 1;
      } else if (signal.category === "passive_aggression") {
        passiveAggressionSignals += 1;
      }
    }
  }

  const safeDivisor = Math.max(sampleCount, 1);
  const avgIntensity = totalIntensity / safeDivisor;
  const avgTargeting = totalTargeting / safeDivisor;
  const avgDisagreement = totalDisagreement / safeDivisor;

  const hostileChainCount = chains.filter((chain) => chain.interactionType === "conflict").length;
  const topEscalation = chains[0]?.escalationScore ?? 0;

  const hostilityPressure = hostilitySignals * 0.08 + avgTargeting * 0.45 + topEscalation * 0.35;
  const supportPressure = supportSignals * 0.08 + curiositySignals * 0.03;

  let label: ConversationClimate["label"] = "neutral";
  if (hostilityPressure >= 0.65 || hostileChainCount >= 2) {
    label = "hostile";
  } else if (avgIntensity >= 0.6 || topEscalation >= 0.58) {
    label = "volatile";
  } else if (supportPressure > hostilityPressure && supportPressure >= 0.25) {
    label = "supportive";
  } else if (hostilityPressure > 0.2 && supportPressure > 0.12) {
    label = "mixed";
  }

  let emotionalIntensity: ConversationClimate["emotionalIntensity"] = "calm";
  const intensityComposite = avgIntensity * 0.5 + topEscalation * 0.35 + (passiveAggressionSignals > 0 ? 0.1 : 0);
  if (intensityComposite >= 0.72) {
    emotionalIntensity = "hostile";
  } else if (intensityComposite >= 0.55) {
    emotionalIntensity = "volatile";
  } else if (intensityComposite >= 0.3) {
    emotionalIntensity = "elevated";
  }

  let socialIntent: ConversationClimate["socialIntent"] = "neutral";
  if (curiositySignals > hostilitySignals && curiositySignals > 0) {
    socialIntent = "curiosity";
  }
  if (supportSignals > 0 && hostilitySignals === 0) {
    socialIntent = "support-seeking";
  }
  if (hostilitySignals > supportSignals && (avgDisagreement > 0.3 || avgTargeting > 0.25)) {
    socialIntent = "adversarial";
  }
  if (supportSignals > 0 && hostilitySignals > 0) {
    socialIntent = "mixed";
  }

  const factors = [
    `hostility_signals:${hostilitySignals}`,
    `support_signals:${supportSignals}`,
    `passive_aggression:${passiveAggressionSignals}`,
    `avg_intensity:${avgIntensity.toFixed(3)}`,
    `top_chain_escalation:${topEscalation.toFixed(3)}`
  ];

  const confidence = Number(
    Math.min(1, 0.35 + Math.min(0.45, sampleCount / 80) + Math.min(0.2, Math.abs(hostilityPressure - supportPressure))).toFixed(3)
  );

  return {
    label,
    emotionalIntensity,
    socialIntent,
    confidence,
    factors
  };
}