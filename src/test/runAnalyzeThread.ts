import { analyzeThread } from "../core/analyzeThread";
import { mockRedditJson } from "./mockRedditJson";

function run(): void {
  const result = analyzeThread(mockRedditJson, { debug: true });
  console.log(JSON.stringify(result, null, 2));
}

run();