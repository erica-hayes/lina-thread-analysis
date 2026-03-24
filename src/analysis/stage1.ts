import { scoreCommentHeuristic } from "../features/heuristicScorer";
import { CommentTree } from "../graph/types";
import { Stage1ScoredComment } from "../types";

export interface Stage1Result {
  scored: Stage1ScoredComment[];
  highSignal: Stage1ScoredComment[];
  scoreByCommentId: Map<string, Stage1ScoredComment>;
}

export function runStage1(tree: CommentTree): Stage1Result {
  const authorCommentCount = new Map<string, number>();

  for (const node of tree.byId.values()) {
    authorCommentCount.set(node.author, (authorCommentCount.get(node.author) ?? 0) + 1);
  }

  const scored: Stage1ScoredComment[] = [];
  const scoreByCommentId = new Map<string, Stage1ScoredComment>();

  for (const node of tree.byId.values()) {
    const analysis = scoreCommentHeuristic({
      body: node.body,
      depth: node.depth,
      authorActivityCount: authorCommentCount.get(node.author) ?? 1
    });

    const scoredComment: Stage1ScoredComment = {
      commentId: node.id,
      author: node.author,
      depth: node.depth,
      score: analysis.score,
      flags: analysis.flags,
      priority: analysis.priority,
      detectedSignals: analysis.detectedSignals,
      signals: analysis.signals
    };

    scored.push(scoredComment);
    scoreByCommentId.set(scoredComment.commentId, scoredComment);
  }

  scored.sort((a, b) => b.score - a.score);
  const highSignal = scored.filter((item) => item.priority !== "low");

  return {
    scored,
    highSignal,
    scoreByCommentId
  };
}