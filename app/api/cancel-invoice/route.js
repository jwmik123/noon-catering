// app/api/cancel-invoice/route.js
import { client } from "@/sanity/lib/client";
import { NextResponse } from "next/server";
import { sendCancellationEmail } from "@/lib/email";
import { createMollieClient } from "@mollie/api-client";

const mollieClient = createMollieClient({
  apiKey: process.env.MOLLIE_LIVE_API_KEY,
});

export async function POST(request) {
  console.log("===== CANCEL INVOICE API CALLED =====");

  try {
    const { invoiceId } = await request.json();

    if (!invoiceId) {
      return NextResponse.json(
        { success: false, error: "Missing invoiceId" },
        { status: 400 }
      );
    }

    // Bypass CDN to always get the latest published data
    const invoice = await client.withConfig({ useCdn: false }).fetch(
      `*[_type == "invoice" && _id == $invoiceId][0]`,
      { invoiceId }
    );

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: "Invoice not found" },
        { status: 404 }
      );
    }

    if (invoice.status === "cancelled") {
      return NextResponse.json(
        { success: false, error: "Invoice is already cancelled" },
        { status: 400 }
      );
    }

    console.log("Cancelling invoice:", invoice.quoteId);

    // Mollie refund — only for online-paid orders with a paymentId
    const isMolliePayment =
      invoice.orderDetails?.paymentMethod === "online" &&
      invoice.paymentStatus === "paid" &&
      invoice.paymentId;

    if (isMolliePayment) {
      console.log("Mollie payment detected, issuing refund for:", invoice.paymentId);
      try {
        const refund = await mollieClient.paymentRefunds.create({
          paymentId: invoice.paymentId,
          amount: {
            currency: "EUR",
            value: (invoice.amount?.total || 0).toFixed(2),
          },
          description: `Annulering bestelling ${invoice.quoteId}`,
        });
        console.log("Mollie refund created:", refund.id);
      } catch (refundError) {
        console.error("Mollie refund failed:", refundError);
        return NextResponse.json(
          { success: false, error: `Mollie refund failed: ${refundError.message}` },
          { status: 500 }
        );
      }
    }

    // Mark as cancelled in Sanity
    await client
      .patch(invoice._id)
      .set({
        status: "cancelled",
        cancelledAt: new Date().toISOString(),
      })
      .commit();

    console.log("Invoice status updated to cancelled");

    // Send cancellation email to customer + credit note to verkoop
    const emailResult = await sendCancellationEmail(invoice);

    if (!emailResult.success) {
      console.error("Cancellation emails failed:", emailResult.error);
      return NextResponse.json(
        { success: false, error: `Order cancelled but emails failed: ${emailResult.error}` },
        { status: 500 }
      );
    }

    console.log("===== CANCEL INVOICE API COMPLETED SUCCESSFULLY =====");
    return NextResponse.json({
      success: true,
      message: `Order ${invoice.quoteId} cancelled and emails sent`,
    });
  } catch (error) {
    console.error("Cancel invoice failed:", error);
    console.error("Error stack:", error.stack);
    return NextResponse.json(
      { success: false, error: error.message || "Unknown error occurred" },
      { status: 500 }
    );
  }
}
