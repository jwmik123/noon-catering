/**
 * Migration script to assign clean sequential invoiceNumbers to all existing invoices.
 * Numbers are assigned chronologically (oldest = 2026-0001, newest = 2026-0081).
 * The quoteId field is left untouched.
 *
 * Usage:
 *   node sanity/migrations/backfill-invoice-numbers.js
 *
 * Preview without writing:
 *   node sanity/migrations/backfill-invoice-numbers.js --dry-run
 */

import { createClient } from "@sanity/client";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, "../../.env.local") });

const isDryRun = process.argv.includes("--dry-run");

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  token: process.env.SANITY_API_TOKEN,
  apiVersion: "2025-02-13",
  useCdn: false,
});

async function run() {
  if (isDryRun) console.log("--- DRY RUN (no changes will be written) ---\n");

  const invoices = await client.fetch(
    `*[_type == "invoice" && !(_id in path("drafts.**"))] | order(_createdAt asc) { _id, quoteId, invoiceNumber, _createdAt }`
  );

  console.log(`Found ${invoices.length} invoices.\n`);

  const year = new Date().getFullYear();

  for (let i = 0; i < invoices.length; i++) {
    const invoice = invoices[i];
    const invoiceNumber = `${year}-${String(i + 1).padStart(4, "0")}`;
    const date = invoice._createdAt.split("T")[0];
    const was = invoice.invoiceNumber ? `(was: ${invoice.invoiceNumber})` : "(new)";

    console.log(`${invoiceNumber}  quoteId: ${String(invoice.quoteId).padEnd(14)}  date: ${date}  ${was}`);

    if (!isDryRun) {
      await client.patch(invoice._id).set({ invoiceNumber }).commit();
    }
  }

  if (isDryRun) {
    console.log("\n--- DRY RUN complete. Run without --dry-run to apply. ---");
  } else {
    console.log(`\nDone. ${invoices.length} invoices numbered.`);
  }
}

run().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
