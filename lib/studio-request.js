/**
 * Authorise API calls made from Studio document actions.
 *
 * The action first writes a one-time `studioRequest` (nonce + action) onto the
 * document with the Studio's own, logged-in Sanity client. Only users with
 * write access to the dataset can do that. The API route then checks that the
 * nonce it received matches what is stored on the document, and removes it.
 */

import { client } from "@/sanity/lib/client";

const MAX_AGE_MS = 5 * 60 * 1000;

/**
 * @returns {Promise<{ok: true, request: object} | {ok: false, error: string}>}
 */
export async function consumeStudioRequest(documentId, nonce, action) {
  if (!documentId || typeof nonce !== "string" || nonce.length < 16) {
    return { ok: false, error: "Unauthorized" };
  }

  const stored = await client
    .withConfig({ useCdn: false })
    .fetch(`*[_id == $id][0].studioRequest`, { id: documentId });

  const age = Date.now() - new Date(stored?.requestedAt || 0).getTime();
  if (!stored || stored.nonce !== nonce || stored.action !== action || age > MAX_AGE_MS) {
    return { ok: false, error: "Unauthorized" };
  }

  // One-time use
  await client.patch(documentId).unset(["studioRequest"]).commit();

  return { ok: true, request: stored };
}
