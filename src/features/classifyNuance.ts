import { BehavioralNuance, RiskBand } from "../types";

export interface NuanceClassification {
  label: BehavioralNuance;
  secondaryLabels: BehavioralNuance[];
  confidence: number;
}

const SUPPORT_MARKERS = ["support", "deescalation", "empathy", "thanks"];
const PASSIVE_AGGRESSION_MARKERS = ["passive_aggression", "passive-aggressive"];
const GUILT_MARKERS = ["guilt", "guilt_induction"];
const THREAT_MARKERS = ["threat", "coercive", "intimidat"];
const POSSESSIVE_MARKERS = ["possessive", "control"];
const GASLIGHTING_MARKERS = ["gaslighting", "invalidation"];
const BOUNDARY_MARKERS = ["boundary_violation", "stalking"];
const COMPARISON_MARKERS = ["comparison", "disagreement", "critical"];
const DEROGATORY_MARKERS = ["verbal_attack", "harassment", "hostility", "targeting"];

const SARCASM_PATTERN = /\b(sure,? right|yeah,? right|as if|wow great)\b/;
const BACKHANDED_PATTERN = /\bno offense\b|\bwith all due respect\b|\bbless your heart\b/;
const POLITE_MASKING_PATTERN = /\b(i'?m sorry but|i am sorry but|respectfully,)\b/;
const SELF_EFFACING_PATTERN = /\b(i might be wrong|maybe i'?m overreacting|sorry if this is dumb)\b/;
const PASSIVE_COMPLIANCE_PATTERN = /\b(fine\.?|whatever\.?|if you say so\.?|okay then\.?)/;
const PROBING_PATTERN = /\?[^\n]*\?|\b(are you okay|what happened|why did)\b/;
const DEFLECTIVE_PATTERN = /\b(anyway|that'?s not the point|you too|what about)\b/;
const BETRAYAL_PATTERN = /\bbetray|trust\s+broken|let me down\b/;
const HURT_PATTERN = /\b(hurt|wounded|heartbroken|painful)\b/;

function round3(value: number): number {
  return Number(Math.max(0, Math.min(1, value)).toFixed(3));
}

function hasAnyToken(haystack: string[], needles: string[]): boolean {
  return haystack.some((value) => needles.some((needle) => value.includes(needle)));
}

export function classifyNuanceWithConfidence(text: string, signals: string[], riskLevel: RiskBand): NuanceClassification {
  const lowerText = (text ?? "").toLowerCase();
  const normalized = signals.map((item) => item.toLowerCase());
  const isRisky = riskLevel === "high" || riskLevel === "critical";
  const signalDensity = Math.min(0.2, normalized.length * 0.03);

  const secondaryLabels = new Set<BehavioralNuance>();
  if (PASSIVE_COMPLIANCE_PATTERN.test(lowerText)) {
    secondaryLabels.add("passive_compliance");
  }
  if (POLITE_MASKING_PATTERN.test(lowerText)) {
    secondaryLabels.add("polite_masking");
  }
  if (PROBING_PATTERN.test(lowerText)) {
    secondaryLabels.add("probing");
  }
  if (DEFLECTIVE_PATTERN.test(lowerText)) {
    secondaryLabels.add("deflective");
  }
  if (SELF_EFFACING_PATTERN.test(lowerText)) {
    secondaryLabels.add("self_effacing");
  }

  if (hasAnyToken(normalized, THREAT_MARKERS)) {
    return { label: "coercive", secondaryLabels: Array.from(secondaryLabels), confidence: round3(0.84 + signalDensity) };
  }

  if (hasAnyToken(normalized, BOUNDARY_MARKERS)) {
    if (normalized.some((item) => item.includes("stalking"))) {
      return { label: "stalking", secondaryLabels: Array.from(secondaryLabels), confidence: round3(0.88 + signalDensity) };
    }
    return { label: "boundary_violation", secondaryLabels: Array.from(secondaryLabels), confidence: round3(0.8 + signalDensity) };
  }

  if (hasAnyToken(normalized, GASLIGHTING_MARKERS)) {
    return { label: "gaslighting", secondaryLabels: Array.from(secondaryLabels), confidence: round3(0.79 + signalDensity) };
  }

  if (hasAnyToken(normalized, DEROGATORY_MARKERS)) {
    return { label: "derogatory", secondaryLabels: Array.from(secondaryLabels), confidence: round3(0.78 + signalDensity) };
  }

  if (hasAnyToken(normalized, PASSIVE_AGGRESSION_MARKERS)) {
    return { label: "passive_aggressive", secondaryLabels: Array.from(secondaryLabels), confidence: round3(0.73 + signalDensity) };
  }

  if (hasAnyToken(normalized, GUILT_MARKERS)) {
    return { label: "guilt_tripping", secondaryLabels: Array.from(secondaryLabels), confidence: round3(0.74 + signalDensity) };
  }

  if (hasAnyToken(normalized, POSSESSIVE_MARKERS) && isRisky) {
    return { label: "possessive", secondaryLabels: Array.from(secondaryLabels), confidence: round3(0.69 + signalDensity) };
  }

  if (BACKHANDED_PATTERN.test(lowerText)) {
    return { label: "backhanded_compliment", secondaryLabels: Array.from(secondaryLabels), confidence: round3(0.68 + signalDensity) };
  }

  if (SARCASM_PATTERN.test(lowerText)) {
    return { label: "sarcastic", secondaryLabels: Array.from(secondaryLabels), confidence: round3(0.66 + signalDensity) };
  }

  if (POLITE_MASKING_PATTERN.test(lowerText)) {
    return { label: "polite_masking", secondaryLabels: Array.from(secondaryLabels), confidence: round3(0.62 + signalDensity) };
  }

  if (PASSIVE_COMPLIANCE_PATTERN.test(lowerText)) {
    return { label: "passive_compliance", secondaryLabels: Array.from(secondaryLabels), confidence: round3(0.64 + signalDensity) };
  }

  if (PROBING_PATTERN.test(lowerText)) {
    return { label: "probing", secondaryLabels: Array.from(secondaryLabels), confidence: round3(0.6 + signalDensity) };
  }

  if (DEFLECTIVE_PATTERN.test(lowerText)) {
    return { label: "deflective", secondaryLabels: Array.from(secondaryLabels), confidence: round3(0.61 + signalDensity) };
  }

  if (BETRAYAL_PATTERN.test(lowerText)) {
    return { label: "betrayal", secondaryLabels: Array.from(secondaryLabels), confidence: round3(0.67 + signalDensity) };
  }

  if (HURT_PATTERN.test(lowerText)) {
    return { label: "hurt", secondaryLabels: Array.from(secondaryLabels), confidence: round3(0.6 + signalDensity) };
  }

  if (SELF_EFFACING_PATTERN.test(lowerText)) {
    return { label: "self_effacing", secondaryLabels: Array.from(secondaryLabels), confidence: round3(0.58 + signalDensity) };
  }

  if (hasAnyToken(normalized, SUPPORT_MARKERS)) {
    return { label: "supportive", secondaryLabels: Array.from(secondaryLabels), confidence: round3(0.64 + signalDensity) };
  }

  if (hasAnyToken(normalized, COMPARISON_MARKERS)) {
    return { label: "comparative", secondaryLabels: Array.from(secondaryLabels), confidence: round3(0.58 + signalDensity) };
  }

  return { label: "neutral", secondaryLabels: Array.from(secondaryLabels), confidence: round3(0.28 + signalDensity) };
}

export function classifyNuance(text: string, signals: string[], riskLevel: RiskBand): BehavioralNuance {
  return classifyNuanceWithConfidence(text, signals, riskLevel).label;
}
