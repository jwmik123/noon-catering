import { client } from "@/sanity/lib/client";

const COUNTER_TYPE = "invoiceCounter";

export async function getNextInvoiceNumber() {
  const year = new Date().getFullYear();
  const counterId = `invoice-counter-${year}`;

  // If counter document doesn't exist yet, seed it from the current highest invoiceNumber
  const existing = await client.fetch(`*[_id == $id][0].value`, { id: counterId });

  if (existing === null || existing === undefined) {
    const pattern = `${year}-*`;
    const latestInvoiceNumber = await client.fetch(
      `*[_type == "invoice" && invoiceNumber match $pattern] | order(invoiceNumber desc)[0].invoiceNumber`,
      { pattern }
    );
    const seedValue = latestInvoiceNumber
      ? parseInt(latestInvoiceNumber.split("-")[1], 10)
      : 0;

    // createIfNotExists is idempotent — safe under concurrent calls
    await client.createIfNotExists({
      _type: COUNTER_TYPE,
      _id: counterId,
      year,
      value: seedValue,
    });
  }

  // Atomically increment — Sanity serializes patch mutations per document,
  // so concurrent calls always produce distinct values.
  const result = await client
    .patch(counterId)
    .inc({ value: 1 })
    .commit({ returnDocuments: true });

  return `${year}-${String(result.value).padStart(4, "0")}`;
}
