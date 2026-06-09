import { client } from "@/sanity/lib/client";

const COUNTER_TYPE = "creditNoteCounter";

/**
 * Atomically generate the next credit note number, e.g. "CN-2026-0001".
 * Credit notes have their own sequence, separate from invoice numbers.
 */
export async function getNextCreditNoteNumber() {
  const year = new Date().getFullYear();
  const counterId = `creditnote-counter-${year}`;

  // Seed the counter from the highest existing credit note number on first use of the year
  const existing = await client.fetch(`*[_id == $id][0].value`, { id: counterId });

  if (existing === null || existing === undefined) {
    const pattern = `CN-${year}-*`;
    const latest = await client.fetch(
      `*[_type == "invoice" && creditNoteNumber match $pattern] | order(creditNoteNumber desc)[0].creditNoteNumber`,
      { pattern }
    );
    const seedValue = latest ? parseInt(latest.replace(/\D/g, "").slice(4), 10) || 0 : 0;

    // createIfNotExists is idempotent — safe under concurrent calls
    await client.createIfNotExists({
      _type: COUNTER_TYPE,
      _id: counterId,
      year,
      value: seedValue,
    });
  }

  // Atomic increment — Sanity serializes patch mutations per document
  const result = await client
    .patch(counterId)
    .inc({ value: 1 })
    .commit({ returnDocuments: true });

  return `CN-${year}-${String(result.value).padStart(4, "0")}`;
}
