import { Chain, ChainAnalysis } from "../chains/types";

export type Priority = "low" | "medium" | "high";
export type RiskLevel = "low" | "medium" | "high";
export type UserRole =
  | "instigator"
  | "escalator"
  | "defender"
  | "supporter"
  | "information_seeker"
  | "observer"
  | "neutral";
export type RiskBand = "none" | "low" | "moderate" | "high" | "critical";
export type CommentTone = "positive" | "negative" | "neutral";
export type ToneSubLabel =
  | "neutral"
  | "supportive"
  | "respectful"
  | "critical"
  | "hostile"
  | "anxious"
  | "sad"
  | "emotional"
  | "mixed";
export type BehavioralNuance =
  | "neutral"
  | "supportive"
  | "passive_aggressive"
  | "guilt_tripping"
  | "backhanded_compliment"
  | "polite_masking"
  | "dismissive"
  | "invalidating"
  | "possessive"
  | "coercive"
  | "gaslighting"
  | "sarcastic"
  | "love_bombing"
  | "stalking"
  | "boundary_violation"
  | "betrayal"
  | "comparative"
  | "derogatory"
  | "hurt"
  | "manipulative"
  | "probing"
  | "deflective"
  | "self_effacing"
  | "passive_compliance"
  | "sarcastic_praise"
  | "conflicted_emotion";
export type CommentIntent = "supportive" | "critical" | "curious" | "adversarial" | "neutral";
export type IntentSubLabel =
  | "direct_attack"
  | "support_validation"
  | "support_seeking"
  | "information_seeking"
  | "personal_disclosure"
  | "topic_condemnation"
  | "deescalation"
  | "neutral";

export interface DetectedSignal {
  ruleName: string;
  category: "risk" | "hostility" | "support" | "curiosity" | "passive_aggression" | "instability";
  family: string;
  matchedText: string;
  start: number;
  end: number;
  weight: number;
  riskContribution: number;
  reasoning: string;
}

export interface NormalizedComment {
  id: string;
  parentId: string | null;
  author: string;
  body: string;
  timestamp: number;
}

export interface HeuristicScore {
  score: number;
  flags: string[];
  priority: Priority;
  detectedSignals: DetectedSignal[];
  signals: {
    aggression: number;
    targeting: number;
    disagreement: number;
    intensity: number;
  };
}

export interface Stage1ScoredComment extends HeuristicScore {
  commentId: string;
  author: string;
  depth: number;
}

export interface DeepCommentAnalysis {
  tone: string;
  intent: string;
  nuance: string;
  risk: RiskLevel;
}

export interface EscalationPoint {
  parentCommentId: string;
  commentId: string;
  depth: number;
  riskDelta: number;
}

export interface HighSignalCluster {
  commentIds: string[];
  maxScore: number;
}

export interface ThreadSummary {
  overallRisk: number;
  topic: string;
  sensitivity: number;
  threadTopicRisk: TopicRisk;
  conversationClimate: ConversationClimate;
  alignment: AlignmentSummary;
  participationRisk: ParticipationRisk;
  keyDynamics: string[];
  highRiskChains: Chain[];
  escalationPoints: {
    chainId: string;
    peakCommentId: string;
  }[];
  userRoles: Record<string, UserRole>;
}

export interface HighRiskComment {
  commentId: string;
  author: string;
  body: string;
  depth: number;
  score: number;
  flags: string[];
  priority: Priority;
  detectedSignals: DetectedSignal[];
  signals: {
    aggression: number;
    targeting: number;
    disagreement: number;
    intensity: number;
  };
  deepAnalysis: DeepCommentAnalysis;
}

export interface AnalyzeThreadResult {
  summary: ThreadSummary;
  comments: AnalyzedComment[];
  uiIndex: UIIndex;
  quickScan: {
    counts: {
      positive: number;
      negative: number;
      neutral: number;
    };
    byIntent: Record<string, number>;
    byRisk: Record<string, number>;
    composites: {
      highRiskAdversarial: number;
      highRiskNegativeTone: number;
      supportiveInRiskyContext: number;
    };
  };
  chains: Chain[];
  highRiskComments: HighRiskComment[];
  escalationPoints: {
    chainId: string;
    peakCommentId: string;
  }[];
  userRoles: Record<string, UserRole>;
  debug?: {
    commentScores: Stage1ScoredComment[];
    comments?: AnalyzedComment[];
    uiIndex?: UIIndex;
    chains: Chain[];
    chainAnalyses: ChainAnalysis[];
  };
}

export interface AnalyzeThreadOptions {
  debug?: boolean;
}

export interface AnalyzedComment {
  id: string;
  tone: CommentTone;
  toneSubLabels: ToneSubLabel[];
  nuance: BehavioralNuance;
  nuanceSecondary: BehavioralNuance[];
  intent: CommentIntent;
  intentSubLabels: IntentSubLabel[];
  toneLabel: CommentTone | null;
  intentLabel: CommentIntent | null;
  toneConfidence: number;
  nuanceConfidence: number;
  intentConfidence: number;
  riskLevel: RiskBand;
  signals: string[];
  signalEvidence: string[];
}

export interface UIIndex {
  byId: Record<
    string,
    {
      tone: CommentTone;
      toneSubLabels?: ToneSubLabel[];
      nuance: BehavioralNuance;
      nuanceSecondary?: BehavioralNuance[];
      intent: CommentIntent;
      intentSubLabels?: IntentSubLabel[];
      toneLabel?: CommentTone | null;
      intentLabel?: CommentIntent | null;
      toneConfidence?: number;
      nuanceConfidence?: number;
      intentConfidence?: number;
      riskLevel: RiskBand;
      signals: string[];
      signalEvidence: string[];
    }
  >;
  counts: {
    tone: Record<string, number>;
    nuance: Record<string, number>;
    intent: Record<string, number>;
    risk: Record<string, number>;
    signals: Record<string, number>;
    composite: Record<string, number>;
  };
  groups: {
    tone: {
      positive: string[];
      negative: string[];
      neutral: string[];
    };
    nuance: Record<string, string[]>;
    intent: Record<string, string[]>;
    risk: Record<string, string[]>;
    signals: Record<string, string[]>;
    composite: {
      highRiskAdversarial: string[];
      highRiskNegativeTone: string[];
      supportiveInRiskyContext: string[];
    };
  };
}

export interface TopicRisk {
  level: RiskBand;
  confidence: number;
  factors: string[];
  detectedPatternTypes: string[];
  evidenceSnippets: string[];
}

export interface ConversationClimate {
  label: "supportive" | "hostile" | "volatile" | "mixed" | "neutral";
  emotionalIntensity: "calm" | "elevated" | "volatile" | "hostile";
  socialIntent: "curiosity" | "adversarial" | "support-seeking" | "mixed" | "neutral";
  confidence: number;
  factors: string[];
}

export interface AlignmentSummary {
  label: "consensus" | "polarized" | "mixed" | "fragmented";
  dominantStance: "support" | "condemn" | "defend" | "neutral";
  disagreementRatio: number;
  dissentPressure: number;
}

export interface ParticipationRisk {
  agreeing: RiskBand;
  stayingNeutral: RiskBand;
  disagreeing: RiskBand;
  factors: string[];
}