// Send an existing invoice via Peppol (Billit) from the Studio, e.g. after
// correcting the customer's VAT number. Keeps the existing invoice number.
import { client } from "@/sanity/lib/client";
import { NextResponse } from "next/server";
import {
  getCustomerPeppolLookupId,
  getPeppolParticipant,
  sendPeppolInvoice,
  validateInvoiceForPeppol,
} from "@/lib/billit";
import { consumeStudioRequest } from "@/lib/studio-request";

export async function POST(request) {
  try {
    const { invoiceId, nonce } = await request.json();

    // Only requests started from the Studio by a logged-in editor
    const auth = await consumeStudioRequest(invoiceId, nonce, "sendPeppol");
    if (!auth.ok) {
      return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
    }

    const invoice = await client
      .withConfig({ useCdn: false })
      .fetch(`*[_type == "invoice" && _id == $invoiceId][0]`, { invoiceId });

    if (!invoice) {
      return NextResponse.json({ success: false, error: "Factuur niet gevonden" }, { status: 404 });
    }

    if (invoice.billitSentAt) {
      return NextResponse.json(
        {
          success: false,
          error: `Deze factuur is al via Peppol verstuurd op ${invoice.billitSentAt.slice(0, 10)}`,
        },
        { status: 409 }
      );
    }

    const validation = validateInvoiceForPeppol(invoice);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.errors.join(", ") },
        { status: 422 }
      );
    }

    // Check reachability first, so Billit doesn't end up with an unsent order
    const lookupId = getCustomerPeppolLookupId(invoice.companyDetails);
    const reachable = await getPeppolParticipant(lookupId);
    if (reachable === false) {
      return NextResponse.json(
        {
          success: false,
          error: `Klant is niet bereikbaar via Peppol (${lookupId}). Controleer het btw- of ondernemingsnummer.`,
        },
        { status: 422 }
      );
    }

    const result = await sendPeppolInvoice(invoice);

    if (!result.success) {
      await client.patch(invoice._id).set({ billitError: result.error }).commit();
      return NextResponse.json({ success: false, error: result.error }, { status: 502 });
    }

    await client
      .patch(invoice._id)
      .set({
        billitOrderId: result.orderId,
        billitSentAt: new Date().toISOString(),
        billitError: null,
        invoiceChannel: "peppol",
      })
      .commit();

    return NextResponse.json({
      success: true,
      message: `Factuur ${invoice.invoiceNumber} verstuurd via Peppol (Billit order ${result.orderId})`,
    });
  } catch (error) {
    console.error("Send invoice via Peppol failed:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Onbekende fout" },
      { status: 500 }
    );
  }
}
