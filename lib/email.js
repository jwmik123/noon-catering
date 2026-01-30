// lib/email.js
import { Resend } from "resend";
import { renderToBuffer } from "@react-pdf/renderer";
import InvoicePDF from "@/app/components/InvoicePDF";
import { sendOrderWhatsAppNotification } from "./sms";
import { isDrink } from "./product-helpers";
import { calculateVATBreakdown } from "./vat-calculations";
import { calculateOrderTotal } from "./pricing-utils";
import { parseDateString } from "./utils";
import { client } from "@/sanity/lib/client";
import { PRODUCT_QUERY } from "@/sanity/lib/queries";

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
    ORDER_CONFIRMATION: (quoteId) => `Orderbevestiging - ${quoteId}`,
    INVOICE: (quoteId) => `Factuur NOON Sandwicherie & Koffie - ${quoteId}`,
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
    return sandwich ? sandwich.name : "Onbekend broodje";
  };

  // Helper function to check if bread type should be shown
  const shouldShowBreadType = (sandwichId, breadType) => {
    const sandwich = sandwichOptions.find((s) => s._id === sandwichId);
    return sandwich && !isDrink(sandwich) && breadType;
  };

  // Migration map for old English values to new Dutch values
  const SUBCATEGORY_MIGRATION_MAP = {
    'meat': 'vlees',
    'chicken': 'kip',
    'fish': 'vis',
    'salads': 'salades'
  };

  // Helper function to get price for a variety selection item
  const getVarietyPrice = (key) => {
    if (!pricing) return 0;

    const parts = key.split('-');

    // Handle old format (single word like "meat", "veggie", "vegan")
    if (parts.length === 1) {
      // Migrate old value to new value if needed
      const migratedKey = SUBCATEGORY_MIGRATION_MAP[key] || key;
      const sandwichCategory = pricing.categoryPricing?.find(cat => cat.typeCategory === 'sandwiches');
      const subCatData = sandwichCategory?.subCategoryPricing?.find(sc => sc.subCategory === migratedKey);
      return subCatData?.price || 0;
    }

    if (parts[0] === 'lunchboxes' && parts.length === 3) {
      const boxType = parts[1];
      const lunchboxCategory = pricing.categoryPricing?.find(cat => cat.typeCategory === 'lunchboxes');
      const boxTypeData = lunchboxCategory?.boxTypes?.find(bt => bt.boxType === boxType);
      return boxTypeData?.price || 0;
    } else if (parts.length === 2) {
      let [typeCategory, subCategory] = parts;

      // Migrate old values to new values
      typeCategory = SUBCATEGORY_MIGRATION_MAP[typeCategory] || typeCategory;
      subCategory = SUBCATEGORY_MIGRATION_MAP[subCategory] || subCategory;

      const categoryData = pricing.categoryPricing?.find(cat => cat.typeCategory === typeCategory);
      const subCatData = categoryData?.subCategoryPricing?.find(sc => sc.subCategory === subCategory);
      return subCatData?.price || 0;
    }

    return 0;
  };

  // Helper function to render variety selection for both old and new formats
  const renderVarietySelectionRows = (varietySelection) => {
    if (!varietySelection || Object.keys(varietySelection).length === 0) {
      return '<tr><td colspan="6">Geen items geselecteerd</td></tr>';
    }

    const categoryLabels = {
      sandwiches: "Sandwiches",
      salads: "Salades",
      salades: "Salades", // New Dutch value
      bowls: "Bowls",
      lunchboxes: "Lunchboxes"
    };

    const subCategoryLabels = {
      // New Dutch values
      vlees: "Vlees",
      kip: "Kip",
      vis: "Vis",
      veggie: "Veggie",
      vegan: "Vegan",
      // Old English values (for backward compatibility)
      meat: "Vlees",
      chicken: "Kip",
      fish: "Vis",
      // Box types
      daily: "Daily",
      plus: "Plus",
      deluxe: "Deluxe"
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

  // Safe invoice details - use !== undefined to allow empty strings to override delivery address
  // This is important for pickup orders where invoice address may be different from delivery
  const invoiceStreet = invoiceDetails?.address?.street !== undefined ? invoiceDetails.address.street : deliveryStreet;
  const invoiceHouseNumber =
    invoiceDetails?.address?.houseNumber !== undefined ? invoiceDetails.address.houseNumber : deliveryHouseNumber;
  const invoiceHouseNumberAddition =
    invoiceDetails?.address?.houseNumberAddition !== undefined ? invoiceDetails.address.houseNumberAddition : deliveryHouseNumberAddition;
  const invoicePostalCode =
    invoiceDetails?.address?.postalCode !== undefined ? invoiceDetails.address.postalCode : deliveryPostalCode;
  const invoiceCity = invoiceDetails?.address?.city !== undefined ? invoiceDetails.address.city : deliveryCity;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Orderbevestiging - NOON Sandwicherie & Koffie</title>
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
                ? `<h1>Factuur NOON Sandwicherie & Koffie</h1>`
                : `<h1>Orderbevestiging</h1>`
            }
            <div class="order-id">Offerte ID: ${quoteId}</div>
            ${referenceNumber ? `<div class="order-id">Referentienummer: ${referenceNumber}</div>` : ""}
            <div class="order-id">Betaalmethode: ${orderDetails.paymentMethod === "invoice" ? "Factuur" : "Mollie"}</div>
            <div class="order-id">Betalingsstatus: ${isInvoiceEmail ? "In afwachting" : orderDetails.paymentMethod === "invoice" ? "In afwachting" : "Betaald"}</div>
            <div class="order-id">Datum: ${new Date().toLocaleDateString("nl-NL")}</div>
          </div>

          <!-- Payment Message -->
          <div class="section" style="background-color: #f0f7ff; padding: 15px; border-radius: 5px; margin-bottom: 20px; border: 1px solid #524a98;">
            <p style="margin: 0; color: #524a98; font-weight: 500; text-align: center;">Beste ${companyDetails?.name || fullName || "klant"},</p>
            ${
              isInvoiceEmail
                ? `<p style="margin: 10px 0 0; color: #524a98; font-weight: 500; text-align: center;">In de bijlage vindt u de factuur voor uw bestelling.</p>`
                : `<p style="margin: 10px 0 0; color: #524a98; font-weight: 500; text-align: center;">Bedankt voor uw bestelling. ${
                    orderDetails.paymentMethod === "invoice"
                      ? "U ontvangt de factuur op de dag van levering."
                      : "In de bijlage vindt u de factuur voor uw bestelling."
                  }</p>`
            }
          </div>

          <!-- Delivery and Invoice Details -->
          <div class="details-container">
            <!-- Delivery Details -->
            <div class="details-column">
              <div class="section">
                <h2 class="section-title">${isPickup ? 'Afhaalgegevens' : 'Leveringsgegevens'}</h2>
                <div class="delivery-details">
                  <div class="delivery-row">
                    <span class="delivery-label">Bedrijf:</span> ${companyName}
                  </div>
                  <div class="delivery-row">
                    <span class="delivery-label">Telefoon:</span> ${deliveryDetails?.phoneNumber || "N/A"}
                  </div>
                  <div class="delivery-row">
                    <span class="delivery-label">${isPickup ? 'Afhaaldatum:' : 'Leverdatum:'}</span> ${parseDateString(deliveryDetails?.deliveryDate).toLocaleDateString("nl-NL")}
                  </div>
                  <div class="delivery-row">
                    <span class="delivery-label">Tijd:</span> ${deliveryTime}
                  </div>
                  <div class="delivery-row">
                    <span class="delivery-label">Timing:</span> 45 minuten
                  </div>
                  ${isPickup ? `
                  <div class="delivery-row">
                    <span class="delivery-label">Afhaallocatie:</span><br>
                    NOON Sandwicherie & Koffie<br>
                    Keizer Leopoldstraat 1<br>
                    9000 Gent, België
                  </div>
                  ` : `
                  <div class="delivery-row">
                    <span class="delivery-label">Adres:</span><br>
                    ${deliveryStreet} ${deliveryHouseNumber}${deliveryHouseNumberAddition}<br>
                    ${deliveryPostalCode} ${deliveryCity}
                  </div>
                  `}
                  <div class="delivery-row">
                    <span class="delivery-label">Verpakking:</span> ${orderDetails.packagingType === 'plateau' ? 'Door twee gesneden en feestelijk verpakt op plateau' : 'Individueel verpakt'}
                  </div>
                </div>
              </div>
            </div>

            <!-- Invoice Details -->
            <div class="details-column">
              <div class="section">
                <h2 class="section-title">Factuuradres</h2>
                <div class="delivery-details">
                  <div class="delivery-row">
                    <span class="delivery-label">Bedrijf:</span> ${companyName}
                  </div>
                  <div class="delivery-row">
                    <span class="delivery-label">Adres:</span><br>
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
              <h2 class="section-title">Bedrijfsgegevens</h2>
              <div class="delivery-row">
                <span class="delivery-label">Bedrijfsnaam:</span> ${companyName}
              </div>
              ${
                companyDetails?.vatNumber
                  ? `
                <div class="delivery-row">
                  <span class="delivery-label">BTW-nummer:</span> ${companyDetails.vatNumber}
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
            <h2 class="section-title">Bestelgegevens</h2>
            <table>
              <thead>
                <tr>
                  <th>Broodje</th>
                  <th>Aantal</th>
                  <th>Brood</th>
                  <th>Saus</th>
                  <th>Toppings</th>
                  <th>Prijs</th>
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
                            <td>Levering</td>
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
                            <td>Verse Jus</td>
                            <td>${orderDetails.drinks.verseJus}x</td>
                            <td>-</td>
                            <td>-</td>
                            <td>-</td>
                            <td>€${(orderDetails.drinks.verseJus * 3.62).toFixed(2)}</td>
                          </tr>
                          ` : ""}
                          ${orderDetails.drinks.sodas > 0 ? `
                          <tr>
                            <td>Frisdranken</td>
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
                        : "") +
                      (orderDetails.addSoup && orderDetails.soup
                        ? `
                          ${orderDetails.soup.soup_small > 0 ? `
                          <tr>
                            <td>Soep 400ml</td>
                            <td>${orderDetails.soup.soup_small}x</td>
                            <td>-</td>
                            <td>-</td>
                            <td>-</td>
                            <td>€${(orderDetails.soup.soup_small * (pricing?.soup?.soup_small || 3.80)).toFixed(2)}</td>
                          </tr>
                          ` : ""}
                          ${orderDetails.soup.soup_large > 0 ? `
                          <tr>
                            <td>Soep 1000ml</td>
                            <td>${orderDetails.soup.soup_large}x</td>
                            <td>-</td>
                            <td>-</td>
                            <td>-</td>
                            <td>€${(orderDetails.soup.soup_large * (pricing?.soup?.soup_large || 6.40)).toFixed(2)}</td>
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
                          <td>Levering</td>
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
                            <td>Verse Jus</td>
                            <td>${orderDetails.drinks.verseJus}x</td>
                            <td>-</td>
                            <td>-</td>
                            <td>-</td>
                            <td>€${(orderDetails.drinks.verseJus * 3.62).toFixed(2)}</td>
                          </tr>
                          ` : ""}
                          ${orderDetails.drinks.sodas > 0 ? `
                          <tr>
                            <td>Frisdranken</td>
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
                      ${
                        orderDetails.addSoup && orderDetails.soup
                          ? `
                          ${orderDetails.soup.soup_small > 0 ? `
                          <tr>
                            <td>Soep 400ml</td>
                            <td>${orderDetails.soup.soup_small}x</td>
                            <td>-</td>
                            <td>-</td>
                            <td>-</td>
                            <td>€${(orderDetails.soup.soup_small * (pricing?.soup?.soup_small || 3.80)).toFixed(2)}</td>
                          </tr>
                          ` : ""}
                          ${orderDetails.soup.soup_large > 0 ? `
                          <tr>
                            <td>Soep 1000ml</td>
                            <td>${orderDetails.soup.soup_large}x</td>
                            <td>-</td>
                            <td>-</td>
                            <td>-</td>
                            <td>€${(orderDetails.soup.soup_large * (pricing?.soup?.soup_large || 6.40)).toFixed(2)}</td>
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
              <h2 class="section-title">Allergieën of opmerkingen</h2>
              <div class="delivery-details">
                ${orderDetails.allergies}
              </div>
            </div>
          `
              : ""
          }

          <!-- Price Summary -->
          <div class="price-section">
            <div class="price-row">Subtotaal: €${(amountData.originalSubtotal || amountData.subtotal || 0).toFixed(2)}</div>
            ${isPickup && (amountData.pickupDiscount || 0) > 0 ? `<div class="price-row" style="color: #16a34a;">Afhaalkorting (5%): -€${(amountData.pickupDiscount || 0).toFixed(2)}</div>` : ''}
            ${(amountData.delivery || 0) > 0 ? `<div class="price-row">Levering: €${(amountData.delivery || 0).toFixed(2)}</div>` : `<div class="price-row">Levering: ${isPickup ? 'Afhalen' : 'Gratis'}</div>`}
            <div class="price-row">BTW Voeding (6%): €${(amountData.foodVAT || 0).toFixed(2)}</div>
            ${(amountData.deliveryVAT || 0) > 0 ? `<div class="price-row">BTW Levering (21%): €${(amountData.deliveryVAT || 0).toFixed(2)}</div>` : ''}
            <div class="price-row">Totaal BTW: €${(amountData.vat || 0).toFixed(2)}</div>
            <div class="price-row total">Totaal: €${(amountData.total || 0).toFixed(2)}</div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p>NOON Sandwicherie & Koffie</p>
            <p>Keizer Leopoldstraat 1, 9000 Gent, België</p>
            <p>bestel@noonsandwicherie.be</p>
            <p>Heeft u vragen over uw bestelling? Neem gerust contact met ons op.</p>
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
          invoiceDetails={order.invoiceDetails}
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
    // Note: verkoop-0795406037@abpart.clouddemat.be receives the invoice email (via cron job) with PDF attached instead
    const adminEmails = ["bestel@noonsandwicherie.be"];
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
      to: order.email,
      cc: adminEmails, // Uncomment for production
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

/**
 * Send invoice email with PDF attachment (called from cron job on delivery day)
 * This sends the invoice to the customer and verkoop@abpart for accounting
 */
export async function sendInvoiceEmail(invoice, pricing = null) {
  console.log("========= SENDING INVOICE EMAIL =========");
  console.log("Invoice ID:", invoice.quoteId || invoice._id);

  try {
    // Build order object from invoice data
    // Note: email and customer name are stored in orderDetails, not companyDetails
    const orderDetails = invoice.orderDetails || {};

    // Convert customSelection from Sanity array format to object format expected by InvoicePDF
    // Sanity format: [{ sandwichId: { _ref: "id" }, selections: [...] }]
    // Expected format: { "sandwich-id": [{ breadType, quantity, ... }] }
    if (Array.isArray(orderDetails.customSelection)) {
      const convertedSelection = {};
      orderDetails.customSelection.forEach((item) => {
        if (item.sandwichId && item.sandwichId._ref) {
          convertedSelection[item.sandwichId._ref] = Array.isArray(item.selections) ? item.selections : [];
        }
      });
      orderDetails.customSelection = convertedSelection;
      console.log("Converted customSelection to object format for PDF");
    }

    // Build invoiceDetails from flat orderDetails structure
    // Invoice stores invoice address as orderDetails.invoiceStreet, etc.
    // Email template expects invoiceDetails.address.street, etc.
    // For pickup orders: always use invoice address (no delivery address exists)
    // For delivery orders: use invoice address when sameAsDelivery is false
    const isPickup = orderDetails.isPickup === true;
    const useInvoiceAddress = isPickup || orderDetails.sameAsDelivery === false;
    const invoiceDetails = {
      sameAsDelivery: !useInvoiceAddress,
      address: useInvoiceAddress
        ? {
            street: orderDetails.invoiceStreet,
            houseNumber: orderDetails.invoiceHouseNumber,
            houseNumberAddition: orderDetails.invoiceHouseNumberAddition,
            postalCode: orderDetails.invoicePostalCode,
            city: orderDetails.invoiceCity,
          }
        : {
            street: orderDetails.street,
            houseNumber: orderDetails.houseNumber,
            houseNumberAddition: orderDetails.houseNumberAddition,
            postalCode: orderDetails.postalCode,
            city: orderDetails.city,
          },
    };

    const order = {
      quoteId: invoice.quoteId || invoice.referenceNumber,
      email: orderDetails.email,
      fullName: orderDetails.name,
      orderDetails: orderDetails,
      deliveryDetails: {
        deliveryDate: orderDetails.deliveryDate,
        deliveryTime: orderDetails.deliveryTime,
        phoneNumber: orderDetails.phoneNumber,
        address: {
          street: orderDetails.street || "",
          houseNumber: orderDetails.houseNumber || "",
          houseNumberAddition: orderDetails.houseNumberAddition || "",
          postalCode: orderDetails.postalCode || "",
          city: orderDetails.city || "",
        },
      },
      invoiceDetails: invoiceDetails,
      companyDetails: invoice.companyDetails,
      amount: invoice.amount,
      dueDate: invoice.dueDate,
    };

    if (!order.email) {
      console.error("No email address found for invoice:", invoice._id);
      console.error("orderDetails.email:", invoice.orderDetails?.email);
      console.error("companyDetails:", invoice.companyDetails);
      return { success: false, error: "No email address" };
    }

    console.log("Customer email:", order.email);
    console.log("Customer name:", order.fullName);

    // Fetch sandwich options (product list) from Sanity to look up product names
    let sandwichOptions = [];
    try {
      sandwichOptions = await client.fetch(PRODUCT_QUERY);
      console.log(`Fetched ${sandwichOptions.length} products for invoice PDF`);
    } catch (fetchError) {
      console.error("Error fetching products for invoice PDF:", fetchError);
      // Continue with empty array - PDF will show "Unknown Sandwich" for items
    }

    // Generate PDF
    let pdfBuffer;
    try {
      pdfBuffer = await renderToBuffer(
        <InvoicePDF
          quoteId={order.quoteId}
          orderDetails={order.orderDetails}
          deliveryDetails={order.deliveryDetails}
          invoiceDetails={order.invoiceDetails}
          companyDetails={order.companyDetails}
          amount={order.amount}
          dueDate={
            order.dueDate ||
            (() => {
              if (order.deliveryDetails?.deliveryDate) {
                const deliveryDate = parseDateString(
                  order.deliveryDetails.deliveryDate
                );
                const dueDate = new Date(deliveryDate);
                dueDate.setDate(deliveryDate.getDate() + 14);
                return dueDate;
              }
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
      return { success: false, error: `PDF generation failed: ${pdfError.message}` };
    }

    // Generate email HTML
    const emailHtml = getOrderConfirmationHtml({
      quoteId: order.quoteId,
      orderDetails: order.orderDetails,
      deliveryDetails: order.deliveryDetails,
      invoiceDetails: order.invoiceDetails,
      companyDetails: order.companyDetails,
      amount: order.amount,
      sandwichOptions: sandwichOptions,
      dueDate: order.dueDate,
      fullName: order.fullName,
      isInvoiceEmail: true,
      referenceNumber: order.companyDetails?.referenceNumber || null,
      pricing,
    });

    const fromEmail = EMAIL_CONSTANTS.FROM_EMAIL();

    // Invoice emails go to customer + verkoop (accounting)
    const ccEmails = ["verkoop-0795406037@abpart.clouddemat.be"];

    console.log("Sending invoice email:");
    console.log("- From:", fromEmail);
    console.log("- To:", order.email);
    console.log("- CC:", ccEmails);
    console.log("- Subject:", EMAIL_CONSTANTS.EMAIL_SUBJECTS.INVOICE(order.quoteId));

    const emailData = {
      from: fromEmail,
      to: order.email,
      cc: ccEmails,
      reply_to: "bestel@noonsandwicherie.be",
      headers: {
        "Reply-To": "bestel@noonsandwicherie.be",
      },
      subject: EMAIL_CONSTANTS.EMAIL_SUBJECTS.INVOICE(order.quoteId),
      html: emailHtml,
      attachments: [
        {
          filename: `factuur-${order.quoteId}.pdf`,
          content: pdfBuffer,
        },
      ],
    };

    const { data, error } = await resend.emails.send(emailData);

    if (error) {
      console.error("Error sending invoice email:", error);
      return { success: false, error: error.message };
    }

    console.log("Invoice email sent successfully:", data);
    console.log("========= INVOICE EMAIL SENDING COMPLETED =========");
    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error("Failed to send invoice email:", error);
    console.log("========= INVOICE EMAIL SENDING FAILED =========");
    return { success: false, error: error.message };
  }
}
