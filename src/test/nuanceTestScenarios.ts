/**
 * Comprehensive test scenarios for nuance detection and OP context awareness
 * Each scenario includes expected signals that should be detected
 */

export interface ExpectedSignal {
  ruleName?: string;
  category: "risk" | "hostility" | "support" | "curiosity" | "passive_aggression" | "instability";
  family: string;
  minRiskContribution?: number;
}

export interface ExpectedClassification {
  tone?: "positive" | "negative" | "neutral";
  toneSubLabels?: string[];
  nuance?: string;
  nuanceSecondary?: string[];
  intent?: "supportive" | "critical" | "curious" | "adversarial" | "neutral";
  intentSubLabels?: string[];
  riskLevel?: "none" | "low" | "moderate" | "high";
}

export interface TestScenario {
  id: string;
  description: string;
  opContext: {
    title: string;
    body: string;
    expectedTopic?: string;
    expectedSensitivity?: number;
  };
  comments: Array<{
    id: string;
    author: string;
    body: string;
    parentId: string | null;
    expectedSignals: ExpectedSignal[];
    expectedClassification: ExpectedClassification;
    notes?: string;
  }>;
}

export const nuanceTestScenarios: TestScenario[] = [
  {
    id: "passive-aggressive-dismissal",
    description: "Subtle passive-aggressive dismissal patterns that should not be classified as neutral",
    opContext: {
      title: "Feeling hurt by my partner's comments about my weight",
      body: "My partner keeps making comments about what I eat and suggesting I should exercise more. It makes me feel terrible about myself.",
      expectedTopic: "relationship_boundary",
      expectedSensitivity: 1
    },
    comments: [
      {
        id: "c1",
        author: "user1",
        body: "Well, maybe they're just trying to help. If you say so.",
        parentId: null,
        expectedSignals: [
          { category: "passive_aggression", family: "snark" }
        ],
        expectedClassification: {
          tone: "neutral",
          nuance: "passive_aggressive",
          intent: "neutral",
          riskLevel: "low"
        },
        notes: "Classic 'if you say so' passive-aggressive pattern"
      },
      {
        id: "c2",
        author: "user2",
        body: "I'm sorry but have you considered they might have a point? Maybe you're being too sensitive.",
        parentId: null,
        expectedSignals: [
          { category: "hostility", family: "invalidation" }
        ],
        expectedClassification: {
          tone: "negative",
          nuance: "invalidating",
          intent: "adversarial",
          riskLevel: "moderate"
        },
        notes: "Polite masking + invalidation should be detected"
      },
      {
        id: "c3",
        author: "user3",
        body: "Whatever makes you happy. Do what you want.",
        parentId: null,
        expectedSignals: [
          { category: "passive_aggression", family: "snark" }
        ],
        expectedClassification: {
          tone: "neutral",
          nuance: "passive_aggressive",
          intent: "neutral",
          riskLevel: "low"
        },
        notes: "Dismissive pattern"
      }
    ]
  },
  {
    id: "gaslighting-with-care-concern",
    description: "Gaslighting disguised as concern - OP context should elevate risk",
    opContext: {
      title: "My ex keeps texting me after I asked for space",
      body: "I told my ex I need space but they keep messaging saying they're worried about me and that I'm not thinking clearly.",
      expectedTopic: "relationship_boundary",
      expectedSensitivity: 1
    },
    comments: [
      {
        id: "c1",
        author: "user1",
        body: "Maybe you're overreacting. They sound like they genuinely care.",
        parentId: null,
        expectedSignals: [
          { category: "hostility", family: "invalidation" }
        ],
        expectedClassification: {
          tone: "negative",
          nuance: "gaslighting",
          intent: "adversarial",
          riskLevel: "moderate"
        },
        notes: "Invalidation in boundary violation context"
      },
      {
        id: "c2",
        author: "user2",
        body: "You're remembering it wrong. I'm sure they didn't mean it that way.",
        parentId: null,
        expectedSignals: [
          { category: "hostility", family: "invalidation" }
        ],
        expectedClassification: {
          tone: "negative",
          nuance: "gaslighting",
          intent: "adversarial",
          riskLevel: "moderate"
        },
        notes: "Direct gaslighting pattern"
      }
    ]
  },
  {
    id: "coercive-control-subtle",
    description: "Subtle coercive control language in relationship context",
    opContext: {
      title: "Partner gets upset when I spend time with friends",
      body: "Every time I make plans with my friends, my partner gets quiet and distant. They say they're fine but then bring it up later in arguments.",
      expectedTopic: "relationship_boundary",
      expectedSensitivity: 1
    },
    comments: [
      {
        id: "c1",
        author: "user1",
        body: "Don't tell anyone we talked about this, it's between us. You have to respond to me about this.",
        parentId: null,
        expectedSignals: [
          { category: "risk", family: "control", minRiskContribution: 1.5 }
        ],
        expectedClassification: {
          tone: "negative",
          nuance: "coercive",
          intent: "adversarial",
          riskLevel: "high"
        },
        notes: "Secrecy + demand for response"
      },
      {
        id: "c2",
        author: "user2",
        body: "You're mine and you can't ignore me. Answer me.",
        parentId: null,
        expectedSignals: [
          { category: "risk", family: "control", minRiskContribution: 1.5 }
        ],
        expectedClassification: {
          tone: "negative",
          nuance: "possessive",
          intent: "adversarial",
          riskLevel: "high"
        },
        notes: "Possessive + coercive demand"
      }
    ]
  },
  {
    id: "blame-shifting-in-conflict",
    description: "Blame-shifting patterns that should be detected as more than neutral",
    opContext: {
      title: "Argument with roommate about cleanliness",
      body: "My roommate never does dishes and when I brought it up, they got angry at me.",
      expectedTopic: "interpersonal",
      expectedSensitivity: 0
    },
    comments: [
      {
        id: "c1",
        author: "user1",
        body: "This is your fault. You made me do this by nagging constantly.",
        parentId: null,
        expectedSignals: [
          { category: "hostility", family: "blame" },
          { category: "hostility", family: "targeting" }
        ],
        expectedClassification: {
          tone: "negative",
          nuance: "blame_shifting",
          intent: "adversarial",
          riskLevel: "moderate"
        },
        notes: "Direct blame-shifting should be detected"
      },
      {
        id: "c2",
        author: "user2",
        body: "Look what you made me do. You started it.",
        parentId: null,
        expectedSignals: [
          { category: "hostility", family: "blame" }
        ],
        expectedClassification: {
          tone: "negative",
          nuance: "blame_shifting",
          intent: "adversarial",
          riskLevel: "moderate"
        },
        notes: "Classic blame-shifting phrase"
      }
    ]
  },
  {
    id: "trauma-disclosure-context",
    description: "OP trauma disclosure should elevate risk assessment of critical comments",
    opContext: {
      title: "Finally ready to talk about what happened to me",
      body: "When I was 12, my uncle did things that I'm only now understanding were not okay. I'm struggling with this.",
      expectedTopic: "trauma_safety",
      expectedSensitivity: 1
    },
    comments: [
      {
        id: "c1",
        author: "user1",
        body: "Why did you wait so long to say something? That doesn't make sense.",
        parentId: null,
        expectedSignals: [
          { category: "hostility", family: "targeting" }
        ],
        expectedClassification: {
          tone: "negative",
          nuance: "invalidating",
          intent: "adversarial",
          riskLevel: "high"
        },
        notes: "Victim-blaming in trauma context should be high risk"
      },
      {
        id: "c2",
        author: "user2",
        body: "Are you sure that's what happened? Kids misremember things.",
        parentId: null,
        expectedSignals: [
          { category: "hostility", family: "invalidation" }
        ],
        expectedClassification: {
          tone: "negative",
          nuance: "gaslighting",
          intent: "adversarial",
          riskLevel: "high"
        },
        notes: "Gaslighting trauma disclosure is critical risk"
      }
    ]
  },
  {
    id: "mixed-support-criticism",
    description: "Mixed signals: support + criticism should not default to neutral",
    opContext: {
      title: "Struggling with depression",
      body: "I've been having a really hard time getting out of bed lately. Everything feels overwhelming.",
      expectedTopic: "mental_health",
      expectedSensitivity: 1
    },
    comments: [
      {
        id: "c1",
        author: "user1",
        body: "I'm so sorry you're going through this. Have you tried just exercising more? That always works for me.",
        parentId: null,
        expectedSignals: [
          { category: "support", family: "deescalation" }
        ],
        expectedClassification: {
          tone: "positive",
          toneSubLabels: ["supportive"],
          nuance: "invalidating",
          nuanceSecondary: ["polite_masking"],
          intent: "supportive",
          intentSubLabels: ["support_validation"],
          riskLevel: "low"
        },
        notes: "Well-intentioned but dismissive advice"
      },
      {
        id: "c2",
        author: "user2",
        body: "That must be so hard. But honestly, you need to just push through it. We all have bad days.",
        parentId: null,
        expectedSignals: [
          { category: "support", family: "encouragement" }
        ],
        expectedClassification: {
          tone: "neutral",
          nuance: "invalidating",
          intent: "supportive",
          riskLevel: "low"
        },
        notes: "Minimizing mental health struggles"
      }
    ]
  },
  {
    id: "backhanded-compliments",
    description: "Backhanded compliments and sarcastic praise",
    opContext: {
      title: "Proud of finishing my degree at 35",
      body: "It took me longer than most people but I finally finished my bachelor's degree!",
      expectedTopic: "general",
      expectedSensitivity: 0
    },
    comments: [
      {
        id: "c1",
        author: "user1",
        body: "Wow, good for you! Must be nice to have all that time. Bless your heart.",
        parentId: null,
        expectedSignals: [
          { category: "passive_aggression", family: "snark" }
        ],
        expectedClassification: {
          tone: "neutral",
          nuance: "backhanded_compliment",
          intent: "neutral",
          riskLevel: "low"
        },
        notes: "'Bless your heart' pattern"
      },
      {
        id: "c2",
        author: "user2",
        body: "No offense but most people do that in their 20s. Better late than never I guess.",
        parentId: null,
        expectedSignals: [
          { category: "passive_aggression", family: "snark" }
        ],
        expectedClassification: {
          tone: "negative",
          nuance: "backhanded_compliment",
          nuanceSecondary: ["comparative"],
          intent: "critical",
          riskLevel: "low"
        },
        notes: "'No offense but' + comparison"
      }
    ]
  },
  {
    id: "emotional-intensity-anxious",
    description: "High emotional intensity (anxiety) should be detected with proper sublabels",
    opContext: {
      title: "Worried about my child's safety at school",
      body: "There have been several incidents at my child's school and I'm terrified something will happen.",
      expectedTopic: "safety_concern",
      expectedSensitivity: 1
    },
    comments: [
      {
        id: "c1",
        author: "user1",
        body: "I'm so scared about this too. I'm panicking every day and can't focus. What if something happens? I'm so worried.",
        parentId: null,
        expectedSignals: [
          { category: "instability", family: "intensity" }
        ],
        expectedClassification: {
          tone: "neutral",
          toneSubLabels: ["anxious"],
          nuance: "hurt",
          intent: "supportive",
          intentSubLabels: ["support_seeking"],
          riskLevel: "low"
        },
        notes: "Anxious tone should be detected"
      }
    ]
  },
  {
    id: "op-context-carryover",
    description: "Comments should be interpreted through OP context lens",
    opContext: {
      title: "My dad tracked my location without telling me",
      body: "I'm 24 and found out my dad has been using Find My Friends to track my location for months without asking.",
      expectedTopic: "privacy_violation",
      expectedSensitivity: 1
    },
    comments: [
      {
        id: "c1",
        author: "user1",
        body: "He's just worried about you. Parents do that.",
        parentId: null,
        expectedSignals: [
          { category: "hostility", family: "invalidation" }
        ],
        expectedClassification: {
          tone: "neutral",
          nuance: "invalidating",
          intent: "neutral",
          riskLevel: "moderate"
        },
        notes: "Minimizing boundary violation - OP context should increase risk"
      },
      {
        id: "c2",
        author: "user2",
        body: "You're overreacting. It's normal for family.",
        parentId: null,
        expectedSignals: [
          { category: "hostility", family: "invalidation" }
        ],
        expectedClassification: {
          tone: "negative",
          nuance: "gaslighting",
          intent: "adversarial",
          riskLevel: "moderate"
        },
        notes: "Direct invalidation of privacy concern"
      }
    ]
  }
];
