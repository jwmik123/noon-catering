"use client";
import { useState, useEffect } from "react";

export const useOrderForm = (pricing = null) => {
  const [formData, setFormData] = useState({
    // Stap 1
    numberOfPeople: 15,
    totalSandwiches: 15,
    // Stap 3
    selectionType: "",
    allergies: "",
    varietySelection: {
      meat: 0,
      chicken: 0,
      fish: 0,
      veggie: 0,
      vegan: 0,
    },
    // Stap 5
    deliveryDate: "",
    deliveryTime: "",
    street: "",
    houseNumber: "",
    houseNumberAddition: "",
    postalCode: "",
    city: "",
    // Google Maps specific fields
    fullAddress: "",
    coordinates: null,
    usingGoogleMaps: false,
    // Invoice address
    sameAsDelivery: true,
    invoiceStreet: "",
    invoiceHouseNumber: "",
    invoiceHouseNumberAddition: "",
    invoicePostalCode: "",
    invoiceCity: "",
    // Stap 6
    name: "",
    email: "",
    phoneNumber: "",
    isCompany: false,
    companyName: "",
    companyVAT: "",
    btwNumber: "",
    referenceNumber: "",
    // Stap 7
    paymentMethod: "",
    customSelection: {},
  });

  const [deliveryCost, setDeliveryCost] = useState(null);
  const [deliveryError, setDeliveryError] = useState(null);

  // Old calculateDeliveryCost function removed - now using Google Maps validation

  // Helper function to get price for a variety selection item
  const getVarietyPrice = (key) => {
    if (!pricing) {
      console.error('No pricing data available in useOrderForm for key:', key);
      return 0; // Return 0 to make missing pricing obvious
    }

    const parts = key.split('-');

    // Handle old format (single word like "meat", "veggie", "vegan")
    if (parts.length === 1) {
      console.warn('Old variety selection format detected:', key, '- assuming sandwiches category');
      // Assume it's a sandwich subcategory for backward compatibility
      const sandwichCategory = pricing.categoryPricing?.find(cat => cat.typeCategory === 'sandwiches');
      const subCatData = sandwichCategory?.subCategoryPricing?.find(sc => sc.subCategory === key);
      if (!subCatData?.price) {
        console.error(`No price found for old format key "${key}" in sandwiches category`);
        return 0;
      }
      return subCatData.price;
    }

    if (parts[0] === 'lunchboxes' && parts.length === 3) {
      // Lunchbox: price by box type
      const boxType = parts[1];
      const lunchboxCategory = pricing.categoryPricing?.find(cat => cat.typeCategory === 'lunchboxes');
      const boxTypeData = lunchboxCategory?.boxTypes?.find(bt => bt.boxType === boxType);
      if (!boxTypeData?.price) {
        console.error(`No price found for lunchbox ${boxType} in useOrderForm`);
        return 0;
      }
      return boxTypeData.price;
    } else if (parts.length === 2) {
      // Sandwiches/Salads: price by subcategory
      const [typeCategory, subCategory] = parts;
      const categoryData = pricing.categoryPricing?.find(cat => cat.typeCategory === typeCategory);
      const subCatData = categoryData?.subCategoryPricing?.find(sc => sc.subCategory === subCategory);
      if (!subCatData?.price) {
        console.error(`No price found for ${typeCategory}-${subCategory} in useOrderForm`);
        return 0;
      }
      return subCatData.price;
    }

    console.error('Invalid key format in useOrderForm:', key);
    return 0; // Return 0 instead of hardcoded price
  };

  const calculateTotal = (formData) => {
    let subtotal = 0;

    if (formData.selectionType === "custom") {
      subtotal = Object.values(formData.customSelection)
        .flat()
        .reduce((total, selection) => total + selection.subTotal, 0);
    } else if (formData.selectionType === "variety") {
      // Calculate variety selection total using dynamic pricing
      if (formData.varietySelection) {
        subtotal = Object.entries(formData.varietySelection)
          .reduce((sum, [key, quantity]) => {
            const price = getVarietyPrice(key);
            return sum + (price * quantity);
          }, 0);
      }
    }

    // Add drinks pricing if drinks are selected
    if (formData.addDrinks && formData.drinks) {
      const drinksTotal =
        (formData.drinks.freshOrangeJuice || 0) * (pricing?.drinks?.freshOrangeJuice || 3.35) +
        (formData.drinks.sodas || 0) * (pricing?.drinks?.sodas || 2.35);
      subtotal += drinksTotal;
    }

    // Add desserts pricing if desserts are selected
    if (formData.addDesserts && formData.desserts) {
      const dessertsTotal =
        (formData.desserts.desserts || 0) * (pricing?.desserts?.desserts || 3.50) +
        (formData.desserts.cookies || 0) * (pricing?.desserts?.cookies || 2.50);
      subtotal += dessertsTotal;
    }

    return subtotal; // excluding VAT
  };

  const totalAmount = calculateTotal(formData);

  // Old postal code effect removed - delivery cost now handled by Google Maps validation

  const updateFormData = (field, value) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      // Log company details when they change
      if (
        field === "isCompany" ||
        field === "companyName" ||
        field === "companyVAT" ||
        field === "btwNumber"
      ) {
        console.log("========= COMPANY DETAILS UPDATED =========");
        console.log("Company Details:", {
          isCompany: newData.isCompany,
          companyName: newData.companyName,
          companyVAT: newData.companyVAT,
          btwNumber: newData.btwNumber,
        });
      }

      // Old postal code validation removed - now using Google Maps validation
      return newData;
    });
  };

  // Restore quote functionality
  const restoreQuote = () => {
    // Check if we should restore a quote
    const searchParams = new URLSearchParams(window.location.search);
    const shouldRestore = searchParams.get("restore");

    if (shouldRestore) {
      const storedQuote = localStorage.getItem("restoreQuote");
      if (storedQuote) {
        try {
          const quote = JSON.parse(storedQuote);

          // Restore form data
          setFormData({
            // Step 1
            numberOfPeople: quote.orderDetails.numberOfPeople || quote.orderDetails.totalSandwiches || 15,
            totalSandwiches: quote.orderDetails.numberOfPeople || quote.orderDetails.totalSandwiches || 15,
            // Step 3
            selectionType: quote.orderDetails.selectionType,
            customSelection:
              quote.orderDetails.selectionType === "custom"
                ? quote.orderDetails.customSelection.reduce((acc, item) => {
                    acc[item.sandwichId._id] = item.selections;
                    return acc;
                  }, {})
                : {},
            varietySelection: quote.orderDetails.varietySelection || {
              vega: 0,
              nonVega: 0,
              vegan: 0,
            },
            allergies: quote.orderDetails.allergies || "",
            // Step 5
            deliveryDate: quote.deliveryDetails.deliveryDate,
            deliveryTime: quote.deliveryDetails.deliveryTime,
            street: quote.deliveryDetails.address.street,
            houseNumber: quote.deliveryDetails.address.houseNumber,
            houseNumberAddition:
              quote.deliveryDetails.address.houseNumberAddition,
            postalCode: quote.deliveryDetails.address.postalCode,
            city: quote.deliveryDetails.address.city,
            // Step 6
            isCompany: !!quote.companyDetails,
            companyName: quote.companyDetails?.companyName || "",
            companyVAT: quote.companyDetails?.companyVAT || "",
            btwNumber: quote.companyDetails?.btwNumber || "",
            referenceNumber: quote.companyDetails?.referenceNumber || "",
          });

          // Clear the stored quote
          localStorage.removeItem("restoreQuote");

          return true; // Indicate that a quote was restored
        } catch (error) {
          console.error("Error restoring quote:", error);
        }
      }
    }
    return false;
  };

  return {
    formData,
    setFormData,
    updateFormData,
    deliveryCost,
    setDeliveryCost,
    deliveryError,
    setDeliveryError,
    totalAmount,
    calculateTotal,
    restoreQuote,
  };
}; 