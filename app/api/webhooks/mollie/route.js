// app/api/webhooks/mollie/route.js
import { createMollieClient } from "@mollie/api-client";
import { client } from "@/sanity/lib/client";
import { NextResponse } from "next/server";
import { sendOrderConfirmation } from "@/lib/email";
import { sendOrderSmsNotification } from "@/lib/sms";
import { PRODUCT_QUERY, PRICING_QUERY } from "@/sanity/lib/queries";
import { calculateVATBreakdown } from "@/lib/vat-calculations";
import { calculateOrderTotal } from "@/lib/pricing-utils";
import { parseDateString } from "@/lib/utils";


const mollieClient = createMollieClient({
  apiKey: process.env.MOLLIE_LIVE_API_KEY,
});

export async function POST(request) {
  try {
    console.log("===== MOLLIE WEBHOOK RECEIVED =====");

    // Get the payment ID from Mollie's webhook call
    const body = await request.formData();
    const paymentId = body.get("id");

    if (!paymentId) {
      console.error("No payment ID provided in webhook");
      return new NextResponse("No payment ID provided", { status: 400 });
    }

    console.log("Payment ID received:", paymentId);

    try {
      // Fetch the payment details from Mollie
      const payment = await mollieClient.payments.get(paymentId);
      const { status, metadata } = payment;
      const { quoteId } = metadata || {};

      if (!quoteId) {
        console.error("No quoteId found in payment metadata");
        return new NextResponse("Missing quoteId in payment metadata", {
          status: 400,
        });
      }

      console.log(`Payment status: ${status}, Quote ID: ${quoteId}`);

      // First fetch the document to get its _id
      const document = await client.fetch(
        `*[_type == "quote" && quoteId == $quoteId][0]._id`,
        { quoteId }
      );

      if (!document) {
        console.error(`Quote with ID ${quoteId} not found in Sanity`);
        return new NextResponse("Quote not found", { status: 404 });
      }

      // Update the order status in Sanity using the correct _id
      await client
        .patch(document)
        .set({
          paymentStatus: status,
          paymentId: paymentId,
          lastPaymentUpdate: new Date().toISOString(),
        })
        .commit();

      console.log(`Updated payment status in Sanity to: ${status}`);

      // Handle different payment statuses
      switch (status) {
        case "paid":
          // Payment completed successfully
          console.log("Payment paid - sending confirmation");
          await handlePaidStatus(quoteId);
          break;
        case "failed":
          console.log("Payment failed - sending notification");
          await sendPaymentFailureNotification(quoteId);
          break;
        case "expired":
          console.log("Payment expired - handling expired payment");
          await handleExpiredPayment(quoteId);
          break;
        case "canceled":
          console.log("Payment canceled - handling cancelation");
          await handleCanceledPayment(quoteId);
          break;
        default:
          console.log(`Unhandled payment status: ${status}`);
      }

      return new NextResponse("Webhook processed", { status: 200 });
    } catch (error) {
      console.error("Error processing payment details:", error);
      console.error("Error stack:", error.stack);
      // Still return 200 to Mollie to acknowledge receipt
      return new NextResponse("Webhook received with errors", { status: 200 });
    }
  } catch (error) {
    console.error("Webhook processing failed:", error);
    console.error("Error stack:", error.stack);
    // Still return 200 to Mollie to acknowledge receipt
    return new NextResponse("Webhook received", { status: 200 });
  }
}

// Helper functions for different payment statuses
async function handlePaidStatus(quoteId) {
  try {
    console.log(`Handling paid status for quote ${quoteId}`);

    // Fetch order details from Sanity using a more comprehensive query
    const order = await client.fetch(
      `*[_type == "quote" && quoteId == $quoteId][0]{
        _id,
        quoteId,
        name,
        email,
        phoneNumber,
        orderDetails {
          totalSandwiches,
          selectionType,
          customSelection,
          varietySelection,
          addDrinks,
          drinks,
          addSoup,
          soup,
          addDesserts,
          desserts,
          allergies
        },
        deliveryDetails {
          deliveryDate,
          deliveryTime,
          deliveryCost,
          isPickup,
          address {
            street,
            houseNumber,
            houseNumberAddition,
            postalCode,
            city
          }
        },
        invoiceDetails {
          sameAsDelivery,
          address {
            street,
            houseNumber,
            houseNumberAddition,
            postalCode,
            city
          }
        },
        companyDetails {
          companyName,
          companyVAT,
          referenceNumber
        },
        status,
        paymentStatus,
        createdAt,
        pdfAsset
      }`,
      { quoteId }
    );

    if (!order) {
      console.error(`Order with quoteId ${quoteId} not found for confirmation`);
      return;
    }

    console.log(
      "Order data fetched from Sanity:",
      JSON.stringify(order, null, 2)
    );

    // Fetch sandwich options and pricing data to include in the email
    console.log("Fetching sandwich options and pricing for order confirmation...");
    let sandwichOptions = [];
    let pricing = null;
    try {
      [sandwichOptions, pricing] = await Promise.all([
        client.fetch(PRODUCT_QUERY),
        client.fetch(PRICING_QUERY)
      ]);
      console.log(
        `Retrieved ${sandwichOptions.length} sandwich options and pricing from Sanity`
      );
    } catch (fetchError) {
      console.error("Error fetching data from Sanity:", fetchError);
      console.log("Will continue with empty data arrays");
    }

    // Convert customSelection from Sanity array format to object format for calculations
    // Sanity stores: [{sandwichId: {_ref: "id"}, selections: [{subTotal, ...}]}]
    // calculateOrderTotal expects: {"sandwichId": [{subTotal, ...}]}
    if (Array.isArray(order.orderDetails?.customSelection)) {
      const convertedSelection = {};
      order.orderDetails.customSelection.forEach((item) => {
        if (item.sandwichId && item.sandwichId._ref) {
          convertedSelection[item.sandwichId._ref] = Array.isArray(item.selections) ? item.selections : [];
        }
      });
      order.orderDetails.customSelection = convertedSelection;
    }

    // Calculate amounts using correct Belgian VAT rates with dynamic pricing
    const subtotalAmount = calculateOrderTotal(order.orderDetails, pricing); // Items only, VAT-exclusive
    const deliveryCost = order.deliveryDetails.deliveryCost || 0; // VAT-exclusive
    const vatBreakdown = calculateVATBreakdown(subtotalAmount, deliveryCost);

    console.log(`Amount calculation for quote ${quoteId}:`);
    console.log(`- Subtotal (items): €${subtotalAmount.toFixed(2)}`);
    console.log(`- Delivery cost: €${deliveryCost.toFixed(2)}`);
    console.log(`- VAT Food (6%): €${vatBreakdown.foodVAT.toFixed(2)}`);
    console.log(`- VAT Delivery (21%): €${vatBreakdown.deliveryVAT.toFixed(2)}`);
    console.log(`- Total VAT: €${vatBreakdown.totalVAT.toFixed(2)}`);
    console.log(`- Total: €${vatBreakdown.totalWithVAT.toFixed(2)}`);

    const amountData = {
      subtotal: vatBreakdown.subtotal,
      delivery: vatBreakdown.deliverySubtotal,
      foodVAT: vatBreakdown.foodVAT,
      deliveryVAT: vatBreakdown.deliveryVAT,
      vat: vatBreakdown.totalVAT,
      total: vatBreakdown.totalWithVAT,
    };

    // Determine billing address based on isPickup and sameAsDelivery
    // For pickup orders: always use invoice address (no delivery address exists)
    // For delivery orders: use invoice address when sameAsDelivery is false
    const isPickup = order.deliveryDetails?.isPickup === true;
    const useInvoiceAddress = isPickup || order.invoiceDetails?.sameAsDelivery === false;
    const billingAddress = useInvoiceAddress
      ? {
          street: order.invoiceDetails?.address?.street || "",
          houseNumber: order.invoiceDetails?.address?.houseNumber || "",
          houseNumberAddition: order.invoiceDetails?.address?.houseNumberAddition || "",
          postalCode: order.invoiceDetails?.address?.postalCode || "",
          city: order.invoiceDetails?.address?.city || "",
        }
      : {
          street: order.deliveryDetails?.address?.street || "",
          houseNumber: order.deliveryDetails?.address?.houseNumber || "",
          houseNumberAddition: order.deliveryDetails?.address?.houseNumberAddition || "",
          postalCode: order.deliveryDetails?.address?.postalCode || "",
          city: order.deliveryDetails?.address?.city || "",
        };

    // Create an invoice document in Sanity for consistency
    try {
      const deliveryDate = parseDateString(
        order.deliveryDetails.deliveryDate || new Date().toISOString()
      );
      const dueDate = new Date(deliveryDate);
      dueDate.setDate(deliveryDate.getDate() + 14);

      // Build orderDetails with invoice address fields for Sanity storage
      const invoiceOrderDetails = {
        ...order.orderDetails,
        // Customer info
        name: order.name,
        email: order.email,
        phoneNumber: order.phoneNumber,
        // Delivery info
        isPickup: isPickup,
        deliveryDate: order.deliveryDetails?.deliveryDate,
        deliveryTime: order.deliveryDetails?.deliveryTime,
        deliveryCost: order.deliveryDetails?.deliveryCost || 0,
        street: order.deliveryDetails?.address?.street || "",
        houseNumber: order.deliveryDetails?.address?.houseNumber || "",
        houseNumberAddition: order.deliveryDetails?.address?.houseNumberAddition || "",
        postalCode: order.deliveryDetails?.address?.postalCode || "",
        city: order.deliveryDetails?.address?.city || "",
        // Invoice address fields (flat structure for invoice schema)
        sameAsDelivery: !useInvoiceAddress,
        invoiceStreet: order.invoiceDetails?.address?.street || "",
        invoiceHouseNumber: order.invoiceDetails?.address?.houseNumber || "",
        invoiceHouseNumberAddition: order.invoiceDetails?.address?.houseNumberAddition || "",
        invoicePostalCode: order.invoiceDetails?.address?.postalCode || "",
        invoiceCity: order.invoiceDetails?.address?.city || "",
        // Company info
        isCompany: !!order.companyDetails,
        companyName: order.companyDetails?.companyName || "",
        btwNumber: order.companyDetails?.companyVAT || "",
        paymentMethod: "online",
      };

      const invoicePayload = {
        _type: "invoice",
        quoteId: order.quoteId,
        referenceNumber: order.companyDetails?.referenceNumber || null,
        amount: amountData,
        status: "paid", // From Mollie
        dueDate: dueDate.toISOString(),
        companyDetails: {
          name: order.companyDetails?.companyName || "",
          btwNumber: order.companyDetails?.companyVAT || "",
          referenceNumber: order.companyDetails?.referenceNumber || null,
          address: billingAddress,
        },
        orderDetails: invoiceOrderDetails,
        createdAt: new Date().toISOString(),
      };

      const newInvoice = await client.create(invoicePayload);
      console.log(
        `Invoice document created in Sanity with ID: ${newInvoice._id}`
      );


    } catch (invoiceError) {
      console.error(
        "Failed to create invoice document for paid order:",
        invoiceError
      );
      // Log error but don't block confirmation emails
    }

    // Create a properly formatted order object expected by the email/PDF components
    const formattedOrder = {
      quoteId: order.quoteId,
      email: order.email,
      phoneNumber: order.phoneNumber,
      fullName: order.name, // This will be used as fallback when no company name
      amount: amountData, // Pass the calculated amount data

      // Format orderDetails
      orderDetails: {
        totalSandwiches: order.orderDetails?.totalSandwiches || 0,
        selectionType: order.orderDetails?.selectionType || "variety",
        allergies: order.orderDetails?.allergies || "",
        isPickup: isPickup,
        deliveryCost: order.deliveryDetails?.deliveryCost || 0,
        addDrinks: order.orderDetails?.addDrinks || false,
        drinks: order.orderDetails?.drinks || null,
        addSoup: order.orderDetails?.addSoup || false,
        soup: order.orderDetails?.soup || null,
        addDesserts: order.orderDetails?.addDesserts || false,
        desserts: order.orderDetails?.desserts || null,
        varietySelection: order.orderDetails?.varietySelection || {},

        // Convert customSelection from Sanity array format to object format
        customSelection: {},
      },

      // Format deliveryDetails to match expected structure
      deliveryDetails: {
        deliveryDate:
          order.deliveryDetails?.deliveryDate || new Date().toISOString(),
        deliveryTime: order.deliveryDetails?.deliveryTime || "12:00",
        phoneNumber: order.phoneNumber || "",
        address: {
          street: order.deliveryDetails?.address?.street || "",
          houseNumber: order.deliveryDetails?.address?.houseNumber || "",
          houseNumberAddition:
            order.deliveryDetails?.address?.houseNumberAddition || "",
          postalCode: order.deliveryDetails?.address?.postalCode || "",
          city: order.deliveryDetails?.address?.city || "",
        },
      },

      // Format companyDetails - use invoice address when pickup OR sameAsDelivery is false
      companyDetails: order.companyDetails
        ? {
            name: order.companyDetails.companyName || "",
            vatNumber: order.companyDetails.companyVAT || "",
            referenceNumber: order.companyDetails.referenceNumber || "",
            address: billingAddress,
          }
        : null,

      // Format invoiceDetails for email template
      // For pickup: always use invoice address (no delivery address exists)
      // For delivery: use invoice address when sameAsDelivery is false
      invoiceDetails: {
        sameAsDelivery: !useInvoiceAddress,
        address: billingAddress,
      },

      // Add all other necessary fields
      status: order.status || "pending",
      sandwichOptions: sandwichOptions,
      createdAt: order.createdAt || new Date().toISOString(),
      paymentMethod: "online", // Since this is a paid webhook
    };

    // Preserve the actual variety selection data (supports both old and new formats)
    if (order.orderDetails?.varietySelection) {
      formattedOrder.orderDetails.varietySelection = order.orderDetails.varietySelection;
    }

    // customSelection was already converted from Sanity array format to object format
    // earlier (before calculateOrderTotal), so use the converted data directly
    formattedOrder.orderDetails.customSelection = order.orderDetails.customSelection || {};

    console.log("Sending order confirmation with formatted data");
    console.log(
      "Delivery details:",
      JSON.stringify(formattedOrder.deliveryDetails, null, 2)
    );
    console.log(
      "Company details:",
      JSON.stringify(formattedOrder.companyDetails, null, 2)
    );

    await sendOrderConfirmation(formattedOrder, false, pricing);
    console.log(`Order confirmation sent for quote ${quoteId}`);

    // Send SMS notification directly
    await sendOrderSmsNotification(formattedOrder);
    console.log(`SMS notification sent for paid order ${quoteId}`);
  } catch (error) {
    console.error(`Error in handlePaidStatus for quote ${quoteId}:`, error);
    console.error("Error stack:", error.stack);
  }
}

// Keep other helper functions
async function sendPaymentFailureNotification(quoteId) {
  console.log(`Would send payment failure notification for ${quoteId}`);
  // Handle payment failure
}

async function handleExpiredPayment(quoteId) {
  console.log(`Would handle expired payment for ${quoteId}`);
  // Handle expired payment
}

async function handleCanceledPayment(quoteId) {
  // Logic for canceled payments
  console.log(`Handling canceled payment for quote ${quoteId}`);
}

// Helper function to calculate total from order data using dynamic pricing
function calculateOrderTotalWithPricing(orderDetails, pricing = null) {
  return calculateOrderTotal(orderDetails, pricing);
}
