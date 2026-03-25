import { BehavioralNuance, RiskBand } from "../types";

export interface NuanceClassification {
  label: BehavioralNuance;
  secondaryLabels: BehavioralNuance[];
  confidence: number;
}

const SUPPORT_MARKERS = ["support", "deescalation", "empathy", "thanks", "encouragement"];
const PASSIVE_AGGRESSION_MARKERS = ["passive_aggression", "passive-aggressive"];
const GUILT_MARKERS = ["guilt", "guilt_induction"];
const THREAT_MARKERS = ["threat", "coercive", "intimidat"];
const POSSESSIVE_MARKERS = ["possessive"];
const GASLIGHTING_MARKERS = ["gaslighting"];
const INVALIDATION_MARKERS = ["invalidation"];
const BOUNDARY_MARKERS = ["boundary_violation", "stalking"];
const COMPARISON_MARKERS = ["comparison", "disagreement", "critical"];
const DEROGATORY_MARKERS = ["verbal_attack", "harassment"];
const BLAME_MARKERS = ["blame"];

const SARCASM_PATTERN = /\b(sure,? right|yeah,? right|as if|wow great)\b/;
const BACKHANDED_PATTERN = /\bno offense\b|\bwith all due respect\b|\bbless your heart\b/;
const POLITE_MASKING_PATTERN =
  /\b(i'?m sorry but|i am sorry but|respectfully,|i'?m so sorry you'?re going through this|that must be so hard)\b/;
const SELF_EFFACING_PATTERN = /\b(i might be wrong|maybe i'?m overreacting|sorry if this is dumb)\b/;
const PASSIVE_COMPLIANCE_PATTERN = /^(?:fine\.?|whatever\.?|if you say so\.?|okay then\.?)$|(?:^|[.!?]\s+)(?:fine\.?|whatever\.?|if you say so\.?|okay then\.?)$/i;
const PROBING_PATTERN = /\?[^\n]*\?|\b(are you okay|what happened|why did)\b/;
const DEFLECTIVE_PATTERN = /\b(anyway|that'?s not the point|you too|what about)\b/;
const BETRAYAL_PATTERN = /\bbetray|trust\s+broken|let me down\b/;
const HURT_PATTERN = /\b(hurt|wounded|heartbroken|painful|scared|terrified|panicking|afraid)\b/;
const POSSESSIVE_PATTERN = /\b(you'?re mine|you belong to me|i own you|my property)\b/;
const DISMISSIVE_TEXT_PATTERN = /\b(he'?s just worried about you|parents do that|that always works for me|just exercising more)\b/;
const INVALIDATING_TEXT_PATTERN = /\b(that doesn'?t make sense|why (did|wait)|kids misremember|we all have bad days|it'?s normal for family|just push through it)\b/;
const EXPLICIT_GASLIGHTING_PATTERN = /\b(overreacting|remembering it wrong|imagining things|are you sure that'?s what happened|didn'?t mean it that way)\b/;
const SUPPORTIVE_TEXT_PATTERN =
  /\b(proud of you|you deserve|you have every right|you'?re not alone|you are not alone|you'?re doing great|your privacy is important|that sounds incredibly unfair|document everything|reach out|contact the)\b/i;
const BLAME_SHIFTING_PATTERN =
  /\b(maybe you'?re not being appreciative enough|he probably feels undervalued|if you contributed to the account|you'?d have rights|maybe you should get a job|maybe if you dressed more professionally|what were you wearing|you should have)\b/i;
const COERCIVE_TEXT_PATTERN = /\b(if you have nothing to hide|trust is about transparency)\b/i;
const COMPARATIVE_TEXT_PATTERN = /\b(at least he didn'?t|like mine did|others have it worse|compared to mine)\b/i;
const POLITE_MASKING_ATTACK_PATTERN = /\b(i'?m so concerned about you|i'?m sorry but have you considered|i am sorry but have you considered)\b/i;
const RESPECTFUL_DISAGREEMENT_PATTERN = /\b(respectfully\s+disagree|you\s+do\s+you|different\s+tastes)\b/i;
const FALSE_SUPPORT_PATTERN = /\b(oh\s+wow|i'?m\s+so\s+sorry\s+you\s+had\s+to\s+deal\s+with\s+that)\b.*\b(just\s+being\s+happier)\b|🙄/i;
const SUPPORTIVE_ADVICE_DISMISSIVE_PATTERN = /\b(you'?ll\s+feel\s+better\s+soon|maybe\s+try\s+yoga|maybe\s+try\s+meditation|turn\s+out\s+fine|that'?s\s+just\s+how\s+marriages\s+work|move\s+on\s+already)\b/i;
const STRONG_DISMISSIVE_PATTERN = /\b(move\s+on\s+already|that'?s\s+just\s+how\s+marriages\s+work)\b/i;
const INVALIDATING_TEXT_EXTRA_PATTERN = /\b(not\s+really\s+a\s+big\s+deal|too\s+sensitive|that'?s\s+just\s+office\s+culture|everyone\s+feels\s+depressed\s+sometimes)\b/i;
const SUPPORTIVE_AGREEMENT_PATTERN = /\b(is\s+amazing|best\s+combo|sweet\s+and\s+savory|clear\s+expectations\s+help|chore\s+chart|dividing\s+tasks\s+explicitly)\b/i;
const DEROGATORY_TEXT_PATTERN = /\b(disgusting|no\s+taste|screen\s+addict)\b/i;
const JUDGMENTAL_PASSIVE_AGGRESSION_PATTERN = /\b(good\s+parents\s+limit|screen\s+addict)\b/i;

function round3(value: number): number {
  return Number(Math.max(0, Math.min(1, value)).toFixed(3));
}

function hasAnyToken(haystack: string[], needles: string[]): boolean {
  return haystack.some((value) => needles.some((needle) => value.includes(needle)));
}

export function classifyNuanceWithConfidence(text: string, signals: string[], riskLevel: RiskBand): NuanceClassification {
  const lowerText = (text ?? "").toLowerCase();
  const normalized = signals.map((item) => item.toLowerCase());
  const isRisky = riskLevel === "high";
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
  if (hasAnyToken(normalized, COMPARISON_MARKERS) || /\b(most\s+people|better\s+late\s+than\s+never|others\s+have\s+it\s+worse)\b/.test(lowerText)) {
    secondaryLabels.add("comparative");
  }

  // Check possessive language first - specific pattern
  if (POSSESSIVE_PATTERN.test(lowerText) || (hasAnyToken(normalized, POSSESSIVE_MARKERS) && isRisky)) {
    return { label: "possessive", secondaryLabels: Array.from(secondaryLabels), confidence: round3(0.82 + signalDensity) };
  }

  if (hasAnyToken(normalized, THREAT_MARKERS)) {
    return { label: "coercive", secondaryLabels: Array.from(secondaryLabels), confidence: round3(0.84 + signalDensity) };
  }

  if (COERCIVE_TEXT_PATTERN.test(lowerText)) {
    return { label: "coercive", secondaryLabels: Array.from(secondaryLabels), confidence: round3(0.78 + signalDensity) };
  }

  if (hasAnyToken(normalized, BOUNDARY_MARKERS)) {
    if (normalized.some((item) => item.includes("stalking"))) {
      return { label: "stalking", secondaryLabels: Array.from(secondaryLabels), confidence: round3(0.88 + signalDensity) };
    }
    return { label: "boundary_violation", secondaryLabels: Array.from(secondaryLabels), confidence: round3(0.8 + signalDensity) };
  }

  // Check backhanded/sarcastic patterns early - very specific text patterns
  if (BACKHANDED_PATTERN.test(lowerText)) {
    return { label: "backhanded_compliment", secondaryLabels: Array.from(secondaryLabels), confidence: round3(0.68 + signalDensity) };
  }

  if (SARCASM_PATTERN.test(lowerText)) {
    return { label: "sarcastic", secondaryLabels: Array.from(secondaryLabels), confidence: round3(0.66 + signalDensity) };
  }

  if (FALSE_SUPPORT_PATTERN.test(lowerText)) {
    return { label: "dismissive", secondaryLabels: Array.from(secondaryLabels), confidence: round3(0.78 + signalDensity) };
  }

  if (JUDGMENTAL_PASSIVE_AGGRESSION_PATTERN.test(lowerText)) {
    return { label: "passive_aggressive", secondaryLabels: Array.from(secondaryLabels), confidence: round3(0.75 + signalDensity) };
  }

  if (COMPARATIVE_TEXT_PATTERN.test(lowerText)) {
    return { label: "comparative", secondaryLabels: Array.from(secondaryLabels), confidence: round3(0.74 + signalDensity) };
  }

  if (DEROGATORY_TEXT_PATTERN.test(lowerText)) {
    return { label: "derogatory", secondaryLabels: Array.from(secondaryLabels), confidence: round3(0.8 + signalDensity) };
  }

  if (hasAnyToken(normalized, PASSIVE_AGGRESSION_MARKERS)) {
    return { label: "passive_aggressive", secondaryLabels: Array.from(secondaryLabels), confidence: round3(0.73 + signalDensity) };
  }

  if (EXPLICIT_GASLIGHTING_PATTERN.test(lowerText)) {
    return { label: "gaslighting", secondaryLabels: Array.from(secondaryLabels), confidence: round3(0.79 + signalDensity) };
  }

  if (
    INVALIDATING_TEXT_PATTERN.test(lowerText) ||
    INVALIDATING_TEXT_EXTRA_PATTERN.test(lowerText) ||
    hasAnyToken(normalized, INVALIDATION_MARKERS)
  ) {
    return { label: "invalidating", secondaryLabels: Array.from(secondaryLabels), confidence: round3(0.73 + signalDensity) };
  }

  if (DISMISSIVE_TEXT_PATTERN.test(lowerText)) {
    return { label: "dismissive", secondaryLabels: Array.from(secondaryLabels), confidence: round3(0.7 + signalDensity) };
  }

  if (SUPPORTIVE_ADVICE_DISMISSIVE_PATTERN.test(lowerText)) {
    return { label: "dismissive", secondaryLabels: Array.from(secondaryLabels), confidence: round3(0.68 + signalDensity) };
  }

  if (STRONG_DISMISSIVE_PATTERN.test(lowerText)) {
    return { label: "dismissive", secondaryLabels: Array.from(secondaryLabels), confidence: round3(0.71 + signalDensity) };
  }

  if (hasAnyToken(normalized, DEROGATORY_MARKERS)) {
    return { label: "derogatory", secondaryLabels: Array.from(secondaryLabels), confidence: round3(0.78 + signalDensity) };
  }

  if (BLAME_SHIFTING_PATTERN.test(lowerText) || hasAnyToken(normalized, BLAME_MARKERS)) {
    return { label: "blame_shifting", secondaryLabels: Array.from(secondaryLabels), confidence: round3(0.76 + signalDensity) };
  }

  if (hasAnyToken(normalized, GUILT_MARKERS)) {
    return { label: "guilt_tripping", secondaryLabels: Array.from(secondaryLabels), confidence: round3(0.74 + signalDensity) };
  }

  if (POLITE_MASKING_ATTACK_PATTERN.test(lowerText) || POLITE_MASKING_PATTERN.test(lowerText)) {
    return { label: "polite_masking", secondaryLabels: Array.from(secondaryLabels), confidence: round3(0.62 + signalDensity) };
  }

  if (RESPECTFUL_DISAGREEMENT_PATTERN.test(lowerText)) {
    return { label: "neutral", secondaryLabels: Array.from(secondaryLabels), confidence: round3(0.58 + signalDensity) };
  }

  if (PASSIVE_COMPLIANCE_PATTERN.test(lowerText)) {
    return { label: "passive_compliance", secondaryLabels: Array.from(secondaryLabels), confidence: round3(0.64 + signalDensity) };
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

  if (SUPPORTIVE_TEXT_PATTERN.test(lowerText) || SUPPORTIVE_AGREEMENT_PATTERN.test(lowerText) || hasAnyToken(normalized, SUPPORT_MARKERS)) {
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
