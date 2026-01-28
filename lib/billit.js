/**
 * Billit API client for sending Peppol e-invoices
 * Documentation: https://docs.billit.be/reference/peppol_postsendorder-1
 */

import { calculateVarietySubtotal } from "./pricing-utils";

// Billit API configuration
const BILLIT_CONFIG = {
  apiKey: process.env.BILLIT_API_KEY,
  partyId: process.env.BILLIT_PARTY_ID,
  baseUrl: process.env.BILLIT_BASE_URL || "https://api.sandbox.billit.be",
};

// NOON company details (supplier)
const SUPPLIER_DETAILS = {
  Name: "NOON Sandwicherie & Koffie",
  VATNumber: "BE0795406037",
  Street: "Keizer Leopoldstraat",
  StreetNumber: "1",
  Zipcode: "9000",
  City: "Gent",
  CountryCode: "BE",
  IBAN: "BE02363155064240",
  BIC: "BBRUBEBB",
  Email: "bestel@noonsandwicherie.be",
};

/**
 * Format VAT number for Billit (remove spaces, ensure BE prefix)
 * @param {string} vatNumber - The VAT number to format
 * @returns {string} - Formatted VAT number
 */
function formatVATNumber(vatNumber) {
  if (!vatNumber) return "";

  // Remove spaces and dots
  let formatted = vatNumber.replace(/[\s.]/g, "").toUpperCase();

  // Add BE prefix if not present
  if (!formatted.startsWith("BE")) {
    formatted = "BE" + formatted;
  }

  return formatted;
}

/**
 * Format date for Billit API (YYYY-MM-DD)
 * @param {string|Date} date - The date to format
 * @returns {string} - Formatted date string
 */
function formatDate(date) {
  if (!date) return new Date().toISOString().split("T")[0];

  if (typeof date === "string") {
    // If already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    // Parse and format
    const parsed = new Date(date);
    return parsed.toISOString().split("T")[0];
  }

  return date.toISOString().split("T")[0];
}

/**
 * Calculate sandwich subtotal for custom selection
 * @param {Object} customSelection - The custom selection object
 * @returns {number} - Total price for sandwiches
 */
function calculateCustomSandwichTotal(customSelection) {
  if (!customSelection) return 0;

  // Handle both array format (from Sanity) and object format
  if (Array.isArray(customSelection)) {
    return customSelection.reduce((total, item) => {
      const selections = item.selections || [];
      return total + selections.reduce((sum, sel) => sum + (sel.subTotal || 0), 0);
    }, 0);
  }

  // Object format
  return Object.values(customSelection)
    .flat()
    .reduce((total, selection) => total + (selection.subTotal || 0), 0);
}

/**
 * Calculate drinks total
 * @param {Object} drinks - The drinks object
 * @param {Object} pricing - The pricing data
 * @returns {number} - Total price for drinks
 */
function calculateDrinksTotal(drinks, pricing) {
  if (!drinks) return 0;

  const juicePrice = pricing?.drinks?.freshOrangeJuice || 3.35;
  const sodaPrice = pricing?.drinks?.sodas || 2.35;

  return (
    (drinks.verseJus || drinks.freshOrangeJuice || 0) * juicePrice +
    (drinks.sodas || 0) * sodaPrice +
    (drinks.smoothies || 0) * juicePrice // Assume smoothies same price as juice
  );
}

/**
 * Get total drink count
 * @param {Object} drinks - The drinks object
 * @returns {number} - Total number of drinks
 */
function getDrinksCount(drinks) {
  if (!drinks) return 0;
  return (
    (drinks.verseJus || drinks.freshOrangeJuice || 0) +
    (drinks.sodas || 0) +
    (drinks.smoothies || 0)
  );
}

/**
 * Calculate soup total
 * @param {Object} soup - The soup object
 * @param {Object} pricing - The pricing data
 * @returns {number} - Total price for soup
 */
function calculateSoupTotal(soup, pricing) {
  if (!soup) return 0;

  const smallPrice = pricing?.soup?.soup_small || 3.80;
  const largePrice = pricing?.soup?.soup_large || 6.40;

  return (
    (soup.soup_small || 0) * smallPrice +
    (soup.soup_large || 0) * largePrice
  );
}

/**
 * Get total soup count
 * @param {Object} soup - The soup object
 * @returns {number} - Total number of soups
 */
function getSoupCount(soup) {
  if (!soup) return 0;
  return (soup.soup_small || 0) + (soup.soup_large || 0);
}

/**
 * Calculate desserts total
 * @param {Object} desserts - The desserts object
 * @param {Object} pricing - The pricing data
 * @returns {number} - Total price for desserts
 */
function calculateDessertsTotal(desserts, pricing) {
  if (!desserts) return 0;

  const dessertPrice = pricing?.desserts?.desserts || 3.50;
  const cookiePrice = pricing?.desserts?.cookies || 2.50;

  return (
    (desserts.desserts || 0) * dessertPrice +
    (desserts.cookies || 0) * cookiePrice
  );
}

/**
 * Get total desserts count
 * @param {Object} desserts - The desserts object
 * @returns {number} - Total number of desserts
 */
function getDessertsCount(desserts) {
  if (!desserts) return 0;
  return (desserts.desserts || 0) + (desserts.cookies || 0);
}

/**
 * Build order lines for Billit from invoice data
 * Uses grouped format: "Sandwiches (15x)", "Dranken (5x)", etc.
 * @param {Object} invoice - The invoice document from Sanity
 * @param {Object} pricing - The pricing data from Sanity
 * @returns {Array} - Array of order line objects for Billit
 */
function buildOrderLines(invoice, pricing) {
  const lines = [];
  const orderDetails = invoice.orderDetails || {};

  // 1. Sandwiches (grouped)
  const totalSandwiches = orderDetails.totalSandwiches || 0;
  if (totalSandwiches > 0) {
    let sandwichTotal = 0;

    if (orderDetails.selectionType === "custom") {
      sandwichTotal = calculateCustomSandwichTotal(orderDetails.customSelection);
    } else if (orderDetails.selectionType === "variety") {
      sandwichTotal = calculateVarietySubtotal(orderDetails.varietySelection, pricing);
    }

    if (sandwichTotal > 0) {
      lines.push({
        Description: `Sandwiches (${totalSandwiches}x)`,
        Quantity: 1,
        UnitPriceExcl: Math.round(sandwichTotal * 100) / 100,
        VATPercentage: 6.0,
      });
    }
  }

  // 2. Drinks
  if (orderDetails.addDrinks && orderDetails.drinks) {
    const drinksTotal = calculateDrinksTotal(orderDetails.drinks, pricing);
    const drinksCount = getDrinksCount(orderDetails.drinks);

    if (drinksTotal > 0) {
      lines.push({
        Description: `Dranken (${drinksCount}x)`,
        Quantity: 1,
        UnitPriceExcl: Math.round(drinksTotal * 100) / 100,
        VATPercentage: 6.0,
      });
    }
  }

  // 3. Soup
  if (orderDetails.addSoup && orderDetails.soup) {
    const soupTotal = calculateSoupTotal(orderDetails.soup, pricing);
    const soupCount = getSoupCount(orderDetails.soup);

    if (soupTotal > 0) {
      lines.push({
        Description: `Soep (${soupCount}x)`,
        Quantity: 1,
        UnitPriceExcl: Math.round(soupTotal * 100) / 100,
        VATPercentage: 6.0,
      });
    }
  }

  // 4. Desserts
  if (orderDetails.addDesserts && orderDetails.desserts) {
    const dessertsTotal = calculateDessertsTotal(orderDetails.desserts, pricing);
    const dessertsCount = getDessertsCount(orderDetails.desserts);

    if (dessertsTotal > 0) {
      lines.push({
        Description: `Desserts (${dessertsCount}x)`,
        Quantity: 1,
        UnitPriceExcl: Math.round(dessertsTotal * 100) / 100,
        VATPercentage: 6.0,
      });
    }
  }

  // 5. Delivery (21% VAT) - only if not a pickup order
  const deliveryCost = invoice.amount?.delivery || orderDetails.deliveryCost || 0;
  const isPickup = orderDetails.isPickup || false;

  if (deliveryCost > 0 && !isPickup) {
    lines.push({
      Description: "Levering",
      Quantity: 1,
      UnitPriceExcl: Math.round(deliveryCost * 100) / 100,
      VATPercentage: 21.0,
    });
  }

  return lines;
}

/**
 * Create an order in Billit
 * @param {Object} orderData - The order data for Billit
 * @returns {Promise<{success: boolean, orderId?: string, error?: string}>}
 */
async function createBillitOrder(orderData) {
  const response = await fetch(`${BILLIT_CONFIG.baseUrl}/v1/orders`, {
    method: "POST",
    headers: {
      "apiKey": BILLIT_CONFIG.apiKey,
      "partyId": BILLIT_CONFIG.partyId,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(orderData),
  });

  const responseText = await response.text();
  console.log("[Billit] Create order response:", response.status, responseText);

  if (!response.ok) {
    let errorMessage = `Create order failed: ${response.status}`;
    try {
      const errorData = JSON.parse(responseText);
      if (errorData.errors && Array.isArray(errorData.errors)) {
        errorMessage = errorData.errors.map(e => e.Description || e.Code).join(", ");
      }
    } catch {
      errorMessage = responseText || errorMessage;
    }
    return { success: false, error: errorMessage };
  }

  // Response is just the order ID as a number
  const orderId = responseText.trim();
  return { success: true, orderId };
}

/**
 * Send an existing order via Peppol
 * @param {string} orderId - The Billit order ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function sendOrderViaPeppol(orderId) {
  const response = await fetch(`${BILLIT_CONFIG.baseUrl}/v1/orders/commands/send`, {
    method: "POST",
    headers: {
      "apiKey": BILLIT_CONFIG.apiKey,
      "partyId": BILLIT_CONFIG.partyId,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({
      TransportType: "Peppol",
      OrderIDs: [parseInt(orderId, 10)],
    }),
  });

  const responseText = await response.text();
  console.log("[Billit] Send via Peppol response:", response.status, responseText);

  if (!response.ok) {
    let errorMessage = `Send via Peppol failed: ${response.status}`;
    try {
      const errorData = JSON.parse(responseText);
      if (errorData.errors && Array.isArray(errorData.errors)) {
        errorMessage = errorData.errors.map(e => e.Description || e.Code).join(", ");
      }
    } catch {
      errorMessage = responseText || errorMessage;
    }
    return { success: false, error: errorMessage };
  }

  return { success: true };
}

/**
 * Send an invoice to Billit for Peppol delivery (two-step process)
 * Step 1: Create the order in Billit
 * Step 2: Send the order via Peppol
 * @param {Object} invoice - The invoice document from Sanity
 * @param {Object} pricing - The pricing data from Sanity
 * @returns {Promise<{success: boolean, orderId?: string, error?: string}>}
 */
export async function sendPeppolInvoice(invoice, pricing) {
  console.log(`[Billit] Sending invoice ${invoice.quoteId} to Peppol...`);

  if (!BILLIT_CONFIG.apiKey) {
    console.error("[Billit] API key not configured");
    return { success: false, error: "Billit API key not configured" };
  }

  if (!BILLIT_CONFIG.partyId) {
    console.error("[Billit] Party ID not configured");
    return { success: false, error: "Billit Party ID not configured" };
  }

  // Check if customer has VAT number
  const vatNumber = invoice.companyDetails?.btwNumber || invoice.companyDetails?.vatNumber;
  if (!vatNumber) {
    console.error("[Billit] Customer VAT number (btw-nummer) is required for Peppol");
    return { success: false, error: "Customer VAT number (btw-nummer) is required for Peppol invoicing" };
  }

  try {
    // Transform invoice to Billit order format
    const billitOrderData = transformInvoiceToBillitOrder(invoice, pricing);
    console.log("[Billit] Order payload:", JSON.stringify(billitOrderData, null, 2));

    // Step 1: Create the order in Billit
    console.log("[Billit] Step 1: Creating order...");
    const createResult = await createBillitOrder(billitOrderData);

    if (!createResult.success) {
      console.error("[Billit] Failed to create order:", createResult.error);
      return { success: false, error: createResult.error };
    }

    const orderId = createResult.orderId;
    console.log(`[Billit] Order created with ID: ${orderId}`);

    // Step 2: Send the order via Peppol
    console.log("[Billit] Step 2: Sending via Peppol...");
    const sendResult = await sendOrderViaPeppol(orderId);

    if (!sendResult.success) {
      console.error("[Billit] Failed to send via Peppol:", sendResult.error);
      // Order was created but not sent - return the order ID so it can be retried
      return { success: false, orderId, error: `Order created (ID: ${orderId}) but Peppol send failed: ${sendResult.error}` };
    }

    console.log(`[Billit] Invoice ${invoice.quoteId} sent successfully via Peppol. Order ID: ${orderId}`);

    return {
      success: true,
      orderId,
    };
  } catch (error) {
    console.error("[Billit] Failed to send invoice:", error);
    return { success: false, error: error.message || "Unknown error occurred" };
  }
}

/**
 * Transform a Sanity invoice to Billit order format (for /v1/orders endpoint)
 * @param {Object} invoice - The invoice document from Sanity
 * @param {Object} pricing - The pricing data from Sanity
 * @returns {Object} - Billit order object
 */
function transformInvoiceToBillitOrder(invoice, pricing) {
  const orderDetails = invoice.orderDetails || {};
  const companyDetails = invoice.companyDetails || {};
  const address = companyDetails.address || {};

  // Calculate due date
  let expiryDate;
  if (invoice.dueDate) {
    expiryDate = formatDate(invoice.dueDate);
  } else {
    const deliveryDate = new Date(orderDetails.deliveryDate || Date.now());
    deliveryDate.setDate(deliveryDate.getDate() + 14);
    expiryDate = formatDate(deliveryDate);
  }

  return {
    OrderType: "Invoice",
    OrderDirection: "Income", // Sales invoice (outgoing = income for us)
    OrderNumber: invoice.quoteId || `INV-${Date.now()}`,
    OrderDate: formatDate(orderDetails.deliveryDate),
    ExpiryDate: expiryDate,
    Supplier: {
      Name: SUPPLIER_DETAILS.Name,
      VATNumber: SUPPLIER_DETAILS.VATNumber,
      // Explicitly specify Belgian VAT identifier (SchemeID 9925)
      PeppolIdentifier: `9925:${SUPPLIER_DETAILS.VATNumber}`,
      Street: SUPPLIER_DETAILS.Street,
      StreetNumber: SUPPLIER_DETAILS.StreetNumber,
      Zipcode: SUPPLIER_DETAILS.Zipcode,
      City: SUPPLIER_DETAILS.City,
      CountryCode: SUPPLIER_DETAILS.CountryCode,
      IBAN: SUPPLIER_DETAILS.IBAN,
      BIC: SUPPLIER_DETAILS.BIC,
      Email: SUPPLIER_DETAILS.Email,
      PartyType: "Supplier",
    },
    Customer: {
      Name: companyDetails.name || orderDetails.name || "Unknown Customer",
      VATNumber: formatVATNumber(companyDetails.btwNumber || companyDetails.vatNumber),
      // Explicitly specify Belgian VAT identifier (SchemeID 9925)
      PeppolIdentifier: `9925:${formatVATNumber(companyDetails.btwNumber || companyDetails.vatNumber)}`,
      Street: address.street || "",
      StreetNumber: address.houseNumber || "",
      Box: address.houseNumberAddition || "",
      Zipcode: address.postalCode || "",
      City: address.city || "",
      CountryCode: "BE",
      Email: orderDetails.email || "",
      PartyType: "Customer",
    },
    OrderLines: buildOrderLines(invoice, pricing),
    CustomerReference: companyDetails.referenceNumber || invoice.referenceNumber || undefined,
  };
}

/**
 * Validate that an invoice has all required fields for Peppol
 * @param {Object} invoice - The invoice document from Sanity
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateInvoiceForPeppol(invoice) {
  const errors = [];

  if (!invoice.quoteId) {
    errors.push("Missing quote ID");
  }

  if (!invoice.companyDetails?.btwNumber && !invoice.companyDetails?.vatNumber) {
    errors.push("Missing customer VAT number (btw-nummer)");
  }

  if (!invoice.companyDetails?.name) {
    errors.push("Missing customer company name");
  }

  if (!invoice.orderDetails?.deliveryDate) {
    errors.push("Missing delivery date");
  }

  const orderLines = buildOrderLines(invoice, {});
  if (orderLines.length === 0) {
    errors.push("No order lines could be generated");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
