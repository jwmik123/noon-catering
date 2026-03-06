// app/api/send-invoice/route.js
import { client } from "@/sanity/lib/client";
import { NextResponse } from "next/server";
import { sendInvoiceEmail } from "@/lib/email";
import { PRICING_QUERY } from "@/sanity/lib/queries";

export async function POST(request) {
  console.log("===== SEND INVOICE API CALLED =====");

  try {
    const { invoiceId } = await request.json();

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

    if (!invoice.orderDetails?.email) {
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

    const emailResult = await sendInvoiceEmail(invoice, pricing);

    if (emailResult.success) {
      console.log("Invoice email sent successfully");

      await client
        .patch(invoice._id)
        .set({ emailSent: true, emailSentAt: new Date().toISOString() })
        .commit();

      console.log("===== SEND INVOICE API COMPLETED SUCCESSFULLY =====");
      return NextResponse.json({
        success: true,
        message: `Invoice sent to ${invoice.orderDetails.email}`,
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
