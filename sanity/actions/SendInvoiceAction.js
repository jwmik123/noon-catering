// sanity/actions/SendInvoiceAction.js
import { EnvelopeIcon } from "@sanity/icons";

export function SendInvoiceAction(props) {
  const { type, published } = props;

  // Only show this action for invoice documents
  if (type !== "invoice") {
    return null;
  }

  // Only show if there's a published document — admin must publish edits before sending
  if (!published) {
    return null;
  }

  return {
    label: "Send Invoice",
    icon: EnvelopeIcon,
    onHandle: async () => {
      const invoiceId = published._id;
      const email = published.orderDetails?.email;
      const quoteId = published.quoteId || "Unknown";

      if (!email) {
        props.onComplete();
        return {
          type: "error",
          message: "No email address found for this invoice",
        };
      }

      const confirmed = window.confirm(
        `Send invoice ${quoteId} to ${email}?`
      );

      if (!confirmed) {
        props.onComplete();
        return;
      }

      try {
        const response = await fetch("/api/send-invoice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ invoiceId }),
        });

        const result = await response.json();

        props.onComplete();

        if (result.success) {
          return {
            type: "success",
            message: result.message || "Invoice sent successfully",
          };
        } else {
          return {
            type: "error",
            message: result.error || "Failed to send invoice",
          };
        }
      } catch (error) {
        console.error("Error sending invoice:", error);
        props.onComplete();
        return {
          type: "error",
          message: "Failed to send invoice: " + error.message,
        };
      }
    },
  };
}
