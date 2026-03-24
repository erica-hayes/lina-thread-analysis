import { CommentIntent, IntentSubLabel, RiskBand } from "../types";

const SUPPORTIVE_MARKERS = ["support", "deescalation", "thanks", "understand", "empathy"];
const ADVERSARIAL_MARKERS = ["hostility", "risk", "threat", "verbal_attack", "targeting", "disagreement"];
const SUPPORTIVE_TEXT_MARKERS = [
  "i'm sorry",
  "i am sorry",
  "that sounds hard",
  "i hope",
  "take care",
  "be safe",
  "you deserve",
  "sending love",
  "you are not alone",
  "i hear you"
];
const ADVERSARIAL_TEXT_MARKERS = ["you are", "shut up", "idiot", "moron", "liar", "pathetic", "disgusting"];
const SUPPORT_SEEKING_TEXT_MARKERS = [
  "i need help",
  "need advice",
  "what should i do",
  "does anyone",
  "has anyone",
  "i don't know what to do",
  "i dont know what to do"
];

export interface IntentClassification {
  label: CommentIntent;
  subLabels: IntentSubLabel[];
  confidence: number;
}

function round3(value: number): number {
  return Number(Math.max(0, Math.min(1, value)).toFixed(3));
}

export function classifyIntentWithConfidence(text: string, signals: string[], riskLevel: RiskBand): IntentClassification {
  const lowerText = text.toLowerCase();
  const normalizedSignals = signals.map((item) => item.toLowerCase());
  const isRisky = riskLevel === "high" || riskLevel === "critical";

  const hasQuestionStyle = lowerText.includes("?") || /\b(why|how|what|can|should|could)\b/.test(lowerText);
  const hasAdversarial = normalizedSignals.some((item) => ADVERSARIAL_MARKERS.some((marker) => item.includes(marker)));
  const hasSupportive = normalizedSignals.some((item) => SUPPORTIVE_MARKERS.some((marker) => item.includes(marker)));
  const hasSupportiveText = SUPPORTIVE_TEXT_MARKERS.some((marker) => lowerText.includes(marker));
  const hasAdversarialText = ADVERSARIAL_TEXT_MARKERS.some((marker) => lowerText.includes(marker));
  const hasSupportSeekingText = SUPPORT_SEEKING_TEXT_MARKERS.some((marker) => lowerText.includes(marker));
  const hasCriticalTopicWords = /\b(abuse|assault|rape|molest|victim|trauma)\b/.test(lowerText);
  const hasPersonalDisclosure = /\b(i was|when i was|my dad|my mom|my father|my mother|he did|she did)\b/.test(lowerText);
  const hasDirectAttack = /\byou\b/.test(lowerText) && (hasAdversarial || hasAdversarialText);
  const signalDensity = Math.min(0.2, normalizedSignals.length * 0.03);

  if (hasDirectAttack) {
    return { label: "adversarial", subLabels: ["direct_attack"], confidence: round3(0.77 + signalDensity) };
  }

  if (hasSupportive || hasSupportiveText) {
    if (hasAdversarial || hasAdversarialText) {
      return {
        label: isRisky ? "critical" : "neutral",
        subLabels: ["support_validation", "topic_condemnation"],
        confidence: round3((isRisky ? 0.66 : 0.44) + signalDensity)
      };
    }
    return {
      label: "supportive",
      subLabels: ["support_validation", "deescalation"],
      confidence: round3(0.72 + (hasSupportiveText ? 0.08 : 0.04) + signalDensity)
    };
  }

  if (hasAdversarial || hasAdversarialText) {
    return {
      label: "adversarial",
      subLabels: ["topic_condemnation"],
      confidence: round3(0.68 + (hasAdversarialText ? 0.08 : 0.04) + signalDensity)
    };
  }

  if (hasQuestionStyle) {
    if (isRisky && hasCriticalTopicWords) {
      return { label: "critical", subLabels: ["information_seeking", "topic_condemnation"], confidence: round3(0.72 + signalDensity) };
    }
    return { label: "curious", subLabels: ["information_seeking"], confidence: round3(0.64 + signalDensity) };
  }

  if (hasSupportSeekingText) {
    return {
      label: isRisky ? "critical" : "curious",
      subLabels: ["support_seeking"],
      confidence: round3((isRisky ? 0.69 : 0.62) + signalDensity)
    };
  }

  if (isRisky && hasCriticalTopicWords && hasPersonalDisclosure) {
    return { label: "critical", subLabels: ["personal_disclosure", "topic_condemnation"], confidence: round3(0.74 + signalDensity) };
  }

  if (
    normalizedSignals.some((item) => item.includes("disagreement") || item.includes("critical")) ||
    hasCriticalTopicWords
  ) {
    return { label: "critical", subLabels: ["topic_condemnation"], confidence: round3(0.57 + signalDensity) };
  }

  return { label: "neutral", subLabels: ["neutral"], confidence: round3(0.2 + signalDensity) };
}

export function classifyIntent(text: string, signals: string[], riskLevel: RiskBand): CommentIntent {
  return classifyIntentWithConfidence(text, signals, riskLevel).label;
}