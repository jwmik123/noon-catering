// Cron job to send invoices to Billit for Peppol e-invoicing and email to customers
// Runs daily at 8 AM (configured in vercel.json)
export const dynamic = "force-dynamic";

import { client } from "@/sanity/lib/client";
import { sendPeppolInvoice, validateInvoiceForPeppol } from "@/lib/billit";
import { sendInvoiceEmail } from "@/lib/email";
import { PRICING_QUERY } from "@/sanity/lib/queries";
import { NextResponse } from "next/server";

export async function GET(request) {
  console.log("========================================");
  console.log("CRON JOB STARTED: send-invoices-to-billit");
  console.log("========================================");

  const executionTime = new Date().toISOString();
  console.log(`Execution time: ${executionTime}`);

  // Verify the request is from a trusted source (e.g., Vercel Cron)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.error("Unauthorized access attempt");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0];
    console.log(`Looking for invoices with delivery date: ${today}`);

    // Find all invoices that:
    // 1. Have a delivery date of today
    // 2. Haven't been sent to Billit yet
    // 3. Status is pending (invoice payment method)
    console.log("Querying Sanity database...");
    const invoices = await client.fetch(
      `*[_type == "invoice" &&
        orderDetails.deliveryDate match $today &&
        !defined(billitSentAt) &&
        status == "pending"]{
        _id,
        quoteId,
        referenceNumber,
        amount,
        status,
        dueDate,
        companyDetails,
        orderDetails,
        createdAt
      }`,
      { today }
    );

    console.log(`Found ${invoices.length} invoices to process for today`);

    if (invoices.length === 0) {
      console.log("No invoices to process today");
      console.log("========================================");
      console.log("CRON JOB COMPLETED");
      console.log("========================================");
      return NextResponse.json({
        success: true,
        processed: 0,
        successful: 0,
        failed: 0,
        message: "No invoices to process today",
      });
    }

    // Log invoice IDs for debugging
    console.log("Invoice IDs to process:", invoices.map((inv) => inv.quoteId || inv._id));

    // Fetch pricing data once for all invoices
    let pricing = null;
    try {
      pricing = await client.fetch(PRICING_QUERY);
    } catch (pricingError) {
      console.error("Error fetching pricing data:", pricingError);
    }

    // Process each invoice
    const results = [];
    for (const invoice of invoices) {
      console.log(`\n--- Processing invoice: ${invoice.quoteId || invoice._id} ---`);

      // Validate invoice has required fields for Peppol
      const validation = validateInvoiceForPeppol(invoice);
      if (!validation.valid) {
        console.error(`Validation failed for ${invoice.quoteId}:`, validation.errors);

        // Update invoice with error
        await client
          .patch(invoice._id)
          .set({
            billitError: `Validation failed: ${validation.errors.join(", ")}`,
          })
          .commit();

        results.push({
          quoteId: invoice.quoteId,
          success: false,
          error: `Validation failed: ${validation.errors.join(", ")}`,
        });
        continue;
      }

      // Send to Billit
      const result = await sendPeppolInvoice(invoice);

      if (result.success) {
        console.log(`Successfully sent ${invoice.quoteId} to Billit. Order ID: ${result.orderId}`);

        // Update invoice with Billit tracking info
        await client
          .patch(invoice._id)
          .set({
            billitOrderId: result.orderId,
            billitSentAt: new Date().toISOString(),
            billitError: null, // Clear any previous error
          })
          .commit();

        // Send invoice email to customer with PDF attachment
        const emailResult = await sendInvoiceEmail(invoice, pricing);

        if (emailResult.success) {
          console.log(`Invoice email sent successfully for ${invoice.quoteId}`);

          // Update invoice with email sent timestamp
          await client
            .patch(invoice._id)
            .set({
              invoiceEmailSentAt: new Date().toISOString(),
            })
            .commit();
        } else {
          console.error(`Failed to send invoice email for ${invoice.quoteId}:`, emailResult.error);

          // Update invoice with email error (but don't fail the whole process)
          await client
            .patch(invoice._id)
            .set({
              invoiceEmailError: emailResult.error,
            })
            .commit();
        }

        results.push({
          quoteId: invoice.quoteId,
          success: true,
          billitOrderId: result.orderId,
          emailSent: emailResult.success,
          emailError: emailResult.error || null,
        });
      } else {
        console.error(`Failed to send ${invoice.quoteId} to Billit:`, result.error);

        // Update invoice with error
        await client
          .patch(invoice._id)
          .set({
            billitError: result.error,
          })
          .commit();

        results.push({
          quoteId: invoice.quoteId,
          success: false,
          error: result.error,
        });
      }
    }

    // Summary
    const successful = results.filter((r) => r.success).length;
    const failed = results.length - successful;

    console.log(`\n========================================`);
    console.log(`Processing complete. Success: ${successful}, Failed: ${failed}`);

    if (failed > 0) {
      console.log("Failed invoices:");
      results
        .filter((r) => !r.success)
        .forEach((r) => {
          console.error(`  - ${r.quoteId}: ${r.error}`);
        });
    }

    console.log("========================================");
    console.log("CRON JOB COMPLETED");
    console.log("========================================");

    return NextResponse.json({
      success: true,
      processed: results.length,
      successful,
      failed,
      results,
    });
  } catch (error) {
    console.error("Error processing invoices:", error);
    console.error("Stack trace:", error.stack);
    console.log("========================================");
    console.log("CRON JOB FAILED");
    console.log("========================================");
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
