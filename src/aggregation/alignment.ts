import { CommentTree } from "../graph/types";
import { AlignmentSummary, Stage1ScoredComment } from "../types";

type Stance = "support" | "condemn" | "defend" | "neutral";

const SUPPORT_PHRASES = [
  "i agree",
  "good point",
  "thanks",
  "thank you",
  "i'm sorry",
  "i am sorry",
  "that sounds hard",
  "you are not alone",
  "sending love",
  "take care",
  "be safe"
];

const DEFEND_PHRASES = [
  "to be fair",
  "i can see why",
  "understand your point",
  "i understand why",
  "i get why",
  "it makes sense"
];

const CONDEMN_PHRASES = ["you are wrong", "you're wrong", "nonsense", "that's false", "not true", "ridiculous"];

function includesAny(text: string, phrases: readonly string[]): boolean {
  return phrases.some((phrase) => text.includes(phrase));
}

function detectStance(body: string, score: Stage1ScoredComment): Stance {
  const text = body.toLowerCase();

  if (includesAny(text, SUPPORT_PHRASES)) {
    return "support";
  }

  if (includesAny(text, DEFEND_PHRASES)) {
    return "defend";
  }

  if (
    score.signals.aggression >= 0.28 ||
    score.signals.disagreement >= 0.32 ||
    includesAny(text, CONDEMN_PHRASES)
  ) {
    return "condemn";
  }

  if (score.signals.disagreement >= 0.2 || score.signals.targeting >= 0.18) {
    return "defend";
  }

  return "neutral";
}

function areInDisagreement(a: Stance, b: Stance): boolean {
  if (a === b) {
    return false;
  }
  if (a === "neutral" || b === "neutral") {
    return false;
  }
  return true;
}

export function computeAlignment(tree: CommentTree, scoredComments: Stage1ScoredComment[]): AlignmentSummary {
  const scoreById = new Map<string, Stage1ScoredComment>();
  for (const score of scoredComments) {
    scoreById.set(score.commentId, score);
  }

  const stanceCount: Record<Stance, number> = {
    support: 0,
    condemn: 0,
    defend: 0,
    neutral: 0
  };

  const stanceByCommentId = new Map<string, Stance>();

  for (const node of tree.byId.values()) {
    const score = scoreById.get(node.id);
    if (!score) {
      continue;
    }

    const stance = detectStance(node.body, score);
    stanceByCommentId.set(node.id, stance);
    stanceCount[stance] += 1;
  }

  let agreements = 0;
  let disagreements = 0;

  for (const node of tree.byId.values()) {
    if (!node.parent) {
      continue;
    }

    const currentStance = stanceByCommentId.get(node.id) ?? "neutral";
    const parentStance = stanceByCommentId.get(node.parent.id) ?? "neutral";

    if (currentStance === parentStance && currentStance !== "neutral") {
      agreements += 1;
    } else if (areInDisagreement(currentStance, parentStance)) {
      disagreements += 1;
    }
  }

  const interactionTotal = agreements + disagreements;
  const disagreementRatio = Number((interactionTotal > 0 ? disagreements / interactionTotal : 0).toFixed(3));

  const dominantStanceRaw = (Object.entries(stanceCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "neutral") as Stance;
  const nonNeutralDominant = (["support", "condemn", "defend"] as Stance[])
    .map((stance) => [stance, stanceCount[stance]] as const)
    .sort((a, b) => b[1] - a[1])[0];

  const dominantStance =
    dominantStanceRaw === "neutral" && nonNeutralDominant && nonNeutralDominant[1] > 0
      ? nonNeutralDominant[0]
      : dominantStanceRaw;

  const nonZeroStances = Object.values(stanceCount).filter((count) => count > 0).length;
  const dominantShare = stanceCount[dominantStanceRaw] / Math.max(scoredComments.length, 1);

  let label: AlignmentSummary["label"] = "mixed";
  if (dominantShare >= 0.65 && disagreementRatio <= 0.25) {
    label = "consensus";
  } else if (disagreementRatio >= 0.55 && nonZeroStances >= 2) {
    label = "polarized";
  } else if (nonZeroStances >= 4 || (nonZeroStances >= 3 && disagreementRatio >= 0.35)) {
    label = "fragmented";
  }

  const dissentPressure = Number(
    Math.min(1, disagreementRatio * 0.75 + (stanceCount.condemn / Math.max(scoredComments.length, 1)) * 0.4).toFixed(3)
  );

  return {
    label,
    dominantStance,
    disagreementRatio,
    dissentPressure
  };
}