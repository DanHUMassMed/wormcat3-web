// TODO This file is to be removed useWormCatForm
// *************************************************

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { analyze_and_visualize_enrichment, perform_gsea_analysis } from "../api/enrichmentAPI";
import { useFormValidation } from "./useFormValidation";
import { useFileUpload } from "./useFileUpload";
import { ANNOTATION_OPTIONS, SIGNIFICANCE_METHODS, DOMAIN_SCOPES } from "../components/constants";

export const useWormCatForm = () => {
  const navigate = useNavigate();
  const validation = useFormValidation();
  
  // Basic form state
  const [email, setEmail] = useState("daniel.higgins@umassmed.edu");
  const [annotationType, setAnnotationType] = useState(ANNOTATION_OPTIONS[0].value);
  const [significanceMethod, setSignificanceMethod] = useState(SIGNIFICANCE_METHODS[0].value);
  const [significanceThreshold, setSignificanceThreshold] = useState("0.05");
  const [analysisTitle, setAnalysisTitle] = useState("");
  const [statisticalDomain, setStatisticalDomain] = useState(DOMAIN_SCOPES[0].value);
  const [customBackgroundText, setCustomBackgroundText] = useState("");
  const [uploadId, setUploadId] = useState("");

  
  // Single form specific state
  const [geneSetText, setGeneSetText] = useState("");
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  
  // File upload handling
  const fileUpload = useFileUpload(setUploadId);

  // Form validation logic
  const validateForm = () => {
    validation.resetValidationErrors();
    let hasErrors = false;
    
    // Validate email
    if (!email) {
      validation.setValidationError("email", "Email is required");
      hasErrors = true;
    }
    
    const geneSetValidation = validation.isValidGeneSet(geneSetText);
    if (!geneSetValidation.valid) {
      validation.setValidationError("geneSet", geneSetValidation.message);
      hasErrors = true;
    }
    
    // Validate custom background if selected
    if (statisticalDomain === "custom") {
      const backgroundValidation = validation.isValidGeneSet(customBackgroundText);
      if (!backgroundValidation.valid) {
        validation.setValidationError("customBackground", backgroundValidation.message);
        hasErrors = true;
      }
    }
    
    return !hasErrors;
  };


  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    setErrorMessage("");
    
    // Prepare request payload
    const enrichmentRequest = {
      gene_set: geneSetText.trim().split(/\r?\n/).filter(Boolean),
      title: analysisTitle || "Analysis", // Default title if empty
      email: email,
      annotation_file_name: annotationType,
      p_adjust_method: significanceMethod,
      p_adjust_threshold: parseFloat(significanceThreshold),
    };

    // Add custom background if selected
    if (statisticalDomain === "custom") {
      enrichmentRequest.background_genes = customBackgroundText.trim().split(/\r?\n/).filter(Boolean);
    }

    try {
      const response_data = await analyze_and_visualize_enrichment(enrichmentRequest);
      
      if (response_data?.run_id) {
        navigate(`/report/${response_data.run_id}`);
      } else {
        setErrorMessage("Analysis failed: no run ID returned from the server.");
      }
    } catch (error) {
      // Handle specific error types
      if (error.name === "AbortError") {
        setErrorMessage("Request timed out. Please try again later.");
      } else {
        setErrorMessage(`Error: ${error.message || "Failed to process analysis"}`);
      }
      console.error("Analysis error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGSEASubmit = async () => {
    console.log("in handleGSEASubmit")
    validation.resetValidationErrors();
    // Validate email
    if (!email) {
      validation.setValidationError("email", "Email is required");
      return;
    }
    
    setLoading(true);
    setErrorMessage("");
    
    // Prepare request payload
    const gseaRequest = {
      gene_set: uploadId,
      title: analysisTitle || "GSEA", // Default title if empty
      email: email,
      annotation_file_name: annotationType,
    };

    try {
      const response_data = await perform_gsea_analysis(gseaRequest);
      
      if (response_data?.run_id) {
        navigate(`/gsea_report/${response_data.run_id}`);
      } else {
        setErrorMessage("Analysis failed: no run ID returned from the server.");
      }
    } catch (error) {
      // Handle specific error types
      if (error.name === "AbortError") {
        setErrorMessage("Request timed out. Please try again later.");
      } else {
        setErrorMessage(`Error: ${error.message || "Failed to process analysis"}`);
      }
      console.error("Analysis error:", error);
    } finally {
      setLoading(false);
    }
  };



  return {
    // Form state
    email,
    setEmail,
    annotationType,
    setAnnotationType,
    significanceMethod,
    setSignificanceMethod,
    significanceThreshold,
    setSignificanceThreshold,
    analysisTitle,
    setAnalysisTitle,
    statisticalDomain,
    setStatisticalDomain,
    customBackgroundText,
    setCustomBackgroundText,
    uploadId,
    setUploadId,
    
    // Single form state
    geneSetText,
    setGeneSetText,
    
    // UI state
    loading,
    errorMessage,
    
    // File handling
    fileUpload,
    
    // Validation
    validation,
    
    // Form submission
    handleSubmit,  
    handleGSEASubmit
  };
};