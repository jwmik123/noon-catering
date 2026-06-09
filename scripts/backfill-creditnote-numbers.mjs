// Backfill credit note numbers (CN-YYYY-NNNN) for already-cancelled invoices.
// Assigns chronologically by credit date (cancelledAt, fallback createdAt).
//
// Dry-run (default):  node scripts/backfill-creditnote-numbers.mjs
// Apply changes:      node scripts/backfill-creditnote-numbers.mjs --commit
import { createClient } from "@sanity/client";
import { readFileSync } from "node:fs";

for (const file of [".env.local", ".env"]) {
  try {
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {}
}

const COMMIT = process.argv.includes("--commit");

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_DATASET || "production",
  apiVersion: process.env.SANITY_API_VERSION || "2024-01-01",
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

async function main() {
  // Cancelled invoices that don't have a credit note number yet
  const todo = await client.fetch(
    `*[_type == "invoice" && status == "cancelled" && !defined(creditNoteNumber) && !(_id in path("drafts.**"))]{
      _id, invoiceNumber, quoteId, cancelledAt, createdAt, _createdAt,
      "name": orderDetails.name, "company": orderDetails.companyName, "total": amount.total
    }`
  );

  // Sort by credit date (cancelledAt > createdAt > _createdAt)
  const dateOf = (r) => r.cancelledAt || r.createdAt || r._createdAt || "";
  todo.sort((a, b) => dateOf(a).localeCompare(dateOf(b)));

  // Seed per-year counters from any credit note numbers that already exist
  const existing = await client.fetch(
    `*[_type == "invoice" && defined(creditNoteNumber)].creditNoteNumber`
  );
  const counters = {}; // year -> highest used value
  for (const cn of existing) {
    const m = /^CN-(\d{4})-(\d+)$/.exec(cn || "");
    if (m) counters[m[1]] = Math.max(counters[m[1]] || 0, parseInt(m[2], 10));
  }

  const plan = [];
  for (const r of todo) {
    const date = dateOf(r);
    const year = String(new Date(date).getFullYear() || new Date().getFullYear());
    counters[year] = (counters[year] || 0) + 1;
    const creditNoteNumber = `CN-${year}-${String(counters[year]).padStart(4, "0")}`;
    plan.push({ ...r, creditNoteNumber, creditNoteDate: date });
  }

  console.log(`\n${plan.length} geannuleerde facturen zonder creditnota-nummer:\n`);
  for (const p of plan) {
    console.log(
      `  ${p.creditNoteNumber}  <-  factuur ${p.invoiceNumber || "(geen)"}  ` +
        `${(p.company || p.name || "").slice(0, 32).padEnd(32)}  €${(p.total || 0).toFixed(2)}  ${p.creditNoteDate.slice(0, 10)}`
    );
  }

  if (!COMMIT) {
    console.log("\nDRY-RUN. Niets gewijzigd. Voeg --commit toe om toe te passen.\n");
    return;
  }

  let tx = client.transaction();
  for (const p of plan) {
    tx = tx.patch(p._id, (patch) =>
      patch.set({ creditNoteNumber: p.creditNoteNumber, creditNoteDate: p.creditNoteDate })
    );
  }
  // Sync the live counter(s) so future cancellations continue after the backfilled max
  for (const [year, value] of Object.entries(counters)) {
    tx = tx.createOrReplace({
      _type: "creditNoteCounter",
      _id: `creditnote-counter-${year}`,
      year: Number(year),
      value,
    });
  }
  await tx.commit();
  console.log(`\n✅ ${plan.length} creditnota-nummers toegekend. Tellers bijgewerkt: ${Object.entries(counters).map(([y, v]) => `${y}→${v}`).join(", ")}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
