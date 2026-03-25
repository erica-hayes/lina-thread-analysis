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
    patterns: [/\byour fault\b/gi, /\bblame you\b/gi, /\byou('?re| are)\s+(wrong|lying|the problem|to blame|responsible)\b/gi],
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
      /\b(whatever makes you happy|if that'?s what you want|do what you want)\b/gi,
      /\bbless your heart\b/gi,
      /\b(yeah,?\s+right|sure,?\s+right|as if|wow great)\b/gi,
      /\b(better late than never|could\s+be\s+worse|at\s+least)\b/gi
    ],
    weight: 0.8,
    riskContribution: 0.5,
    reasoning: "Passive-aggressive snark can gradually destabilize thread tone."
  },
  {
    name: "gaslighting-invalidation",
    category: "hostility",
    family: "invalidation",
    patterns: [
      /\b(you'?re\s+(too\s+)?sensitive|you'?re\s+(being\s+)?too\s+sensitive|you'?re\s+probably\s+being\s+too\s+sensitive|you'?re\s+overreacting|you\s+might\s+be\s+overreacting|stop\s+overreacting|you'?re\s+being\s+dramatic)\b/gi,
      /\b(that\s+never\s+happened|you'?re\s+imagining\s+things|you'?re\s+making\s+things\s+up|you'?re\s+remembering\s+it\s+wrong)\b/gi,
      /\b(that'?s\s+not\s+what\s+happened|that'?s\s+not\s+what\s+i\s+said|you'?re\s+twisting\s+my\s+words)\b/gi,
      /\b(maybe you'?re being|are you sure that'?s|are you sure it was really abuse|it'?s normal for|parents do that)\b/gi,
      /\b(kids misremember|you'?re misremembering|didn'?t mean it that way)\b/gi,
      /\b(have you considered|did you think|did it occur to you)\s+(they|he|she|it)\s+(might|could|may)/gi
    ],
    weight: 1.2,
    riskContribution: 1.8,
    reasoning: "Gaslighting/invalidation language correlates with manipulative and escalating interaction dynamics."
  },
  {
    name: "concern-framed-invalidation",
    category: "hostility",
    family: "invalidation",
    patterns: [
      /\b(they\s+sound\s+like\s+they\s+genuinely\s+care|i'?m\s+sure\s+they\s+didn'?t\s+mean\s+it\s+that\s+way)\b/gi,
      /\b(he'?s\s+just\s+worried\s+about\s+you|parents\s+do\s+that)\b/gi
    ],
    weight: 1.1,
    riskContribution: 1.8,
    reasoning: "Concern-framed minimization often invalidates boundaries while masking hostility."
  },
  {
    name: "polite-masked-invalidation",
    category: "hostility",
    family: "invalidation",
    patterns: [
      /\b(i'?m\s+sorry\s+but\s+have\s+you\s+considered)\b/gi,
      /\b(i\s+am\s+sorry\s+but\s+have\s+you\s+considered)\b/gi
    ],
    weight: 1.0,
    riskContribution: 1.2,
    reasoning: "Polite prefaces can mask invalidating attacks and should elevate risk above low-level snark."
  },
  {
    name: "blame-shifting-language",
    category: "hostility",
    family: "blame",
    patterns: [
      /\b(this\s+is\s+your\s+fault|you\s+made\s+me|you\s+caused\s+this|because\s+of\s+you|you\s+started\s+it)\b/gi,
      /\b(look\s+what\s+you\s+made\s+me\s+do|you'?re\s+the\s+one\s+who|why\s+do\s+you\s+always)\b/gi,
      /\b(maybe\s+you'?re\s+not\s+being\s+appreciative\s+enough|he\s+probably\s+feels\s+undervalued|if\s+you\s+contributed\s+to\s+the\s+account|maybe\s+if\s+you\s+dressed\s+more\s+professionally|maybe\s+you\s+should\s+get\s+a\s+job)\b/gi
    ],
    weight: 1,
    riskContribution: 1.3,
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
    riskContribution: 3.5,
    reasoning: "Possessive secrecy, isolation, and coercive demands are high-severity control signals."
  },
  {
    name: "privacy-coercion-language",
    category: "risk",
    family: "control",
    patterns: [
      /\b(if\s+you\s+have\s+nothing\s+to\s+hide|trust\s+is\s+about\s+transparency)\b/gi
    ],
    weight: 1.0,
    riskContribution: 2.2,
    reasoning: "Privacy-coercive framing is risky, but below the severity of explicit possessive control."
  },
  {
    name: "de-escalation-language",
    category: "support",
    family: "deescalation",
    patterns: [
      /\b(let'?s calm down|no worries|i understand|thanks for clarifying|sorry)\b/gi,
      /\b(i'?m\s+so\s+sorry\s+(you'?re|you\s+are)|i'?m\s+sorry\s+you'?re\s+going\s+through)\b/gi,
      /\b(that\s+sounds\s+(hard|difficult|tough)|i\s+hear\s+you)\b/gi
    ],
    weight: 0.7,
    riskContribution: -0.5,
    reasoning: "Explicit calming language tends to reduce escalation pressure."
  },
  {
    name: "support-encouragement-language",
    category: "support",
    family: "encouragement",
    patterns: [
      /\b(i\s+believe\s+in\s+you|you'?ve\s+got\s+this|you\s+can\s+do\s+it|i'?m\s+here\s+for\s+you|proud\s+of\s+you)\b/gi,
      /\b(that\s+makes\s+sense|that'?s\s+fair|good\s+point|you\s+have\s+every\s+right)\b/gi,
      /\b(that\s+must\s+be\s+so\s+(hard|difficult|tough|scary))\b/gi
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
  },
  {
    name: "emotional-intensity-anxiety",
    category: "instability",
    family: "intensity",
    patterns: [
      /\b(i'?m\s+(so\s+)?(scared|terrified|panicking|afraid|anxious|worried))\b/gi,
      /\b(panic(king)?|can'?t\s+(focus|think|breathe)|what\s+if)\b/gi,
      /\b(every\s+day\s+and|so\s+worried|i\s+worry)\b/gi
    ],
    weight: 0.9,
    riskContribution: 0.3,
    reasoning: "High emotional intensity markers indicate elevated anxiety and distress."
  },
  {
    name: "dismissive-minimizing-language",
    category: "hostility",
    family: "invalidation",
    patterns: [
      /\b(just\s+(try|do|push\s+through|get\s+over)|simply|only|all\s+you\s+have\s+to\s+do)\b/gi,
      /\bjust\s+exercis(e|ing)\b/gi,
      /\b(everyone|we\s+all|lots\s+of\s+people)\s+(go(es)?\s+through|deal\s+with|feel)\b/gi,
      /\b(it'?s\s+not\s+that\s+bad|could\s+be\s+worse|not\s+as\s+bad\s+as)\b/gi,
      /\b(get\s+over\s+it|move\s+on|move\s+on\s+already|let\s+it\s+go|time\s+to\s+move\s+on)\b/gi,
      /\b(isn'?t\s+really\s+a\s+big\s+deal|that'?s\s+just\s+how\s+marriages\s+work|that'?s\s+just\s+office\s+culture)\b/gi
    ],
    weight: 1.0,
    riskContribution: 1.0,
    reasoning: "Dismissive language minimizes concerns and invalidates emotional experiences."
  },
  {
    name: "victim-blaming-questions",
    category: "hostility",
    family: "targeting",
    patterns: [
      /\b(why\s+did(n'?t)?\s+you|why\s+didn'?t\s+you|you\s+should\s+have)\b/gi,
      /\b(if\s+you\s+(really|actually)|if\s+it\s+was\s+that\s+bad)\b/gi,
      /\b(why\s+(wait(ed)?|took)\s+so\s+long|why\s+now|that\s+doesn'?t\s+make\s+sense)\b/gi,
      /\b(what\s+were\s+you\s+(wearing|doing|thinking))\b/gi,
      /\b(maybe\s+if\s+you\s+dressed\s+more\s+professionally)\b/gi,
      /\b(if\s+you\s+contributed\s+to\s+the\s+account)\b/gi
    ],
    weight: 1.1,
    riskContribution: 2.5,
    reasoning: "Victim-blaming questions shift responsibility and invalidate trauma experiences."
  },
  {
    name: "comparative-invalidation",
    category: "hostility",
    family: "invalidation",
    patterns: [
      /\b(others\s+have\s+it\s+worse|some\s+people|compared\s+to)\b/gi,
      /\b(first\s+world\s+problem|must\s+be\s+nice\s+to\s+worry\s+about)\b/gi,
      /\b(most\s+people\s+do\s+(that|this)\s+in)\b/gi
    ],
    weight: 0.9,
    riskContribution: 0.8,
    reasoning: "Comparative statements minimize experiences by unfavorable comparison."
  }
];