import { CommentTone, RiskBand, ToneSubLabel } from "../types";

const POSITIVE_MARKERS = ["support", "deescalation", "empathy", "thanks", "curiosity"];
const NEGATIVE_MARKERS = [
  "hostility",
  "risk",
  "threat",
  "verbal_attack",
  "harassment",
  "targeting",
  "adversarial"
];

const NEGATIVE_TEXT_PATTERNS = [
  /\bidiot\b/,
  /\bstupid\b/,
  /\bshut up\b/,
  /\btrash\b/,
  /\bpathetic\b/,
  /\bi hate you\b/,
  /\byou(?:'re| are)\s+(?:an?\s+)?(?:idiot|stupid|trash|pathetic|disgusting)\b/
];
const POSITIVE_TEXT_MARKERS = ["sorry", "thank you", "i understand", "i hear you", "be safe", "take care"];
const EMPATHY_CONTEXT_MARKERS = [
  "feel horrible for",
  "feels horrible for",
  "sympathy",
  "innocent",
  "victim",
  "their kids",
  "the kids",
  "sadness",
  "shame"
];

const ACTION_CONDEMNATION_PATTERN =
  /\b(disgusting|horrible|awful|criminal)\b.{0,28}\b(action|actions|behavior|behaviour|conduct|crime|crimes)\b|\b(action|actions|behavior|behaviour|conduct|crime|crimes)\b.{0,28}\b(disgusting|horrible|awful|criminal)\b/;

const DIRECT_ATTACK_PATTERN =
  /\byou(?:'re| are)?\b.{0,30}\b(idiot|stupid|trash|pathetic|disgusting|awful|hate)\b|\b(hate|despise)\s+you\b/;

const ANXIOUS_TEXT_MARKERS = ["worried", "i worry", "anxious", "scared", "afraid", "panic", "urgent"];
const SAD_TEXT_MARKERS = ["sad", "heartbreaking", "grief", "shame", "loss", "hurt"];

export interface ToneClassification {
  label: CommentTone;
  subLabels: ToneSubLabel[];
  confidence: number;
}

function round3(value: number): number {
  return Number(Math.max(0, Math.min(1, value)).toFixed(3));
}

export function classifyToneWithConfidence(text: string, signals: string[], riskLevel: RiskBand): ToneClassification {
  const lowerText = (text ?? "").toLowerCase();
  const normalized = signals.map((item) => item.toLowerCase());

  const hasPositive = normalized.some((item) => POSITIVE_MARKERS.some((marker) => item.includes(marker)));
  const hasNegative = normalized.some((item) => NEGATIVE_MARKERS.some((marker) => item.includes(marker)));
  const hasHostilitySignal = normalized.some(
    (item) => item.includes("hostility") || item.includes("verbal_attack") || item.includes("harassment")
  );
  const hasPositiveText = POSITIVE_TEXT_MARKERS.some((marker) => lowerText.includes(marker));
  const hasNegativeText = NEGATIVE_TEXT_PATTERNS.some((pattern) => pattern.test(lowerText));
  const hasEmpatheticContext = EMPATHY_CONTEXT_MARKERS.some((marker) => lowerText.includes(marker));
  const hasActionCondemnation = ACTION_CONDEMNATION_PATTERN.test(lowerText);
  const hasDirectAttack = DIRECT_ATTACK_PATTERN.test(lowerText);
  const hasAnxiousText = ANXIOUS_TEXT_MARKERS.some((marker) => lowerText.includes(marker));
  const hasSadText = SAD_TEXT_MARKERS.some((marker) => lowerText.includes(marker));
  const hasCriticismSignal = normalized.some(
    (item) => item.includes("disagreement") || item.includes("critical") || item.includes("condemn")
  );
  const hasIntensitySignal = normalized.some(
    (item) => item.includes("intensity") || item.includes("instability") || item.includes("urgency")
  );
  const isRisky = riskLevel === "high" || riskLevel === "critical";
  const riskyTopicMention = /\b(abuse|assault|rape|molest|threat|violence)\b/.test(lowerText);

  const signalDensity = Math.min(0.2, normalized.length * 0.03);

  const contextualNonHostileNegative =
    (hasEmpatheticContext || hasActionCondemnation) && !hasDirectAttack && !hasHostilitySignal;

  if (hasNegative || hasNegativeText) {
    if (contextualNonHostileNegative) {
      const toneSubLabel: ToneSubLabel = hasAnxiousText ? "anxious" : hasSadText ? "sad" : "respectful";
      return {
        label: "neutral",
        subLabels: [toneSubLabel],
        confidence: round3(0.53 + signalDensity)
      };
    }

    if ((hasPositive || hasPositiveText) && !isRisky) {
      return {
        label: "neutral",
        subLabels: ["mixed"],
        confidence: round3(0.42 + signalDensity)
      };
    }

    if (hasDirectAttack || hasHostilitySignal) {
      return {
        label: "negative",
        subLabels: ["hostile"],
        confidence: round3(0.72 + (hasNegativeText ? 0.1 : 0.05) + signalDensity)
      };
    }

    if (hasCriticismSignal || hasActionCondemnation) {
      return {
        label: "negative",
        subLabels: ["critical"],
        confidence: round3(0.66 + (hasNegativeText ? 0.08 : 0.04) + signalDensity)
      };
    }

    const toneSubLabel: ToneSubLabel = hasIntensitySignal ? "emotional" : "critical";
    return {
      label: "negative",
      subLabels: [toneSubLabel],
      confidence: round3(0.68 + (hasNegativeText ? 0.12 : 0.06) + signalDensity)
    };
  }

  if (hasPositive || hasPositiveText) {
    if (hasAnxiousText) {
      return {
        label: "neutral",
        subLabels: ["anxious"],
        confidence: round3(0.58 + signalDensity)
      };
    }

    if (hasSadText && isRisky) {
      return {
        label: "neutral",
        subLabels: ["sad"],
        confidence: round3(0.56 + signalDensity)
      };
    }

    const toneSubLabel: ToneSubLabel = hasEmpatheticContext ? "respectful" : "supportive";
    return {
      label: "positive",
      subLabels: [toneSubLabel],
      confidence: round3(0.66 + (hasPositiveText ? 0.1 : 0.05) + signalDensity)
    };
  }

  if (isRisky && riskyTopicMention) {
    if (hasSadText) {
      return {
        label: "neutral",
        subLabels: ["sad"],
        confidence: round3(0.5 + signalDensity)
      };
    }

    if (hasAnxiousText) {
      return {
        label: "neutral",
        subLabels: ["anxious"],
        confidence: round3(0.49 + signalDensity)
      };
    }

    const toneSubLabel: ToneSubLabel = hasIntensitySignal ? "emotional" : "neutral";
    return {
      label: "neutral",
      subLabels: [toneSubLabel],
      confidence: round3(0.46 + signalDensity)
    };
  }

  return {
    label: "neutral",
    subLabels: ["neutral"],
    confidence: round3(0.22 + signalDensity)
  };
}

export function classifyTone(text: string, signals: string[], riskLevel: RiskBand): CommentTone {
  return classifyToneWithConfidence(text, signals, riskLevel).label;
}