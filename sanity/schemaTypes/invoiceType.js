// schemas/invoice.js
import { defineField, defineType } from "sanity";

export const invoice = defineType({
  name: "invoice",
  title: "Invoices",
  type: "document",
  fields: [
    defineField({
      name: "quoteId",
      title: "Quote ID",
      type: "string",
    }),
    defineField({
      name: "referenceNumber",
      title: "Reference Number",
      type: "string",
      description:
        "Optional internal reference number provided by the customer",
    }),
    defineField({
      name: "invoiceNumber",
      title: "Invoice Number",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "amount",
      title: "Amount",
      type: "object",
      fields: [
        defineField({ name: "total", type: "number" }),
        defineField({ name: "subtotal", type: "number" }),
        defineField({ name: "vat", type: "number" }),
      ],
    }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      options: {
        list: [
          { title: "Pending", value: "pending" },
          { title: "Paid", value: "paid" },
          { title: "Overdue", value: "overdue" },
          { title: "Cancelled", value: "cancelled" },
        ],
      },
    }),
    defineField({
      name: "dueDate",
      title: "Due Date",
      type: "datetime",
    }),
    defineField({
      name: "companyDetails",
      title: "Company Details",
      type: "object",
      fields: [
        defineField({ name: "name", type: "string" }),
        defineField({
          name: "btwNumber",
          title: "BTW Number",
          type: "string",
          description: "Customer VAT number for Peppol e-invoicing",
        }),
        defineField({
          name: "address",
          type: "object",
          fields: [
            defineField({ name: "street", type: "string" }),
            defineField({ name: "houseNumber", type: "string" }),
            defineField({ name: "houseNumberAddition", type: "string" }),
            defineField({ name: "postalCode", type: "string" }),
            defineField({ name: "city", type: "string" }),
          ],
        }),
      ],
    }),
    defineField({
      name: "paymentStatus",
      title: "Payment Status",
      type: "string",
      options: {
        list: [
          { title: "Pending", value: "pending" },
          { title: "Paid", value: "paid" },
          { title: "Failed", value: "failed" },
          { title: "Expired", value: "expired" },
          { title: "Canceled", value: "canceled" },
        ],
      },
    }),
    defineField({
      name: "paymentId",
      title: "Mollie Payment ID",
      type: "string",
    }),
    defineField({
      name: "lastPaymentUpdate",
      title: "Last Payment Update",
      type: "datetime",
    }),
    defineField({
      name: "paidAt",
      title: "Paid At",
      type: "datetime",
    }),
    defineField({
      name: "createdAt",
      title: "Created At",
      type: "datetime",
    }),
    defineField({
      name: "notes",
      title: "Notes",
      type: "text",
    }),

    // -- Billit / Peppol Integration --
    defineField({
      name: "billitOrderId",
      title: "Billit Order ID",
      type: "string",
      description: "Order ID returned from Billit API after successful submission",
      readOnly: true,
    }),
    defineField({
      name: "billitSentAt",
      title: "Billit Sent At",
      type: "datetime",
      description: "Timestamp when the invoice was sent to Billit",
      readOnly: true,
    }),
    defineField({
      name: "billitError",
      title: "Billit Error",
      type: "text",
      description: "Error message if Billit submission failed",
      readOnly: true,
    }),

    // -- Order Details --
    defineField({
      name: "orderDetails",
      title: "Order Details",
      type: "object",
      description:
        "A snapshot of the order details at the time of invoice creation.",
      fields: [
        { name: "name", title: "Customer Name", type: "string" },
        { name: "email", title: "Email", type: "string" },
        { name: "phoneNumber", title: "Phone Number", type: "string" },
        { name: "deliveryDate", title: "Delivery Date", type: "string" },
        { name: "deliveryTime", title: "Delivery Time", type: "string" },
        { name: "deliveryCost", title: "Delivery Cost", type: "number" },
        { name: "totalSandwiches", title: "Total Sandwiches", type: "number" },
        { name: "selectionType", title: "Selection Type", type: "string" },
        { name: "allergies", title: "Allergies", type: "text" },
        {
          name: "varietySelection",
          title: "Variety Selection",
          type: "object",
          fields: [
            { name: "nonVega", type: "number" },
            { name: "vega", type: "number" },
            { name: "vegan", type: "number" },
          ],
        },
        { name: "addDrinks", title: "Add Drinks", type: "boolean" },
        {
          name: "drinks",
          title: "Drinks Selection",
          type: "object",
          fields: [
            { name: "verseJus", title: "Fresh Juice", type: "number" },
            { name: "sodas", title: "Sodas", type: "number" },
            { name: "smoothies", title: "Smoothies", type: "number" },
          ],
        },
        { name: "addSoup", title: "Add Soup", type: "boolean" },
        {
          name: "soup",
          title: "Soup Selection",
          type: "object",
          fields: [
            { name: "soup_small", title: "Soup 400ml", type: "number" },
            { name: "soup_large", title: "Soup 1000ml", type: "number" },
          ],
        },
        { name: "addDesserts", title: "Add Desserts", type: "boolean" },
        {
          name: "desserts",
          title: "Desserts Selection",
          type: "object",
          fields: [
            { name: "desserts", title: "Desserts", type: "number" },
            { name: "cookies", title: "Cookies", type: "number" },
          ],
        },
        {
          name: "customSelection",
          title: "Custom Selection",
          type: "array",
          of: [
            {
              type: "object",
              fields: [
                {
                  name: "sandwichId",
                  type: "reference",
                  to: [{ type: "product" }],
                },
                {
                  name: "selections",
                  type: "array",
                  of: [
                    {
                      type: "object",
                      fields: [
                        { name: "breadType", type: "string" },
                        { name: "sauce", type: "string" },
                        { name: "quantity", type: "number" },
                        { name: "subTotal", type: "number" },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    }),


  ],


});

export default invoice;
