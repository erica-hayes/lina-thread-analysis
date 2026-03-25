import { classifyToneWithConfidence } from "./src/features/classifyTone";

const text = "I'm so sorry you're going through this. Have you tried just exercising more? That always works for me.";
const signals: string[] = [];
const riskLevel: "none" | "low" | "moderate" | "high" = "low";

const result = classifyToneWithConfidence(text, signals, riskLevel);

console.log("Text:", text);
console.log("Result:", JSON.stringify(result, null, 2));
console.log("Expected: tone='positive', subLabels=['supportive']");

// Debug the detection
const lowerText = text.toLowerCase();
console.log("\nDebug info:");
console.log("Has lead-in 'i'm so sorry you're going through this':", lowerText.includes("i'm so sorry you're going through this"));
console.log("Has 'have you tried':", lowerText.includes("have you tried"));
console.log("Has 'just exercising':", lowerText.includes("just exercising"));
console.log("Has 'that always works for me':", lowerText.includes("that always works for me"));
