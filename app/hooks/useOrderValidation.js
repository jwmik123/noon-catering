"use client";

import { isSlotBookable } from "@/lib/delivery-slots";

// Helper function to calculate total from variety selection (supports both old and new formats)
const calculateVarietyTotal = (varietySelection) => {
  if (!varietySelection || Object.keys(varietySelection).length === 0) {
    return 0;
  }

  return Object.values(varietySelection).reduce((total, quantity) => {
    return total + (quantity || 0);
  }, 0);
};

// Total number of extras (drinks, soup, desserts) that are enabled and have a quantity
const calculateExtrasTotal = (formData) => {
  const sum = (obj) =>
    Object.values(obj || {}).reduce((total, qty) => total + (Number(qty) || 0), 0);

  return (
    (formData.addDrinks ? sum(formData.drinks) : 0) +
    (formData.addSoup ? sum(formData.soup) : 0) +
    (formData.addDesserts ? sum(formData.desserts) : 0)
  );
};

export const useOrderValidation = (formData, deliveryError, deliveryCost) => {
  const isStepValid = (step) => {
    switch (step) {
      case 1:
        return formData.numberOfPeople >= 3; // Minimum 3 people requirement
      case 2:
        if (formData.selectionType === "custom") {
          const totalSelected = Object.values(formData.customSelection)
            .flat()
            .reduce((total, selection) => total + selection.quantity, 0);
          return totalSelected >= formData.numberOfPeople;
        }
        if (formData.selectionType === "variety") {
          const varietyTotal = calculateVarietyTotal(formData.varietySelection);
          // Extras-only order (e.g. dessert buffet): no sandwiches required
          if (varietyTotal === 0 && calculateExtrasTotal(formData) > 0) {
            return true;
          }
          return varietyTotal >= formData.numberOfPeople;
        }
        return false;
      case 3:
        return true; // Overview step is always valid
      case 4:
        // Validate delivery details
        const hasBasicDeliveryInfo = formData.deliveryDate && formData.deliveryTime;

        // If pickup is selected, only require date and time
        if (formData.isPickup) {
          return hasBasicDeliveryInfo;
        }

        // For delivery orders, check if address is filled via Google Maps
        const hasAddressInfo = (
          formData.fullAddress ||
          (formData.street && formData.houseNumber && formData.postalCode && formData.city)
        );

        const hasValidDeliveryLocation = deliveryError !== "We do not deliver to this postal code.";

        // Ensure delivery cost has been calculated (not null)
        const hasDeliveryCost = deliveryCost !== null;

        return hasBasicDeliveryInfo && hasAddressInfo && hasValidDeliveryLocation && hasDeliveryCost;

      case 5:
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isEmailValid = emailRegex.test(formData.email);

        // Validate phone number (just check if not empty)
        const isPhoneValid = formData.phoneNumber.trim() !== "";

        // Base validation
        let isValid =
          isEmailValid && isPhoneValid && formData.name.trim() !== "";

        // Business order ("isCompany" means NOT a business order):
        // company name plus a checked VAT number, unless the organisation has none
        if (!formData.isCompany) {
          const hasValidVAT = ["valid", "unverified"].includes(
            formData.vatCheck?.status
          );
          // Enterprise number is optional, but must be valid when filled in
          const hasValidEnterprise =
            !formData.enterpriseNumber?.trim() ||
            formData.enterpriseCheck?.status === "valid";
          isValid =
            isValid &&
            formData.companyName.trim() !== "" &&
            (formData.noVatNumber ? hasValidEnterprise : hasValidVAT);
        }

        return isValid;
      default:
        return true;
    }
  };

  const getValidationMessage = (step) => {
    switch (step) {
      case 2:
        if (formData.selectionType === "custom") {
          const totalSelected = Object.values(formData.customSelection)
            .flat()
            .reduce((total, selection) => total + selection.quantity, 0);
          const remaining = formData.numberOfPeople - totalSelected;
          if (remaining > 0) {
            return `Selecteer nog ${remaining} item${
              remaining === 1 ? "" : "s"
            } voor ${formData.numberOfPeople} personen`;
          }
        }
        if (formData.selectionType === "variety") {
          const total = calculateVarietyTotal(formData.varietySelection);

          if (total === 0 && calculateExtrasTotal(formData) > 0) {
            return "";
          }

          if (Number(total) !== Number(formData.numberOfPeople)) {
            return `Het totaal moet ${formData.numberOfPeople} items zijn voor ${formData.numberOfPeople} personen`;
          }
        }
        return "";
      case 4:
        if (!formData.deliveryDate) {
          return formData.isPickup ? "Kies een ophaaldatum" : "Kies een bezorgdatum";
        }
        if (!formData.deliveryTime) {
          return formData.isPickup ? "Kies een ophaaltijd" : "Kies een bezorgtijd";
        }
        if (!isSlotBookable(formData.deliveryDate, formData.deliveryTime)) {
          return "Bestel minimaal 24 uur op voorhand. Kies een later tijdstip";
        }
        // Skip address validation for pickup orders
        if (!formData.isPickup) {
          if (!formData.fullAddress && (!formData.street || !formData.houseNumber || !formData.postalCode || !formData.city)) {
            return "Vul een volledig bezorgadres in";
          }
          if (deliveryError && (
            deliveryError === "We do not deliver to this postal code." ||
            deliveryError.includes("delivery area") ||
            deliveryError.includes("within our delivery") ||
            deliveryError.includes("10km")
          )) {
            return "Kies een adres binnen ons bezorggebied";
          }
        }
        return "";
      case 5:
        if (!formData.isCompany && formData.noVatNumber && formData.enterpriseNumber?.trim()) {
          if (formData.enterpriseCheck?.status === "invalid") {
            return "Het ondernemingsnummer is ongeldig";
          }
          if (!formData.enterpriseCheck) {
            return "Ondernemingsnummer wordt gecontroleerd...";
          }
        }
        if (!formData.isCompany && !formData.noVatNumber) {
          if (!formData.btwNumber?.trim()) {
            return "Vul een btw-nummer in, of vink aan dat jullie organisatie er geen heeft";
          }
          if (formData.vatCheck?.status === "invalid") {
            return "Het btw-nummer is ongeldig";
          }
          if (!formData.vatCheck) {
            return "BTW-nummer wordt gecontroleerd...";
          }
        }
        return "";
      default:
        return "";
    }
  };

  return {
    isStepValid,
    getValidationMessage,
  };
}; 