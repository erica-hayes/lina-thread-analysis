export interface Chain {
  id: string;
  commentIds: string[];
  participants: string[];
}

export interface ChainAnalysis {
  chainId: string;
  escalationScore: number;
  peakCommentId: string;
  participants: string[];
  interactionType: "conflict" | "discussion" | "neutral";
}