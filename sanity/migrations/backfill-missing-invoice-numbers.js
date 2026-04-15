/**
 * Assigns invoiceNumbers to invoices that are missing them, continuing from
 * the current highest invoiceNumber. Also updates the atomic counter document.
 *
 * Usage:
 *   node sanity/migrations/backfill-missing-invoice-numbers.js
 *
 * Preview without writing:
 *   node sanity/migrations/backfill-missing-invoice-numbers.js --dry-run
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

  const year = new Date().getFullYear();

  // Find current highest invoiceNumber
  const highest = await client.fetch(
    `*[_type == "invoice" && defined(invoiceNumber) && invoiceNumber match $pattern] | order(invoiceNumber desc)[0].invoiceNumber`,
    { pattern: `${year}-*` }
  );
  const startFrom = highest ? parseInt(highest.split("-")[1], 10) : 0;
  console.log(`Current highest invoiceNumber: ${highest || "none"} → starting backfill from ${year}-${String(startFrom + 1).padStart(4, "0")}\n`);

  // Find invoices missing an invoiceNumber, ordered chronologically
  const invoices = await client.fetch(
    `*[_type == "invoice" && !(_id in path("drafts.**")) && !defined(invoiceNumber)] | order(_createdAt asc) { _id, quoteId, _createdAt, status }`
  );

  if (invoices.length === 0) {
    console.log("No invoices missing invoiceNumber. Nothing to do.");
    return;
  }

  console.log(`Found ${invoices.length} invoices missing invoiceNumber:\n`);

  let counter = startFrom;
  for (const invoice of invoices) {
    counter++;
    const invoiceNumber = `${year}-${String(counter).padStart(4, "0")}`;
    const date = invoice._createdAt.split("T")[0];
    console.log(`${invoiceNumber}  quoteId: ${String(invoice.quoteId || "—").padEnd(14)}  date: ${date}  status: ${invoice.status}`);

    if (!isDryRun) {
      await client.patch(invoice._id).set({ invoiceNumber }).commit();
    }
  }

  // Update the atomic counter so next real invoice continues from here
  const counterId = `invoice-counter-${year}`;
  console.log(`\nUpdating counter ${counterId} to ${counter}`);
  if (!isDryRun) {
    await client.createOrReplace({
      _type: "invoiceCounter",
      _id: counterId,
      year,
      value: counter,
    });
  }

  if (isDryRun) {
    console.log("\n--- DRY RUN complete. Run without --dry-run to apply. ---");
  } else {
    console.log(`\nDone. ${invoices.length} invoices backfilled. Counter set to ${counter}.`);
  }
}

run().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
