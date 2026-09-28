"use client";

import React, { useEffect } from "react";
import { AlertTriangle, Building2, CheckCircle2, Loader2, Plus, X, XCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "react-toastify";

const ContactStep = ({
  formData,
  updateFormData,
  sandwichOptions,
  deliveryCost,
  totalAmount,
}) => {
  const isBusinessOrder = !formData.isCompany;
  const btwNumber = formData.btwNumber || "";
  const vatCheck = formData.vatCheck;

  // Check VAT number (VIES + Peppol) shortly after the user stops typing
  useEffect(() => {
    if (!isBusinessOrder || formData.noVatNumber || vatCheck) return;
    if (btwNumber.replace(/[^0-9]/g, "").length < 9) return;

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const response = await fetch("/api/validate-vat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vatNumber: btwNumber }),
          signal: controller.signal,
        });
        const result = await response.json();
        updateFormData("vatCheck", result);
      } catch (error) {
        if (error.name !== "AbortError") {
          updateFormData("vatCheck", { status: "unverified", peppol: null });
        }
      }
    }, 700);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [btwNumber, vatCheck, formData.noVatNumber, isBusinessOrder]);

  const isCheckingVAT =
    !formData.noVatNumber &&
    !vatCheck &&
    btwNumber.replace(/[^0-9]/g, "").length >= 9;

  const handleDownloadInvoice = async () => {
    try {
      // Calculate total amount including delivery costs
      // Use the totalAmount prop which already includes dynamic pricing
      const finalAmount = totalAmount + (deliveryCost || 0);

      // Determine which address to use for billing
      // For pickup orders: always use invoice address (no delivery address exists)
      // For delivery orders: use invoice address when sameAsDelivery is false
      const isPickup = formData.isPickup === true;
      const useInvoiceAddress = isPickup || formData.sameAsDelivery === false;

      const billingAddress = useInvoiceAddress
        ? {
            street: formData.invoiceStreet || "",
            houseNumber: formData.invoiceHouseNumber || "",
            houseNumberAddition: formData.invoiceHouseNumberAddition || "",
            postalCode: formData.invoicePostalCode || "",
            city: formData.invoiceCity || "",
          }
        : {
            street: formData.street || "",
            houseNumber: formData.houseNumber || "",
            houseNumberAddition: formData.houseNumberAddition || "",
            postalCode: formData.postalCode || "",
            city: formData.city || "",
          };

      // Call the API to generate PDF
      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quoteId: `PREVIEW-${Date.now()}`,
          orderDetails: {
            totalSandwiches: formData.totalSandwiches,
            selectionType: formData.selectionType,
            customSelection: formData.customSelection,
            varietySelection: formData.varietySelection,
            addDrinks: formData.addDrinks || false,
            drinks: formData.drinks || null,
            addSoup: formData.addSoup || false,
            soup: formData.soup || null,
            addDesserts: formData.addDesserts || false,
            desserts: formData.desserts || null,
            allergies: formData.allergies,
            deliveryCost: deliveryCost || 0,
            isPickup: isPickup,
          },
          deliveryDetails: {
            deliveryDate: formData.deliveryDate,
            deliveryTime: formData.deliveryTime,
            address: {
              street: formData.street || "",
              houseNumber: formData.houseNumber || "",
              houseNumberAddition: formData.houseNumberAddition || "",
              postalCode: formData.postalCode || "",
              city: formData.city || "",
            },
            phoneNumber: formData.phoneNumber,
          },
          invoiceDetails: {
            sameAsDelivery: !useInvoiceAddress,
            address: billingAddress,
          },
          companyDetails: {
            isCompany: formData.isCompany,
            name: formData.companyName,
            vatNumber: formData.companyVAT,
            btwNumber: formData.btwNumber,
            referenceNumber: formData.referenceNumber,
            address: billingAddress,
          },
          amount: finalAmount,
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          sandwichOptions: sandwichOptions,
          fullName: formData.name,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to generate PDF");
      }

      // Convert base64 to blob and create download link
      const binaryString = window.atob(data.pdf);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-preview-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 items-center text-lg font-medium text-gray-700">
        <Building2 className="w-5 h-5" />
        <h2 className="text-gray-700">Contact- en bedrijfsgegevens</h2>
      </div>

      <div className="space-y-4">
        {/* Contact Details */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-700 text-md">Contactgegevens</h3>

          <div className="space-y-2">
            <Label htmlFor="name">Volledige naam*</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => updateFormData("name", e.target.value)}
              placeholder="Je volledige naam"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mailadres*</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => updateFormData("email", e.target.value)}
              placeholder="jouw@email.com"
              required
            />
            {(formData.additionalEmails || []).map((email, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    const updated = [...(formData.additionalEmails || [])];
                    updated[idx] = e.target.value;
                    updateFormData("additionalEmails", updated);
                  }}
                  placeholder="extra@email.com"
                />
                <button
                  type="button"
                  onClick={() => {
                    const updated = (formData.additionalEmails || []).filter((_, i) => i !== idx);
                    updateFormData("additionalEmails", updated);
                  }}
                  className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors"
                  aria-label="Verwijder e-mailadres"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => updateFormData("additionalEmails", [...(formData.additionalEmails || []), ""])}
              className="flex items-center gap-1 text-sm text-primary hover:underline mt-1"
            >
              <Plus className="w-3 h-3" /> E-mailadres toevoegen
            </button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">
              Telefoonnummer* (Contactpersoon op locatie tijdens bezorging)
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => updateFormData("phoneNumber", e.target.value)}
              placeholder="04 12345678"
              required
            />
            {(formData.additionalPhoneNumbers || []).map((phone, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    const updated = [...(formData.additionalPhoneNumbers || [])];
                    updated[idx] = e.target.value;
                    updateFormData("additionalPhoneNumbers", updated);
                  }}
                  placeholder="04 12345678"
                />
                <button
                  type="button"
                  onClick={() => {
                    const updated = (formData.additionalPhoneNumbers || []).filter((_, i) => i !== idx);
                    updateFormData("additionalPhoneNumbers", updated);
                  }}
                  className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors"
                  aria-label="Verwijder telefoonnummer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => updateFormData("additionalPhoneNumbers", [...(formData.additionalPhoneNumbers || []), ""])}
              className="flex items-center gap-1 text-sm text-primary hover:underline mt-1"
            >
              <Plus className="w-3 h-3" /> Telefoonnummer toevoegen
            </button>
          </div>
        </div>

        {/* Company Details Section */}
        <div className="pt-6 border-t">
          <div className="flex gap-2 items-center">
            <Checkbox
              id="isCompany"
              checked={formData.isCompany}
              onCheckedChange={(checked) =>
                updateFormData("isCompany", checked)
              }
            />
            <Label
              htmlFor="isCompany"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Dit is GEEN zakelijke bestelling
            </Label>
          </div>

          {!formData.isCompany && (
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Bedrijfsnaam*</Label>
                <Input
                  id="companyName"
                  type="text"
                  value={formData.companyName}
                  onChange={(e) =>
                    updateFormData("companyName", e.target.value)
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="btwNumber">
                  BTW-nummer{formData.noVatNumber ? "" : "*"}
                </Label>
                <Input
                  id="btwNumber"
                  type="text"
                  value={btwNumber}
                  onChange={(e) =>
                    updateFormData("btwNumber", e.target.value)
                  }
                  placeholder="BE0123456789"
                  disabled={formData.noVatNumber}
                  required={!formData.noVatNumber}
                />

                {!formData.noVatNumber && (
                  <VATCheckStatus checking={isCheckingVAT} vatCheck={vatCheck} />
                )}

                <div className="flex gap-2 items-center pt-1">
                  <Checkbox
                    id="noVatNumber"
                    checked={formData.noVatNumber || false}
                    onCheckedChange={(checked) =>
                      updateFormData("noVatNumber", checked === true)
                    }
                  />
                  <Label
                    htmlFor="noVatNumber"
                    className="text-sm font-normal text-gray-600"
                  >
                    Onze organisatie heeft geen btw-nummer (bv. vzw of
                    overheidsinstelling)
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="referenceNumber">
                  Referentienummer (optioneel)
                </Label>
                <Input
                  id="referenceNumber"
                  type="text"
                  value={formData.referenceNumber}
                  onChange={(e) =>
                    updateFormData("referenceNumber", e.target.value)
                  }
                  placeholder="Je interne referentienummer"
                />
              </div>

              {/* Download Invoice Button */}
              <div className="pt-4">
                <button
                  onClick={handleDownloadInvoice}
                  className="px-4 py-2 w-full text-sm font-medium text-white rounded-md transition-colors bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Factuurvoorbeeld downloaden
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const VATCheckStatus = ({ checking, vatCheck }) => {
  if (checking) {
    return (
      <p className="flex gap-2 items-center text-sm text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        BTW-nummer controleren...
      </p>
    );
  }

  if (!vatCheck) return null;

  if (vatCheck.status === "invalid") {
    return (
      <p className="flex gap-2 items-start text-sm text-red-600">
        <XCircle className="flex-shrink-0 mt-0.5 w-4 h-4" />
        Dit btw-nummer is ongeldig. Controleer het nummer, of vink hieronder
        aan dat jullie organisatie geen btw-nummer heeft.
      </p>
    );
  }

  const isBelgian = vatCheck.country === "BE";

  if (isBelgian && vatCheck.peppol === false) {
    return (
      <p className="flex gap-2 items-start text-sm text-amber-700">
        <AlertTriangle className="flex-shrink-0 mt-0.5 w-4 h-4" />
        <span>
          Geldig btw-nummer{vatCheck.name ? ` (${vatCheck.name})` : ""}, maar
          jullie organisatie is niet bereikbaar via Peppol. In België moeten
          facturen tussen bedrijven via Peppol verstuurd worden, dus betalen
          op factuur is niet mogelijk. Je kunt wel online betalen, of je
          gratis registreren via Hermes (FOD Financiën).
        </span>
      </p>
    );
  }

  if (vatCheck.status === "unverified") {
    return (
      <p className="flex gap-2 items-start text-sm text-gray-500">
        <AlertTriangle className="flex-shrink-0 mt-0.5 w-4 h-4" />
        We konden dit nummer nu niet controleren bij de EU (VIES). Controleer
        het zelf nog even goed.
      </p>
    );
  }

  return (
    <p className="flex gap-2 items-start text-sm text-green-700">
      <CheckCircle2 className="flex-shrink-0 mt-0.5 w-4 h-4" />
      Geldig btw-nummer{vatCheck.name ? ` – ${vatCheck.name}` : ""}
      {vatCheck.peppol ? ". Bereikbaar via Peppol." : ""}
    </p>
  );
};

export default ContactStep; 