/**
 * Debug script to trace tone classification for mixed-support-criticism c1
 */

import { analyzeThread } from "../core/analyzeThread";
import { classifyToneWithConfidence } from "../features/classifyTone";

const testThreadJson = {
  kind: "Listing",
  data: {
    title: "Struggling with depression",
    selftext: "I've been having a really hard time getting out of bed lately. Everything feels overwhelming.",
    children: [
      {
        kind: "t1",
        data: {
          id: "c1",
          parent_id: "t3_post6",
          author: "user1",
          body: "I'm so sorry you're going through this. Have you tried just exercising more? That always works for me.",
          created_utc: 1710000000,
          replies: ""
        }
      }
    ]
  }
};

console.log("\n=== DEBUGGING mixed-support-criticism c1 ===\n");

const comment = testThreadJson.data.children[0].data;
console.log("Comment text:", comment.body);
console.log("\n--- Direct tone classification ---");

const toneResult = classifyToneWithConfidence(comment.body, [], "low");
console.log("Direct classifyTone result:", JSON.stringify(toneResult, null, 2));

console.log("\n--- Full analyzeThread result ---");
const analysis = analyzeThread(testThreadJson);
const analyzedComment = analysis.comments[0];
console.log("Full analysis:", JSON.stringify({
  tone: analyzedComment.tone,
  toneSubLabels: analyzedComment.toneSubLabels,
  nuance: analyzedComment.nuance,
  intent: analyzedComment.intent,
  riskLevel: analyzedComment.riskLevel,
  signals: analyzedComment.signals?.slice(0, 3)
}, null, 2));

console.log("\n--- All signals detected ---");
if (analyzedComment.signals) {
  analyzedComment.signals.slice(0, 5).forEach((sig, i) => {
    console.log(`${i + 1}. ${sig}`);
  });
}
