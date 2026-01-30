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
      // Include soup data
      addSoup: orderDetails.addSoup || false,
      soup: orderDetails.addSoup ? orderDetails.soup : null,
      // Include desserts data
      addDesserts: orderDetails.addDesserts || false,
      desserts: orderDetails.addDesserts ? orderDetails.desserts : null,
      // Invoice address fields (stored flat in invoice schema)
      sameAsDelivery: orderDetails.sameAsDelivery !== false,
      invoiceStreet: orderDetails.invoiceStreet || "",
      invoiceHouseNumber: orderDetails.invoiceHouseNumber || "",
      invoiceHouseNumberAddition: orderDetails.invoiceHouseNumberAddition || "",
      invoicePostalCode: orderDetails.invoicePostalCode || "",
      invoiceCity: orderDetails.invoiceCity || "",
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

    // Helper to round to 2 decimal places (matches Billit's rounding)
    const round2 = (val) => Math.round(val * 100) / 100;

    // Calculate amounts using PaymentStep.jsx pattern
    // The amount passed is the final total with VAT
    // deliveryCost from orderDetails is VAT-EXCLUSIVE (e.g., €19 base price)
    const finalTotal = round2(Number(amount) || 0);
    const deliveryCost = round2(orderDetails.deliveryCost || 0);

    // Reverse calculate from final total using correct VAT rates
    // deliveryCost is already VAT-exclusive, so we calculate the VAT-inclusive amount
    let remainingTotal = finalTotal;
    let deliveryWithoutVAT = deliveryCost;

    if (deliveryCost > 0) {
      // deliveryCost is VAT-exclusive, calculate VAT-inclusive amount
      const deliveryVAT = round2(deliveryCost * 0.21);
      const deliveryWithVAT = round2(deliveryCost + deliveryVAT);
      // Subtract VAT-inclusive delivery from total to get food portion (with VAT)
      remainingTotal = round2(finalTotal - deliveryWithVAT);
    }

    // The remaining total is food + food VAT (6%)
    // Round to 2 decimals to match Billit's calculation
    const foodSubtotal = round2(remainingTotal / 1.06);

    // Use proper VAT breakdown calculation (both params are VAT-exclusive and rounded)
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

    // Determine if using same address for billing
    // For pickup orders: always use invoice address (no delivery address exists)
    // For delivery orders: use invoice address when sameAsDelivery is false
    const isPickup = orderDetails.isPickup === true;
    const useInvoiceAddress = isPickup || orderDetails.sameAsDelivery === false;

    // Ensure we have valid company details
    // Use invoice address for billing when pickup or sameAsDelivery is false
    const companyDetails = {
      name: orderDetails.companyName || "Unknown Company",
      btwNumber: orderDetails.btwNumber || null, // Required for Peppol e-invoicing
      referenceNumber: orderDetails.referenceNumber || null,
      address: useInvoiceAddress
        ? {
            street: orderDetails.invoiceStreet || "",
            houseNumber: orderDetails.invoiceHouseNumber || "",
            houseNumberAddition: orderDetails.invoiceHouseNumberAddition || "",
            postalCode: orderDetails.invoicePostalCode || "",
            city: orderDetails.invoiceCity || "",
          }
        : {
            street: orderDetails.street || "",
            houseNumber: orderDetails.houseNumber || "",
            houseNumberAddition: orderDetails.houseNumberAddition || "",
            postalCode: orderDetails.postalCode || "",
            city: orderDetails.city || "",
          },
    };

    console.log("Invoice address settings:");
    console.log("- isPickup:", isPickup);
    console.log("- sameAsDelivery:", orderDetails.sameAsDelivery);
    console.log("- useInvoiceAddress:", useInvoiceAddress);
    console.log("- Billing address:", companyDetails.address);

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
        // Build invoiceDetails from orderDetails
        // For pickup: always use invoice address (no delivery address)
        // For delivery: use invoice address when sameAsDelivery is false
        const invoiceDetailsForEmail = {
          sameAsDelivery: !useInvoiceAddress,
          address: useInvoiceAddress
            ? {
                street: orderDetails.invoiceStreet || "",
                houseNumber: orderDetails.invoiceHouseNumber || "",
                houseNumberAddition: orderDetails.invoiceHouseNumberAddition || "",
                postalCode: orderDetails.invoicePostalCode || "",
                city: orderDetails.invoiceCity || "",
              }
            : {
                street: orderDetails.street || "",
                houseNumber: orderDetails.houseNumber || "",
                houseNumberAddition: orderDetails.houseNumberAddition || "",
                postalCode: orderDetails.postalCode || "",
                city: orderDetails.city || "",
              },
        };

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
            addSoup: orderDetails.addSoup || false,
            soup: orderDetails.soup || null,
            addDesserts: orderDetails.addDesserts || false,
            desserts: orderDetails.desserts || null,
            paymentMethod: "invoice", // Add payment method
          },
          deliveryDetails: {
            deliveryDate: orderDetails.deliveryDate || new Date().toISOString(),
            deliveryTime: orderDetails.deliveryTime || "12:00",
            phoneNumber: orderDetails.phoneNumber || "",
            address: {
              street: orderDetails.street || "",
              houseNumber: orderDetails.houseNumber || "",
              houseNumberAddition: orderDetails.houseNumberAddition || "",
              postalCode: orderDetails.postalCode || "",
              city: orderDetails.city || "",
            },
          },
          invoiceDetails: invoiceDetailsForEmail,
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
