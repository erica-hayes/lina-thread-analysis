export const AGGRESSION_KEYWORDS = [
  "shut up",
  "idiot",
  "stupid",
  "nonsense",
  "trash",
  "garbage",
  "liar"
];

export const INSULT_KEYWORDS = [
  "moron",
  "clown",
  "dumb",
  "pathetic",
  "loser"
];

export const URGENCY_KEYWORDS = [
  "now",
  "immediately",
  "urgent",
  "asap",
  "right now"
];

export const DISAGREEMENT_KEYWORDS = [
  "i disagree",
  "you are wrong",
  "not true",
  "that is false",
  "no way",
  "incorrect"
];

export const TARGETING_PHRASES = [
  "you are",
  "you're",
  "your",
  "u are"
];

export const DEFUSING_KEYWORDS = [
  "sorry",
  "thanks for clarifying",
  "i understand",
  "no worries",
  "let's calm down"
];

export const NEGATIVE_WORDS = [
  "hate",
  "awful",
  "terrible",
  "ridiculous",
  "wrong",
  "bad"
];

export const POSITIVE_WORDS = [
  "good",
  "great",
  "helpful",
  "fair",
  "thanks",
  "appreciate"
];

export const SCORE_WEIGHTS = {
  aggressionKeyword: 3,
  insultKeyword: 3,
  urgencyKeyword: 1.5,
  disagreementKeyword: 1.25,
  targetingKeyword: 1.5,
  excessiveExclamation: 2,
  allCapsBurst: 2,
  negativeSentiment: 1.5,
  deepReplyBoost: 0.5,
  repeatAuthorBoost: 1.5
} as const;