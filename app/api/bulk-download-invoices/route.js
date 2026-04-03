import { client } from "@/sanity/lib/client";
import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import JSZip from "jszip";
import InvoicePDF from "@/app/components/InvoicePDF";
import { PRODUCT_QUERY, PRICING_QUERY } from "@/sanity/lib/queries";

export const maxDuration = 300; // 5 minutes — generating many PDFs takes time

export async function GET() {
  try {
    // Fetch all invoices ordered by invoiceNumber / createdAt
    const invoices = await client.withConfig({ useCdn: false }).fetch(
      `*[_type == "invoice" && !(_id in path("drafts.**"))] | order(coalesce(invoiceNumber, quoteId) asc) {
        _id,
        quoteId,
        invoiceNumber,
        referenceNumber,
        amount,
        dueDate,
        companyDetails,
        orderDetails,
        createdAt
      }`
    );

    // Fetch shared data once
    const [sandwichOptions, pricing] = await Promise.all([
      client.fetch(PRODUCT_QUERY),
      client.fetch(PRICING_QUERY),
    ]);

    const zip = new JSZip();

    for (const invoice of invoices) {
      const orderDetails = invoice.orderDetails || {};

      // Convert customSelection array → object (Sanity stores as array)
      if (Array.isArray(orderDetails.customSelection)) {
        const converted = {};
        orderDetails.customSelection.forEach((item) => {
          if (item.sandwichId?._ref) {
            converted[item.sandwichId._ref] = Array.isArray(item.selections) ? item.selections : [];
          }
        });
        orderDetails.customSelection = converted;
      }

      const isPickup = orderDetails.isPickup === true;
      const useInvoiceAddress = isPickup || orderDetails.sameAsDelivery === false;
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
      };

      const pdfBuffer = await renderToBuffer(
        <InvoicePDF
          quoteId={invoice.quoteId}
          invoiceNumber={invoice.invoiceNumber}
          invoiceDate={invoice.createdAt}
          orderDetails={orderDetails}
          deliveryDetails={{
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
          }}
          invoiceDetails={invoiceDetails}
          companyDetails={companyDetails}
          amount={invoice.amount}
          dueDate={invoice.dueDate}
          sandwichOptions={sandwichOptions}
          referenceNumber={invoice.referenceNumber || null}
          fullName={orderDetails.name}
          pricing={pricing}
        />
      );

      const filename = `factuur-${invoice.invoiceNumber || invoice.quoteId}.pdf`;
      zip.file(filename, pdfBuffer);
    }

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });

    const date = new Date().toISOString().split("T")[0];
    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="facturen-${date}.zip"`,
        "Content-Length": String(zipBuffer.length),
      },
    });
  } catch (error) {
    console.error("Bulk download failed:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
