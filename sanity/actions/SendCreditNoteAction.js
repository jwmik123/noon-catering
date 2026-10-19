// sanity/actions/SendCreditNoteAction.js
import { EnvelopeIcon } from "@sanity/icons";
import { useToast } from "@sanity/ui";
import { useClient } from "sanity";
import { callStudioApi } from "./studioRequest";

const ACCOUNTANT_LABEL = "de boekhouder";

// recipients: "both" | "customer" | "accountant" (see /api/send-credit-note)
function createSendCreditNoteAction(recipients, label) {
  function SendCreditNoteAction(props) {
    const { type, published, onComplete } = props;
    const toast = useToast();
    const client = useClient({ apiVersion: "2025-02-13" });

    // Only cancelled invoices have a credit note
    if (type !== "invoice" || !published || published.status !== "cancelled") {
      return null;
    }

    const email = published.orderDetails?.email;
    const creditNoteNumber = published.creditNoteNumber;
    const needsCustomerEmail = recipients !== "accountant";

    const target = {
      both: `${email} en ${ACCOUNTANT_LABEL}`,
      customer: email,
      accountant: ACCOUNTANT_LABEL,
    }[recipients];

    const disabledReason = !creditNoteNumber
      ? "Geen creditnotanummer bij deze factuur"
      : needsCustomerEmail && !email
        ? "Geen e-mailadres bij deze factuur"
        : undefined;

    return {
      label,
      icon: EnvelopeIcon,
      disabled: Boolean(disabledReason),
      title: disabledReason,
      onHandle: async () => {
        if (!window.confirm(`Creditnota ${creditNoteNumber} versturen naar ${target}?`)) {
          onComplete();
          return;
        }

        try {
          const result = await callStudioApi(client, {
            documentId: published._id,
            action: "sendCreditNote",
            url: "/api/send-credit-note",
            params: { recipients },
          });

          toast.push(
            result.success
              ? { status: "success", title: result.message }
              : { status: "error", title: "Versturen mislukt", description: result.error }
          );
        } catch (error) {
          console.error("Error sending credit note:", error);
          toast.push({ status: "error", title: "Versturen mislukt", description: error.message });
        } finally {
          onComplete();
        }
      },
    };
  }

  SendCreditNoteAction.action = `sendCreditNote-${recipients}`;
  return SendCreditNoteAction;
}

export const SendCreditNoteToBothAction = createSendCreditNoteAction(
  "both",
  "Verstuur creditnota naar klant en boekhouder"
);
export const SendCreditNoteToCustomerAction = createSendCreditNoteAction(
  "customer",
  "Verstuur creditnota naar klant"
);
export const SendCreditNoteToAccountantAction = createSendCreditNoteAction(
  "accountant",
  "Verstuur creditnota naar boekhouder"
);
