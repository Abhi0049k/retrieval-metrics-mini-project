// eval.js starter. Fill in the four TODOs, then run: node eval.js
// You should not need any libraries. Plain Node.js is enough.
const fs = require('fs');

// --- 1. Load the inputs (already done for you) -----------------------------
// test-set.csv has a header row, then: query,correct_post_ids
// correct_post_ids may be a semicolon list, e.g. "1024;1025".
function loadTestSet(path) {
  const lines = fs.readFileSync(path, 'utf8').trim().split('\n').slice(1);
  return lines.map(line => {
    const [query, ids] = line.split(',');
    return { query, correctIds: ids.split(';').map(Number) };
  });
}
const testSet = loadTestSet('test-set.csv');

// search-results.json maps each query to the top-10 ranked post_id lists that
// each system returned: { "<query>": { keyword: [...], semantic: [...] } }
const results = JSON.parse(fs.readFileSync('search-results.json', 'utf8'));

// --- 2. TODO: Reciprocal Rank ----------------------------------------------
// Return 1 / (rank of the FIRST correct id in rankedIds). Return 0 if none of
// the correct ids appear in rankedIds. Rank is 1-based (first result = rank 1).
function reciprocalRank(rankedIds, correctIds) {
  for (let i = 0; i < rankedIds.length; i++) {
    if (correctIds.includes(rankedIds[i])) return 1 / (i + 1);
  }
  return 0;
}

// Helper: the 1-based rank of the first correct id, or null if it is a miss.
function rankOf(rankedIds, correctIds) {
  for (let i = 0; i < rankedIds.length; i++) {
    if (correctIds.includes(rankedIds[i])) return i + 1;
  }
  return null;
}

const mean = a => a.reduce((x, y) => x + y, 0) / a.length;

const kwRRs = [], semRRs = [];
let kwHits = 0, semHits = 0;
const rows = [];

for (const { query, correctIds } of testSet) {
  const r = results[query];
  const kwRR = reciprocalRank(r.keyword, correctIds);
  const semRR = reciprocalRank(r.semantic, correctIds);
  kwRRs.push(kwRR); semRRs.push(semRR);
  if (kwRR > 0) kwHits++;
  if (semRR > 0) semHits++;
  rows.push({ query, kwRank: rankOf(r.keyword, correctIds), semRank: rankOf(r.semantic, correctIds) });
}

const n = testSet.length;
console.log('| Query | Keyword rank | Semantic rank |');
console.log('|---|---|---|');
for (const { query, kwRank, semRank } of rows) {
  console.log(`| ${query} | ${kwRank ?? 'miss'} | ${semRank ?? 'miss'} |`);
}
console.log(`| **Summary** | **MRR ${mean(kwRRs).toFixed(2)} · Recall@10 ${(kwHits / n).toFixed(2)}** | **MRR ${mean(semRRs).toFixed(2)} · Recall@10 ${(semHits / n).toFixed(2)}** |`);
