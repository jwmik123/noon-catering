// sanity/actions/SendPeppolAction.js
import { PublishIcon } from "@sanity/icons";
import { useToast } from "@sanity/ui";
import { useClient } from "sanity";
import { callStudioApi } from "./studioRequest";

// Send an existing invoice via Peppol (Billit), keeping its invoice number
export function SendPeppolAction(props) {
  const { type, published, draft, onComplete } = props;
  const toast = useToast();
  const client = useClient({ apiVersion: "2025-02-13" });

  if (type !== "invoice" || !published) {
    return null;
  }

  const company = published.companyDetails || {};
  const identifier = company.btwNumber || company.enterpriseNumber;
  const invoiceNumber = published.invoiceNumber || "onbekend";

  const disabledReason = published.billitSentAt
    ? "Al verstuurd via Peppol"
    : draft
      ? "Publiceer eerst je wijzigingen"
      : !identifier
        ? "Vul eerst een btw- of ondernemingsnummer in"
        : null;

  return {
    label: "Verstuur via Peppol (Billit)",
    icon: PublishIcon,
    disabled: Boolean(disabledReason),
    title: disabledReason || undefined,
    onHandle: async () => {
      const confirmed = window.confirm(
        `Factuur ${invoiceNumber} via Peppol versturen naar ${company.name || "klant"} (${identifier})?`
      );
      if (!confirmed) {
        onComplete();
        return;
      }

      try {
        const result = await callStudioApi(client, {
          documentId: published._id,
          action: "sendPeppol",
          url: "/api/send-invoice-peppol",
        });

        toast.push(
          result.success
            ? { status: "success", title: result.message }
            : { status: "error", title: "Versturen via Peppol mislukt", description: result.error, duration: 10000 }
        );
      } catch (error) {
        console.error("Error sending invoice via Peppol:", error);
        toast.push({ status: "error", title: "Versturen via Peppol mislukt", description: error.message });
      } finally {
        onComplete();
      }
    },
  };
}

SendPeppolAction.action = "sendInvoicePeppol";
