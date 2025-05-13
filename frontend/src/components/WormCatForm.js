import React from "react";
import { AnimatePresence } from "framer-motion";
import { FileUploadZone } from "./shared/FileUploadZone.js";
import { CustomBackgroundSection } from "./shared/CustomBackgroundSection";
import { FormField } from "./shared/FormField";
import { LoadingButton } from "./shared/LoadingButton";
import { useWormCatFields } from "../hooks/useWormCatFields";
import { useWormCatSubmit } from "../hooks/useWormCatSubmit";
import { ANNOTATION_OPTIONS, SIGNIFICANCE_METHODS, DOMAIN_SCOPES } from "./constants";

export default function WormCatForm() {
  const requiredGeneSet = true // true indicates that a GeneSet is required
  const fields = useWormCatFields(requiredGeneSet);
  const {     
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
    geneSetText, 
    setGeneSetText,
    
    // Validation
    validation,

    handleLocalFileExpand,
    fileNames
  }  = fields;
    
  const {
    onClickRunAnalysis,
    loading,
    errorMessage 
  }  = useWormCatSubmit(fields);

  // Form is disabled when loading, or if there is major error message
  const isFormDisabled = loading || Boolean(errorMessage);

  // Function to handle form submission and prevent default behavior
  const onFormSubmit = (e) => {
    e.preventDefault();
    // Form validation and submission will be handled in the hook
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
      
      <form className="space-y-6" onSubmit={onFormSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Email field */}
          <FormField 
          label="Email" 
          required
          error={validation.validationErrors.email}
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.edu"
              className={`w-full border rounded p-2 focus:outline-none focus:ring-2 ${
                validation.validationErrors.email 
                  ? "border-red-500 focus:ring-red-500" 
                  : "focus:ring-blue-500"
              }`}
              required
              disabled={isFormDisabled}
              />
          </FormField>
          
          {/* Annotation Type */}
          <FormField label="Annotation Type">
            <select
              value={annotationType}
              onChange={(e) => setAnnotationType(e.target.value)}
              className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isFormDisabled}
              >
              {ANNOTATION_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>
          
          {/* Significance Method */}
          <FormField 
            label="Significance Method"
          >
            <select
              value={significanceMethod}
              onChange={(e) => setSignificanceMethod(e.target.value)}
              className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isFormDisabled}
              >
              {SIGNIFICANCE_METHODS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>
          
          {/* Significance Threshold */}
          <FormField 
            label="Significance Threshold"
            error={validation.validationErrors.significanceThreshold}
            >
            <input
              type="number"
              step="0.01"
              min="0.01"
              max="1"
              value={significanceThreshold}
              onChange={(e) => setSignificanceThreshold(e.target.value)}
              className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={isFormDisabled}
              />
          </FormField>
        </div>

        {/* Statistical Domain Scope */}
        <FormField label="Statistical Domain Scope">
          <select
            value={statisticalDomain}
            onChange={(e) => setStatisticalDomain(e.target.value)}
            className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isFormDisabled}
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
          <CustomBackgroundSection
            show={statisticalDomain === "custom"}
            fileName={fileNames.customBackground}
            customBackgroundText={customBackgroundText}
            setCustomBackgroundText={setCustomBackgroundText}
            handleFileDrop={(e) => handleLocalFileExpand(e, 'customBackground', setCustomBackgroundText)}
            disabled={isFormDisabled}
            error={validation.validationErrors.customBackground}
          />          
        </AnimatePresence>

        {/* Analysis Title */}
        <FormField 
          label="Analysis Title"
          error={validation.validationErrors.analysisTitle}
          >
          <input
            type="text"
            value={analysisTitle}
            onChange={(e) => setAnalysisTitle(e.target.value)}
            placeholder="Gene Set Analysis"
            className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isFormDisabled}
            />
        </FormField>

        {/* Regulated Gene Set */}
        <FormField 
          label="Regulated Gene Set" 
          required
          error={validation.validationErrors.geneSet}
          >
          <FileUploadZone 
            fileName={fileNames.geneSet}
            onDrop={(e) => handleLocalFileExpand(e, 'geneSet', setGeneSetText)}
            label="Gene Set"
            id="gene-set-drop"
            disabled={isFormDisabled}
            />
          <textarea
            id="gene-set-textarea-id"
            value={geneSetText}
            onChange={(e) => setGeneSetText(e.target.value)}
            placeholder="Or paste regulated gene set (one gene ID per line)"
            rows="6"
            className={`w-full border rounded p-2 mt-2 focus:outline-none focus:ring-2 ${
              validation.validationErrors.geneSet 
                ? "border-red-500 focus:ring-red-500" 
                : "focus:ring-blue-500"
            }`}
            required
            disabled={isFormDisabled}
            />
          <p className="text-xs text-gray-500 mt-1">
            Note: Each row should contain a single gene ID (either Sequence ID or WBGene format)
          </p>
        </FormField>

        {/* Submit Button */}
        <div className="flex flex-col items-center w-full">
            <LoadingButton 
              loading={loading} 
              text="Submit and Run Analysis" 
              loadingText="Processing..."
              onClick={onClickRunAnalysis}
              disabled={isFormDisabled}
            />
        </div>
      </form>
    </div>
  );
}