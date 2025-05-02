import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { analyze_and_visualize_enrichment } from "../api/enrichmentAPI.mjs";
import FileUploadZone from "./FileUploadZone";

// Constants
const ANNOTATION_OPTIONS = [
  { value: "whole_genome_v2_nov-11-2021.csv", label: "Whole genome" },
  { value: "ORF_only_v2_nov-11-2021.csv", label: "ORF only" },
  { value: "ahringer_v2_nov-11-2021.csv", label: "Ahringer RNAi" },
  { value: "orfeome_v2_nov-11-2021.csv", label: "Orfeome RNAi" },
];

const SIGNIFICANCE_METHODS = [
  { value: "bonferroni", label: "Bonferroni correction" },
  { value: "fdr_bh", label: "Benjamini-Hochberg FDR" },
];

const DOMAIN_SCOPES = [
  { value: "all_genes", label: "All Genes" },
  { value: "custom", label: "Custom" },
];

// Form Field Component
const FormField = ({ label, children, required = false }) => {
  return (
    <div>
      <label className="block font-semibold mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
};

export default function WormCatForm() {
  const navigate = useNavigate();
  
  // Form state
  const [email, setEmail] = useState("dan@none.com");
  const [annotationType, setAnnotationType] = useState(ANNOTATION_OPTIONS[0].value);
  const [significanceMethod, setSignificanceMethod] = useState(SIGNIFICANCE_METHODS[0].value);
  const [significanceThreshold, setSignificanceThreshold] = useState("0.05");
  const [analysisTitle, setAnalysisTitle] = useState("");
  const [geneSetText, setGeneSetText] = useState("");
  const [fileName, setFileName] = useState("");
  const [statisticalDomain, setStatisticalDomain] = useState(DOMAIN_SCOPES[0].value);
  const [customBackgroundText, setCustomBackgroundText] = useState("");
  const [customBackgroundFileName, setCustomBackgroundFileName] = useState("");
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  const isMountedRef = useRef(true);


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

  // File upload handlers
  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      setFileName(file.name);
      setValidationErrors({ ...validationErrors, geneSet: null });
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setGeneSetText(event.target.result);
      };
      reader.readAsText(file);
    }
  };

  const handleCustomDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      setCustomBackgroundFileName(file.name);
      setValidationErrors({ ...validationErrors, customBackground: null });
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomBackgroundText(event.target.result);
      };
      reader.readAsText(file);
    }
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset errors
    setErrorMessage("");
    setValidationErrors({});
    
    // Validate fields
    let errors = {};
    let hasErrors = false;
    
    // Validate gene set
    const geneSetValidation = isValidGeneSet(geneSetText);
    if (!geneSetValidation.valid) {
      errors.geneSet = geneSetValidation.message;
      hasErrors = true;
    }
    
    // Validate custom background if selected
    if (statisticalDomain === "custom") {
      const backgroundValidation = isValidGeneSet(customBackgroundText);
      if (!backgroundValidation.valid) {
        errors.customBackground = backgroundValidation.message;
        hasErrors = true;
      }
    }
    
    // Check for validation errors
    if (hasErrors) {
      setValidationErrors(errors);
      return;
    }
    
    // Start loading
    setLoading(true);

    // Prepare request payload
    const enrichmentRequest = {
      gene_set: geneSetText.trim().split(/\r?\n/).filter(Boolean),
      title: analysisTitle || "Untitled Analysis", // Default title if empty
      email: email,
      annotation_file_name: annotationType,
      background:
        statisticalDomain === "custom"
          ? customBackgroundText.trim().split(/\r?\n/).filter(Boolean)
          : null,
      p_adjust_method: significanceMethod,
      p_adjust_threshold: parseFloat(significanceThreshold),
    };

    try {
      console.log("Calling analyze_and_visualize_enrichment");
      const response = await analyze_and_visualize_enrichment(enrichmentRequest);
      console.log("Returning from analyze_and_visualize_enrichment");
      
      // Instead of navigating directly, set the navigation data
      if (isMountedRef.current) {
        console.log("Setting navigation data");
        navigate(`/report/${response.run_id}`);
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
      console.log("Log Finally from analyze_and_visualize_enrichment");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6 text-center">
        Process your Regulated Gene Set with WormCat
      </h1>
      
      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p>{errorMessage}</p>
        </div>
      )}
      
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Email field */}
          <FormField label="Email" required>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </FormField>
          
          {/* Annotation Type */}
          <FormField label="Annotation Type">
            <select
              value={annotationType}
              onChange={(e) => setAnnotationType(e.target.value)}
              className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ANNOTATION_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>
          
          {/* Significance Method */}
          <FormField label="Significance Method">
            <select
              value={significanceMethod}
              onChange={(e) => setSignificanceMethod(e.target.value)}
              className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SIGNIFICANCE_METHODS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>
          
          {/* Significance Threshold */}
          <FormField label="Significance Threshold">
            <input
              type="number"
              step="0.01"
              min="0.01"
              max="1"
              value={significanceThreshold}
              onChange={(e) => setSignificanceThreshold(e.target.value)}
              className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </FormField>
        </div>

        {/* Statistical Domain Scope */}
        <FormField label="Statistical Domain Scope">
          <select
            value={statisticalDomain}
            onChange={(e) => setStatisticalDomain(e.target.value)}
            className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {DOMAIN_SCOPES.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>

        {/* Custom Background (conditional) */}
        <AnimatePresence>
          {statisticalDomain === "custom" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="border-2 border-dashed border-orange-400 rounded-md p-4 md:p-6 mb-4">
                <FormField label="Custom Background Gene Set">
                  <FileUploadZone 
                    fileName={customBackgroundFileName}
                    onDrop={handleCustomDrop}
                    label="Custom Background"
                    id="custom-background-drop"
                  />
                  <textarea
                    id="custom-background-textarea-id"
                    value={customBackgroundText}
                    onChange={(e) => setCustomBackgroundText(e.target.value)}
                    placeholder="Or paste custom background gene set (one gene ID per line)"
                    rows="5"
                    className={`w-full border rounded p-2 mt-2 focus:outline-none focus:ring-2 ${
                      validationErrors.customBackground 
                        ? "border-red-500 focus:ring-red-500" 
                        : "focus:ring-blue-500"
                    }`}
                  />
                  {validationErrors.customBackground && (
                    <p className="text-red-500 mt-1 text-sm">
                      {validationErrors.customBackground}
                    </p>
                  )}
                </FormField>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Analysis Title */}
        <FormField label="Analysis Title">
          <input
            type="text"
            value={analysisTitle}
            onChange={(e) => setAnalysisTitle(e.target.value)}
            placeholder="Gene Set Analysis"
            className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </FormField>

        {/* Regulated Gene Set */}
        <FormField label="Regulated Gene Set" required>
          <FileUploadZone 
            fileName={fileName}
            onDrop={handleDrop}
            label="Gene Set"
            id="gene-set-drop"
          />
          <textarea
            id="gene-set-textarea-id"
            value={geneSetText}
            onChange={(e) => setGeneSetText(e.target.value)}
            placeholder="Or paste regulated gene set (one gene ID per line)"
            rows="6"
            className={`w-full border rounded p-2 mt-2 focus:outline-none focus:ring-2 ${
              validationErrors.geneSet 
                ? "border-red-500 focus:ring-red-500" 
                : "focus:ring-blue-500"
            }`}
            required
          />
          {validationErrors.geneSet && (
            <p className="text-red-500 mt-1 text-sm">
              {validationErrors.geneSet}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Note: Each row should contain a single gene ID (either Sequence ID or WBGene format)
          </p>
        </FormField>

        {/* Submit Button */}
        <div className="flex flex-col items-center w-full">
          <button
            type="submit"
            disabled={loading}
            className={`w-full p-3 text-white font-bold rounded-lg transition-colors ${
              loading 
                ? "bg-gray-500 cursor-not-allowed" 
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="white"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="white"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                <span>Processing...</span>
              </div>
            ) : (
              "Submit Analysis"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}