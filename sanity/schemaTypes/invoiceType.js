// schemas/invoice.js
import { defineField, defineType } from "sanity";

export const invoice = defineType({
  name: "invoice",
  title: "Invoices",
  type: "document",
  groups: [
    { name: "main", title: "Main Info", default: true },
    { name: "amounts", title: "Amounts & VAT" },
    { name: "company", title: "Company Details" },
    { name: "order", title: "Order Details" },
    { name: "payment", title: "Payment" },
    { name: "billit", title: "Billit / Peppol" },
    { name: "meta", title: "Metadata" },
  ],
  fields: [
    // === MAIN INFO ===
    defineField({
      name: "quoteId",
      title: "Quote ID",
      type: "string",
      group: "main",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "invoiceNumber",
      title: "Invoice Number",
      type: "string",
      group: "main",
      readOnly: true,
      description: "Auto-generated invoice number",
    }),
    defineField({
      name: "referenceNumber",
      title: "Customer Reference",
      type: "string",
      group: "main",
      description: "Optional internal reference number provided by the customer",
    }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      group: "main",
      initialValue: "pending",
      options: {
        list: [
          { title: "Pending", value: "pending" },
          { title: "Paid", value: "paid" },
          { title: "Overdue", value: "overdue" },
          { title: "Cancelled", value: "cancelled" },
        ],
        layout: "radio",
      },
    }),
    defineField({
      name: "dueDate",
      title: "Due Date",
      type: "datetime",
      group: "main",
      description: "Payment due date (usually 14 days after delivery)",
    }),

    // === AMOUNTS & VAT ===
    defineField({
      name: "amount",
      title: "Amount Breakdown",
      type: "object",
      group: "amounts",
      description: "Complete VAT breakdown for the invoice",
      fields: [
        defineField({
          name: "subtotal",
          title: "Food Subtotal (excl. VAT)",
          type: "number",
          description: "Food items subtotal before 6% VAT",
        }),
        defineField({
          name: "delivery",
          title: "Delivery Cost (excl. VAT)",
          type: "number",
          description: "Delivery cost before 21% VAT",
        }),
        defineField({
          name: "foodVAT",
          title: "Food VAT (6%)",
          type: "number",
          description: "VAT amount on food items",
        }),
        defineField({
          name: "deliveryVAT",
          title: "Delivery VAT (21%)",
          type: "number",
          description: "VAT amount on delivery",
        }),
        defineField({
          name: "vat",
          title: "Total VAT",
          type: "number",
          description: "Combined VAT (food + delivery)",
        }),
        defineField({
          name: "total",
          title: "Total (incl. VAT)",
          type: "number",
          description: "Final amount including all VAT",
          validation: (Rule) => Rule.required(),
        }),
      ],
    }),

    // === COMPANY DETAILS ===
    defineField({
      name: "companyDetails",
      title: "Company Details",
      type: "object",
      group: "company",
      fields: [
        defineField({
          name: "name",
          title: "Company Name",
          type: "string",
        }),
        defineField({
          name: "btwNumber",
          title: "BTW Number",
          type: "string",
          description: "Customer VAT number for Peppol e-invoicing (required for B2B)",
        }),
        defineField({
          name: "referenceNumber",
          title: "Reference Number",
          type: "string",
          description: "Customer's internal reference/PO number",
        }),
        defineField({
          name: "address",
          title: "Billing Address",
          type: "object",
          fields: [
            defineField({ name: "street", title: "Street", type: "string" }),
            defineField({ name: "houseNumber", title: "House Number", type: "string" }),
            defineField({ name: "houseNumberAddition", title: "Addition", type: "string" }),
            defineField({ name: "postalCode", title: "Postal Code", type: "string" }),
            defineField({ name: "city", title: "City", type: "string" }),
          ],
        }),
      ],
    }),

    // === PAYMENT ===
    defineField({
      name: "paymentStatus",
      title: "Payment Status",
      type: "string",
      group: "payment",
      options: {
        list: [
          { title: "Pending", value: "pending" },
          { title: "Paid", value: "paid" },
          { title: "Failed", value: "failed" },
          { title: "Expired", value: "expired" },
          { title: "Canceled", value: "canceled" },
        ],
        layout: "radio",
      },
    }),
    defineField({
      name: "paymentId",
      title: "Mollie Payment ID",
      type: "string",
      group: "payment",
      readOnly: true,
    }),
    defineField({
      name: "paidAt",
      title: "Paid At",
      type: "datetime",
      group: "payment",
      readOnly: true,
    }),
    defineField({
      name: "lastPaymentUpdate",
      title: "Last Payment Update",
      type: "datetime",
      group: "payment",
      readOnly: true,
    }),

    // === BILLIT / PEPPOL ===
    defineField({
      name: "billitOrderId",
      title: "Billit Order ID",
      type: "string",
      group: "billit",
      description: "Order ID returned from Billit API after successful submission",
      readOnly: true,
    }),
    defineField({
      name: "billitSentAt",
      title: "Billit Sent At",
      type: "datetime",
      group: "billit",
      description: "Timestamp when the invoice was sent to Billit",
      readOnly: true,
    }),
    defineField({
      name: "billitError",
      title: "Billit Error",
      type: "text",
      group: "billit",
      description: "Error message if Billit submission failed",
      readOnly: true,
    }),

    // === EMAIL TRACKING ===
    defineField({
      name: "emailSent",
      title: "Email Sent",
      type: "boolean",
      group: "meta",
      initialValue: false,
      description: "Whether the invoice email has been sent to the customer",
    }),
    defineField({
      name: "emailSentAt",
      title: "Email Sent At",
      type: "datetime",
      group: "meta",
      description: "Timestamp when the invoice email was sent",
    }),

    // === METADATA ===
    defineField({
      name: "createdAt",
      title: "Created At",
      type: "datetime",
      group: "meta",
      readOnly: true,
    }),
    defineField({
      name: "notes",
      title: "Internal Notes",
      type: "text",
      group: "meta",
      description: "Internal notes (not shown to customer)",
    }),

    // === ORDER DETAILS ===
    defineField({
      name: "orderDetails",
      title: "Order Details",
      type: "object",
      group: "order",
      description: "A snapshot of the order details at the time of invoice creation",
      fields: [
        // === Customer Info ===
        defineField({
          name: "name",
          title: "Customer Name",
          type: "string",
        }),
        defineField({
          name: "email",
          title: "Email",
          type: "string",
        }),
        defineField({
          name: "phoneNumber",
          title: "Phone Number",
          type: "string",
        }),
        defineField({
          name: "isCompany",
          title: "Is Company Order",
          type: "boolean",
        }),
        defineField({
          name: "companyName",
          title: "Company Name",
          type: "string",
        }),
        defineField({
          name: "btwNumber",
          title: "BTW Number",
          type: "string",
          description: "Company VAT number",
        }),
        defineField({
          name: "companyVAT",
          title: "Company VAT (Legacy)",
          type: "string",
          description: "Legacy field for company VAT",
        }),
        defineField({
          name: "referenceNumber",
          title: "Reference Number",
          type: "string",
          description: "Customer's internal reference/PO number",
        }),
        defineField({
          name: "numberOfPeople",
          title: "Number of People",
          type: "number",
        }),

        // === Delivery Info ===
        defineField({
          name: "isPickup",
          title: "Is Pickup",
          type: "boolean",
          description: "Whether customer picks up instead of delivery",
        }),
        defineField({
          name: "deliveryDate",
          title: "Delivery Date",
          type: "string",
          description: "Delivery date in ISO format",
        }),
        defineField({
          name: "deliveryTime",
          title: "Delivery Time",
          type: "string",
        }),
        defineField({
          name: "deliveryCost",
          title: "Delivery Cost",
          type: "number",
          description: "Delivery cost (VAT-exclusive)",
        }),

        // === Delivery Address ===
        defineField({
          name: "street",
          title: "Street",
          type: "string",
        }),
        defineField({
          name: "houseNumber",
          title: "House Number",
          type: "string",
        }),
        defineField({
          name: "houseNumberAddition",
          title: "House Number Addition",
          type: "string",
        }),
        defineField({
          name: "postalCode",
          title: "Postal Code",
          type: "string",
        }),
        defineField({
          name: "city",
          title: "City",
          type: "string",
        }),
        defineField({
          name: "fullAddress",
          title: "Full Address",
          type: "string",
          description: "Complete address string from Google Maps",
        }),
        defineField({
          name: "usingGoogleMaps",
          title: "Using Google Maps",
          type: "boolean",
        }),
        defineField({
          name: "coordinates",
          title: "Coordinates",
          type: "object",
          fields: [
            defineField({ name: "lat", title: "Latitude", type: "number" }),
            defineField({ name: "lng", title: "Longitude", type: "number" }),
          ],
        }),

        // === Invoice Address (if different) ===
        defineField({
          name: "sameAsDelivery",
          title: "Invoice Address Same as Delivery",
          type: "boolean",
        }),
        defineField({
          name: "invoiceStreet",
          title: "Invoice Street",
          type: "string",
          hidden: ({ parent }) => parent?.sameAsDelivery !== false,
        }),
        defineField({
          name: "invoiceHouseNumber",
          title: "Invoice House Number",
          type: "string",
          hidden: ({ parent }) => parent?.sameAsDelivery !== false,
        }),
        defineField({
          name: "invoiceHouseNumberAddition",
          title: "Invoice House Number Addition",
          type: "string",
          hidden: ({ parent }) => parent?.sameAsDelivery !== false,
        }),
        defineField({
          name: "invoicePostalCode",
          title: "Invoice Postal Code",
          type: "string",
          hidden: ({ parent }) => parent?.sameAsDelivery !== false,
        }),
        defineField({
          name: "invoiceCity",
          title: "Invoice City",
          type: "string",
          hidden: ({ parent }) => parent?.sameAsDelivery !== false,
        }),

        // === Order Options ===
        defineField({
          name: "packagingType",
          title: "Packaging Type",
          type: "string",
          options: {
            list: [
              { title: "Individual", value: "individual" },
              { title: "Group", value: "group" },
            ],
          },
        }),
        defineField({
          name: "paymentMethod",
          title: "Payment Method",
          type: "string",
          options: {
            list: [
              { title: "Invoice", value: "invoice" },
              { title: "Online (Mollie)", value: "online" },
              { title: "Cash", value: "cash" },
            ],
          },
        }),

        // === Order Summary ===
        defineField({
          name: "totalSandwiches",
          title: "Total Sandwiches",
          type: "number",
          description: "Total number of sandwiches ordered",
        }),
        defineField({
          name: "selectionType",
          title: "Selection Type",
          type: "string",
          options: {
            list: [
              { title: "Custom Selection", value: "custom" },
              { title: "Variety Pack", value: "variety" },
            ],
          },
        }),
        defineField({
          name: "allergies",
          title: "Allergies / Dietary Notes",
          type: "text",
        }),

        // === Variety Selection ===
        defineField({
          name: "varietySelection",
          title: "Variety Selection",
          type: "object",
          hidden: ({ parent }) => parent?.selectionType !== "variety",
          fields: [
            defineField({ name: "nonVega", title: "Non-Vegetarian", type: "number" }),
            defineField({ name: "vega", title: "Vegetarian", type: "number" }),
            defineField({ name: "vegan", title: "Vegan", type: "number" }),
          ],
        }),

        // === Custom Selection ===
        defineField({
          name: "customSelection",
          title: "Custom Selection",
          type: "array",
          hidden: ({ parent }) => parent?.selectionType !== "custom",
          of: [
            {
              type: "object",
              fields: [
                defineField({
                  name: "sandwichId",
                  title: "Sandwich",
                  type: "reference",
                  to: [{ type: "product" }],
                }),
                defineField({
                  name: "selections",
                  title: "Selections",
                  type: "array",
                  of: [
                    {
                      type: "object",
                      fields: [
                        defineField({ name: "breadType", title: "Bread Type", type: "string" }),
                        defineField({ name: "sauce", title: "Sauce", type: "string" }),
                        defineField({ name: "quantity", title: "Quantity", type: "number" }),
                        defineField({ name: "subTotal", title: "Subtotal", type: "number" }),
                      ],
                    },
                  ],
                }),
              ],
              preview: {
                select: {
                  title: "sandwichId.name",
                  selections: "selections",
                },
                prepare({ title, selections }) {
                  const count = selections?.reduce((sum, s) => sum + (s.quantity || 0), 0) || 0;
                  return {
                    title: title || "Unknown Sandwich",
                    subtitle: `${count} items`,
                  };
                },
              },
            },
          ],
        }),

        // === Extras - Drinks ===
        defineField({
          name: "addDrinks",
          title: "Add Drinks",
          type: "boolean",
          initialValue: false,
        }),
        defineField({
          name: "drinks",
          title: "Drinks Selection",
          type: "object",
          hidden: ({ parent }) => !parent?.addDrinks,
          fields: [
            defineField({ name: "verseJus", title: "Fresh Juice", type: "number" }),
            defineField({ name: "sodas", title: "Sodas", type: "number" }),
            defineField({ name: "smoothies", title: "Smoothies", type: "number" }),
          ],
        }),

        // === Extras - Soup ===
        defineField({
          name: "addSoup",
          title: "Add Soup",
          type: "boolean",
          initialValue: false,
        }),
        defineField({
          name: "soup",
          title: "Soup Selection",
          type: "object",
          hidden: ({ parent }) => !parent?.addSoup,
          fields: [
            defineField({ name: "soup_small", title: "Soup 400ml", type: "number" }),
            defineField({ name: "soup_large", title: "Soup 1000ml", type: "number" }),
          ],
        }),

        // === Extras - Desserts ===
        defineField({
          name: "addDesserts",
          title: "Add Desserts",
          type: "boolean",
          initialValue: false,
        }),
        defineField({
          name: "desserts",
          title: "Desserts Selection",
          type: "object",
          hidden: ({ parent }) => !parent?.addDesserts,
          fields: [
            defineField({ name: "desserts", title: "Desserts", type: "number" }),
            defineField({ name: "cookies", title: "Cookies", type: "number" }),
          ],
        }),
      ],
    }),
  ],

  // Preview configuration for the document list
  preview: {
    select: {
      quoteId: "quoteId",
      invoiceNumber: "invoiceNumber",
      companyName: "companyDetails.name",
      total: "amount.total",
      status: "status",
    },
    prepare({ quoteId, invoiceNumber, companyName, total, status }) {
      const statusEmoji = {
        pending: "⏳",
        paid: "✅",
        overdue: "⚠️",
        cancelled: "❌",
      };
      return {
        title: invoiceNumber || quoteId || "No ID",
        subtitle: `${companyName || "Unknown"} • €${total?.toFixed(2) || "0.00"} • ${statusEmoji[status] || ""} ${status || "unknown"}`,
        media: null,
      };
    },
  },

  // Default ordering
  orderings: [
    {
      title: "Created (Newest)",
      name: "createdAtDesc",
      by: [{ field: "createdAt", direction: "desc" }],
    },
    {
      title: "Due Date",
      name: "dueDateAsc",
      by: [{ field: "dueDate", direction: "asc" }],
    },
    {
      title: "Status",
      name: "statusAsc",
      by: [{ field: "status", direction: "asc" }],
    },
  ],
});

export default invoice;
