import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileUploadZone } from "./shared/FileUploadZone.js";
import { FormField } from "./shared/FormField";
import { LoadingButton } from "./shared/LoadingButton";
import { useWormCatGSEAProcessor } from "../hooks/useWormCatGSEAProcessor";
import { ANNOTATION_OPTIONS } from "./constants";
import { useNavigate } from "react-router-dom";

export default function WormCatGSEAForm() {
  const navigate = useNavigate();
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
      onClickRunGSEA,

      //Task variables
      taskStatus, 
      isRunning,
      progress, 
      progressMessage, 
      resultUrl
    } = useWormCatGSEAProcessor(); // false indicates this is not a batch form
  
   // Form is disabled when loading, or if there is major error message
   const isFormDisabled = loading || isRunning || Boolean(errorMessage);
   
  // Function to handle form submission and prevent default behavior
  const onFormSubmit = (e) => {
    e.preventDefault();
    // Form validation and submission will be handled in the hook
  };

   // Progress bar variants for animation
   const progressBarVariants = {
    initial: { width: 0 },
    animate: { width: `${progress}%` },
  };

      // Navigate when resultUrl is set
      useEffect(() => {
        if (resultUrl) {
            const taskId = resultUrl.slice(0, -4);
            navigate(`/gsea_report/${taskId}`);
            }
        }, [resultUrl, navigate]);

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
        
      {/* Task status and progress section */}
      <AnimatePresence>
        {isRunning ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">GSEA Progress</h3>
                <span className="text-sm text-blue-700">{taskStatus}</span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                <motion.div
                  className="bg-blue-600 h-4 rounded-full"
                  initial="initial"
                  animate="animate"
                  variants={progressBarVariants}
                  transition={{ duration: 0.5 }}
                ></motion.div>
              </div>
              
              <div className="flex justify-between text-xs text-gray-600">
                <span>{progress}% Complete</span>
                {progressMessage !== undefined && (
                  <span className="text-green-600">{progressMessage}</span>
                )}
              </div>
              
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>


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
          <FormField 
            label="Analysis Title"
            error={validation.validationErrors.analysisTitle}>
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
              loading={isRunning}
              text="Submit and Run GSEA"
              loadingText={`Processing... ${progress}%`}
              onClick={onClickRunGSEA}
              disabled={isFormDisabled}
            />
          </div>
        </form>
      </div>
    );
}