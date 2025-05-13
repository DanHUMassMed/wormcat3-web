import { useState } from "react";

export const useFieldValidation = () => {
  const [validationErrors, setValidationErrors] = useState({});

  // Set a specific validation error
  const setValidationError = (field, message) => {
    setValidationErrors(prev => ({
      ...prev,
      [field]: message
    }));
  };

  // Clear a specific validation error
  const clearValidationError = (field) => {
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  // Reset all validation errors
  const resetValidationErrors = () => {
    setValidationErrors({});
  };

  return {
    validationErrors,
    resetValidationErrors,
    setValidationError,
    clearValidationError,
  };
};