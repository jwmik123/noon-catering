// lib/email.js
import { Resend } from "resend";
import { renderToBuffer } from "@react-pdf/renderer";
import InvoicePDF from "@/app/components/InvoicePDF";
import { sendOrderWhatsAppNotification } from "./sms";
import { isDrink } from "./product-helpers";
import { calculateVATBreakdown } from "./vat-calculations";
import { calculateOrderTotal } from "./pricing-utils";
import { parseDateString } from "./utils";

const resend = new Resend(process.env.RESEND_API_KEY);

const EMAIL_CONSTANTS = {
  // IMPORTANT: This must match the domain you've verified in Resend
  VERIFIED_DOMAIN: "catering.thesandwichbar.nl",
  SENDER_NAME: "NOON Sandwicherie & Koffie",
  FROM_EMAIL: function () {
    return `${this.SENDER_NAME} <orders@catering.thesandwichbar.nl>`;
  },
  // ADMIN_EMAIL: ["bestel@noonsandwicherie.be", "verkoop-0795406037@abpart.clouddemat.be", "peloton@cargovelo.be"],
  EMAIL_SUBJECTS: {
    ORDER_CONFIRMATION: (quoteId) => `Order Confirmation - ${quoteId}`,
    INVOICE: (quoteId) => `Invoice NOON Sandwicherie & Koffie - ${quoteId}`,
  },
};

function getOrderConfirmationHtml({
  quoteId,
  orderDetails,
  deliveryDetails,
  invoiceDetails,
  companyDetails,
  amount, // Use the full amount object
  sandwichOptions = [],
  dueDate,
  fullName,
  isInvoiceEmail = false,
  referenceNumber = null,
  pricing = null, // Add pricing parameter
}) {
  // Check if this is a pickup order
  const isPickup = orderDetails?.isPickup || false;

  // Calculate amounts using the same logic as InvoicePDF.jsx
  const amountData = (() => {
    // If amount is passed as an object with the correct structure, use it
    if (amount && typeof amount === 'object' && amount.total !== undefined) {
      return {
        subtotal: amount.subtotal || 0,
        originalSubtotal: amount.originalFoodSubtotal || amount.subtotal || 0,
        pickupDiscount: amount.pickupDiscount || 0,
        delivery: amount.delivery || 0,
        foodVAT: amount.foodVAT || 0,
        deliveryVAT: amount.deliveryVAT || 0,
        vat: amount.vat || 0,
        total: amount.total || 0,
      };
    }

    // Otherwise, calculate from order details using dynamic pricing
    const subtotalAmount = calculateOrderTotal(orderDetails, pricing);

    // Delivery cost (VAT-exclusive) - 0 for pickup orders
    const deliveryCost = isPickup ? 0 : (orderDetails.deliveryCost || 0);

    // Calculate VAT and total using correct Belgian VAT rates with pickup discount
    const vatBreakdown = calculateVATBreakdown(subtotalAmount, deliveryCost, isPickup);

    return {
      subtotal: vatBreakdown.subtotal,
      originalSubtotal: vatBreakdown.originalFoodSubtotal || subtotalAmount,
      pickupDiscount: vatBreakdown.pickupDiscount || 0,
      delivery: vatBreakdown.deliverySubtotal,
      foodVAT: vatBreakdown.foodVAT,
      deliveryVAT: vatBreakdown.deliveryVAT,
      vat: vatBreakdown.totalVAT,
      total: vatBreakdown.totalWithVAT,
    };
  })();
  // Helper function to find sandwich name by ID
  const getSandwichName = (sandwichId) => {
    const sandwich = sandwichOptions.find((s) => s._id === sandwichId);
    return sandwich ? sandwich.name : "Unknown Sandwich";
  };

  // Helper function to check if bread type should be shown
  const shouldShowBreadType = (sandwichId, breadType) => {
    const sandwich = sandwichOptions.find((s) => s._id === sandwichId);
    return sandwich && !isDrink(sandwich) && breadType;
  };

  // Helper function to get price for a variety selection item
  const getVarietyPrice = (key) => {
    if (!pricing) return 0;

    const parts = key.split('-');

    // Handle old format (single word like "meat", "veggie", "vegan")
    if (parts.length === 1) {
      const sandwichCategory = pricing.categoryPricing?.find(cat => cat.typeCategory === 'sandwiches');
      const subCatData = sandwichCategory?.subCategoryPricing?.find(sc => sc.subCategory === key);
      return subCatData?.price || 0;
    }

    if (parts[0] === 'lunchboxes' && parts.length === 3) {
      const boxType = parts[1];
      const lunchboxCategory = pricing.categoryPricing?.find(cat => cat.typeCategory === 'lunchboxes');
      const boxTypeData = lunchboxCategory?.boxTypes?.find(bt => bt.boxType === boxType);
      return boxTypeData?.price || 0;
    } else if (parts.length === 2) {
      const [typeCategory, subCategory] = parts;
      const categoryData = pricing.categoryPricing?.find(cat => cat.typeCategory === typeCategory);
      const subCatData = categoryData?.subCategoryPricing?.find(sc => sc.subCategory === subCategory);
      return subCatData?.price || 0;
    }

    return 0;
  };

  // Helper function to render variety selection for both old and new formats
  const renderVarietySelectionRows = (varietySelection) => {
    if (!varietySelection || Object.keys(varietySelection).length === 0) {
      return '<tr><td colspan="6">No items selected</td></tr>';
    }

    const categoryLabels = {
      sandwiches: "Sandwiches",
      salads: "Salads",
      bowls: "Bowls",
      lunchboxes: "Lunchboxes"
    };

    const subCategoryLabels = {
      meat: "Meat",
      chicken: "Chicken",
      fish: "Fish",
      veggie: "Vegetarian",
      vegan: "Vegan",
      daily: "Daily",
      healthy: "Healthy",
      premium: "Premium"
    };

    // Check if it's the new hierarchical format (contains hyphens)
    const hasHierarchicalFormat = Object.keys(varietySelection).some(key => key.includes('-'));

    let rows = [];

    if (hasHierarchicalFormat) {
      // New format: process each key
      Object.entries(varietySelection).forEach(([key, quantity]) => {
        if (quantity > 0) {
          let displayName = '';

          if (key.includes('-')) {
            const parts = key.split('-');
            if (parts[0] === 'lunchboxes' && parts.length === 3) {
              // Lunchboxes: "Lunchboxes - Daily - Chicken"
              const [mainCat, boxType, subCat] = parts;
              const mainLabel = categoryLabels[mainCat] || mainCat;
              const boxLabel = subCategoryLabels[boxType] || boxType;
              const subLabel = subCategoryLabels[subCat] || subCat;
              displayName = `${mainLabel} - ${boxLabel} - ${subLabel}`;
            } else {
              // Regular: "Sandwiches - Meat"
              const [mainCategory, subCategory] = parts;
              const mainLabel = categoryLabels[mainCategory] || mainCategory;
              const subLabel = subCategoryLabels[subCategory] || subCategory;
              displayName = `${mainLabel} - ${subLabel}`;
            }
          } else {
            // Backward compatibility: treat as sandwiches
            displayName = subCategoryLabels[key] || key;
          }

          const price = getVarietyPrice(key);
          rows.push(`
            <tr>
              <td>${displayName}</td>
              <td>${quantity}x</td>
              <td>-</td>
              <td>-</td>
              <td>-</td>
              <td>€${(quantity * price).toFixed(2)}</td>
            </tr>
          `);
        }
      });
    } else {
      // Old format: direct subcategory mapping (backward compatibility)
      Object.entries(varietySelection).forEach(([key, quantity]) => {
        if (quantity > 0) {
          const label = subCategoryLabels[key] || key;
          const price = getVarietyPrice(`sandwiches-${key}`);
          rows.push(`
            <tr>
              <td>${label}</td>
              <td>${quantity}x</td>
              <td>-</td>
              <td>-</td>
              <td>-</td>
              <td>€${(quantity * price).toFixed(2)}</td>
            </tr>
          `);
        }
      });
    }

    return rows.join('');
  };

  // Safely get nested values
  const companyName =
    companyDetails?.name || companyDetails?.companyName || "Unknown Company";
  const phoneNumber = companyDetails?.phoneNumber || "";
  const address = companyDetails?.address || {};
  const street = address?.street || "";
  const houseNumber = address?.houseNumber || "";
  const houseNumberAddition = address?.houseNumberAddition || "";
  const postalCode = address?.postalCode || "";
  const city = address?.city || "";

  // Safe delivery details
  const deliveryTime = deliveryDetails?.deliveryTime || "12:00";
  const deliveryStreet = deliveryDetails?.address?.street || street;
  const deliveryHouseNumber =
    deliveryDetails?.address?.houseNumber || houseNumber;
  const deliveryHouseNumberAddition =
    deliveryDetails?.address?.houseNumberAddition || houseNumberAddition;
  const deliveryPostalCode = deliveryDetails?.address?.postalCode || postalCode;
  const deliveryCity = deliveryDetails?.address?.city || city;

  // Safe invoice details
  const invoiceStreet = invoiceDetails?.address?.street || deliveryStreet;
  const invoiceHouseNumber =
    invoiceDetails?.address?.houseNumber || deliveryHouseNumber;
  const invoiceHouseNumberAddition =
    invoiceDetails?.address?.houseNumberAddition || deliveryHouseNumberAddition;
  const invoicePostalCode =
    invoiceDetails?.address?.postalCode || deliveryPostalCode;
  const invoiceCity = invoiceDetails?.address?.city || deliveryCity;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation - NOON Sandwicherie & Koffie</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f9f9f9;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
          }
          .logo {
            text-align: center;
            padding: 20px 0;
          }
          .logo img {
            max-width: 150px;
            height: auto;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .order-id {
            color: #666;
            font-size: 14px;
            margin: 10px 0;
          }
          .section {
            margin-bottom: 30px;
          }
          .section-title {
            color: #524a98;
            font-size: 18px;
            margin-bottom: 15px;
            padding-bottom: 5px;
            border-bottom: 2px solid #524a98;
          }
          .delivery-details {
            background-color: #f9f9f9;
            padding: 15px;
            border-radius: 5px;
            border: 1px solid #524a98;
          }
          .delivery-row {
            margin-bottom: 8px;
          }
          .delivery-label {
            font-weight: bold;
            color: #524a98;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th {
            background-color: #524a98;
            color: white;
            padding: 12px;
            text-align: left;
            border-bottom: 2px solid #524a98;
          }
          td {
            padding: 12px;
            border-bottom: 1px solid #eee;
          }
          .price-section {
            margin-top: 30px;
            text-align: right;
          }
          .price-row {
            margin: 5px 0;
          }
          .total {
            font-size: 18px;
            font-weight: bold;
            margin-top: 10px;
            color: #524a98;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #524a98;
            font-size: 12px;
            color: #666;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Logo -->
          <div class="logo">
            <img src="https://catering.noonsandwicherie.be/tsb-logo-full.png" alt="NOON Sandwicherie & Koffie Logo" />
          </div>

          <!-- Header -->
          <div class="header">
            ${
              isInvoiceEmail
                ? `<h1>Invoice NOON Sandwicherie & Koffie</h1>`
                : `<h1>Order Confirmation</h1>`
            }
            <div class="order-id">Quote ID: ${quoteId}</div>
            ${referenceNumber ? `<div class="order-id">Reference Number: ${referenceNumber}</div>` : ""}
            <div class="order-id">Payment Method: ${orderDetails.paymentMethod === "invoice" ? "Invoice" : "Mollie"}</div>
            <div class="order-id">Payment Status: ${isInvoiceEmail ? "Pending" : orderDetails.paymentMethod === "invoice" ? "Pending" : "Paid"}</div>
            <div class="order-id">Date: ${new Date().toLocaleDateString("nl-NL")}</div>
          </div>

          <!-- Payment Message -->
          <div class="section" style="background-color: #f0f7ff; padding: 15px; border-radius: 5px; margin-bottom: 20px; border: 1px solid #524a98;">
            <p style="margin: 0; color: #524a98; font-weight: 500; text-align: center;">Dear ${companyDetails?.name || fullName || "customer"},</p>
            ${
              isInvoiceEmail
                ? `<p style="margin: 10px 0 0; color: #524a98; font-weight: 500; text-align: center;">Please find attached the invoice for your order.</p>`
                : `<p style="margin: 10px 0 0; color: #524a98; font-weight: 500; text-align: center;">Thank you for your order. ${
                    orderDetails.paymentMethod === "invoice"
                      ? "You'll receive the invoice on the day of delivery."
                      : "Please find attached the invoice for your order."
                  }</p>`
            }
          </div>

          <!-- Delivery and Invoice Details -->
          <div class="details-container">
            <!-- Delivery Details -->
            <div class="details-column">
              <div class="section">
                <h2 class="section-title">${isPickup ? 'Pick Up Details' : 'Delivery Details'}</h2>
                <div class="delivery-details">
                  <div class="delivery-row">
                    <span class="delivery-label">Company:</span> ${companyName}
                  </div>
                  <div class="delivery-row">
                    <span class="delivery-label">Phone:</span> ${deliveryDetails?.phoneNumber || "N/A"}
                  </div>
                  <div class="delivery-row">
                    <span class="delivery-label">${isPickup ? 'Pick Up Date:' : 'Delivery Date:'}</span> ${parseDateString(deliveryDetails?.deliveryDate).toLocaleDateString("nl-NL")}
                  </div>
                  <div class="delivery-row">
                    <span class="delivery-label">Time:</span> ${deliveryTime}
                  </div>
                  <div class="delivery-row">
                    <span class="delivery-label">Timing:</span> 45 minutes
                  </div>
                  ${isPickup ? `
                  <div class="delivery-row">
                    <span class="delivery-label">Pick Up Location:</span><br>
                    NOON Sandwicherie & Koffie<br>
                    Keizer Leopoldstraat 1<br>
                    9000 Gent, België
                  </div>
                  ` : `
                  <div class="delivery-row">
                    <span class="delivery-label">Address:</span><br>
                    ${deliveryStreet} ${deliveryHouseNumber}${deliveryHouseNumberAddition}<br>
                    ${deliveryPostalCode} ${deliveryCity}
                  </div>
                  `}
                </div>
              </div>
            </div>

            <!-- Invoice Details -->
            <div class="details-column">
              <div class="section">
                <h2 class="section-title">Invoice Address</h2>
                <div class="delivery-details">
                  <div class="delivery-row">
                    <span class="delivery-label">Company:</span> ${companyName}
                  </div>
                  <div class="delivery-row">
                    <span class="delivery-label">Address:</span><br>
                    ${invoiceStreet} ${invoiceHouseNumber}${invoiceHouseNumberAddition}<br>
                    ${invoicePostalCode} ${invoiceCity}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Company Details if applicable -->
          ${
            companyDetails?.isCompany
              ? `
            <div class="section">
              <h2 class="section-title">Company Details</h2>
              <div class="delivery-row">
                <span class="delivery-label">Company Name:</span> ${companyName}
              </div>
              ${
                companyDetails?.vatNumber
                  ? `
                <div class="delivery-row">
                  <span class="delivery-label">VAT Number:</span> ${companyDetails.vatNumber}
                </div>
              `
                  : ""
              }
            </div>
          `
              : ""
          }

          <!-- Order Details -->
          <div class="section">
            <h2 class="section-title">Order Details</h2>
            <table>
              <thead>
                <tr>
                  <th>Sandwich</th>
                  <th>Quantity</th>
                  <th>Bread</th>
                  <th>Sauce</th>
                  <th>Toppings</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                ${
                  orderDetails.selectionType === "custom"
                    ? Object.entries(orderDetails.customSelection || {})
                        .map(([sandwichId, selections]) => {
                          if (!Array.isArray(selections)) return "";
                          return selections
                            .map(
                              (selection) => `
                                <tr>
                                  <td>${getSandwichName(sandwichId)}</td>
                                  <td>${selection.quantity || 0}x</td>
                                  <td>${shouldShowBreadType(sandwichId, selection.breadType) ? selection.breadType : "-"}</td>
                                  <td>${selection.sauce !== "geen" ? selection.sauce : "-"}</td>
                                  <td>${selection.toppings && selection.toppings.length > 0 ? selection.toppings.join(", ") : "-"}</td>
                                  <td>€${(selection.subTotal || 0).toFixed(2)}</td>
                                </tr>
                              `
                            )
                            .join("");
                        })
                        .join("") +
                      (orderDetails.deliveryCost &&
                      orderDetails.deliveryCost > 0
                        ? `
                          <tr>
                            <td>Delivery</td>
                            <td>1x</td>
                            <td>-</td>
                            <td>-</td>
                            <td>-</td>
                            <td>€${(orderDetails.deliveryCost || 0).toFixed(2)}</td>
                          </tr>
                        `
                        : "") +
                      (orderDetails.addDrinks && orderDetails.drinks
                        ? `
                          ${orderDetails.drinks.verseJus > 0 ? `
                          <tr>
                            <td>Fresh Juice</td>
                            <td>${orderDetails.drinks.verseJus}x</td>
                            <td>-</td>
                            <td>-</td>
                            <td>-</td>
                            <td>€${(orderDetails.drinks.verseJus * 3.62).toFixed(2)}</td>
                          </tr>
                          ` : ""}
                          ${orderDetails.drinks.sodas > 0 ? `
                          <tr>
                            <td>Sodas</td>
                            <td>${orderDetails.drinks.sodas}x</td>
                            <td>-</td>
                            <td>-</td>
                            <td>-</td>
                            <td>€${(orderDetails.drinks.sodas * 2.71).toFixed(2)}</td>
                          </tr>
                          ` : ""}
                          ${orderDetails.drinks.smoothies > 0 ? `
                          <tr>
                            <td>Smoothies</td>
                            <td>${orderDetails.drinks.smoothies}x</td>
                            <td>-</td>
                            <td>-</td>
                            <td>-</td>
                            <td>€${(orderDetails.drinks.smoothies * 3.62).toFixed(2)}</td>
                          </tr>
                          ` : ""}
                        `
                        : "")
                    : renderVarietySelectionRows(orderDetails.varietySelection) +
                      `${
                        orderDetails.deliveryCost &&
                        orderDetails.deliveryCost > 0
                          ? `
                        <tr>
                          <td>Delivery</td>
                          <td>1x</td>
                          <td>-</td>
                          <td>-</td>
                          <td>-</td>
                          <td>€${(orderDetails.deliveryCost || 0).toFixed(2)}</td>
                        </tr>
                      `
                          : ""
                      }
                      ${
                        orderDetails.addDrinks && orderDetails.drinks
                          ? `
                          ${orderDetails.drinks.verseJus > 0 ? `
                          <tr>
                            <td>Fresh Juice</td>
                            <td>${orderDetails.drinks.verseJus}x</td>
                            <td>-</td>
                            <td>-</td>
                            <td>-</td>
                            <td>€${(orderDetails.drinks.verseJus * 3.62).toFixed(2)}</td>
                          </tr>
                          ` : ""}
                          ${orderDetails.drinks.sodas > 0 ? `
                          <tr>
                            <td>Sodas</td>
                            <td>${orderDetails.drinks.sodas}x</td>
                            <td>-</td>
                            <td>-</td>
                            <td>-</td>
                            <td>€${(orderDetails.drinks.sodas * 2.71).toFixed(2)}</td>
                          </tr>
                          ` : ""}
                          ${orderDetails.drinks.smoothies > 0 ? `
                          <tr>
                            <td>Smoothies</td>
                            <td>${orderDetails.drinks.smoothies}x</td>
                            <td>-</td>
                            <td>-</td>
                            <td>-</td>
                            <td>€${(orderDetails.drinks.smoothies * 3.62).toFixed(2)}</td>
                          </tr>
                          ` : ""}
                        `
                          : ""
                      }
                    `
                }
              </tbody>
            </table>
          </div>

          <!-- Allergies -->
          ${
            orderDetails.allergies
              ? `
            <div class="section">
              <h2 class="section-title">Allergies or Comments</h2>
              <div class="delivery-details">
                ${orderDetails.allergies}
              </div>
            </div>
          `
              : ""
          }

          <!-- Price Summary -->
          <div class="price-section">
            <div class="price-row">Subtotal: €${(amountData.originalSubtotal || amountData.subtotal || 0).toFixed(2)}</div>
            ${isPickup && (amountData.pickupDiscount || 0) > 0 ? `<div class="price-row" style="color: #16a34a;">Pickup Discount (5%): -€${(amountData.pickupDiscount || 0).toFixed(2)}</div>` : ''}
            ${(amountData.delivery || 0) > 0 ? `<div class="price-row">Delivery: €${(amountData.delivery || 0).toFixed(2)}</div>` : `<div class="price-row">Delivery: ${isPickup ? 'Pick Up' : 'Free'}</div>`}
            <div class="price-row">VAT Food (6%): €${(amountData.foodVAT || 0).toFixed(2)}</div>
            ${(amountData.deliveryVAT || 0) > 0 ? `<div class="price-row">VAT Delivery (21%): €${(amountData.deliveryVAT || 0).toFixed(2)}</div>` : ''}
            <div class="price-row">Total VAT: €${(amountData.vat || 0).toFixed(2)}</div>
            <div class="price-row total">Total: €${(amountData.total || 0).toFixed(2)}</div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p>NOON Sandwicherie & Koffie</p>
            <p>Keizer Leopoldstraat 1, 9000 Gent, België</p>
            <p>bestel@noonsandwicherie.be</p>
            <p>If you have any questions about your order, please contact us.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function sendOrderConfirmation(order, isInvoiceEmail = false, pricing = null) {
  console.log("========= ORDER CONFIRMATION EMAIL SENDING STARTED =========");
  console.log("Sending order confirmation email to:", order?.email);

  try {
    if (!order || !order.email) {
      console.error("Invalid order or missing email:", order);
      return false;
    }

    // Extract sandwich options if available
    const sandwichOptions = order.sandwichOptions || [];
    console.log(`Sandwich options available: ${sandwichOptions.length}`);

    // The amount object is now passed directly in the 'order' object.
    const totalAmount = order.amount?.total || 0;

    // Generate PDF for both direct payments and invoice emails
    let pdfBuffer;
    try {
      // Generate PDF
      pdfBuffer = await renderToBuffer(
        <InvoicePDF
          quoteId={order.quoteId}
          orderDetails={order.orderDetails}
          deliveryDetails={order.deliveryDetails}
          companyDetails={order.companyDetails}
          amount={order.amount} // Pass the entire amount object instead of just total
          dueDate={
            order.dueDate ||
            (() => {
              // Calculate due date as 14 days after delivery date
              if (order.deliveryDetails?.deliveryDate) {
                const deliveryDate = parseDateString(
                  order.deliveryDetails.deliveryDate
                );
                const dueDate = new Date(deliveryDate);
                dueDate.setDate(deliveryDate.getDate() + 14);
                return dueDate;
              }
              // Fallback to 14 days from now
              return new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
            })()
          }
          sandwichOptions={sandwichOptions}
          referenceNumber={order.companyDetails?.referenceNumber || null}
          fullName={order.fullName}
          pricing={pricing}
        />
      );
    } catch (pdfError) {
      console.error("PDF generation failed:", pdfError);
      // Continue without PDF
    }

    // Use the constants for sender email
    const fromEmail = EMAIL_CONSTANTS.FROM_EMAIL();

    // Generate HTML for the email including sandwich options
    const emailHtml = getOrderConfirmationHtml({
      quoteId: order.quoteId,
      orderDetails: order.orderDetails,
      deliveryDetails: order.deliveryDetails,
      invoiceDetails: order.invoiceDetails,
      companyDetails: order.companyDetails,
      amount: order.amount, // Pass the entire amount object
      sandwichOptions: sandwichOptions,
      dueDate: order.dueDate,
      fullName: order.fullName,
      isInvoiceEmail,
      referenceNumber: order.companyDetails?.referenceNumber || null,
      pricing, // Pass pricing data
    });

    // Check if this is a pickup order
    const isPickup = order.orderDetails?.isPickup || false;

    // Build CC list - exclude peloton@cargovelo.be for pickup orders
    const adminEmails = ["bestel@noonsandwicherie.be", "verkoop-0795406037@abpart.clouddemat.be"];
    if (!isPickup) {
      adminEmails.push("peloton@cargovelo.be");
    }

    // Log email sending details
    console.log("Sending order confirmation email:");
    console.log("- From:", fromEmail);
    console.log("- To:", order.email);
    console.log("- CC:", adminEmails);
    console.log("- Is Pickup:", isPickup);
    console.log(
      "- Subject:",
      isInvoiceEmail
        ? EMAIL_CONSTANTS.EMAIL_SUBJECTS.INVOICE(order.quoteId)
        : EMAIL_CONSTANTS.EMAIL_SUBJECTS.ORDER_CONFIRMATION(order.quoteId)
    );

    const emailData = {
      from: fromEmail,
      to: ["contact@joelmik.nl"],
      // cc: adminEmails, // Uncomment for production
      reply_to: "bestel@tnoonsandwicherie.be",
      headers: {
        "Reply-To": "bestel@tnoonsandwicherie.be",
      },
      subject: isInvoiceEmail
        ? EMAIL_CONSTANTS.EMAIL_SUBJECTS.INVOICE(order.quoteId)
        : EMAIL_CONSTANTS.EMAIL_SUBJECTS.ORDER_CONFIRMATION(order.quoteId),
      html: emailHtml,
    };

    // Add PDF attachment only for invoice emails or direct payments (not for invoice payment order confirmations)
    const shouldAttachPDF =
      pdfBuffer &&
      (isInvoiceEmail || order.orderDetails?.paymentMethod !== "invoice");
    if (shouldAttachPDF) {
      console.log(
        `Attaching PDF to email - isInvoiceEmail: ${isInvoiceEmail}, paymentMethod: ${order.orderDetails?.paymentMethod}`
      );
      emailData.attachments = [
        {
          filename: `invoice-${order.quoteId}.pdf`,
          content: pdfBuffer,
        },
      ];
    } else {
      console.log(
        `NOT attaching PDF to email - isInvoiceEmail: ${isInvoiceEmail}, paymentMethod: ${order.orderDetails?.paymentMethod}, hasPdfBuffer: ${!!pdfBuffer}`
      );
    }

    const { data, error } = await resend.emails.send(emailData);

    if (error) {
      console.error("Error sending confirmation email:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      return false;
    }

    console.log("Order confirmation email sent successfully:", data);

    // Send WhatsApp notification for the order
    if (!isInvoiceEmail) {
      await sendOrderWhatsAppNotification(order);
    }

    console.log(
      "========= ORDER CONFIRMATION EMAIL SENDING COMPLETED ========="
    );
    return true;
  } catch (error) {
    console.error("Failed to send order confirmation email:", error);
    console.error("Error stack:", error.stack);
    console.log("========= ORDER CONFIRMATION EMAIL SENDING FAILED =========");
    return false;
  }
}
