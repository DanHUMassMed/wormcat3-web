import React from "react";
import { FileUploadZone } from "./shared/FileUploadZone.js";
import { FormField } from "./shared/FormField";
import { LoadingButton } from "./shared/LoadingButton";
import { useWormCatGSEAProcessor } from "../hooks/useWormCatGSEAProcessor";
import { ANNOTATION_OPTIONS } from "./constants";

export default function WormCatGSEAForm() {
  const {
     // Form state
     email,
     setEmail,
     annotationType,
     setAnnotationType,
     analysisTitle,
     setAnalysisTitle,
     gseaFileName, 
     
     // Validation
     validation,
     
     loading,
     errorMessage,
 
     // File load
     onHandleFileDrop,
     
     onClickRunGSEA
    } = useWormCatGSEAProcessor(); // false indicates this is not a batch form
  
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
      Gene Set Enrichment Analysis (<span className="text-blue-800 font-extrabold underline">GSEA</span>) with WormCat
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
        </div>  

        {/* Analysis Title */}
        <FormField label="Analysis Title">
          <input
            type="text"
            value={analysisTitle}
            onChange={(e) => setAnalysisTitle(e.target.value)}
            placeholder="Batch Gene Set Analysis"
            className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isFormDisabled}
          />
        </FormField>

        {/* GSEA Gene Sets */}
        <FormField 
          label="GSEA Gene Sets" 
          required
          error={validation.validationErrors.gseaFile}
          >
          <FileUploadZone 
            fileName={gseaFileName}
            onDrop={(e) => onHandleFileDrop(e)}
            label="GSEA CSV file"
            id="gsea-gene-set-drop"
            disabled={isFormDisabled}
          />
          <p className="text-xs text-gray-500 mt-1">
            Note: The required columns in the input CSV are: 'ID', 'log2FoldChange', 'pvalue' (typically outputted from DESeq2)
          </p>
        </FormField>

        {/* Submit Button */}
        <div className="flex flex-col items-center w-full">
          <LoadingButton
            loading={loading}
            text="Submit and Run GSEA"
            loadingText="Running..."
            onClick={onClickRunGSEA}
            disabled={isFormDisabled}
          />
        </div>
      </form>
    </div>
  );
}