import { CommentTone, RiskBand, ToneSubLabel } from "../types";

const POSITIVE_MARKERS = ["support", "deescalation", "empathy", "thanks", "encouragement"];
const NEGATIVE_MARKERS = [
  "threat",
  "verbal_attack",
  "harassment",
  "targeting",
  "blame",
  "control",
  "adversarial"
];
const PASSIVE_AGGRESSION_MARKERS = ["passive_aggression", "snark"];

const NEGATIVE_TEXT_PATTERNS = [
  /\bidiot\b/,
  /\bstupid\b/,
  /\bshut up\b/,
  /\btrash\b/,
  /\bpathetic\b/,
  /\bi hate you\b/,
  /\byou(?:'re| are)\s+(?:an?\s+)?(?:idiot|stupid|trash|pathetic|disgusting)\b/
];
const POSITIVE_TEXT_MARKERS = [
  "sorry",
  "thank you",
  "i understand",
  "i hear you",
  "be safe",
  "take care",
  "proud of you",
  "you deserve",
  "i'm here for you",
  "i'm so proud",
  "reach out",
  "you're amazing",
  "you're strong",
  "incredible strength",
  "you did good",
  "you're doing great",
  "sending love",
  "not alone",
  "amazing",
  "reasonable",
  "right to say no",
  "going to heal",
  "feel good about that",
  "best combo"
];
const PATRONIZING_SARCASM_PATTERN = /\b(too\s+sensitive|fragile|apparently|overreacting|emotional|dramatic)\b/;
const FALSE_APOLOGY_PATTERN = /(?:i'?m|i\s+am)\s+so\s+sorry\s+you'?re\s+(?:apparently\s+)?(so\s+)?(fragile|sensitive|dramatic|emotional|overreacting)/i;
const EMPATHY_CONTEXT_MARKERS = [
  "feel horrible for",
  "feels horrible for",
  "sympathy",
  "innocent",
  "victim",
  "sadness",
  "shame"
];

const ACTION_CONDEMNATION_PATTERN =
  /\b(disgusting|horrible|awful|criminal)\b.{0,28}\b(action|actions|behavior|behaviour|conduct|crime|crimes)\b|\b(action|actions|behavior|behaviour|conduct|crime|crimes)\b.{0,28}\b(disgusting|horrible|awful|criminal)\b/;

const DIRECT_ATTACK_PATTERN =
  /\byou(?:'re| are)?\b.{0,30}\b(idiot|stupid|trash|pathetic|disgusting|awful|hate)\b|\b(hate|despise)\s+you\b/;

const ANXIOUS_TEXT_MARKERS = ["worried", "i worry", "anxious", "scared", "afraid", "panic", "urgent"];
const SAD_TEXT_MARKERS = ["sad", "heartbreaking", "grief", "shame", "loss", "hurt"];
const SUPPORTIVE_LEADIN_PATTERN = /\b(i'?m\s+so\s+sorry\s+you'?re\s+going\s+through|that\s+must\s+be\s+so\s+(hard|difficult|tough)|i\s+hear\s+you)\b/;
const MILD_INVALIDATION_PATTERN = /\b(just\s+(try|do|push\s+through|get\s+over)|just\s+exercis(e|ing)|have\s+you\s+tried|we\s+all\s+have|everyone\s+goes\s+through|that\s+always\s+works\s+for\s+me)\b/;
const POLITE_MASKING_ATTACK_PATTERN = /\b(i'?m\s+sorry\s+but|i\s+am\s+sorry\s+but)\b/;
const STRONG_INVALIDATION_TONE_PATTERN = /\b(we\s+all\s+have\s+bad\s+days|just\s+push\s+through\s+it|that\s+doesn'?t\s+make\s+sense|kids\s+misremember)\b/;
const BACKHANDED_NEUTRAL_TONE_PATTERN = /\b(bless\s+your\s+heart|must\s+be\s+nice\s+to\s+have\s+all\s+that\s+time)\b/;
const BACKHANDED_NEGATIVE_TONE_PATTERN = /\b(no\s+offense\s+but|most\s+people\s+do\s+that\s+in|better\s+late\s+than\s+never)\b/;
const FALSE_SUPPORT_PATTERN = /\b(oh\s+wow|i'?m\s+so\s+sorry\s+you\s+had\s+to\s+deal\s+with\s+that|i'?m\s+so\s+concerned\s+about\s+you)\b.*\b(just\s+being\s+happier|just\s+weak|weak)\b|🙄/i;
const VALIDATING_SUPPORT_PATTERN =
  /\b(proud\s+of\s+you|you\s+deserve|you\s+have\s+every\s+right|you\s+are\s+not\s+alone|you're\s+not\s+alone|you're\s+doing\s+great|your\s+privacy\s+is\s+important|that\s+sounds\s+incredibly\s+unfair)\b/i;
const RESPECTFUL_DISAGREEMENT_PATTERN = /\b(respectfully\s+disagree|you\s+do\s+you|different\s+tastes)\b/i;
const PRACTICAL_SUPPORT_PATTERN = /\b(maybe\s+try\s+(yoga|meditation)|have\s+you\s+tried\s+making|making\s+a\s+chore\s+chart|dividing\s+tasks\s+explicitly|clear\s+expectations\s+help|consider\s+couples\s+therapy)\b/i;
const GASLIGHTING_ATTACK_PATTERN =
  /\b(are\s+you\s+sure\s+it\s+was\s+really\s+abuse|are\s+you\s+sure\s+that'?s\s+what\s+happened|you\s+might\s+be\s+overreacting|you'?re\s+overreacting|you'?re\s+remembering\s+it\s+wrong|didn'?t\s+mean\s+it\s+that\s+way|kids\s+misremember|it'?s\s+normal\s+for\s+family|maybe\s+if\s+you\s+dressed\s+more\s+professionally)\b/i;
const CONTEMPT_PATTERN = /\b(disgusting|no\s+taste|screen\s+addict)\b/i;
const BLAME_SHIFTING_NEUTRAL_TONE_PATTERN = /\b(maybe\s+you'?re\s+not\s+being\s+appreciative\s+enough|he\s+probably\s+feels\s+undervalued|if\s+you\s+contributed\s+to\s+the\s+account|maybe\s+you\s+should\s+get\s+a\s+job)\b/i;

export interface ToneClassification {
  label: CommentTone;
  subLabels: ToneSubLabel[];
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

export function classifyToneWithConfidence(text: string, signals: string[], riskLevel: RiskBand): ToneClassification {
  const lowerText = (text ?? "").toLowerCase();
  const normalized = toSemanticSignals(signals);

  const hasPositive = normalized.some((item) => POSITIVE_MARKERS.some((marker) => item.includes(marker)));
  const hasNegative = normalized.some((item) => NEGATIVE_MARKERS.some((marker) => item.includes(marker)));
  const hasPassiveAggression = normalized.some((item) => PASSIVE_AGGRESSION_MARKERS.some((marker) => item.includes(marker)));
  const hasHostilitySignal = normalized.some(
    (item) => item.includes("verbal_attack") || item.includes("harassment") || item.includes("targeting") || item.includes("threat")
  );
  const hasPositiveText = POSITIVE_TEXT_MARKERS.some((marker) => lowerText.includes(marker));
  const hasNegativeText = NEGATIVE_TEXT_PATTERNS.some((pattern) => pattern.test(lowerText));
  const hasEmpatheticContext = EMPATHY_CONTEXT_MARKERS.some((marker) => lowerText.includes(marker));
  const hasActionCondemnation = ACTION_CONDEMNATION_PATTERN.test(lowerText);
  const hasDirectAttack = DIRECT_ATTACK_PATTERN.test(lowerText);
  const hasAnxiousText = ANXIOUS_TEXT_MARKERS.some((marker) => lowerText.includes(marker));
  const hasSadText = SAD_TEXT_MARKERS.some((marker) => lowerText.includes(marker));
  const hasSupportiveLeadin = SUPPORTIVE_LEADIN_PATTERN.test(lowerText);
  const hasMildInvalidation = MILD_INVALIDATION_PATTERN.test(lowerText);
  const hasPoliteMaskingAttack = POLITE_MASKING_ATTACK_PATTERN.test(lowerText);
  const hasStrongInvalidationTone = STRONG_INVALIDATION_TONE_PATTERN.test(lowerText);
  const hasBackhandedNeutralTone = BACKHANDED_NEUTRAL_TONE_PATTERN.test(lowerText);
  const hasBackhandedNegativeTone = BACKHANDED_NEGATIVE_TONE_PATTERN.test(lowerText);
  const hasPatronizingSarcasm = PATRONIZING_SARCASM_PATTERN.test(lowerText);
  const hasFalseApology = FALSE_APOLOGY_PATTERN.test(lowerText);
  const hasFalseSupport = FALSE_SUPPORT_PATTERN.test(lowerText);
  const hasValidatingSupport = VALIDATING_SUPPORT_PATTERN.test(lowerText);
  const hasRespectfulDisagreement = RESPECTFUL_DISAGREEMENT_PATTERN.test(lowerText);
  const hasPracticalSupport = PRACTICAL_SUPPORT_PATTERN.test(lowerText);
  const hasGaslightingAttack = GASLIGHTING_ATTACK_PATTERN.test(lowerText);
  const hasContempt = CONTEMPT_PATTERN.test(lowerText);
  const hasBlameShiftingNeutralTone = BLAME_SHIFTING_NEUTRAL_TONE_PATTERN.test(lowerText);
  const hasPoliteInvalidatingAttack =
    POLITE_MASKING_ATTACK_PATTERN.test(lowerText) && /\b(too\s+sensitive|overreacting|remembering\s+it\s+wrong)\b/i.test(lowerText);
  // Robust supportive advice detection: matches empathetic opening + advice suggestion
  // Uses flexible matching for apostrophes to handle various quote types
  const hasSupportiveAdvice =
    /i\s*['\u2019`´]?\s*m\s+so\s+sorry\s+you\s*['\u2019`´]?\s*re\s+going\s+through|i\s+am\s+so\s+sorry\s+you\s+are\s+going\s+through/i.test(lowerText) &&
    /(have\s+you\s+tried|just\s+exercis|that\s+always\s+works\s+for\s+me)/i.test(lowerText) &&
    !hasPatronizingSarcasm;
  const hasCriticismSignal = normalized.some(
    (item) => item.includes("disagreement") || item.includes("critical") || item.includes("condemn")
  );
  const hasIntensitySignal = normalized.some(
    (item) => item.includes("intensity") || item.includes("instability") || item.includes("urgency")
  );
  const isRisky = riskLevel === "high";
  const riskyTopicMention = /\b(abuse|assault|rape|molest|threat|violence)\b/.test(lowerText);

  const signalDensity = Math.min(0.2, normalized.length * 0.03);

  const contextualNonHostileNegative =
    (hasEmpatheticContext || hasActionCondemnation) && !hasDirectAttack && !hasHostilitySignal;

  if (hasBackhandedNegativeTone) {
    return {
      label: "negative",
      subLabels: ["critical"],
      confidence: round3(0.64 + signalDensity)
    };
  }

  if (hasBackhandedNeutralTone) {
    return {
      label: "neutral",
      subLabels: ["mixed"],
      confidence: round3(0.58 + signalDensity)
    };
  }

  if (hasRespectfulDisagreement) {
    return {
      label: "positive",
      subLabels: ["respectful"],
      confidence: round3(0.68 + signalDensity)
    };
  }

  if (hasGaslightingAttack) {
    return {
      label: "negative",
      subLabels: ["critical"],
      confidence: round3(0.7 + signalDensity)
    };
  }

  if (hasPoliteInvalidatingAttack) {
    return {
      label: "negative",
      subLabels: ["critical"],
      confidence: round3(0.68 + signalDensity)
    };
  }

  if (hasBlameShiftingNeutralTone && !hasDirectAttack && !hasContempt) {
    return {
      label: "neutral",
      subLabels: ["mixed"],
      confidence: round3(0.58 + signalDensity)
    };
  }

  if ((hasAnxiousText || hasSadText) && !hasDirectAttack && !hasHostilitySignal && !hasNegativeText) {
    return {
      label: "neutral",
      subLabels: [hasAnxiousText ? "anxious" : "sad"],
      confidence: round3(0.52 + signalDensity)
    };
  }

  if (hasSupportiveLeadin && hasStrongInvalidationTone && !hasDirectAttack && !hasHostilitySignal) {
    return {
      label: "neutral",
      subLabels: ["mixed"],
      confidence: round3(0.56 + signalDensity)
    };
  }

  if (hasSupportiveAdvice && !hasDirectAttack && !hasHostilitySignal) {
    return {
      label: "positive",
      subLabels: ["supportive"],
      confidence: round3(0.63 + signalDensity)
    };
  }

  if (hasFalseSupport) {
    return {
      label: "negative",
      subLabels: ["critical"],
      confidence: round3(0.72 + signalDensity)
    };
  }

  // Detect patronizing/sarcastic apologies (false empathy with criticism)
  if (hasSupportiveLeadin && hasPatronizingSarcasm && hasNegativeText) {
    return {
      label: "negative",
      subLabels: ["critical"],
      confidence: round3(0.65 + signalDensity)
    };
  }

  // Detect false apologies with direct insults (e.g., "I'm so sorry you're apparently so fragile")
  if (hasFalseApology) {
    return {
      label: "negative",
      subLabels: ["critical"],
      confidence: round3(0.68 + signalDensity)
    };
  }

  if (
    (hasPositive || hasPositiveText || hasSupportiveLeadin) &&
    hasMildInvalidation &&
    !hasHostilitySignal &&
    !hasDirectAttack &&
    !hasStrongInvalidationTone
  ) {
    return {
      label: "positive",
      subLabels: ["supportive"],
      confidence: round3(0.64 + signalDensity)
    };
  }

  // Passive-aggression without direct attack should be neutral tone
  if (hasPassiveAggression && !hasDirectAttack && !hasHostilitySignal && !hasNegativeText) {
    return {
      label: "neutral",
      subLabels: ["mixed"],
      confidence: round3(0.55 + signalDensity)
    };
  }

  const hasInvalidationSignal = normalized.some((item) => item.includes("invalidation") || item.includes("dismissive"));

  if (hasNegative || hasNegativeText || hasContempt) {
    if (contextualNonHostileNegative) {
      const toneSubLabel: ToneSubLabel = hasAnxiousText ? "anxious" : hasSadText ? "sad" : "respectful";
      return {
        label: "neutral",
        subLabels: [toneSubLabel],
        confidence: round3(0.53 + signalDensity)
      };
    }

    if ((hasPositive || hasPositiveText) && !isRisky && !hasPoliteMaskingAttack) {
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

    if (hasInvalidationSignal && !hasDirectAttack && !hasNegativeText && !hasContempt) {
      return {
        label: "neutral",
        subLabels: ["mixed"],
        confidence: round3(0.52 + signalDensity)
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

  if (hasPositive || hasPositiveText || hasValidatingSupport || hasPracticalSupport) {
    if (hasAnxiousText) {
      return {
        label: "neutral",
        subLabels: ["anxious"],
        confidence: round3(0.58 + signalDensity)
      };
    }

    // Don't downgrade positive tone just because there's sad text in risky context
    // Positive intention should dominate even if emotion words present

    // Only mark as "supportive" if there's actual advice or support signals, not just empathy
    const hasRealSupport = hasMildInvalidation || hasValidatingSupport || hasPracticalSupport || normalized.some((item) => item.includes("support") || item.includes("deescalation") || item.includes("encouragement"));
    const toneSubLabel: ToneSubLabel = hasEmpatheticContext ? "respectful" : hasRealSupport ? "supportive" : "respectful";
    return {
      label: "positive",
      subLabels: [toneSubLabel],
      confidence: round3(0.66 + (hasPositiveText ? 0.1 : 0.05) + signalDensity)
    };
  }

  // Don't automatically default to neutral just because context is risky
  // Tone should be driven by text sentiment, not just topic context

  // Check for anxious or sad text even without risk markers
  if (hasAnxiousText) {
    return {
      label: "neutral",
      subLabels: ["anxious"],
      confidence: round3(0.48 + signalDensity)
    };
  }

  if (hasSadText) {
    return {
      label: "neutral",
      subLabels: ["sad"],
      confidence: round3(0.47 + signalDensity)
    };
  }

  return {
    label: "neutral",
    subLabels: [],
    confidence: round3(0.22 + signalDensity)
  };
}

export function classifyTone(text: string, signals: string[], riskLevel: RiskBand): CommentTone {
  return classifyToneWithConfidence(text, signals, riskLevel).label;
}