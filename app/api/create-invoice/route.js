// app/api/create-invoice/route.js
import { client } from "@/sanity/lib/client";
import { NextResponse } from "next/server";
import { sendOrderConfirmation } from "@/lib/email";
import { PRODUCT_QUERY, PRICING_QUERY } from "@/sanity/lib/queries";
import { calculateVATBreakdown } from "@/lib/vat-calculations";


export async function POST(request) {
  console.log("===== CREATE INVOICE API CALLED =====");

  try {
    // Safely parse the request body
    let requestData;
    try {
      requestData = await request.json();
      console.log("Request data received successfully");
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request format",
        },
        { status: 400 }
      );
    }

    const { quoteId, amount, orderDetails } = requestData || {};

    if (!quoteId || amount === undefined || !orderDetails) {
      console.error("Missing required fields in request:", {
        hasQuoteId: !!quoteId,
        hasAmount: amount !== undefined,
        hasOrderDetails: !!orderDetails,
      });
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
        },
        { status: 400 }
      );
    }

    // --- Data Transformation ---
    // Transform the incoming orderDetails to a structured format for Sanity
    const structuredOrderDetails = {
      ...orderDetails,
      // Convert customSelection from an object to a structured array
      customSelection:
        orderDetails.selectionType === "custom"
          ? Object.entries(orderDetails.customSelection || {}).map(
              ([sandwichId, selections]) => ({
                _key: sandwichId, // Use sandwichId as the key for Sanity array
                sandwichId: { _type: "reference", _ref: sandwichId },
                selections: selections.map((selection) => ({
                  ...selection,
                  _key: `${sandwichId}-${selection.breadType}-${Math.random()}`, // Create a unique key for each selection item
                })),
              })
            )
          : [],
      // Ensure varietySelection is always an object
      varietySelection: orderDetails.varietySelection || {
        nonVega: 0,
        vega: 0,
        vegan: 0,
      },
      // Include drinks data
      addDrinks: orderDetails.addDrinks || false,
      drinks: orderDetails.drinks || null,
    };
    // --- End Data Transformation ---

    // Calculate due date (14 days from delivery date)
    const deliveryDate = new Date(orderDetails.deliveryDate || Date.now());
    const dueDate = new Date(deliveryDate);
    dueDate.setDate(deliveryDate.getDate() + 14);
    console.log(
      "Due date calculated:",
      dueDate.toISOString(),
      "based on delivery date:",
      deliveryDate.toISOString()
    );

    // Calculate amounts using PaymentStep.jsx pattern
    // The amount passed is the final total with VAT: (subtotal + delivery) * 1.09
    const finalTotal = Number(amount) || 0;
    const deliveryCost = orderDetails.deliveryCost || 0;
    
    // Reverse calculate from final total using correct VAT rates
    // This is complex because we need to work backwards from total with mixed VAT rates
    // For now, we'll use a simplified approach and recalculate properly

    // First, extract delivery VAT if there's a delivery cost
    let remainingTotal = finalTotal;
    let deliveryWithoutVAT = deliveryCost;
    let deliveryVATAmount = 0;

    if (deliveryCost > 0) {
      // Delivery total includes 21% VAT, so delivery without VAT = total / 1.21
      deliveryWithoutVAT = deliveryCost / 1.21;
      deliveryVATAmount = deliveryCost - deliveryWithoutVAT;
      remainingTotal = finalTotal - deliveryCost;
    }

    // The remaining total is food + food VAT (6%)
    const foodSubtotal = remainingTotal / 1.06;
    const foodVATAmount = remainingTotal - foodSubtotal;

    // Use proper VAT breakdown calculation
    const vatBreakdown = calculateVATBreakdown(foodSubtotal, deliveryWithoutVAT);

    const amountData = {
      subtotal: vatBreakdown.subtotal,
      delivery: vatBreakdown.deliverySubtotal,
      foodVAT: vatBreakdown.foodVAT,
      deliveryVAT: vatBreakdown.deliveryVAT,
      vat: vatBreakdown.totalVAT,
      total: vatBreakdown.totalWithVAT,
    };

    console.log("Creating invoice in Sanity with data:");
    console.log("- Quote ID:", quoteId);
    console.log("- Amount:", amountData);

    // Ensure we have valid company details
    const companyDetails = {
      name: orderDetails.companyName || "Unknown Company",
      referenceNumber: orderDetails.referenceNumber || null,
      address: {
        street: orderDetails.street || "",
        houseNumber: orderDetails.houseNumber || "",
        houseNumberAddition: orderDetails.houseNumberAddition || "",
        postalCode: orderDetails.postalCode || "",
        city: orderDetails.city || "",
      },
    };

    // Create invoice record in Sanity
    const updatedQuote = await client.create({
      _type: "invoice",
      quoteId,
      referenceNumber: orderDetails.referenceNumber || null,
      amount: amountData,
      status: "pending",
      dueDate: dueDate.toISOString(),
      companyDetails,
      orderDetails: structuredOrderDetails, // Use the new structured data
      createdAt: new Date().toISOString(),
    });

    console.log("Invoice created in Sanity with ID:", updatedQuote._id);



    // Fetch sandwich options and pricing to include in the email
    console.log("Fetching sandwich options and pricing for email...");
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
      console.log("Will continue with empty data");
    }

    // Send order confirmation email without invoice
    if (orderDetails.email) {
      console.log(
        "Preparing to send order confirmation email to:",
        orderDetails.email
      );

      try {
        // Prepare email data with explicitly structured objects
        const emailData = {
          quoteId,
          email: orderDetails.email,
          fullName: orderDetails.name,
          orderDetails: {
            ...orderDetails,
            // Ensure these exist with defaults
            selectionType: orderDetails.selectionType || "custom",
            allergies: orderDetails.allergies || "",
            customSelection: orderDetails.customSelection || {},
            varietySelection: orderDetails.varietySelection || {
              vega: 0,
              nonVega: 0,
              vegan: 0,
            },
            paymentMethod: "invoice", // Add payment method
          },
          deliveryDetails: {
            deliveryDate: orderDetails.deliveryDate || new Date().toISOString(),
            deliveryTime: orderDetails.deliveryTime || "12:00",
            street: orderDetails.street || "",
            houseNumber: orderDetails.houseNumber || "",
            houseNumberAddition: orderDetails.houseNumberAddition || "",
            postalCode: orderDetails.postalCode || "",
            city: orderDetails.city || "",
            phoneNumber: orderDetails.phoneNumber || "",
          },
          companyDetails,
          amount: amountData,
          dueDate,
          sandwichOptions,
        };

        console.log("Sending order confirmation email...");
        const emailSent = await sendOrderConfirmation(emailData, false, pricing);

        if (emailSent) {
          console.log("Order confirmation email sent successfully");
        } else {
          console.error(
            "Failed to send order confirmation email - returned false"
          );
          // Add this to the response to inform the client
          return NextResponse.json({
            success: false,
            error: "Failed to send order confirmation email",
            invoice: updatedQuote,
          });
        }
      } catch (emailError) {
        console.error(
          "Failed to send order confirmation email - exception:",
          emailError
        );
        console.error("Error stack:", emailError.stack);
        // Return error response to client
        return NextResponse.json({
          success: false,
          error: "Failed to send order confirmation email",
          invoice: updatedQuote,
        });
      }
    } else {
      console.warn(
        "No email address provided, skipping order confirmation email"
      );
    }

    console.log("===== CREATE INVOICE API COMPLETED SUCCESSFULLY =====");
    return NextResponse.json({
      success: true,
      invoice: updatedQuote,
    });
  } catch (error) {
    console.error("Invoice creation failed:", error);
    console.error("Error stack:", error.stack);
    console.log("===== CREATE INVOICE API FAILED =====");
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
