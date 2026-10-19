// sanity/actions/DownloadInvoiceAction.js
import { DownloadIcon } from "@sanity/icons";

export function DownloadInvoiceAction(props) {
  return createDownloadAction(props, false);
}

// Only on cancelled invoices that have a credit note number
export function DownloadCreditNoteAction(props) {
  const { published } = props;
  if (published?.status !== "cancelled" || !published?.creditNoteNumber) {
    return null;
  }
  return createDownloadAction(props, true);
}

function createDownloadAction(props, creditNote) {
  const { type, published } = props;

  if (type !== "invoice") {
    return null;
  }

  if (!published) {
    return null;
  }

  return {
    label: creditNote ? "Download creditnota" : "Download Invoice",
    icon: DownloadIcon,
    onHandle: async () => {
      const invoiceId = published._id;

      try {
        const response = await fetch("/api/download-invoice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ invoiceId, creditNote }),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          props.onComplete();
          return {
            type: "error",
            message: err.error || "Failed to generate invoice PDF",
          };
        }

        const blob = await response.blob();
        const invoiceNumber =
          published.invoiceNumber || published.quoteId || invoiceId;
        const filename = creditNote
          ? `creditnota-${published.creditNoteNumber}.pdf`
          : `invoice-${invoiceNumber}.pdf`;

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);

        props.onComplete();
      } catch (error) {
        console.error("Error downloading invoice:", error);
        props.onComplete();
        return {
          type: "error",
          message: "Failed to download invoice: " + error.message,
        };
      }
    },
  };
}
