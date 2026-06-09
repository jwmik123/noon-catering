// Export April 2026 invoices to CSV for accounting reconciliation.
// Read-only. Usage: node scripts/export-april-invoices.mjs
import { createClient } from "@sanity/client";
import { readFileSync, writeFileSync } from "node:fs";

// Minimal .env loader (no dotenv dependency required)
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

const nl = (n) => (n == null ? "" : Number(n).toFixed(2).replace(".", ",")); // comma decimals
const d = (s) => (s ? String(s).slice(0, 10) : "");
const csvCell = (v) => {
  const s = v == null ? "" : String(v);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

// Order/invoice number collisions: a quoteId here equals a different doc's invoiceNumber.
const COLLISION_NOTE = {
  "2026-0087": "DUBBEL met ordernr 0087 (= factuur 0099 Anke vd Vreede)",
  "2026-0099": "DUBBEL: ordernr 0087 botst met factuur 0087 (Pinky Swear)",
  "2026-0093": "DUBBEL met ordernr 0093 (= factuur 0101 Lenie Dhooghe)",
  "2026-0101": "DUBBEL: ordernr 0093 botst met factuur 0093 (BRP)",
  "2026-0092": "DUBBEL: ordernr 0094 botst met factuur 0094 (LegalFly) - creditnota",
  "2026-0094": "DUBBEL met ordernr 0094 (= creditnota 0092 BRP)",
  "2026-0120": "Factuur EN creditnota delen nr 0120 (annulatie Maya)",
  "2026-0097": "In boekhouding zonder nummer geboekt (Paniago)",
};

async function main() {
  const rows = await client.fetch(
    `*[_type == "invoice" && _createdAt >= "2026-04-01T00:00:00Z" && _createdAt < "2026-05-01T00:00:00Z" && !(_id in path("drafts.**"))]{
      invoiceNumber, creditNoteNumber, creditNoteDate, quoteId, status, paymentStatus,
      "name": orderDetails.name, "company": orderDetails.companyName,
      "paymentMethod": orderDetails.paymentMethod, "deliveryDate": orderDetails.deliveryDate,
      "subtotal": amount.subtotal, "vat": amount.vat, "total": amount.total,
      _createdAt, cancelledAt
    } | order(invoiceNumber asc)`
  );

  const header = [
    "Factuurnummer", "Creditnota_nr", "Type", "Klant", "Bedrijf",
    "Subtotaal", "BTW", "Totaal",
    "Status", "Betaalmethode", "Factuurdatum", "Leverdatum",
    "Ordernummer", "Geannuleerd_op", "Opmerking",
  ];

  const lines = [header.join(";")];
  for (const r of rows) {
    const type = r.status === "cancelled" ? "Creditnota" : "Factuur";
    lines.push([
      r.invoiceNumber || "(GEEN NUMMER)",
      r.creditNoteNumber || "",
      type,
      r.name || "",
      r.company || "",
      nl(r.subtotal),
      nl(r.vat),
      nl(r.total),
      r.status || "",
      r.paymentMethod || "",
      d(r._createdAt),
      r.deliveryDate || "",
      r.quoteId || "",
      d(r.cancelledAt),
      COLLISION_NOTE[r.invoiceNumber] || "",
    ].map(csvCell).join(";"));
  }

  const out = "boekhouding-april-2026.csv";
  writeFileSync(out, "﻿" + lines.join("\n"), "utf8"); // BOM for Excel
  console.log(`Wrote ${out} (${rows.length} facturen)`);
  console.log(`Creditnota's: ${rows.filter((r) => r.status === "cancelled").length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
