/**
 * Decide how an invoice ("betalen op factuur") reaches the customer.
 *
 * - "peppol": Belgian VAT-registered company (mandatory since 2026) or any
 *   company that is reachable on Peppol
 * - "email":  organisation without VAT number (and not on Peppol with its
 *   enterprise number), or a foreign company that is not on Peppol — PDF
 *   invoice by e-mail
 * - null:     Belgian company with a VAT number that is not on Peppol —
 *   paying on invoice is not possible, only online payment
 */
export function getInvoiceChannel(formData) {
  // No VAT number: via Peppol when the enterprise number is registered there
  if (formData.noVatNumber) {
    return formData.enterpriseCheck?.peppol === true ? "peppol" : "email";
  }

  const vatCheck = formData.vatCheck;
  if (!vatCheck || vatCheck.status === "invalid") return null;

  if (vatCheck.peppol === true) return "peppol";
  if (vatCheck.country && vatCheck.country !== "BE") return "email";
  if (vatCheck.peppol === false) return null;

  // Peppol lookup failed: fall back to Peppol, Billit reports errors
  return "peppol";
}
