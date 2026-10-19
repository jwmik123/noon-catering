// app/api/send-credit-note/route.js
import { client } from "@/sanity/lib/client";
import { NextResponse } from "next/server";
import { sendInvoiceEmail } from "@/lib/email";
import { PRICING_QUERY } from "@/sanity/lib/queries";
import { consumeStudioRequest } from "@/lib/studio-request";

// Sends the credit note PDF of a cancelled invoice to the customer and/or accountant.
export async function POST(request) {
  try {
    const { invoiceId, nonce } = await request.json();

    // Only requests started from the Studio by a logged-in editor
    const auth = await consumeStudioRequest(invoiceId, nonce, "sendCreditNote");
    if (!auth.ok) {
      return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
    }

    const recipients = auth.request.recipients;
    if (!["both", "customer", "accountant"].includes(recipients)) {
      return NextResponse.json({ success: false, error: "Invalid recipients" }, { status: 400 });
    }

    // Bypass CDN to always get the latest published data
    const invoice = await client.withConfig({ useCdn: false }).fetch(
      `*[_type == "invoice" && _id == $invoiceId][0]`,
      { invoiceId }
    );

    if (!invoice) {
      return NextResponse.json({ success: false, error: "Factuur niet gevonden" }, { status: 404 });
    }

    if (invoice.status !== "cancelled" || !invoice.creditNoteNumber) {
      return NextResponse.json(
        { success: false, error: "Alleen een geannuleerde factuur met creditnotanummer heeft een creditnota" },
        { status: 409 }
      );
    }

    if (!invoice.orderDetails?.email && recipients !== "accountant") {
      return NextResponse.json(
        { success: false, error: "Geen e-mailadres bij deze factuur" },
        { status: 404 }
      );
    }

    let pricing = null;
    try {
      pricing = await client.fetch(PRICING_QUERY);
    } catch (pricingError) {
      console.error("Error fetching pricing data:", pricingError);
    }

    const emailResult = await sendInvoiceEmail(invoice, pricing, { recipients, creditNote: true });

    if (!emailResult.success) {
      console.error("Failed to send credit note email:", emailResult.error);
      return NextResponse.json(
        { success: false, error: emailResult.error || "Versturen mislukt" },
        { status: 500 }
      );
    }

    const now = new Date().toISOString();
    await client
      .patch(invoice._id)
      .set({
        ...(recipients !== "accountant" && { creditNoteSentAt: now }),
        ...(recipients !== "customer" && { creditNoteAccountantSentAt: now }),
      })
      .commit();

    const cn = invoice.creditNoteNumber;
    return NextResponse.json({
      success: true,
      message: {
        both: `Creditnota ${cn} verstuurd naar ${invoice.orderDetails.email} en de boekhouder`,
        customer: `Creditnota ${cn} verstuurd naar ${invoice.orderDetails.email}`,
        accountant: `Creditnota ${cn} verstuurd naar de boekhouder`,
      }[recipients],
    });
  } catch (error) {
    console.error("Send credit note failed:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Unknown error occurred" },
      { status: 500 }
    );
  }
}
