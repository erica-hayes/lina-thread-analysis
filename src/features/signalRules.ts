export interface SignalRule {
  name: string;
  category: "risk" | "hostility" | "support" | "curiosity" | "passive_aggression" | "instability";
  family: string;
  patterns: RegExp[];
  weight: number;
  riskContribution: number;
  reasoning: string;
}

export const RULES: SignalRule[] = [
  {
    name: "direct-insult",
    category: "hostility",
    family: "verbal_attack",
    patterns: [/\b(idiot|moron|clown|pathetic|loser|stupid)\b/gi],
    weight: 1.1,
    riskContribution: 1.4,
    reasoning: "Direct insults are a strong escalation signal in conversational threads."
  },
  {
    name: "threatening-language",
    category: "risk",
    family: "threat",
    patterns: [
      /\b(i will|you will|gonna)\s+(hurt|destroy|ruin|kill)\b/gi,
      /\byou('?re| are) dead\b/gi,
      /\b(you'?ll regret|you'?ll be sorry|or else|final warning|last chance|there will be consequences)\b/gi,
      /\bif\s+i\s+can'?t\s+have\s+you\s+then\s+no\s+one\s+will\b/gi,
      /\byou\s+won'?t\s+like\s+what\s+happens\b/gi
    ],
    weight: 1.4,
    riskContribution: 2.2,
    reasoning: "Threat-like phrasing raises direct safety and moderation risk."
  },
  {
    name: "stalking-surveillance-language",
    category: "risk",
    family: "stalking",
    patterns: [
      /\b(i\s+know\s+where\s+you\s+live|i\s+know\s+where\s+you\s+are|i'?m\s+watching\s+you|i\s+followed\s+you|i\s+can\s+find\s+you|you\s+can'?t\s+hide)\b/gi,
      /\b(i\s+know\s+your\s+schedule|i\s+know\s+your\s+routine|i\s+saw\s+you\s+at|keeping\s+tabs\s+on|tracking\s+you|monitoring\s+you)\b/gi
    ],
    weight: 1.5,
    riskContribution: 2.4,
    reasoning: "Surveillance and location-monitoring language indicates elevated coercion/stalking risk."
  },
  {
    name: "targeted-blame",
    category: "hostility",
    family: "targeting",
    patterns: [/\byou('?re| are)\b/gi, /\byour fault\b/gi, /\bblame you\b/gi],
    weight: 0.9,
    riskContribution: 0.9,
    reasoning: "Targeted phrasing often indicates interpersonal friction."
  },
  {
    name: "passive-aggressive-snark",
    category: "passive_aggression",
    family: "snark",
    patterns: [
      /\b(sure buddy|good luck with that|whatever you say|if you say so|must be nice|good for you|lucky you)\b/gi,
      /\b(whatever makes you happy|if that'?s what you want|do what you want)\b/gi
    ],
    weight: 0.8,
    riskContribution: 0.7,
    reasoning: "Passive-aggressive snark can gradually destabilize thread tone."
  },
  {
    name: "gaslighting-invalidation",
    category: "hostility",
    family: "invalidation",
    patterns: [
      /\b(you'?re\s+too\s+sensitive|you'?re\s+overreacting|stop\s+overreacting|you'?re\s+being\s+dramatic)\b/gi,
      /\b(that\s+never\s+happened|you'?re\s+imagining\s+things|you'?re\s+making\s+things\s+up|you'?re\s+remembering\s+it\s+wrong)\b/gi,
      /\b(that'?s\s+not\s+what\s+happened|that'?s\s+not\s+what\s+i\s+said|you'?re\s+twisting\s+my\s+words)\b/gi
    ],
    weight: 1.2,
    riskContribution: 1.2,
    reasoning: "Gaslighting/invalidation language correlates with manipulative and escalating interaction dynamics."
  },
  {
    name: "blame-shifting-language",
    category: "hostility",
    family: "blame",
    patterns: [
      /\b(this\s+is\s+your\s+fault|you\s+made\s+me|you\s+caused\s+this|because\s+of\s+you|you\s+started\s+it)\b/gi,
      /\b(look\s+what\s+you\s+made\s+me\s+do|you'?re\s+the\s+one\s+who|why\s+do\s+you\s+always)\b/gi
    ],
    weight: 1,
    riskContribution: 1,
    reasoning: "Blame-shifting is a strong adversarial signal that increases conflict pressure."
  },
  {
    name: "coercive-control-language",
    category: "risk",
    family: "control",
    patterns: [
      /\b(you\s+belong\s+to\s+me|you'?re\s+mine|i\s+own\s+you)\b/gi,
      /\b(don'?t\s+talk\s+to|you\s+can'?t\s+see|stay\s+away\s+from|don'?t\s+tell\s+anyone|our\s+little\s+secret|keep\s+this\s+between\s+us)\b/gi,
      /\b(you\s+have\s+to\s+respond|answer\s+me|you\s+can'?t\s+ignore\s+me)\b/gi
    ],
    weight: 1.3,
    riskContribution: 1.9,
    reasoning: "Possessive secrecy, isolation, and coercive demands are high-severity control signals."
  },
  {
    name: "de-escalation-language",
    category: "support",
    family: "deescalation",
    patterns: [/\b(let'?s calm down|no worries|i understand|thanks for clarifying|sorry)\b/gi],
    weight: 0.7,
    riskContribution: -0.8,
    reasoning: "Explicit calming language tends to reduce escalation pressure."
  },
  {
    name: "support-encouragement-language",
    category: "support",
    family: "encouragement",
    patterns: [
      /\b(i\s+believe\s+in\s+you|you'?ve\s+got\s+this|you\s+can\s+do\s+it|i'?m\s+here\s+for\s+you|proud\s+of\s+you)\b/gi,
      /\b(that\s+makes\s+sense|that'?s\s+fair|good\s+point|you\s+have\s+every\s+right)\b/gi
    ],
    weight: 0.65,
    riskContribution: -0.6,
    reasoning: "Supportive encouragement and validation commonly dampen hostility in thread exchanges."
  },
  {
    name: "help-seeking",
    category: "curiosity",
    family: "inquiry",
    patterns: [/\b(can someone help|looking for advice|any advice|what should i do)\b/gi, /\?+/g],
    weight: 0.6,
    riskContribution: 0.1,
    reasoning: "Questioning and advice-seeking indicate curiosity or support-seeking intent."
  },
  {
    name: "high-intensity-punctuation",
    category: "instability",
    family: "intensity",
    patterns: [/!{2,}/g, /\?{2,}/g, /\b[A-Z]{4,}\b/g],
    weight: 1,
    riskContribution: 0.8,
    reasoning: "Excessive punctuation or shouting-style tokens correlate with volatility."
  },
  {
    name: "disagreement-language",
    category: "hostility",
    family: "disagreement",
    patterns: [/\b(i disagree|not true|incorrect|you are wrong|that is false)\b/gi],
    weight: 0.85,
    riskContribution: 0.6,
    reasoning: "Direct contradiction is useful for modeling adversarial dynamics."
  }
];