import { HeuristicScore } from "../types";
import { countRegexMatches, toWordTokens } from "../utils/helpers";
import { detectSignals } from "./detectSignals";
import {
  AGGRESSION_KEYWORDS,
  DISAGREEMENT_KEYWORDS,
  INSULT_KEYWORDS,
  NEGATIVE_WORDS,
  POSITIVE_WORDS,
  SCORE_WEIGHTS,
  TARGETING_PHRASES,
  URGENCY_KEYWORDS
} from "./signalTypes";

export interface HeuristicInput {
  body: string;
  depth: number;
  authorActivityCount: number;
}

function countKeywordHits(lowerBody: string, keywords: readonly string[]): number {
  let hits = 0;
  for (const keyword of keywords) {
    if (lowerBody.includes(keyword)) {
      hits += 1;
    }
  }
  return hits;
}

function hasAllCapsBurst(body: string): boolean {
  const tokens = body.split(/\s+/);
  let allCapsCount = 0;

  for (const token of tokens) {
    const cleaned = token.replace(/[^A-Za-z]/g, "");
    if (cleaned.length >= 4 && cleaned === cleaned.toUpperCase()) {
      allCapsCount += 1;
      if (allCapsCount >= 2) {
        return true;
      }
    }
  }

  return false;
}

function classifyPriority(score: number): HeuristicScore["priority"] {
  if (score >= 10) {
    return "high";
  }
  if (score >= 5) {
    return "medium";
  }
  return "low";
}

export function scoreCommentHeuristic(input: HeuristicInput): HeuristicScore {
  const flags: string[] = [];
  const body = input.body || "";
  const lowerBody = body.toLowerCase();
  let score = 0;
  const detectedSignals = detectSignals(body);

  let aggressionRaw = 0;
  let targetingRaw = 0;
  let disagreementRaw = 0;
  let intensityRaw = 0;

  const aggressionHits = countKeywordHits(lowerBody, AGGRESSION_KEYWORDS);
  if (aggressionHits > 0) {
    score += aggressionHits * SCORE_WEIGHTS.aggressionKeyword;
    flags.push("aggression-keyword");
    aggressionRaw += aggressionHits * 1.2;
  }

  const insultHits = countKeywordHits(lowerBody, INSULT_KEYWORDS);
  if (insultHits > 0) {
    score += insultHits * SCORE_WEIGHTS.insultKeyword;
    flags.push("insult-keyword");
    aggressionRaw += insultHits * 1.5;
  }

  const urgencyHits = countKeywordHits(lowerBody, URGENCY_KEYWORDS);
  if (urgencyHits > 0) {
    score += urgencyHits * SCORE_WEIGHTS.urgencyKeyword;
    flags.push("urgency-keyword");
    intensityRaw += urgencyHits;
  }

  const disagreementHits = countKeywordHits(lowerBody, DISAGREEMENT_KEYWORDS);
  if (disagreementHits > 0) {
    score += disagreementHits * SCORE_WEIGHTS.disagreementKeyword;
    flags.push("disagreement");
    disagreementRaw += disagreementHits * 1.5;
  }

  const targetingHits = countKeywordHits(lowerBody, TARGETING_PHRASES);
  if (targetingHits > 0) {
    score += targetingHits * SCORE_WEIGHTS.targetingKeyword;
    flags.push("targeting-language");
    targetingRaw += targetingHits;
  }

  const exclamationBursts = countRegexMatches(body, /!{2,}/g);
  if (exclamationBursts > 0) {
    score += exclamationBursts * SCORE_WEIGHTS.excessiveExclamation;
    flags.push("punctuation-intensity");
    intensityRaw += exclamationBursts * 1.25;
  }

  if (hasAllCapsBurst(body)) {
    score += SCORE_WEIGHTS.allCapsBurst;
    flags.push("all-caps-burst");
    intensityRaw += 1.5;
  }

  const tokens = toWordTokens(body);
  const negativeHits = tokens.filter((token) => NEGATIVE_WORDS.includes(token)).length;
  const positiveHits = tokens.filter((token) => POSITIVE_WORDS.includes(token)).length;
  const sentimentDelta = negativeHits - positiveHits;
  if (sentimentDelta > 0) {
    score += sentimentDelta * SCORE_WEIGHTS.negativeSentiment;
    flags.push("negative-sentiment");
    aggressionRaw += sentimentDelta;
  }

  if (input.depth >= 3) {
    score += Math.min(input.depth, 10) * SCORE_WEIGHTS.deepReplyBoost;
    flags.push("deep-reply");
    disagreementRaw += 0.5;
  }

  if (input.authorActivityCount >= 4) {
    score += SCORE_WEIGHTS.repeatAuthorBoost;
    flags.push("repeat-activity");
    intensityRaw += 0.75;
  }

  let signalRiskAdjustment = 0;
  for (const detectedSignal of detectedSignals) {
    signalRiskAdjustment += detectedSignal.riskContribution;
  }
  if (signalRiskAdjustment !== 0) {
    score += signalRiskAdjustment;
    if (signalRiskAdjustment > 0) {
      flags.push("rule-based-signal-risk");
    } else {
      flags.push("rule-based-deescalation");
    }
  }

  const hostilitySignals = detectedSignals.filter(
    (item) => item.category === "hostility" || item.category === "risk"
  ).length;
  const supportSignals = detectedSignals.filter((item) => item.category === "support").length;
  const curiositySignals = detectedSignals.filter((item) => item.category === "curiosity").length;

  aggressionRaw += hostilitySignals * 0.35;
  targetingRaw += detectedSignals.filter((item) => item.family === "targeting").length * 0.4;
  disagreementRaw += detectedSignals.filter((item) => item.family === "disagreement").length * 0.45;
  intensityRaw += detectedSignals.filter((item) => item.family === "intensity").length * 0.4;

  if (supportSignals > 0) {
    aggressionRaw -= Math.min(0.8, supportSignals * 0.25);
    disagreementRaw -= Math.min(0.6, supportSignals * 0.2);
  }
  if (curiositySignals > 0) {
    disagreementRaw -= Math.min(0.4, curiositySignals * 0.15);
  }

  const clamp01 = (value: number): number => Number(Math.max(0, Math.min(1, value)).toFixed(3));
  const signals = {
    aggression: clamp01(aggressionRaw / 8),
    targeting: clamp01(targetingRaw / 5),
    disagreement: clamp01(disagreementRaw / 6),
    intensity: clamp01(intensityRaw / 7)
  };

  const roundedScore = Number(score.toFixed(2));
  return {
    score: roundedScore,
    flags,
    priority: classifyPriority(roundedScore),
    detectedSignals,
    signals
  };
}