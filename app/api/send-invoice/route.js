// app/api/send-invoice/route.js
import { client } from "@/sanity/lib/client";
import { NextResponse } from "next/server";
import { sendInvoiceEmail } from "@/lib/email";
import { PRICING_QUERY } from "@/sanity/lib/queries";
import { consumeStudioRequest } from "@/lib/studio-request";

export async function POST(request) {
  console.log("===== SEND INVOICE API CALLED =====");

  try {
    const { invoiceId, nonce } = await request.json();

    // Only requests started from the Studio by a logged-in editor
    const auth = await consumeStudioRequest(invoiceId, nonce, "sendInvoice");
    if (!auth.ok) {
      return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
    }

    const recipients = auth.request.recipients;
    if (!["both", "customer", "accountant"].includes(recipients)) {
      return NextResponse.json(
        { success: false, error: "Invalid recipients" },
        { status: 400 }
      );
    }

    if (!invoiceId) {
      console.error("Missing invoiceId in request");
      return NextResponse.json(
        { success: false, error: "Missing invoiceId" },
        { status: 400 }
      );
    }

    console.log("Fetching invoice with ID:", invoiceId);

    // Bypass CDN to always get the latest published data
    const invoice = await client.withConfig({ useCdn: false }).fetch(
      `*[_type == "invoice" && _id == $invoiceId][0]`,
      { invoiceId }
    );

    if (!invoice) {
      console.error(`Invoice with ID ${invoiceId} not found`);
      return NextResponse.json(
        { success: false, error: "Invoice not found" },
        { status: 404 }
      );
    }

    console.log("Invoice found:", invoice.quoteId);

    if (!invoice.orderDetails?.email && recipients !== "accountant") {
      console.error(`No email found in invoice orderDetails for ${invoice.quoteId}`);
      return NextResponse.json(
        { success: false, error: "No email address found for this invoice" },
        { status: 404 }
      );
    }

    console.log("Email found:", invoice.orderDetails.email);

    // Fetch pricing data (required by sendInvoiceEmail for PDF generation)
    let pricing = null;
    try {
      pricing = await client.fetch(PRICING_QUERY);
      console.log("Pricing data fetched");
    } catch (pricingError) {
      console.error("Error fetching pricing data:", pricingError);
    }

    console.log("Sending invoice email to:", invoice.orderDetails.email);

    const emailResult = await sendInvoiceEmail(invoice, pricing, { recipients });

    if (emailResult.success) {
      console.log("Invoice email sent successfully");

      const now = new Date().toISOString();
      await client
        .patch(invoice._id)
        .set({
          ...(recipients !== "accountant" && { emailSent: true, emailSentAt: now }),
          ...(recipients !== "customer" && { accountantEmailSentAt: now }),
        })
        .commit();

      console.log("===== SEND INVOICE API COMPLETED SUCCESSFULLY =====");
      return NextResponse.json({
        success: true,
        message: {
          both: `Factuur verstuurd naar ${invoice.orderDetails.email} en de boekhouder`,
          customer: `Factuur verstuurd naar ${invoice.orderDetails.email}`,
          accountant: "Factuur verstuurd naar de boekhouder",
        }[recipients],
      });
    } else {
      console.error("Failed to send invoice email:", emailResult.error);
      return NextResponse.json(
        { success: false, error: emailResult.error || "Failed to send invoice email" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Send invoice failed:", error);
    console.error("Error stack:", error.stack);
    console.log("===== SEND INVOICE API FAILED =====");
    return NextResponse.json(
      { success: false, error: error.message || "Unknown error occurred" },
      { status: 500 }
    );
  }
}
