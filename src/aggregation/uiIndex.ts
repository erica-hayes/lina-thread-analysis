import { AnalyzedComment, UIIndex } from "../types";

export function buildUIIndex(comments: AnalyzedComment[]): UIIndex {
  const index: UIIndex = {
    byId: {},
    counts: {
      tone: {
        positive: 0,
        negative: 0,
        neutral: 0
      },
      nuance: {},
      intent: {},
      risk: {},
      signals: {},
      composite: {
        highRiskAdversarial: 0,
        highRiskNegativeTone: 0,
        supportiveInRiskyContext: 0
      }
    },
    groups: {
      tone: {
        positive: [],
        negative: [],
        neutral: []
      },
      nuance: {},
      intent: {},
      risk: {},
      signals: {},
      composite: {
        highRiskAdversarial: [],
        highRiskNegativeTone: [],
        supportiveInRiskyContext: []
      }
    }
  };

  for (const comment of comments) {
    index.byId[comment.id] = {
      tone: comment.tone,
      toneSubLabels: comment.toneSubLabels,
      nuance: comment.nuance,
      nuanceSecondary: comment.nuanceSecondary,
      intent: comment.intent,
      intentSubLabels: comment.intentSubLabels,
      toneLabel: comment.toneLabel,
      intentLabel: comment.intentLabel,
      toneConfidence: comment.toneConfidence,
      nuanceConfidence: comment.nuanceConfidence,
      intentConfidence: comment.intentConfidence,
      riskLevel: comment.riskLevel,
      signals: comment.signals,
      signalEvidence: comment.signalEvidence
    };

    index.groups.tone[comment.tone].push(comment.id);
    index.counts.tone[comment.tone] += 1;

    if (!index.groups.nuance[comment.nuance]) {
      index.groups.nuance[comment.nuance] = [];
      index.counts.nuance[comment.nuance] = 0;
    }
    index.groups.nuance[comment.nuance].push(comment.id);
    index.counts.nuance[comment.nuance] += 1;

    if (!index.groups.intent[comment.intent]) {
      index.groups.intent[comment.intent] = [];
      index.counts.intent[comment.intent] = 0;
    }
    index.groups.intent[comment.intent].push(comment.id);
    index.counts.intent[comment.intent] += 1;

    if (!index.groups.risk[comment.riskLevel]) {
      index.groups.risk[comment.riskLevel] = [];
      index.counts.risk[comment.riskLevel] = 0;
    }
    index.groups.risk[comment.riskLevel].push(comment.id);
    index.counts.risk[comment.riskLevel] += 1;

    const inRiskyContext = comment.riskLevel === "high" || comment.riskLevel === "critical";
    if (inRiskyContext && comment.intent === "adversarial") {
      index.groups.composite.highRiskAdversarial.push(comment.id);
      index.counts.composite.highRiskAdversarial += 1;
    }
    if (inRiskyContext && comment.tone === "negative") {
      index.groups.composite.highRiskNegativeTone.push(comment.id);
      index.counts.composite.highRiskNegativeTone += 1;
    }
    if (inRiskyContext && comment.intent === "supportive") {
      index.groups.composite.supportiveInRiskyContext.push(comment.id);
      index.counts.composite.supportiveInRiskyContext += 1;
    }

    for (const signal of comment.signals) {
      if (!index.groups.signals[signal]) {
        index.groups.signals[signal] = [];
        index.counts.signals[signal] = 0;
      }
      index.groups.signals[signal].push(comment.id);
      index.counts.signals[signal] += 1;
    }
  }

  return index;
}