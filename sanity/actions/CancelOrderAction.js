// sanity/actions/CancelOrderAction.js
import { TrashIcon } from "@sanity/icons";

export function CancelOrderAction(props) {
  const { type, published } = props;

  if (type !== "invoice") return null;
  if (!published) return null;
  if (published.status === "cancelled") return null;

  return {
    label: "Cancel Order",
    icon: TrashIcon,
    tone: "critical",
    onHandle: async () => {
      const invoiceId = published._id;
      const quoteId = published.quoteId || "Unknown";
      const email = published.orderDetails?.email;

      const confirmed = window.confirm(
        `Cancel order ${quoteId}?\n\nThis will:\n- Mark the invoice as cancelled\n- Send a cancellation email to ${email || "the customer"}\n- Send a credit note to verkoop\n\nThis cannot be undone.`
      );

      if (!confirmed) {
        props.onComplete();
        return;
      }

      try {
        const response = await fetch("/api/cancel-invoice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ invoiceId }),
        });

        const result = await response.json();

        props.onComplete();

        if (result.success) {
          return {
            type: "success",
            message: result.message || "Order cancelled and emails sent",
          };
        } else {
          return {
            type: "error",
            message: result.error || "Failed to cancel order",
          };
        }
      } catch (error) {
        console.error("Error cancelling order:", error);
        props.onComplete();
        return {
          type: "error",
          message: "Failed to cancel order: " + error.message,
        };
      }
    },
  };
}
