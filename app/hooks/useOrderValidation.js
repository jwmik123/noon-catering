"use client";

export const useOrderValidation = (formData, deliveryError) => {
  const isStepValid = (step) => {
    switch (step) {
      case 1:
        return formData.numberOfPeople >= 15; // Minimum 15 people requirement
      case 2:
        if (formData.selectionType === "custom") {
          const totalSelected = Object.values(formData.customSelection)
            .flat()
            .reduce((total, selection) => total + selection.quantity, 0);
          return totalSelected >= formData.numberOfPeople;
        }
        return (
          formData.selectionType === "variety" &&
          (formData.varietySelection.meat +
            formData.varietySelection.chicken +
            formData.varietySelection.fish +
            formData.varietySelection.veggie +
            formData.varietySelection.vegan) >=
            formData.numberOfPeople
        );
      case 3:
        return true; // Overview step is always valid
      case 4:
        // Validate delivery details
        return (
          formData.deliveryDate &&
          formData.deliveryTime &&
          formData.street &&
          formData.houseNumber &&
          formData.postalCode &&
          formData.city &&
          deliveryError !== "We do not deliver to this postal code."
        );

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
          const total =
            formData.varietySelection.meat +
            formData.varietySelection.chicken +
            formData.varietySelection.fish +
            formData.varietySelection.veggie +
            formData.varietySelection.vegan;

          if (Number(total) !== Number(formData.numberOfPeople)) {
            return `The total must be ${formData.numberOfPeople} sandwiches for ${formData.numberOfPeople} people`;
          }
        }
        return "";
      case 4:
        return "Please fill in all fields";
      default:
        return "";
    }
  };

  return {
    isStepValid,
    getValidationMessage,
  };
}; 