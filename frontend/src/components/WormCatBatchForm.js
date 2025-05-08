import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FileUploadZone from "./shared/FileUploadZone.js";
import { FormField } from "./shared/FormField";
import { LoadingButton } from "./shared/LoadingButton";
import { CustomBackgroundSection } from "./shared/CustomBackgroundSection";
import { useWormCatForm } from "../hooks/useWormCatForm";
import { ANNOTATION_OPTIONS, SIGNIFICANCE_METHODS, DOMAIN_SCOPES } from "./constants";

export default function WormCatForm() {
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
      onSubmit
    } = useWormCatForm(); // false indicates this is not a batch form
    

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
      
      <form className="space-y-6" onSubmit={onSubmit}>
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
          <CustomBackgroundSection
            show={statisticalDomain === "custom"}
            fileName={fileUpload.fileNames.customBackground}
            customBackgroundText={customBackgroundText}
            setCustomBackgroundText={setCustomBackgroundText}
            handleFileDrop={(e) => fileUpload.handleFileDrop(e, 'customBackground', setCustomBackgroundText)}
            error={validation.validationErrors.customBackground}
          />          
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
        <FormField 
          label="Regulated Gene Set" 
          required
          error={validation.validationErrors.geneSet}
          >
          <FileUploadZone 
            fileName={fileUpload.fileNames.geneSet}
            onDrop={(e) => fileUpload.handleFileDrop(e, 'geneSet', setGeneSetText)}
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
              validation.validationErrors.geneSet 
                ? "border-red-500 focus:ring-red-500" 
                : "focus:ring-blue-500"
            }`}
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Note: Each row should contain a single gene ID (either Sequence ID or WBGene format)
          </p>
        </FormField>

        {/* Submit Button */}
        <div className="flex flex-col items-center w-full">
            <LoadingButton 
              loading={loading} 
              text="Submit Analysis" 
              loadingText="Processing..."
            />
        </div>
      </form>
    </div>
  );
}