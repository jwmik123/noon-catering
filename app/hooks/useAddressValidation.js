// app/hooks/useAddressValidation.js
"use client";
import { useState, useCallback } from "react";
import { validateAddressAndCalculateDelivery } from "@/lib/google-maps";

export const useAddressValidation = () => {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [validationError, setValidationError] = useState("");

  const validateAddress = useCallback(async (address, orderTotal = 0) => {
    if (!address || address.trim().length === 0) {
      setValidationResult(null);
      setValidationError("");
      return null;
    }

    setIsValidating(true);
    setValidationError("");

    try {
      const result = await validateAddressAndCalculateDelivery(address, orderTotal);

      if (result.isValid) {
        setValidationResult(result);
        setValidationError("");
        return result;
      } else {
        setValidationResult(null);
        setValidationError(result.error);
        return null;
      }

    } catch (error) {
      console.error('Address validation error:', error);
      setValidationError('Failed to validate address. Please try again.');
      setValidationResult(null);
      return null;
    } finally {
      setIsValidating(false);
    }
  }, []);

  const clearValidation = useCallback(() => {
    setValidationResult(null);
    setValidationError("");
    setIsValidating(false);
  }, []);

  return {
    validateAddress,
    clearValidation,
    isValidating,
    validationResult,
    validationError,
    isValidAddress: !!validationResult?.isValid,
    deliveryCost: validationResult?.deliveryCost || 0,
    distance: validationResult?.distance || 0,
    isFreeDelivery: validationResult?.isFreeDelivery || false
  };
};