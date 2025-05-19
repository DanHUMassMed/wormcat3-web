import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileUploadZone } from "./shared/FileUploadZone.js";
import { FormField } from "./shared/FormField";
import { LoadingButton } from "./shared/LoadingButton";
import { CustomBackgroundSection } from "./shared/CustomBackgroundSection";
import { useWormCatFields } from "../hooks/useWormCatFields";
import { useWormCatBatchProcessor } from "../hooks/useWormCatBatchProcessor";
import { ANNOTATION_OPTIONS, SIGNIFICANCE_METHODS, DOMAIN_SCOPES } from "./constants";

export default function WormCatBatchForm() {
  const fields = useWormCatFields();
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
    
    // Validation
    validation,

    handleLocalFileExpand,
    fileNames
  }  = fields;
    
  const {
    onHandleFileDrop,
    excelFileName,

    progress,
    progressMessage,
    taskStatus,
    isRunning,
    submissionType,
    resultUrl,

    handleRunAndWait,
    handleSubmitAndEmail,
    handleDownloadResults,

    loading,
    errorMessage 
  }  = useWormCatBatchProcessor(fields);

  // Function to handle form submission and prevent default behavior
  const onFormSubmit = (e) => {
    e.preventDefault();
    // Form validation and submission will be handled in the hook
  };


  // Form is disabled when submitting, running, or completed and waiting for download
  const isFormDisabled = loading || isRunning || taskStatus === 'COMPLETED'|| taskStatus === 'FAILED'|| taskStatus === 'EMAILED';

  // Progress bar variants for animation
  const progressBarVariants = {
    initial: { width: 0 },
    animate: { width: `${progress}%` },
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6 text-center">
        Process a <span className="text-blue-800 font-extrabold underline">Batch</span> of Regulated Gene Sets with WormCat
      </h1>
      
      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p>{errorMessage}</p>
        </div>
      )}
      
      {/* Task status and progress section */}
      <AnimatePresence>
        {isRunning || taskStatus === 'COMPLETED' ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">Analysis Progress</h3>
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
              
              {taskStatus === 'COMPLETED' && resultUrl && (
                <button
                  onClick={() => handleDownloadResults(resultUrl)}
                  className="mt-4 w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded transition duration-200 flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L10 11.586l2.293-2.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Download Results
                </button>
              )}
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
          <FormField label="Significance Method">
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
            error={validation.validationErrors.customBackground}
            disabled={isFormDisabled}
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
            placeholder="Batch Gene Set Analysis"
            className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isFormDisabled}
          />
        </FormField>

        {/* Batch Gene Sets */}
        <FormField 
          label="Excel Batch Gene Sets" 
          required
          error={validation.validationErrors.excelFile}
          >
          <FileUploadZone 
            fileName={excelFileName}
            onDrop={(e) => onHandleFileDrop(e)}
            label="Excel file"
            id="batch-gene-set-drop"
            disabled={isFormDisabled}
          />
          <p className="text-xs text-gray-500 mt-1">
            Note: Each Excel sheet should contain a single column of gene IDs. (either Sequence ID or WBGene format)
          </p>
        </FormField>
        
        {submissionType === "email" && !isRunning && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
            Form submitted. An email will be sent to <strong>{email}</strong> when processing is complete.
          </div>
        )}
        
        {/* Submit Buttons */}
        <div className="flex justify-between w-full px-4 gap-4">
          <LoadingButton
            text={taskStatus === 'EMAILED' ? "Email will be sent" : "Send me an Email"}
            onClick={handleSubmitAndEmail}
            disabled={isFormDisabled}
          />
          <LoadingButton
            loading={isRunning}
            text="Let it run I'll wait"
            loadingText={`Processing... ${progress}%`}
            onClick={handleRunAndWait}
            disabled={isFormDisabled}
          />
        </div>
      </form>
    </div>
  );
}