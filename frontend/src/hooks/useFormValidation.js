// TODO This file is to be removed useFormValidation
// *************************************************
import { useState } from "react";

export const useFormValidation = () => {
  const [validationErrors, setValidationErrors] = useState({});

  // Check if a string is a valid gene set
  const isValidGeneSet = (text) => {
    if (!text.trim()) {
      return { valid: false, message: "Gene set cannot be empty" };
    }
    
    // Split input into non-empty trimmed lines
    const lines = text
      .split("\n")
      .map(line => line.trim())
      .filter(line => line !== "");
  
    // Rule 1: At least 2 rows
    if (lines.length < 2) {
      return { valid: false, message: "Gene set must have at least 2 entries" };
    }
  
    // Rule 2: Each line ≤ 20 characters
    if (lines.some(line => line.length > 20)) {
      return { 
        valid: false, 
        message: "Some entries exceed 20 characters in length" 
      };
    }
  
    const startsWithWBGene = line => line.startsWith("WBGene");
  
    // Rule 3: Consistency in format
    // Either both lines start with WBGene or both do not
    const isConsistent =
      startsWithWBGene(lines[0]) === startsWithWBGene(lines[1]);

    if (!isConsistent) {
      return { 
        valid: false, 
        message: "The first two gene IDs must use the same format" 
      };
    }
    
    // All rules passed
    return { valid: true };
  };

  // Validate Excel file for batch form
  const isValidExcelFile = (file) => {
    if (!file) {
      return { valid: false, message: "Please upload an Excel file" };
    }
    
    const validExtensions = ['.xlsx', '.xls'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      return { valid: false, message: "Please upload a valid Excel file (.xlsx or .xls)" };
    }
    
    return { valid: true };
  };

  // Reset all validation errors
  const resetValidationErrors = () => {
    setValidationErrors({});
  };

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

  return {
    validationErrors,
    setValidationErrors,
    isValidGeneSet,
    isValidExcelFile,
    resetValidationErrors,
    setValidationError,
    clearValidationError
  };
};