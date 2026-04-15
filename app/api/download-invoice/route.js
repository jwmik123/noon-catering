// app/api/download-invoice/route.js
import { client } from "@/sanity/lib/client";
import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import InvoicePDF from "@/app/components/InvoicePDF";
import { PRICING_QUERY, PRODUCT_QUERY } from "@/sanity/lib/queries";

function parseDateString(dateStr) {
  if (!dateStr) return new Date();
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return new Date(
      parseInt(parts[0]),
      parseInt(parts[1]) - 1,
      parseInt(parts[2])
    );
  }
  return new Date(dateStr);
}

export async function POST(request) {
  try {
    const { invoiceId } = await request.json();

    if (!invoiceId) {
      return NextResponse.json(
        { success: false, error: "Missing invoiceId" },
        { status: 400 }
      );
    }

    const invoice = await client.withConfig({ useCdn: false }).fetch(
      `*[_type == "invoice" && _id == $invoiceId][0]`,
      { invoiceId }
    );

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: "Invoice not found" },
        { status: 404 }
      );
    }

    const orderDetails = invoice.orderDetails || {};

    // Convert customSelection from Sanity array format to object format
    if (Array.isArray(orderDetails.customSelection)) {
      const convertedSelection = {};
      orderDetails.customSelection.forEach((item) => {
        if (item.sandwichId && item.sandwichId._ref) {
          convertedSelection[item.sandwichId._ref] = Array.isArray(
            item.selections
          )
            ? item.selections
            : [];
        }
      });
      orderDetails.customSelection = convertedSelection;
    }

    const isPickup = orderDetails.isPickup === true;
    const useInvoiceAddress = isPickup || orderDetails.sameAsDelivery === false;
    const companyBillingAddress = invoice.companyDetails?.address;
    const hasSanityBillingAddress = companyBillingAddress?.street;

    const invoiceDetails = {
      sameAsDelivery: !useInvoiceAddress,
      address: hasSanityBillingAddress
        ? {
            street: companyBillingAddress.street,
            houseNumber: companyBillingAddress.houseNumber || "",
            houseNumberAddition:
              companyBillingAddress.houseNumberAddition || "",
            postalCode: companyBillingAddress.postalCode || "",
            city: companyBillingAddress.city || "",
          }
        : useInvoiceAddress
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

    const companyDetails = {
      ...(invoice.companyDetails || {}),
      name:
        invoice.companyDetails?.name ||
        orderDetails.companyName ||
        orderDetails.name,
      btwNumber:
        invoice.companyDetails?.btwNumber ||
        orderDetails.btwNumber ||
        orderDetails.companyVAT,
    };

    const order = {
      quoteId: invoice.quoteId || invoice.referenceNumber,
      invoiceNumber: invoice.invoiceNumber || null,
      fullName: orderDetails.name,
      orderDetails,
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
      invoiceDetails,
      companyDetails,
      amount: invoice.amount,
      dueDate: invoice.dueDate,
    };

    let sandwichOptions = [];
    try {
      sandwichOptions = await client.fetch(PRODUCT_QUERY);
    } catch (_) {
      // continue with empty array
    }

    let pricing = null;
    try {
      pricing = await client.fetch(PRICING_QUERY);
    } catch (_) {
      // continue without pricing
    }

    const dueDate =
      order.dueDate ||
      (() => {
        if (order.deliveryDetails?.deliveryDate) {
          const deliveryDate = parseDateString(
            order.deliveryDetails.deliveryDate
          );
          const due = new Date(deliveryDate);
          due.setDate(deliveryDate.getDate() + 14);
          return due;
        }
        return new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      })();

    const pdfBuffer = await renderToBuffer(
      <InvoicePDF
        quoteId={order.quoteId}
        invoiceNumber={order.invoiceNumber}
        orderDetails={order.orderDetails}
        deliveryDetails={order.deliveryDetails}
        invoiceDetails={order.invoiceDetails}
        companyDetails={order.companyDetails}
        amount={order.amount}
        dueDate={dueDate}
        sandwichOptions={sandwichOptions}
        referenceNumber={order.companyDetails?.referenceNumber || null}
        fullName={order.fullName}
        pricing={pricing}
      />
    );

    const filename = `invoice-${order.invoiceNumber || order.quoteId}.pdf`;

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Download invoice failed:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Unknown error" },
      { status: 500 }
    );
  }
}
