// Health check on invoice/credit-note numbering. Read-only.
// Usage: node scripts/check-invoice-numbering.mjs
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

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_DATASET || "production",
  apiVersion: process.env.SANITY_API_VERSION || "2024-01-01",
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

const YEAR = "2026";

async function main() {
  const invoices = await client.fetch(
    `*[_type == "invoice" && !(_id in path("drafts.**"))]{
      invoiceNumber, creditNoteNumber, status, quoteId,
      "name": orderDetails.name, "company": orderDetails.companyName,
      "total": amount.total, _createdAt
    }`
  );

  const withNum = invoices.filter((i) => i.invoiceNumber?.startsWith(`${YEAR}-`));
  const seq = (n) => parseInt(n.split("-")[1], 10);

  // 1. Duplicate invoice numbers
  const byNum = {};
  for (const i of withNum) (byNum[i.invoiceNumber] ||= []).push(i);
  const dups = Object.entries(byNum).filter(([, arr]) => arr.length > 1);

  // 2. Missing invoice numbers (null/empty, non-draft)
  const missing = invoices.filter((i) => !i.invoiceNumber);

  // 3. Gaps in the sequence
  const nums = withNum.map((i) => seq(i.invoiceNumber)).sort((a, b) => a - b);
  const min = nums[0], max = nums[nums.length - 1];
  const present = new Set(nums);
  const gaps = [];
  for (let n = min; n <= max; n++) if (!present.has(n)) gaps.push(`${YEAR}-${String(n).padStart(4, "0")}`);

  // 4. Cancelled invoices missing a credit-note number
  const cancelledNoCN = invoices.filter((i) => i.status === "cancelled" && !i.creditNoteNumber);

  // 5. Duplicate credit-note numbers
  const cnBy = {};
  for (const i of invoices) if (i.creditNoteNumber) (cnBy[i.creditNoteNumber] ||= []).push(i);
  const cnDups = Object.entries(cnBy).filter(([, arr]) => arr.length > 1);

  // Split gaps before/after the April fix (atomic counter created 14 Apr; first clean nr 0090)
  const gapsAfterApril = gaps.filter((g) => seq(g) >= 90);

  const ok = (b) => (b ? "✅" : "❌");
  console.log(`\n=== Numbering health check ${YEAR} ===`);
  console.log(`Facturen met nummer: ${withNum.length}  (reeks ${YEAR}-${String(min).padStart(4, "0")} … ${YEAR}-${String(max).padStart(4, "0")})\n`);

  console.log(`${ok(dups.length === 0)} Dubbele factuurnummers: ${dups.length}`);
  dups.forEach(([nr, arr]) => console.log(`     ${nr} -> ${arr.map((a) => a.company || a.name).join(" | ")}`));

  console.log(`${ok(missing.length === 0)} Facturen zonder nummer: ${missing.length}`);
  missing.forEach((m) => console.log(`     quote ${m.quoteId} -> ${m.company || m.name} (${m.status})`));

  console.log(`${ok(gapsAfterApril.length === 0)} Gaten NA april (>= 0090): ${gapsAfterApril.length}  ${gapsAfterApril.join(", ")}`);
  console.log(`   (alle gaten incl. april: ${gaps.length ? gaps.join(", ") : "geen"})`);

  console.log(`${ok(cancelledNoCN.length === 0)} Geannuleerde facturen zonder CN-nummer: ${cancelledNoCN.length}`);
  cancelledNoCN.forEach((c) => console.log(`     ${c.invoiceNumber} -> ${c.company || c.name}`));

  console.log(`${ok(cnDups.length === 0)} Dubbele creditnota-nummers: ${cnDups.length}`);
  cnDups.forEach(([nr, arr]) => console.log(`     ${nr} -> ${arr.map((a) => a.invoiceNumber).join(" | ")}`));

  console.log("");
}

main().catch((e) => { console.error(e); process.exit(1); });
