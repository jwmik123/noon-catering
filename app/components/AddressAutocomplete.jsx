// app/components/AddressAutocomplete.jsx
"use client";
import React, { useRef, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loadGoogleMaps, validateAddressAndCalculateDelivery } from "@/lib/google-maps";

const AddressAutocomplete = ({
  formData,
  updateFormData,
  onDeliveryCostUpdate,
  totalAmount = 0,
  label = "Address",
  placeholder = "Start typing your address..."
}) => {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationResult, setValidationResult] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const initializeAutocomplete = async () => {
      try {
        const maps = await loadGoogleMaps();

        if (!isMounted || !inputRef.current) return;

        // Initialize autocomplete with restrictions to Belgium and Gent
        autocompleteRef.current = new maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: 'BE' },
          fields: ['address_components', 'formatted_address', 'geometry', 'place_id'],
          types: ['address'],
          // Bias results towards Gent area
          bounds: new maps.LatLngBounds(
            new maps.LatLng(51.0200, 3.6900), // Southwest corner of Gent area
            new maps.LatLng(51.0900, 3.7500)  // Northeast corner of Gent area
          ),
          strictBounds: false
        });

        // Listen for place selection
        autocompleteRef.current.addListener('place_changed', handlePlaceSelect);

      } catch (error) {
        console.error('Failed to initialize Google Maps autocomplete:', error);
        setError('Failed to load address suggestions');
      }
    };

    initializeAutocomplete();

    return () => {
      isMounted = false;
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, []);

  const handlePlaceSelect = async () => {
    const place = autocompleteRef.current.getPlace();

    if (!place.geometry) {
      setError('Please select a valid address from the suggestions');
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Validate address and calculate delivery cost
      const result = await validateAddressAndCalculateDelivery(
        place.formatted_address,
        totalAmount
      );

      if (result.isValid) {
        // Parse address components
        const addressComponents = parseAddressComponents(place.address_components);

        // Update form data with parsed address
        updateFormData("street", addressComponents.street);
        updateFormData("houseNumber", addressComponents.houseNumber);
        updateFormData("houseNumberAddition", addressComponents.houseNumberAddition);
        updateFormData("postalCode", addressComponents.postalCode);
        updateFormData("city", addressComponents.city);

        // Store full address and coordinates for reference
        updateFormData("fullAddress", result.formattedAddress);
        updateFormData("coordinates", result.coordinates);
        updateFormData("usingGoogleMaps", true);

        // Update delivery cost and clear any errors
        if (onDeliveryCostUpdate) {
          onDeliveryCostUpdate(result.deliveryCost, result.distance);
        }

        setValidationResult(result);
        setError("");

      } else {
        setError(result.error);
        setValidationResult(null);

        // Reset delivery cost on invalid address
        if (onDeliveryCostUpdate) {
          onDeliveryCostUpdate(0, 0);
        }
      }

    } catch (error) {
      console.error('Address validation error:', error);
      setError('Failed to validate address. Please try again.');
      setValidationResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const parseAddressComponents = (components) => {
    const result = {
      street: "",
      houseNumber: "",
      houseNumberAddition: "",
      postalCode: "",
      city: ""
    };

    components.forEach(component => {
      const types = component.types;

      if (types.includes('street_number')) {
        result.houseNumber = component.long_name;
      } else if (types.includes('route')) {
        result.street = component.long_name;
      } else if (types.includes('postal_code')) {
        result.postalCode = component.long_name;
      } else if (types.includes('locality') || types.includes('administrative_area_level_2')) {
        result.city = component.long_name;
      }
    });

    return result;
  };

  const handleInputChange = (e) => {
    // Clear validation result when user starts typing
    if (validationResult) {
      setValidationResult(null);
    }
    if (error) {
      setError("");
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="address-autocomplete">{label}</Label>
      <Input
        ref={inputRef}
        id="address-autocomplete"
        type="text"
        placeholder={placeholder}
        onChange={handleInputChange}
        className={error ? "border-red-500" : ""}
        disabled={isLoading}
      />

      {isLoading && (
        <p className="text-sm text-blue-600">
          Validating address...
        </p>
      )}

      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}

      {validationResult && validationResult.isValid && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-800">
            ✓ Valid delivery address in {validationResult.city}
          </p>
          <p className="text-xs text-green-700 mt-1">
            Distance: {validationResult.distance}km •
            Delivery: {validationResult.isFreeDelivery
              ? "Free"
              : `€${validationResult.deliveryCost}`
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete;