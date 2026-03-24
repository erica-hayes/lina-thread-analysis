const fs = require("node:fs");
const path = require("node:path");

const { analyzeThread } = require("../dist/core/analyzeThread");

const mockPath = path.resolve(__dirname, "../dev/mockThread.json");
const outputPath = path.resolve(__dirname, "../dev/analysis-output.json");

const raw = JSON.parse(fs.readFileSync(mockPath, "utf-8"));
const result = analyzeThread(raw, { debug: true });

fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), "utf-8");
console.log(`Wrote analysis output to ${outputPath}`);
