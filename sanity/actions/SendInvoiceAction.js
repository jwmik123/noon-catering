// sanity/actions/SendInvoiceAction.js
import { EnvelopeIcon } from "@sanity/icons";
import { useToast } from "@sanity/ui";
import { useClient } from "sanity";
import { callStudioApi } from "./studioRequest";

const ACCOUNTANT_LABEL = "de boekhouder";

// recipients: "both" | "customer" | "accountant" (see /api/send-invoice)
function createSendInvoiceAction(recipients, label) {
  function SendInvoiceAction(props) {
    const { type, published, onComplete } = props;
    const toast = useToast();
    const client = useClient({ apiVersion: "2025-02-13" });

    // Only for published invoices — admin must publish edits before sending
    if (type !== "invoice" || !published) {
      return null;
    }

    const email = published.orderDetails?.email;
    const invoiceNumber = published.invoiceNumber || published.quoteId || "onbekend";
    const needsCustomerEmail = recipients !== "accountant";

    const target = {
      both: `${email} en ${ACCOUNTANT_LABEL}`,
      customer: email,
      accountant: ACCOUNTANT_LABEL,
    }[recipients];

    return {
      label,
      icon: EnvelopeIcon,
      disabled: needsCustomerEmail && !email,
      title: needsCustomerEmail && !email ? "Geen e-mailadres bij deze factuur" : undefined,
      onHandle: async () => {
        if (!window.confirm(`Factuur ${invoiceNumber} versturen naar ${target}?`)) {
          onComplete();
          return;
        }

        try {
          const result = await callStudioApi(client, {
            documentId: published._id,
            action: "sendInvoice",
            url: "/api/send-invoice",
            params: { recipients },
          });

          toast.push(
            result.success
              ? { status: "success", title: result.message }
              : { status: "error", title: "Versturen mislukt", description: result.error }
          );
        } catch (error) {
          console.error("Error sending invoice:", error);
          toast.push({ status: "error", title: "Versturen mislukt", description: error.message });
        } finally {
          onComplete();
        }
      },
    };
  }

  SendInvoiceAction.action = `sendInvoice-${recipients}`;
  return SendInvoiceAction;
}

export const SendInvoiceToBothAction = createSendInvoiceAction(
  "both",
  "Verstuur naar klant en boekhouder"
);
export const SendInvoiceToCustomerAction = createSendInvoiceAction(
  "customer",
  "Verstuur naar klant"
);
export const SendInvoiceToAccountantAction = createSendInvoiceAction(
  "accountant",
  "Verstuur naar boekhouder"
);
