/**
 * One-off: give invoices whose number was already used in Billit/accounting
 * (before the April 2026 renumbering, Billit received the quoteId as invoice
 * number) the next free numbers from the invoice counter.
 *
 * The old number is kept in previousInvoiceNumber, the due date is reset to
 * 14 days from now because these invoices are issued now.
 *
 * Usage:
 *   node sanity/migrations/renumber-duplicate-invoices.js --dry-run
 *   node sanity/migrations/renumber-duplicate-invoices.js
 */

import { createClient } from "@sanity/client";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, "../../.env.local") });

const isDryRun = process.argv.includes("--dry-run");

// Oldest first, so the new numbers follow the original order
const DUPLICATES = ["2026-0007", "2026-0015", "2026-0022", "2026-0048", "2026-0065"];

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  token: process.env.SANITY_API_TOKEN,
  apiVersion: "2025-02-13",
  useCdn: false,
});

async function run() {
  const year = 2026;
  const counterId = `invoice-counter-${year}`;

  const counter = await client.fetch(`*[_id == $id][0]{value, _rev}`, { id: counterId });
  const maxNumber = await client.fetch(
    `*[_type == "invoice" && invoiceNumber match "2026-*"] | order(invoiceNumber desc)[0].invoiceNumber`
  );
  if (`${year}-${String(counter.value).padStart(4, "0")}` !== maxNumber) {
    throw new Error(`Counter (${counter.value}) out of sync with highest number (${maxNumber})`);
  }

  const invoices = await client.fetch(
    `*[_type == "invoice" && invoiceNumber in $numbers && !(_id in path("drafts.**"))]{_id, invoiceNumber, "company": companyDetails.name, previousInvoiceNumber}`,
    { numbers: DUPLICATES }
  );
  if (invoices.length !== DUPLICATES.length) {
    throw new Error(`Expected ${DUPLICATES.length} invoices, found ${invoices.length}`);
  }
  if (invoices.some((inv) => inv.previousInvoiceNumber)) {
    throw new Error("Some invoices were already renumbered — aborting");
  }

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 14);
  dueDate.setUTCHours(0, 0, 0, 0);

  const tx = client.transaction();
  // Fails if the counter changed since we read it (e.g. a new order came in)
  tx.patch(counterId, (p) => p.ifRevisionId(counter._rev).inc({ value: DUPLICATES.length }));

  DUPLICATES.forEach((oldNumber, i) => {
    const invoice = invoices.find((inv) => inv.invoiceNumber === oldNumber);
    const newNumber = `${year}-${String(counter.value + 1 + i).padStart(4, "0")}`;
    console.log(`${oldNumber} -> ${newNumber}  ${invoice.company}`);
    tx.patch(invoice._id, (p) =>
      p.set({
        invoiceNumber: newNumber,
        previousInvoiceNumber: oldNumber,
        dueDate: dueDate.toISOString(),
      })
    );
  });

  console.log(`Counter: ${counter.value} -> ${counter.value + DUPLICATES.length}`);
  console.log(`New due date: ${dueDate.toISOString().slice(0, 10)}`);

  if (isDryRun) {
    console.log("\n--- DRY RUN, nothing written ---");
    return;
  }

  await tx.commit();
  console.log("\nDone.");
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
