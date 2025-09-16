"use client";
import { useState, useEffect } from "react";

export const useOrderForm = () => {
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
    referenceNumber: "",
    // Stap 7
    paymentMethod: "",
    customSelection: {},
  });

  const [deliveryCost, setDeliveryCost] = useState(null);
  const [deliveryError, setDeliveryError] = useState(null);

  // Old calculateDeliveryCost function removed - now using Google Maps validation

  const calculateTotal = (formData) => {
    let subtotal = 0;
    
    if (formData.selectionType === "custom") {
      subtotal = Object.values(formData.customSelection)
        .flat()
        .reduce((total, selection) => total + selection.subTotal, 0);
    } else {
      // For variety selection
      subtotal = formData.numberOfPeople * 6.83; // €6.83 per person (1 sandwich each)
    }
    
    // Add drinks pricing if drinks are selected
    if (formData.addDrinks && formData.drinks) {
      const drinksTotal = 
        (formData.drinks.verseJus || 0) * 3.62 +  // Fresh juice €3.62
        (formData.drinks.sodas || 0) * 2.71 +     // Sodas €2.71
        (formData.drinks.smoothies || 0) * 3.62;  // Smoothies €3.62
      subtotal += drinksTotal;
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
        field === "companyVAT"
      ) {
        console.log("========= COMPANY DETAILS UPDATED =========");
        console.log("Company Details:", {
          isCompany: newData.isCompany,
          companyName: newData.companyName,
          companyVAT: newData.companyVAT,
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