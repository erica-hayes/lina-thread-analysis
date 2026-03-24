import { DetectedSignal } from "../types";
import { RULES } from "./signalRules";

function withGlobalFlag(pattern: RegExp): RegExp {
  const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
  return new RegExp(pattern.source, flags);
}

export function detectSignals(text: string): DetectedSignal[] {
  const input = text ?? "";
  const detected: DetectedSignal[] = [];

  for (const rule of RULES) {
    for (const pattern of rule.patterns) {
      const matcher = withGlobalFlag(pattern);
      let match = matcher.exec(input);

      while (match !== null) {
        const matchedText = match[0] ?? "";
        const start = match.index ?? 0;
        const end = start + matchedText.length;

        if (matchedText.length > 0) {
          detected.push({
            ruleName: rule.name,
            category: rule.category,
            family: rule.family,
            matchedText,
            start,
            end,
            weight: rule.weight,
            riskContribution: rule.riskContribution,
            reasoning: rule.reasoning
          });
        }

        match = matcher.exec(input);
      }
    }
  }

  detected.sort((a, b) => a.start - b.start || b.riskContribution - a.riskContribution);
  return detected;
}