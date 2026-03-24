import { CommentTree } from "../graph/types";
import { EscalationPoint, Stage1ScoredComment } from "../types";

const ESCALATION_DELTA_THRESHOLD = 3;
const ESCALATION_SCORE_THRESHOLD = 6;

export function detectEscalation(
  tree: CommentTree,
  scoreByCommentId: Map<string, Stage1ScoredComment>
): EscalationPoint[] {
  const points: EscalationPoint[] = [];

  for (const node of tree.byId.values()) {
    if (!node.parent) {
      continue;
    }

    const currentScore = scoreByCommentId.get(node.id)?.score ?? 0;
    const parentScore = scoreByCommentId.get(node.parent.id)?.score ?? 0;
    const riskDelta = Number((currentScore - parentScore).toFixed(2));

    if (currentScore >= ESCALATION_SCORE_THRESHOLD && riskDelta >= ESCALATION_DELTA_THRESHOLD) {
      points.push({
        parentCommentId: node.parent.id,
        commentId: node.id,
        depth: node.depth,
        riskDelta
      });
    }
  }

  points.sort((a, b) => b.riskDelta - a.riskDelta);
  return points;
}