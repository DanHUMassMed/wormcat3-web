import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FileUploadZone from "./shared/FileUploadZone.js";
import { FormField } from "./shared/FormField";
import { LoadingButton } from "./shared/LoadingButton";
import { CustomBackgroundSection } from "./shared/CustomBackgroundSection";
import { useWormCatForm } from "../hooks/useWormCatForm";
import { ANNOTATION_OPTIONS, SIGNIFICANCE_METHODS, DOMAIN_SCOPES } from "./constants";

export default function WormCatGSEAForm() {
  const {
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
      handleGSEASubmit
    } = useWormCatForm(); // false indicates this is not a batch form
  
  // Function to handle form submission and prevent default behavior
  const onFormSubmit = (e) => {
    e.preventDefault();
    // Form validation and submission will be handled in the hook
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [submissionType, setSubmissionType] = useState("");
  const [validationMessage, setValidationMessage] = useState('');


  const handleSubmitAndEmail = () => {
    setIsSubmitting(true);
    setSubmissionType("email");
    
    // Simulate API call
    setTimeout(() => {
      console.log("Form submitted and email sent:");
      setIsSubmitting(false);
    }, 2000);
  };
  
  const handleRunAndWait = () => {
    setIsRunning(true);
    setSubmissionType("run");
    
    // Simulate longer running process
    setTimeout(() => {
      console.log("Process completed:");
      setIsRunning(false);
    }, 3000);
  };

  // Handle the drop event
  const handleDrop = async (e) => {
      e.preventDefault();
      e.stopPropagation();

      
      // Clear any previous messages
      setValidationMessage('');
      
      // Excel file upload
      const result = await fileUpload.handleFileDrop(e, 'excelFile');
      
      if (!result.valid) {
        setValidationMessage(result.message);
      } else if (result.jobId) {
        setValidationMessage(`File uploaded successfully. Job ID: ${result.jobId}`);
      }
    };

  // Either button being active disables the entire form
  const isFormDisabled = isSubmitting || isRunning;

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8">
    <h1 className="text-2xl font-bold mb-6 text-center">
      Gene set enrichment analysis (<span className="text-blue-800 font-extrabold underline">GSEA</span>) with WormCat
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
          error={validation.validationErrors.email}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              className={`w-full border rounded p-2 focus:outline-none focus:ring-2 ${
                validation.validationErrors.email 
                  ? "border-red-500 focus:ring-red-500" 
                  : "focus:ring-blue-500"
              }`}
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
        </div>  
        {/* Analysis Title */}
        <FormField label="Analysis Title">
          <input
            type="text"
            value={analysisTitle}
            onChange={(e) => setAnalysisTitle(e.target.value)}
            placeholder="Batch Gene Set Analysis"
            className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </FormField>

        {/* Batch Gene Sets */}
        <FormField 
          label="Batch Gene Sets" 
          required
          error={validation.validationErrors.gseaFile}
          >
          <FileUploadZone 
            fileName={fileUpload.fileNames.gseaFile}
            onDrop={(e) => fileUpload.handleFileDrop(e, 'gseaFile')}
            label="GSEA CSV file"
            id="batch-gene-set-drop"
          />
          <p className="text-xs text-gray-500 mt-1">
            Note: The required columns in the input CSV are: 'ID', 'log2FoldChange', 'pvalue' (typically outputted from DESeq2)
          </p>
        </FormField>
        {submissionType && !isFormDisabled && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
            {submissionType === "email" ? "Form submitted and email sent!" : "Process completed successfully!"}
          </div>
        )}
        {/* Submit Button */}
        <div className="flex flex-col items-center w-full">
          <LoadingButton
            loading={isRunning}
            text="Submit and Run GSEA"
            loadingText="Running..."
            onClick={handleGSEASubmit}
            disabled={isSubmitting}
          />
        </div>
      </form>
    </div>
  );
}