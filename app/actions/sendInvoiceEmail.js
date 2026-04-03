"use server";

import { client } from "@/sanity/lib/client";
import { sendOrderConfirmation } from "@/lib/email";
import { PRODUCT_QUERY, PRICING_QUERY } from "@/sanity/lib/queries";


export async function sendInvoiceEmail(quoteId) {
  try {
    // Fetch the invoice from Sanity
    const invoice = await client.fetch(
      `*[_type == "invoice" && quoteId == $quoteId][0]`,
      { quoteId }
    );

    if (!invoice) {
      console.error("Invoice not found for quoteId:", quoteId);
      return { success: false, error: "Invoice not found" };
    }

    if (
      invoice.orderDetails &&
      invoice.orderDetails.selectionType === "custom" &&
      Array.isArray(invoice.orderDetails.customSelection)
    ) {
      const customSelectionObject = invoice.orderDetails.customSelection.reduce(
        (acc, item) => {
          // The `_key` of the array item is the original sandwichId.
          if (item._key) {
            acc[item._key] = item.selections;
          }
          return acc;
        },
        {}
      );
      // Replace the array with the reconstructed object.
      invoice.orderDetails.customSelection = customSelectionObject;
    }

    // Fetch sandwich options and pricing for the email
    const [sandwichOptions, pricing] = await Promise.all([
      client.fetch(PRODUCT_QUERY),
      client.fetch(PRICING_QUERY)
    ]);

    const orderDetails = invoice.orderDetails;
    const isPickup = orderDetails.isPickup === true;
    const useInvoiceAddress = isPickup || orderDetails.sameAsDelivery === false;

    // Prefer companyDetails.address (editable in Studio) over flat orderDetails snapshot
    const companyBillingAddress = invoice.companyDetails?.address;
    const invoiceDetails = {
      sameAsDelivery: !useInvoiceAddress,
      address: companyBillingAddress?.street
        ? companyBillingAddress
        : useInvoiceAddress
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

    const companyDetails = {
      ...(invoice.companyDetails || {}),
      name: invoice.companyDetails?.name || orderDetails.companyName || orderDetails.name,
      btwNumber: invoice.companyDetails?.btwNumber || orderDetails.btwNumber || orderDetails.companyVAT,
    };

    // Prepare email data
    const emailData = {
      quoteId,
      invoiceNumber: invoice.invoiceNumber || null,
      email: orderDetails.email,
      fullName: orderDetails.name,
      orderDetails: {
        ...orderDetails,
        selectionType: orderDetails.selectionType || "custom",
        allergies: orderDetails.allergies || "",
        customSelection: orderDetails.customSelection || {},
        varietySelection: orderDetails.varietySelection || {
          vega: 0,
          nonVega: 0,
          vegan: 0,
        },
        paymentMethod: "invoice",
      },
      deliveryDetails: {
        deliveryDate: orderDetails.deliveryDate,
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
      invoiceDetails,
      companyDetails,
      amount: invoice.amount,
      dueDate: invoice.dueDate,
      sandwichOptions,
    };

    // Send the invoice email
    const emailSent = await sendOrderConfirmation(emailData, true, pricing);

    if (emailSent) {

      // Update the invoice status to indicate email was sent
      await client
        .patch(invoice._id)
        .set({ emailSent: true, emailSentAt: new Date().toISOString() })
        .commit();

      return { success: true };
    } else {
      return { success: false, error: "Failed to send invoice email" };
    }
  } catch (error) {
    console.error("Error sending invoice email:", error);
    return { success: false, error: error.message };
  }
}
