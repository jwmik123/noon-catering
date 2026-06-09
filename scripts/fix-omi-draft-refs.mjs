import { createClient } from "@sanity/client";
import { readFileSync } from "node:fs";

// load .env.local
const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const DRAFT = "drafts.eb313302-08d3-46db-9e58-ac63f743d5d7";
const PUBLISHED = "eb313302-08d3-46db-9e58-ac63f743d5d7";
const DRY = process.argv.includes("--dry");

const client = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-02-13",
  token: env.SANITY_API_TOKEN,
  useCdn: false,
});

// deep-walk: replace DRAFT _ref -> PUBLISHED. returns count of swaps.
function fix(node) {
  let n = 0;
  if (Array.isArray(node)) {
    for (const v of node) n += fix(v);
  } else if (node && typeof node === "object") {
    if (node._ref === DRAFT) {
      node._ref = PUBLISHED;
      n++;
    }
    for (const k of Object.keys(node)) {
      if (k !== "_ref") n += fix(node[k]);
    }
  }
  return n;
}

const docs = await client.fetch(`*[references($d)]`, { d: DRAFT });
console.log(`Found ${docs.length} docs referencing ${DRAFT}`);

let tx = client.transaction();
let total = 0;
for (const doc of docs) {
  const swaps = fix(doc);
  if (swaps === 0) {
    console.log(`  SKIP ${doc._id} (no draft ref found - already published?)`);
    continue;
  }
  console.log(`  ${doc._type} ${doc._id} <${doc.name ?? ""}> : ${swaps} ref(s)`);
  total += swaps;
  tx = tx.createOrReplace(doc);
}

if (DRY) {
  console.log(`\nDRY RUN. Would fix ${total} ref(s) across ${docs.length} docs. No write.`);
} else {
  const res = await tx.commit();
  console.log(`\nCommitted. ${res.results.length} docs updated, ${total} ref(s) fixed.`);
}
