// lib/whatsapp.js
import twilio from "twilio";
import { isDrink } from "./product-helpers";

// Initialize Twilio client with environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER; // Format: whatsapp:+1234567890

// Create an array of notification recipients (WhatsApp numbers)
const NOTIFICATION_RECIPIENTS = [
  // Add WhatsApp phone numbers that should receive notifications
  // Format: whatsapp:+31612345678 or just +31612345678 (we'll format it)
  process.env.NOTIFICATION_WHATSAPP_1,
  process.env.NOTIFICATION_WHATSAPP_2,
  // Add more as needed
].filter(Boolean);

/**
 * Format phone number for WhatsApp
 * @param {string} phoneNumber - The phone number
 * @returns {string} - Formatted WhatsApp number
 */
function formatWhatsAppNumber(phoneNumber) {
  if (!phoneNumber) return null;

  // If already formatted for WhatsApp, return as is
  if (phoneNumber.startsWith('whatsapp:')) {
    return phoneNumber;
  }

  // Add whatsapp: prefix
  return `whatsapp:${phoneNumber}`;
}

/**
 * Send a WhatsApp notification for a new order
 * @param {Object} orderData - The order data
 * @returns {Promise<boolean>} - Whether the WhatsApp message was sent successfully
 */
export async function sendOrderWhatsAppNotification(orderData) {
  // Early return if no recipients are configured
  if (!NOTIFICATION_RECIPIENTS.length) {
    console.warn("No WhatsApp notification recipients configured");
    return false;
  }

  try {
    // Check if Twilio credentials are configured
    if (!accountSid || !authToken || !twilioWhatsAppNumber) {
      console.error("Missing Twilio credentials. WhatsApp notification not sent.");
      return false;
    }

    console.log("===== SENDING WHATSAPP NOTIFICATIONS =====");

    // Initialize the Twilio client
    const client = twilio(accountSid, authToken);

    // Create a message for WhatsApp
    const messageBody = createOrderWhatsAppContent(orderData);

    // Track successful sends
    let successCount = 0;

    // Send WhatsApp message to each recipient
    for (const recipient of NOTIFICATION_RECIPIENTS) {
      try {
        const formattedRecipient = formatWhatsAppNumber(recipient);
        if (!formattedRecipient) {
          console.error(`Invalid WhatsApp number format: ${recipient}`);
          continue;
        }

        console.log(`Sending WhatsApp message to ${formattedRecipient}`);

        const message = await client.messages.create({
          body: messageBody,
          from: formatWhatsAppNumber(twilioWhatsAppNumber),
          to: formattedRecipient,
        });

        console.log(
          `WhatsApp message sent successfully to ${formattedRecipient}, SID: ${message.sid}`
        );
        successCount++;
      } catch (recipientError) {
        console.error(`Failed to send WhatsApp message to ${recipient}:`, recipientError);
      }
    }

    console.log(
      `===== WHATSAPP NOTIFICATIONS COMPLETED: ${successCount}/${NOTIFICATION_RECIPIENTS.length} =====`
    );
    return successCount > 0;
  } catch (error) {
    console.error("Failed to send WhatsApp notifications:", error);
    return false;
  }
}

/**
 * Create WhatsApp content for order notification in Dutch
 * @param {Object} orderData - The order data
 * @returns {string} - The WhatsApp content
 */
function createOrderWhatsAppContent(orderData) {
  const {
    quoteId,
    orderDetails,
    deliveryDetails,
    companyDetails,
    fullName,
    sandwichOptions = [],
  } = orderData;

  // Format delivery date
  const deliveryDate = new Date(
    deliveryDetails.deliveryDate
  ).toLocaleDateString("nl-NL");

  // Calculate total sandwiches based on selection type
  let totalSandwiches = 0;
  if (orderDetails.selectionType === "custom") {
    // For custom selections, calculate total from actual selections (excluding drinks)
    totalSandwiches = Object.entries(orderDetails.customSelection || {}).reduce(
      (sum, [sandwichId, selections]) => {
        // Find the product to check if it's a drink
        const product = sandwichOptions.find((s) => s._id === sandwichId);
        if (!product || isDrink(product)) return sum;

        // Sum up quantities for non-drink items
        return (
          sum +
          selections.reduce(
            (total, selection) => total + (selection.quantity || 0),
            0
          )
        );
      },
      0
    );
  } else {
    // For variety selections, use the stored totalSandwiches
    totalSandwiches = orderDetails.totalSandwiches || 0;
  }

  // Get address information
  const street = deliveryDetails.street || "";
  const houseNumber = deliveryDetails.houseNumber || "";
  const houseNumberAddition = deliveryDetails.houseNumberAddition || "";
  const postalCode = deliveryDetails.postalCode || "";

  // Format full address
  const fullAddress = `${street} ${houseNumber}${houseNumberAddition}, ${postalCode}`;

  // Get company name if available, otherwise use full name
  const companyName = companyDetails?.companyName || companyDetails?.name || "";
  const customerInfo = companyName.trim() ? `Bedrijf: ${companyName}` : fullName ? `Klant: ${fullName}` : "";

  // Format the message in Dutch with all requested information
  return `Nieuwe Catering Bestelling!

${totalSandwiches} broodjes
Datum: ${deliveryDate} om ${deliveryDetails.deliveryTime}
Adres: ${fullAddress}
${customerInfo}
Contact: ${deliveryDetails.phoneNumber || "Niet opgegeven"}

Ref: ${quoteId}`;
}

/**
 * Combine order and invoice notifications into a single function
 * @param {Object} data - The order or invoice data
 * @param {string} type - The type of notification ('order' or 'invoice')
 * @returns {Promise<boolean>} - Whether the WhatsApp message was sent successfully
 */
export async function sendWhatsAppNotification(data, type = "order") {
  // Determine if this is an order or invoice notification
  if (type === "invoice") {
    return sendOrderWhatsAppNotification(data, true);
  } else {
    return sendOrderWhatsAppNotification(data);
  }
}

// Keep legacy function names for backward compatibility
export const sendSmsNotification = sendWhatsAppNotification;
export const sendOrderSmsNotification = sendOrderWhatsAppNotification;
