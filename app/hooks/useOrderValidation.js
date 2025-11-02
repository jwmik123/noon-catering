"use client";

// Helper function to calculate total from variety selection (supports both old and new formats)
const calculateVarietyTotal = (varietySelection) => {
  if (!varietySelection || Object.keys(varietySelection).length === 0) {
    return 0;
  }

  return Object.values(varietySelection).reduce((total, quantity) => {
    return total + (quantity || 0);
  }, 0);
};

export const useOrderValidation = (formData, deliveryError) => {
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

        // For delivery orders, check if address is filled (either through Google Maps or manual entry)
        const hasAddressInfo = (
          // Google Maps autocomplete provides fullAddress
          formData.fullAddress ||
          // Manual entry requires all fields
          (formData.street && formData.houseNumber && formData.postalCode && formData.city)
        );

        const hasValidDeliveryLocation = deliveryError !== "We do not deliver to this postal code.";

        return hasBasicDeliveryInfo && hasAddressInfo && hasValidDeliveryLocation;

      case 5:
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isEmailValid = emailRegex.test(formData.email);

        // Validate phone number (just check if not empty)
        const isPhoneValid = formData.phoneNumber.trim() !== "";

        // Base validation
        let isValid =
          isEmailValid && isPhoneValid && formData.name.trim() !== "";

        // Additional company validation if isCompany is checked
        if (!formData.isCompany) {
          isValid = isValid && formData.companyName.trim() !== "";
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
            return `Please select ${remaining} more sandwich${
              remaining === 1 ? "" : "es"
            } for ${formData.numberOfPeople} people`;
          }
        }
        if (formData.selectionType === "variety") {
          const total = calculateVarietyTotal(formData.varietySelection);

          if (Number(total) !== Number(formData.numberOfPeople)) {
            return `The total must be ${formData.numberOfPeople} items for ${formData.numberOfPeople} people`;
          }
        }
        return "";
      case 4:
        if (!formData.deliveryDate) {
          return formData.isPickup ? "Please select a pick up date" : "Please select a delivery date";
        }
        if (!formData.deliveryTime) {
          return formData.isPickup ? "Please select a pick up time" : "Please select a delivery time";
        }
        // Skip address validation for pickup orders
        if (!formData.isPickup) {
          if (!formData.fullAddress && (!formData.street || !formData.houseNumber || !formData.postalCode || !formData.city)) {
            return "Please provide a complete delivery address";
          }
          if (deliveryError && (
            deliveryError === "We do not deliver to this postal code." ||
            deliveryError.includes("delivery area") ||
            deliveryError.includes("within our delivery") ||
            deliveryError.includes("10km")
          )) {
            return "Please select an address within our delivery area";
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