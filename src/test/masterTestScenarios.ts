/**
 * MASTER TEST SUITE
 * Comprehensive coverage of all comment types across all post topics
 * Validates tone, intent, nuance, and risk across diverse scenarios
 */

export interface MasterTestScenario {
  id: string;
  category: string; // topic category
  postTopic: string;
  title: string;
  body: string;
  expectedTopic: string;
  comments: Array<{
    id: string;
    author: string;
    text: string;
    expectedTone: "positive" | "negative" | "neutral";
    expectedIntent: "supportive" | "critical" | "curious" | "adversarial" | "neutral";
    expectedNuance: string;
    expectedRisk: "none" | "low" | "moderate" | "high";
    description: string;
  }>;
}

export const masterTestScenarios: MasterTestScenario[] = [
  // ===== TRAUMA & ABUSE TOPIC =====
  {
    id: "trauma-multi-response",
    category: "trauma_safety",
    postTopic: "Surviving abuse",
    title: "My ex was abusive and I finally left",
    body: "I escaped a 5-year abusive relationship. I'm working through the trauma with a therapist.",
    expectedTopic: "trauma_safety",
    comments: [
      {
        id: "t1",
        author: "healer",
        text: "I'm so proud of you for leaving. That took incredible strength 💪 You're going to heal. Please reach out to a crisis line if you need support.",
        expectedTone: "positive",
        expectedIntent: "supportive",
        expectedNuance: "supportive",
        expectedRisk: "none",
        description: "Genuine supportive response with validation"
      },
      {
        id: "t2",
        author: "dismisser",
        text: "Everyone goes through rough relationships. Just move on already.",
        expectedTone: "neutral",
        expectedIntent: "neutral",
        expectedNuance: "invalidating",
        expectedRisk: "low",
        description: "Dismissive invalidation of trauma in trauma context"
      },
      {
        id: "t3",
        author: "gaslight",
        text: "Are you sure it was really abuse though? He seemed nice when I met him. You might be overreacting.",
        expectedTone: "negative",
        expectedIntent: "adversarial",
        expectedNuance: "gaslighting",
        expectedRisk: "moderate",
        description: "Classic gaslighting in trauma context (HIGH RISK)"
      },
      {
        id: "t4",
        author: "curious_seeker",
        text: "How long did it take before you recognized the pattern? I think I might be in a similar situation.",
        expectedTone: "neutral",
        expectedIntent: "curious",
        expectedNuance: "neutral",
        expectedRisk: "none",
        description: "Genuine curious inquiry for help"
      },
      {
        id: "t5",
        author: "comparative",
        text: "omg that's rough but at least he didn't hit you like mine did 😢",
        expectedTone: "neutral",
        expectedIntent: "critical",
        expectedNuance: "comparative",
        expectedRisk: "low",
        description: "Comparative suffering minimization"
      },
      {
        id: "t6",
        author: "sarcastic",
        text: "Oh wow, I'm SO sorry you had to deal with that. Have you tried just being happier? 🙄",
        expectedTone: "negative",
        expectedIntent: "adversarial",
        expectedNuance: "dismissive",
        expectedRisk: "low",
        description: "Sarcastic false empathy with bad advice"
      }
    ]
  },

  // ===== MENTAL HEALTH TOPIC =====
  {
    id: "mental-health-multi-response",
    category: "mental_health",
    postTopic: "Struggling with depression",
    title: "I've been hospitalized for suicidal ideation",
    body: "I'm in the psychiatric ward after a suicide attempt. I'm working through my depression with medication and therapy.",
    expectedTopic: "mental_health",
    comments: [
      {
        id: "m1",
        author: "ally",
        text: "Thank you for sharing your story. You're not alone 💙 Please keep reaching out. National Suicide Prevention Lifeline: 988",
        expectedTone: "positive",
        expectedIntent: "supportive",
        expectedNuance: "supportive",
        expectedRisk: "none",
        description: "Compassionate support with resources"
      },
      {
        id: "m2",
        author: "invalidator",
        text: "Everyone feels depressed sometimes. Just push through it.",
        expectedTone: "neutral",
        expectedIntent: "neutral",
        expectedNuance: "invalidating",
        expectedRisk: "low",
        description: "Invalidation in mental health context"
      },
      {
        id: "m3",
        author: "minimizer",
        text: "I'm sure you'll feel better soon! Maybe try yoga or meditation 🧘",
        expectedTone: "positive",
        expectedIntent: "supportive",
        expectedNuance: "dismissive",
        expectedRisk: "low",
        description: "Well-intentioned but minimizing advice"
      },
      {
        id: "m4",
        author: "concern_faker",
        text: "I'm so concerned about you. Have you considered that maybe you're just weak?",
        expectedTone: "negative",
        expectedIntent: "adversarial",
        expectedNuance: "polite_masking",
        expectedRisk: "moderate",
        description: "False concern masking judgment"
      },
      {
        id: "m5",
        author: "technical_curious",
        text: "What medication are you on? I'm considering asking my doctor about antidepressants.",
        expectedTone: "neutral",
        expectedIntent: "curious",
        expectedNuance: "neutral",
        expectedRisk: "none",
        description: "Genuine curious inquiry about treatment"
      }
    ]
  },

  // ===== PRIVACY BOUNDARY TOPIC =====
  {
    id: "privacy-multi-response",
    category: "privacy_boundary",
    postTopic: "Partner tracking my location",
    title: "My partner wants to use Find My Friends without my consent",
    body: "He says it's 'to keep me safe' but I don't want to share my location.",
    expectedTopic: "privacy_boundary",
    comments: [
      {
        id: "p1",
        author: "boundary_supporter",
        text: "Your privacy is important. You have every right to say no. That request raises a red flag. 🚩",
        expectedTone: "positive",
        expectedIntent: "supportive",
        expectedNuance: "supportive",
        expectedRisk: "none",
        description: "Affirms healthy boundary"
      },
      {
        id: "p2",
        author: "minimizer",
        text: "He's just worried about you. Sharing location isn't really a big deal.",
        expectedTone: "neutral",
        expectedIntent: "neutral",
        expectedNuance: "invalidating",
        expectedRisk: "low",
        description: "Downplays valid privacy concerns"
      },
      {
        id: "p3",
        author: "control_enabler",
        text: "If you have nothing to hide, you shouldn't mind. Trust is about transparency.",
        expectedTone: "negative",
        expectedIntent: "adversarial",
        expectedNuance: "coercive",
        expectedRisk: "moderate",
        description: "Coercive language justifying control"
      },
      {
        id: "p4",
        author: "searcher",
        text: "Have you discussed this boundary with him? How did he react when you said no?",
        expectedTone: "neutral",
        expectedIntent: "curious",
        expectedNuance: "neutral",
        expectedRisk: "none",
        description: "Supportive clarifying questions"
      }
    ]
  },

  // ===== RELATIONSHIP CONFLICT =====
  {
    id: "relationship-multi-response",
    category: "relationship_boundary",
    postTopic: "Husband never helps with housework",
    title: "I'm exhausted from doing all household tasks alone",
    body: "My husband works but refuses to help with cooking, cleaning, or childcare. When I ask, he says he's 'too tired'.",
    expectedTopic: "relationship_boundary",
    comments: [
      {
        id: "r1",
        author: "validating",
        text: "That sounds incredibly unfair. You deserve a partner who shares the load. Consider couples therapy.",
        expectedTone: "positive",
        expectedIntent: "supportive",
        expectedNuance: "supportive",
        expectedRisk: "none",
        description: "Validates feelings and suggests solution"
      },
      {
        id: "r2",
        author: "traditional",
        text: "That's just how marriages work. Men work outside, women handle the home.",
        expectedTone: "neutral",
        expectedIntent: "critical",
        expectedNuance: "invalidating",
        expectedRisk: "low",
        description: "Normalized dismissal based on gender roles"
      },
      {
        id: "r3",
        author: "blaming",
        text: "Maybe you're not being appreciative enough of his work. He probably feels undervalued.",
        expectedTone: "neutral",
        expectedIntent: "critical",
        expectedNuance: "blame_shifting",
        expectedRisk: "low",
        description: "Shifts blame to OP instead of addressing inequality"
      },
      {
        id: "r4",
        author: "practical",
        text: "Have you tried making a chore chart or dividing tasks explicitly? Sometimes clear expectations help.",
        expectedTone: "positive",
        expectedIntent: "supportive",
        expectedNuance: "supportive",
        expectedRisk: "none",
        description: "Practical supportive advice"
      }
    ]
  },

  // ===== NEUTRAL DISCUSSION TOPIC =====
  {
    id: "general-multi-response",
    category: "general",
    postTopic: "Best pizza toppings?",
    title: "Pineapple on pizza: hot take or crime against food?",
    body: "I genuinely enjoy pineapple on pizza. Fight me.",
    expectedTopic: "general",
    comments: [
      {
        id: "g1",
        author: "ally",
        text: "Pineapple pizza is amazing! 🍕 Sweet and savory is the best combo.",
        expectedTone: "positive",
        expectedIntent: "supportive",
        expectedNuance: "supportive",
        expectedRisk: "none",
        description: "Light supportive agreement"
      },
      {
        id: "g2",
        author: "disagree",
        text: "I respectfully disagree, but you do you! Everyone has different tastes.",
        expectedTone: "positive",
        expectedIntent: "neutral",
        expectedNuance: "neutral",
        expectedRisk: "none",
        description: "Respectful disagreement"
      },
      {
        id: "g3",
        author: "harsh",
        text: "That's disgusting. Only people with no taste like pineapple on pizza.",
        expectedTone: "negative",
        expectedIntent: "adversarial",
        expectedNuance: "derogatory",
        expectedRisk: "low",
        description: "Harsh criticism in low-stakes context"
      },
      {
        id: "g4",
        author: "curious",
        text: "What other unusual toppings do you enjoy? I'm trying to expand my palate.",
        expectedTone: "neutral",
        expectedIntent: "curious",
        expectedNuance: "neutral",
        expectedRisk: "none",
        description: "Genuine curious inquiry"
      }
    ]
  },

  // ===== PARENTING TOPIC WITH EMOJIS =====
  {
    id: "parenting-emojis",
    category: "parenting",
    postTopic: "Screen time boundaries for kids",
    title: "Is 2 hours of screen time per day too much for a 6yo?",
    body: "My son wants to watch videos all day. I'm trying to set healthy limits but feel guilty.",
    expectedTopic: "general",
    comments: [
      {
        id: "par1",
        author: "supportive_parent",
        text: "You're doing great! 👏 2 hours is actually reasonable. Your boundaries are healthy and you should feel good about that 💚",
        expectedTone: "positive",
        expectedIntent: "supportive",
        expectedNuance: "supportive",
        expectedRisk: "none",
        description: "Affirming emoji-heavy support"
      },
      {
        id: "par2",
        author: "judger",
        text: "2 hours?? 😱 You're basically raising a screen addict. Good parents limit it to 30 min max.",
        expectedTone: "negative",
        expectedIntent: "critical",
        expectedNuance: "passive_aggressive",
        expectedRisk: "low",
        description: "Judgmental with emoji for passive-aggression"
      },
      {
        id: "par3",
        author: "ngl_advisor",
        text: "Ngl I let my kids watch as much as they want 🤷 They turn out fine lol",
        expectedTone: "neutral",
        expectedIntent: "neutral",
        expectedNuance: "dismissive",
        expectedRisk: "none",
        description: "Slang (ngl) with dismissive stance"
      }
    ]
  },

  // ===== FINANCIAL ABUSE INDICATORS =====
  {
    id: "financial-control",
    category: "trauma_safety",
    postTopic: "Spouse controls all money",
    title: "My husband won't let me access our bank account",
    body: "He says it's 'for my own good' but he won't even let me see the balance. I feel trapped.",
    expectedTopic: "trauma_safety",
    comments: [
      {
        id: "f1",
        author: "safety_advocate",
        text: "This is financial abuse. You have the right to know about shared finances. Please contact the National Domestic Violence Hotline: 1-800-799-7233",
        expectedTone: "neutral",
        expectedIntent: "supportive",
        expectedNuance: "supportive",
        expectedRisk: "low",
        description: "Names pattern and provides resources"
      },
      {
        id: "f2",
        author: "minimizer",
        text: "Maybe he's just trying to protect you from financial stress. Some people are better with money.",
        expectedTone: "neutral",
        expectedIntent: "neutral",
        expectedNuance: "invalidating",
        expectedRisk: "low",
        description: "Rationalizes control behavior"
      },
      {
        id: "f3",
        author: "victim_blamer",
        text: "Well, if you contributed to the account, you'd have rights. Maybe you should get a job?",
        expectedTone: "neutral",
        expectedIntent: "critical",
        expectedNuance: "blame_shifting",
        expectedRisk: "moderate",
        description: "Shifts blame to victim"
      }
    ]
  },

  // ===== WORKPLACE HARASSMENT =====
  {
    id: "workplace-harassment",
    category: "general",
    postTopic: "Boss comments on my appearance",
    title: "My manager keeps making inappropriate comments about my body",
    body: "He says things like 'you look nice today' and asks about my personal life. I feel uncomfortable but HR seems dismissive.",
    expectedTopic: "general",
    comments: [
      {
        id: "w1",
        author: "advocate",
        text: "That's sexual harassment. Document everything and escalate past HR if needed. You deserve to feel safe at work.",
        expectedTone: "positive",
        expectedIntent: "supportive",
        expectedNuance: "supportive",
        expectedRisk: "none",
        description: "Validates and provides actionable support"
      },
      {
        id: "w2",
        author: "minimizer",
        text: "He's just being friendly! You're probably being too sensitive. That's just office culture.",
        expectedTone: "neutral",
        expectedIntent: "neutral",
        expectedNuance: "invalidating",
        expectedRisk: "low",
        description: "Normalizes harassment"
      },
      {
        id: "w3",
        author: "blamer",
        text: "Maybe if you dressed more professionally, he wouldn't comment on your appearance?",
        expectedTone: "negative",
        expectedIntent: "adversarial",
        expectedNuance: "blame_shifting",
        expectedRisk: "moderate",
        description: "Victim blaming in harassment context"
      }
    ]
  }
];

export function analyzeMasterTest() {
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║         MASTER TEST SUITE - INITIALIZATION                ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  let totalScenarios = 0;
  let totalComments = 0;

  for (const scenario of masterTestScenarios) {
    totalScenarios++;
    totalComments += scenario.comments.length;
    console.log(`✓ ${scenario.id}`);
    console.log(`  Topic: ${scenario.expectedTopic}`);
    console.log(`  Comments: ${scenario.comments.length}`);
    console.log();
  }

  console.log(`\n═══════════════════════════════════════════════════════════`);
  console.log(`Total Scenarios: ${totalScenarios}`);
  console.log(`Total Comments: ${totalComments}`);
  console.log(`═══════════════════════════════════════════════════════════\n`);

  return {
    scenarios: totalScenarios,
    comments: totalComments
  };
}

// Run if executed directly
if (require.main === module) {
  analyzeMasterTest();
}
