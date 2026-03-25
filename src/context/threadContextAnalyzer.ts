export interface ThreadContext {
  title: string;
  body: string;
  topic: string;
  sensitivity: number;
  baselineRisk: number;
}

const TOPIC_KEYWORDS: Array<{
  topic: string;
  sensitivity: number;
  baselineRisk: number;
  keywords: string[];
}> = [
  {
    topic: "trauma_safety",
    sensitivity: 0.94,
    baselineRisk: 0.78,
    keywords: [
      "abuse",
      "sexual abuse",
      "molestation",
      "molested",
      "assault",
      "rape",
      "victim",
      "survivor",
      "grooming",
      "pedophile",
      "predator",
      "child",
      "children",
      "uncle",
      "father",
      "dad",
      "when i was",
      "not okay",
      "happened to me",
      "minor",
      "underage",
      "incest",
      "trauma"
    ]
  },
  {
    topic: "relationships",
    sensitivity: 0.75,
    baselineRisk: 0.45,
    keywords: ["relationship", "boyfriend", "girlfriend", "marriage", "divorce", "partner"]
  },
  {
    topic: "mental_health",
    sensitivity: 0.95,
    baselineRisk: 0.7,
    keywords: ["depression", "anxiety", "therapy", "suicidal", "mental health", "panic attack"]
  },
  {
    topic: "politics",
    sensitivity: 0.85,
    baselineRisk: 0.65,
    keywords: ["politics", "election", "president", "government", "policy", "left", "right"]
  },
  {
    topic: "conflict",
    sensitivity: 0.8,
    baselineRisk: 0.75,
    keywords: ["fight", "argument", "abuse", "toxic", "betray", "attack", "cheat"]
  },
  {
    topic: "privacy_boundary",
    sensitivity: 0.82,
    baselineRisk: 0.55,
    keywords: [
      "privacy",
      "tracked",
      "tracking",
      "track my location",
      "location",
      "find my friends",
      "without asking",
      "without telling",
      "monitoring"
    ]
  }
];

export function analyzeThreadContext(title: string, body: string): ThreadContext {
  const text = `${title} ${body}`.toLowerCase();

  let bestTopic = "general";
  let bestHits = 0;
  let bestSensitivity = 0.35;
  let bestBaselineRisk = 0.25;

  for (const candidate of TOPIC_KEYWORDS) {
    let hits = 0;
    for (const keyword of candidate.keywords) {
      const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const pattern = new RegExp(`\\b${escaped}\\b`, "i");
      if (pattern.test(text)) {
        hits += 1;
      }
    }

    if (hits > bestHits) {
      bestHits = hits;
      bestTopic = candidate.topic;
      bestSensitivity = candidate.sensitivity;
      bestBaselineRisk = candidate.baselineRisk;
    }
  }

  if (bestHits === 0) {
    return {
      title,
      body,
      topic: "general",
      sensitivity: 0.35,
      baselineRisk: 0.25
    };
  }

  const hitBoost = Math.min(bestHits, 4) * 0.04;
  return {
    title,
    body,
    topic: bestTopic,
    sensitivity: Math.min(1, Number((bestSensitivity + hitBoost).toFixed(2))),
    baselineRisk: Math.min(1, Number((bestBaselineRisk + hitBoost).toFixed(2)))
  };
}