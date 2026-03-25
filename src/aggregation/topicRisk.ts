import { ThreadContext } from "../context/threadContextAnalyzer";
import { RiskBand, TopicRisk } from "../types";
import { countRegexMatches } from "../utils/helpers";

const RISK_PRIORITY: Record<RiskBand, number> = {
  none: 0,
  low: 1,
  moderate: 2,
  high: 3
};

function collectEvidenceSnippets(text: string, pattern: RegExp, limit = 3): string[] {
  const matcher = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`);
  const snippets: string[] = [];
  let match = matcher.exec(text);

  while (match !== null && snippets.length < limit) {
    const token = (match[0] ?? "").trim();
    if (token.length > 0) {
      snippets.push(token);
    }
    match = matcher.exec(text);
  }

  return snippets;
}

export function assessThreadTopicRisk(threadContext: ThreadContext): TopicRisk {
  const text = `${threadContext.title} ${threadContext.body}`.toLowerCase();
  const factors: string[] = [];
  const detectedPatternTypes: string[] = [];
  const evidenceSnippets = new Set<string>();

  const minorRefCount = countRegexMatches(
    text,
    /\b(child|children|kid|kids|minor|underage|infant|baby|babies|little\s+girl|little\s+boy|\d+\s*year\s*old|victim\s+was\s+\d+)\b/g
  );
  const sexualAbuseCount = countRegexMatches(
    text,
    /\b(molest(?:ed|ing|ation)?|sexual(?:ly)?\s+(?:abuse|assault)(?:ed|ing)?|sex\s+(?:abuse|assault|crimes?)|child\s+sex\s+crimes?|csam|child\s+porn|\bcp\b|predator(?:s)?|pedophile(?:s)?|groom(?:ed|ing)?|\bcsa\b|\bcocsa\b|minor\s+attracted\s+person|nomap)\b/g
  );
  const severeAbuseCount = countRegexMatches(
    text,
    /\b(rape|raped|assault(?:ed)?|traffick(?:ing|ed)|exploitat(?:ion|ive))\b/g
  );
  const selfHarmCount = countRegexMatches(
    text,
    /\b(suicide|suicidal|kill\s+myself|end\s+my\s+life|self\s*harm|cutting|overdose|\bod\b|\bkms\b|unalive|unaliving)\b/g
  );
  const violentThreatCount = countRegexMatches(
    text,
    /\b(murder|kill\s+them|kill\s+him|kill\s+her|shoot(?:ing)?|mass\s+shoot(?:ing)?|bomb(?:ing)?|behead(?:ed|ing)?)\b/g
  );
  const exploitationCount = countRegexMatches(
    text,
    /\b(human\s+traffick(?:ing|ed)|sex\s+traffick(?:ing|ed)|forced\s+prostitution|coerc(?:e|ion|ed)|non[-\s]?consensual)\b/g
  );
  const eatingDisorderCount = countRegexMatches(
    text,
    /\b(anorexia|anorexic|bulimia|bulimic|purging|purge|pro[-\s]?ana|pro[-\s]?mia|thinspo|meanspo|restricting|eating\s+disorder)\b/g
  );
  const incestAbuseCount = countRegexMatches(
    text,
    /\b(incest|incestuous|inappropriate\s+(?:family|familial)\s+relationship|(?:father|dad|brother|uncle|mother|sister)\s+(?:touched|molested|raped))\b/g
  );

  for (const snippet of collectEvidenceSnippets(
    text,
    /\b(molest(?:ed|ing|ation)?|sexual(?:ly)?\s+(?:abuse|assault)(?:ed|ing)?|predator(?:s)?|pedophile(?:s)?|groom(?:ed|ing)?|\bcsa\b|\bcocsa\b|child\s+porn|csam)\b/g
  )) {
    evidenceSnippets.add(snippet);
  }
  for (const snippet of collectEvidenceSnippets(
    text,
    /\b(child|children|minor|underage|\d+\s*year\s*old|victim\s+was\s+\d+)\b/g
  )) {
    evidenceSnippets.add(snippet);
  }
  for (const snippet of collectEvidenceSnippets(
    text,
    /\b(suicide|suicidal|self\s*harm|kill\s+myself|murder|mass\s+shoot(?:ing)?)\b/g,
    2
  )) {
    evidenceSnippets.add(snippet);
  }

  let level: RiskBand = "none";
  let confidence = 0;

  if (sexualAbuseCount > 0) {
    level = "high";
    confidence = 0.88;
    factors.push("sexual abuse topic present in thread context");
    detectedPatternTypes.push("sexual_abuse");
  }

  if (minorRefCount > 0 && sexualAbuseCount > 0) {
    level = "high";
    confidence = 0.96;
    factors.push("minor + sexual abuse overlap detected in thread context");
    detectedPatternTypes.push("minor_sexual_abuse");
  }

  if (selfHarmCount >= 2 && RISK_PRIORITY.high > RISK_PRIORITY[level]) {
    level = "high";
    confidence = Math.max(confidence, 0.9);
    factors.push("repeated self-harm/suicide context in thread");
    detectedPatternTypes.push("self_harm_suicide");
  }

  if ((violentThreatCount >= 2 || exploitationCount >= 2) && RISK_PRIORITY.high > RISK_PRIORITY[level]) {
    level = "high";
    confidence = Math.max(confidence, 0.9);
    factors.push("repeated high-severity violence/exploitation context");
    detectedPatternTypes.push("violence_or_exploitation");
  }

  if (
    (minorRefCount > 0 && exploitationCount > 0) ||
    (minorRefCount > 0 && violentThreatCount > 0) ||
    (minorRefCount > 0 && incestAbuseCount > 0)
  ) {
    level = "high";
    confidence = Math.max(confidence, 0.96);
    factors.push("compound extreme-risk overlap detected");
    detectedPatternTypes.push("compound_extreme_risk");
  }

  if (sexualAbuseCount >= 3 || severeAbuseCount >= 3) {
    if (RISK_PRIORITY.high > RISK_PRIORITY[level]) {
      level = "high";
      confidence = Math.max(confidence, 0.95);
    }
    factors.push("repeated severe abuse references in thread");
    detectedPatternTypes.push("repeated_severe_abuse");
  }

  if (level === "none" && severeAbuseCount > 0) {
    level = "moderate";
    confidence = Math.max(confidence, 0.75);
    factors.push("severe abuse context references present");
    detectedPatternTypes.push("severe_abuse");
  }

  if (incestAbuseCount > 0 && RISK_PRIORITY.high > RISK_PRIORITY[level]) {
    level = "high";
    confidence = Math.max(confidence, 0.89);
    factors.push("incest/familial abuse context present");
    detectedPatternTypes.push("incest_familial_abuse");
  }

  if (eatingDisorderCount >= 2 && RISK_PRIORITY.high > RISK_PRIORITY[level]) {
    level = "high";
    confidence = Math.max(confidence, 0.83);
    factors.push("eating disorder content or pro-ED pattern present");
    detectedPatternTypes.push("eating_disorder");
  } else if (eatingDisorderCount === 1 && level === "none") {
    level = "moderate";
    confidence = Math.max(confidence, 0.72);
    factors.push("eating disorder reference present");
    detectedPatternTypes.push("eating_disorder_reference");
  }

  if (level === "none" && threadContext.sensitivity >= 0.65) {
    level = "low";
    confidence = Math.max(confidence, 0.55);
    factors.push("sensitive topic context without explicit severe pattern");
    detectedPatternTypes.push("sensitive_topic_context");
  }

  return {
    level,
    confidence: Number(Math.min(1, Math.max(confidence, 0.2)).toFixed(3)),
    factors,
    detectedPatternTypes: Array.from(new Set(detectedPatternTypes)),
    evidenceSnippets: Array.from(evidenceSnippets).slice(0, 8)
  };
}