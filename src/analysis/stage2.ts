import { CommentNode, CommentTree } from "../graph/types";
import { DeepCommentAnalysis } from "../types";

export function analyzeCommentDeep(comment: CommentNode): DeepCommentAnalysis {
  const body = comment.body.toLowerCase();
  const hasQuestion = body.includes("?");

  return {
    tone: "neutral",
    intent: hasQuestion ? "inquiry" : "statement",
    nuance: "stage2-stub",
    risk: "low"
  };
}

export function runStage2(
  commentIds: string[],
  tree: CommentTree
): Map<string, DeepCommentAnalysis> {
  const deepAnalysisByCommentId = new Map<string, DeepCommentAnalysis>();

  for (const commentId of commentIds) {
    const node = tree.byId.get(commentId);
    if (!node) {
      continue;
    }

    deepAnalysisByCommentId.set(commentId, analyzeCommentDeep(node));
  }

  return deepAnalysisByCommentId;
}