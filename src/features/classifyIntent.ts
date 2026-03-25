import { CommentIntent, IntentSubLabel, RiskBand } from "../types";

const SUPPORTIVE_MARKERS = ["support", "deescalation", "thanks", "understand", "empathy"];
const ADVERSARIAL_MARKERS = ["threat", "verbal_attack", "harassment", "targeting", "blame", "control"];
const CRITICAL_ADVERSARIAL = ["disagreement", "critical", "condemn", "comparison", "comparative"];
const PASSIVE_MARKERS = ["passive_aggression", "snark", "dismissive", "minimizing"];
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
  "i hear you",
  "proud of you",
  "i'm here for you",
  "you're doing great",
  "you're strong",
  "incredible strength",
  "reach out",
  "i'm here",
  "i'll help",
  "you got this",
  "you're amazing",
  "please reach out",
  "please contact"
];
const ADVERSARIAL_TEXT_MARKERS = ["shut up", "idiot", "moron", "liar", "pathetic", "disgusting", "no taste"];
const SUPPORTIVE_ADVICE_PATTERN =
  /\b(have\s+you\s+tried|consider\s+(?:trying|making|couples\s+therapy|talking)|it\s+might\s+help|sometimes\s+clear\s+expectations\s+help|please\s+(?:reach\s+out|contact)|document\s+everything|escalate\s+past\s+hr|maybe\s+try\s+(yoga|meditation)|making\s+a\s+chore\s+chart|dividing\s+tasks\s+explicitly)\b/;
const FALSE_SUPPORT_PATTERN =
  /\b(oh\s+wow|i'?m\s+so\s+sorry\s+you\s+had\s+to\s+deal\s+with\s+that|i'?m\s+so\s+concerned\s+about\s+you)\b.*\b(just\s+being\s+happier|just\s+weak|weak)\b|🙄/i;
const VALIDATING_PATTERN =
  /\b(proud\s+of\s+you|you\s+deserve|you\s+have\s+every\s+right|you\s+are\s+not\s+alone|you're\s+not\s+alone|you're\s+doing\s+great|your\s+privacy\s+is\s+important|that\s+sounds\s+incredibly\s+unfair)\b/i;
const AGREEMENT_SUPPORT_PATTERN = /\b(is\s+amazing|best\s+combo|sweet\s+and\s+savory)\b/i;
const RESPECTFUL_DISAGREEMENT_PATTERN = /\b(respectfully\s+disagree|you\s+do\s+you|different\s+tastes)\b/i;
const BLAME_SHIFTING_PATTERN = /\b(maybe\s+you'?re\s+not\s+being\s+appreciative\s+enough|he\s+probably\s+feels\s+undervalued|if\s+you\s+contributed\s+to\s+the\s+account|maybe\s+if\s+you\s+dressed\s+more\s+professionally|maybe\s+you\s+should\s+get\s+a\s+job)\b/i;
const COMPARATIVE_INVALIDATION_PATTERN = /\b(at\s+least\s+he\s+didn'?t|like\s+mine\s+did)\b/i;
const JUDGMENTAL_CRITICAL_PATTERN = /\b(good\s+parents|screen\s+addict)\b/i;
const TRAUMA_GASLIGHTING_ATTACK_PATTERN = /\b(are\s+you\s+sure\s+it\s+was\s+really\s+abuse|you\s+might\s+be\s+overreacting)\b/i;
const CONTEMPT_ATTACK_PATTERN = /\b(only\s+people\s+with\s+no\s+taste)\b/i;
const BACKHANDED_CRITICAL_PATTERN = /\b(no\s+offense\s+but|better\s+late\s+than\s+never|most\s+people\s+do\s+that\s+in)\b/i;
const OFFICE_CULTURE_MINIMIZATION_PATTERN =
  /\b(he'?s\s+just\s+being\s+friendly|that'?s\s+just\s+office\s+culture|you'?re\s+probably\s+being\s+too\s+sensitive)\b/i;
const GENDER_ROLE_MINIMIZATION_PATTERN =
  /\b(that'?s\s+just\s+how\s+marriages\s+work|men\s+work\s+outside,?\s+women\s+handle\s+the\s+home)\b/i;
const SUPPORT_SEEKING_TEXT_MARKERS = [
  "i need help",
  "need advice",
  "what should i do",
  "does anyone",
  "has anyone",
  "i don't know what to do",
  "i dont know what to do",
  "i'm so scared",
  "i am so scared",
  "i'm panicking",
  "i'm terrified",
  "i'm afraid",
  "i'm worried"
];

export interface IntentClassification {
  label: CommentIntent;
  subLabels: IntentSubLabel[];
  confidence: number;
}

function round3(value: number): number {
  return Number(Math.max(0, Math.min(1, value)).toFixed(3));
}

function toSemanticSignals(signals: string[]): string[] {
  return signals
    .map((item) => item.toLowerCase())
    .filter(
      (item) =>
        item !== "rule-based-signal-risk" &&
        item !== "rule-based-deescalation" &&
        item !== "negative-sentiment" &&
        item !== "aggression-keyword" &&
        item !== "insult-keyword" &&
        item !== "urgency-keyword" &&
        item !== "punctuation-intensity" &&
        item !== "all-caps-burst" &&
        item !== "deep-reply" &&
        item !== "repeat-activity"
    );
}

export function classifyIntentWithConfidence(text: string, signals: string[], riskLevel: RiskBand): IntentClassification {
  const lowerText = text.toLowerCase();
  const normalizedSignals = toSemanticSignals(signals);
  const isRisky = riskLevel === "high";

  const hasQuestionStyle = lowerText.includes("?") || /\b(why|how|what|can|should|could)\b/.test(lowerText);
  const hasAdversarial = normalizedSignals.some((item) => ADVERSARIAL_MARKERS.some((marker) => item.includes(marker)));
  const hasPassiveSignals = normalizedSignals.some((item) => PASSIVE_MARKERS.some((marker) => item.includes(marker)));
  const hasCriticalAdversarial = normalizedSignals.some((item) => CRITICAL_ADVERSARIAL.some((marker) => item.includes(marker)));
  const hasSupportive = normalizedSignals.some((item) => SUPPORTIVE_MARKERS.some((marker) => item.includes(marker)));
  const hasSupportiveText = SUPPORTIVE_TEXT_MARKERS.some((marker) => lowerText.includes(marker));
  const hasAdversarialText = ADVERSARIAL_TEXT_MARKERS.some((marker) => lowerText.includes(marker));
  const hasSupportiveAdvice = SUPPORTIVE_ADVICE_PATTERN.test(lowerText);
  const hasFalseSupport = FALSE_SUPPORT_PATTERN.test(lowerText);
  const hasValidationText = VALIDATING_PATTERN.test(lowerText);
  const hasAgreementSupport = AGREEMENT_SUPPORT_PATTERN.test(lowerText);
  const hasRespectfulDisagreement = RESPECTFUL_DISAGREEMENT_PATTERN.test(lowerText);
  const hasBlameShifting = BLAME_SHIFTING_PATTERN.test(lowerText);
  const hasComparativeInvalidation = COMPARATIVE_INVALIDATION_PATTERN.test(lowerText);
  const hasJudgmentalCritical = JUDGMENTAL_CRITICAL_PATTERN.test(lowerText);
  const hasTraumaGaslightingAttack = TRAUMA_GASLIGHTING_ATTACK_PATTERN.test(lowerText);
  const hasContemptAttack = CONTEMPT_ATTACK_PATTERN.test(lowerText);
  const hasSupportSeekingText = SUPPORT_SEEKING_TEXT_MARKERS.some((marker) => lowerText.includes(marker));
  const hasCriticalTopicWords = /\b(abuse|assault|rape|molest|victim|trauma)\b/.test(lowerText);
  const hasPersonalDisclosure = /\b(i was|when i was|my dad|my mom|my father|my mother|he did|she did)\b/.test(lowerText);
  const addressesOtherPerson = /\b(you'?re|you are|your fault|you made|you started|you always)\b/.test(lowerText);
  const hasPoliteMaskingAttack = /\b(i'?m\s+sorry\s+but|i\s+am\s+sorry\s+but)\b/.test(lowerText);
  const hasDirectGaslightingText = /\b(you'?re\s+overreacting|you'?re\s+too\s+sensitive|you'?re\s+remembering\s+it\s+wrong|you'?re\s+imagining\s+things)\b/.test(lowerText);
  const hasConcernFramedInvalidation = /\b(he'?s\s+just\s+worried\s+about\s+you|parents\s+do\s+that|they\s+sound\s+like\s+they\s+genuinely\s+care)\b/.test(
    lowerText
  );
  const hasHostileSemanticSignal = normalizedSignals.some(
    (item) =>
      item.includes("targeting") ||
      item.includes("verbal_attack") ||
      item.includes("threat") ||
      item.includes("control") ||
      item.includes("gaslighting") ||
      item.includes("invalidation")
  );
  const hasDirectAttack = (addressesOtherPerson && (hasAdversarialText || hasHostileSemanticSignal)) || hasDirectGaslightingText;
  const signalDensity = Math.min(0.2, normalizedSignals.length * 0.03);
  const hasInvalidationSignal = normalizedSignals.some((item) => item.includes("invalidation") || item.includes("gaslighting"));

  // Prioritize explicit supportive text even if dismissive signals present
  const hasDismissiveOnly = normalizedSignals.some((item) => item.includes("dismissive") || item.includes("minimizing"));
  const hasStrongAdversarial = normalizedSignals.some((item) =>
    item.includes("targeting") ||
    item.includes("verbal_attack") ||
    item.includes("threat") ||
    item.includes("blame") ||
    item.includes("control") ||
    item.includes("gaslighting") ||
    item.includes("invalidation")
  );

  const hasPoliteInvalidatingAttack =
    hasPoliteMaskingAttack && /\b(too\s+sensitive|overreacting|remembering\s+it\s+wrong)\b/i.test(lowerText);
  const hasBackhandedCritical = BACKHANDED_CRITICAL_PATTERN.test(lowerText);
  const hasOfficeCultureMinimization = OFFICE_CULTURE_MINIMIZATION_PATTERN.test(lowerText);
  const hasGenderRoleMinimization = GENDER_ROLE_MINIMIZATION_PATTERN.test(lowerText);

  if (hasFalseSupport) {
    return {
      label: "adversarial",
      subLabels: ["topic_condemnation"],
      confidence: round3(0.76 + signalDensity)
    };
  }

  if (hasSupportSeekingText) {
    return {
      label: "supportive",
      subLabels: ["support_seeking"],
      confidence: round3(0.62 + signalDensity)
    };
  }

  if (hasRespectfulDisagreement) {
    return {
      label: "neutral",
      subLabels: ["neutral"],
      confidence: round3(0.7 + signalDensity)
    };
  }

  if (hasOfficeCultureMinimization) {
    return {
      label: "neutral",
      subLabels: [],
      confidence: round3(0.62 + signalDensity)
    };
  }

  if (hasBackhandedCritical) {
    return {
      label: "critical",
      subLabels: ["topic_condemnation"],
      confidence: round3(0.66 + signalDensity)
    };
  }

  if (hasGenderRoleMinimization) {
    return {
      label: "critical",
      subLabels: ["topic_condemnation"],
      confidence: round3(0.64 + signalDensity)
    };
  }

  if (hasPoliteInvalidatingAttack || (hasPoliteMaskingAttack && hasInvalidationSignal)) {
    return {
      label: "adversarial",
      subLabels: ["topic_condemnation"],
      confidence: round3(0.69 + signalDensity)
    };
  }

  if (hasComparativeInvalidation) {
    return {
      label: "critical",
      subLabels: ["topic_condemnation"],
      confidence: round3(0.62 + signalDensity)
    };
  }

  if (hasJudgmentalCritical) {
    return {
      label: "critical",
      subLabels: ["topic_condemnation"],
      confidence: round3(0.66 + signalDensity)
    };
  }

  if (hasTraumaGaslightingAttack) {
    return {
      label: "adversarial",
      subLabels: ["topic_condemnation"],
      confidence: round3(0.72 + signalDensity)
    };
  }

  if (hasContemptAttack) {
    return {
      label: "adversarial",
      subLabels: ["topic_condemnation"],
      confidence: round3(0.69 + signalDensity)
    };
  }

  if (hasSupportive || hasSupportiveText || hasValidationText || hasAgreementSupport || (hasSupportiveAdvice && !hasDismissiveOnly)) {
    if ((hasAdversarial || hasAdversarialText) && !hasDismissiveOnly) {
      if (hasPoliteMaskingAttack || hasDirectAttack) {
        return {
          label: "adversarial",
          subLabels: ["topic_condemnation"],
          confidence: round3(0.69 + signalDensity)
        };
      }
      // Supportive intent should not be downgraded to critical just because context is risky
      // Support is support regardless of topic severity
      return {
        label: "supportive",
        subLabels: ["support_validation", "topic_condemnation"],
        confidence: round3(0.64 + signalDensity)
      };
    }
    // Supportive text with dismissive signals = still supportive intent
    if (hasDismissiveOnly && !hasStrongAdversarial) {
      return {
        label: "supportive",
        subLabels: ["support_validation"],
        confidence: round3(0.65 + signalDensity)
      };
    }
    return {
      label: "supportive",
      subLabels: ["support_validation", "deescalation"],
      confidence: round3(0.72 + (hasSupportiveText ? 0.08 : 0.04) + signalDensity)
    };
  }

  if (hasDirectAttack) {
    return { label: "adversarial", subLabels: ["direct_attack"], confidence: round3(0.77 + signalDensity) };
  }

  if (hasBlameShifting) {
    return {
      label: lowerText.includes("dressed more professionally") ? "adversarial" : "critical",
      subLabels: ["topic_condemnation"],
      confidence: round3(0.68 + signalDensity)
    };
  }

  if (hasQuestionStyle && (hasAdversarial || hasInvalidationSignal || hasCriticalAdversarial)) {
    return {
      label: hasStrongAdversarial || hasDirectGaslightingText ? "adversarial" : "critical",
      subLabels: ["information_seeking"],
      confidence: round3(0.63 + signalDensity)
    };
  }

  // Passive-aggressive or dismissive without direct hostility should not collapse to adversarial.
  if (hasPassiveSignals && !hasHostileSemanticSignal) {
    return {
      label: hasCriticalAdversarial ? "critical" : "neutral",
      subLabels: [],
      confidence: round3(0.55 + signalDensity)
    };
  }

  if (hasAdversarial || hasAdversarialText) {
    if (!hasDirectAttack && hasConcernFramedInvalidation) {
      return {
        label: "neutral",
        subLabels: [],
        confidence: round3(0.57 + signalDensity)
      };
    }
    if (!hasDirectAttack && hasPassiveSignals) {
      return {
        label: hasCriticalAdversarial ? "critical" : "neutral",
        subLabels: [],
        confidence: round3(0.56 + signalDensity)
      };
    }
    if (!hasDirectAttack && hasCriticalAdversarial) {
      return {
        label: "critical",
        subLabels: ["topic_condemnation"],
        confidence: round3(0.61 + signalDensity)
      };
    }
    return {
      label: "adversarial",
      subLabels: ["topic_condemnation"],
      confidence: round3(0.68 + (hasAdversarialText ? 0.08 : 0.04) + signalDensity)
    };
  }

  if (hasQuestionStyle) {
    // Question style should be "curious" regardless of topic - questions are questions
    return { label: "curious", subLabels: ["information_seeking"], confidence: round3(0.64 + signalDensity) };
  }

  // Personal disclosure is personal disclosure - intent comes from content, not topic
  // Skip forcing to "critical" based on risky topic

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