// Call an API route from a Studio action. First writes a one-time nonce onto
// the document with the editor's own session; the route only acts when it
// matches (see lib/studio-request.js).
export async function callStudioApi(client, { documentId, action, url, params = {} }) {
  const nonce = crypto.randomUUID();
  await client
    .patch(documentId)
    .set({
      studioRequest: { nonce, action, ...params, requestedAt: new Date().toISOString() },
    })
    .commit();

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ invoiceId: documentId, nonce }),
  });
  return response.json();
}
