import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FileUploadZone from "./shared/FileUploadZone.js";
import { FormField } from "./shared/FormField";
import { LoadingButton } from "./shared/LoadingButton";
import { CustomBackgroundSection } from "./shared/CustomBackgroundSection";
import { useWormCatForm } from "../hooks/useWormCatForm";
import { ANNOTATION_OPTIONS, SIGNIFICANCE_METHODS, DOMAIN_SCOPES } from "./constants";

export default function WormCatBatchForm() {
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
      validation
      
   
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
  const [taskId, setTaskId] = useState(null);
  const [progress, setProgress] = useState(0);
  const [taskStatus, setTaskStatus] = useState('Idle');
  const [resultUrl, setResultUrl] = useState(null);
  const [websocket, setWebsocket] = useState(null);

  // Effect to handle WebSocket connection and cleanup
  useEffect(() => {
    // Clean up WebSocket connection when component unmounts
    return () => {
      if (websocket) {
        websocket.close();
      }
    };
  }, []);

  // Effect to handle WebSocket messages when taskId changes
  useEffect(() => {
    if (!taskId) return;

    // Close previous connection if exists
    if (websocket) {
      websocket.close();
    }

    // Create new WebSocket connection
    const ws = new WebSocket(`ws://localhost:8000/wormcat3/ws/${taskId}`);
    setWebsocket(ws);

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('WebSocket message:::', data);
      
      if (data.progress !== undefined) {
        setProgress(data.progress);
      }
      
      if (data.state) {
        setTaskStatus(data.state);
        
        if (data.state === 'COMPLETED') {
          setIsRunning(false);
          if (data.result_url) {
            setResultUrl(data.result_url);
          }
          ws.close();
        } else if (data.state === 'FAILED') {
          setIsRunning(false);
          ws.close();
        }
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setTaskStatus('Error');
      setIsRunning(false);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return () => {
      ws.close();
    };
  }, [taskId]);

  const handleSubmitAndEmail = () => {
    setIsSubmitting(true);
    setSubmissionType("email");
    
    // Simulate API call
    setTimeout(() => {
      console.log("Form submitted and email sent:");
      setIsSubmitting(false);
    }, 2000);
  };
  
  const handleRunAndWait = async () => {
    try {
      // Reset states
      setProgress(0);
      setResultUrl(null);
      setTaskStatus('Starting');
      setIsRunning(true);
      setSubmissionType("run");
      
      // Validate form before submitting
      // if (!validation.validateForm()) {
      //   setIsRunning(false);
      //   return;
      // }
      
      // Prepare form data
      const formData = {
        email,
        annotationType,
        significanceMethod,
        significanceThreshold,
        analysisTitle,
        statisticalDomain,
        customBackgroundText: statisticalDomain === "custom" ? customBackgroundText : null,
        uploadId
      };
      
      // Submit to API
      const response = await fetch('http://localhost:8000/wormcat3/start-task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Task started:", data);
      
      // Set task ID which will trigger WebSocket connection in useEffect
      setTaskId(data.task_id);
      
    } catch (error) {
      console.error("Error starting task:", error);
      setTaskStatus('Failed');
      setIsRunning(false);
    }
  };
  
  const handleDownloadResults = async () => {
    if (!resultUrl) return;
    
    try {
      const response = await fetch(resultUrl);
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `wormcat-batch-results-${taskId}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download error:", error);
    }
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

  // Form is disabled when submitting, running, or completed and waiting for download
  const isFormDisabled = isSubmitting || isRunning || taskStatus === 'COMPLETED';

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
                {taskStatus === 'COMPLETED' && (
                  <span className="text-green-600">Analysis completed successfully</span>
                )}
              </div>
              
              {taskStatus === 'COMPLETED' && resultUrl && (
                <button
                  onClick={handleDownloadResults}
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
            fileName={fileUpload.fileNames.customBackground}
            customBackgroundText={customBackgroundText}
            setCustomBackgroundText={setCustomBackgroundText}
            handleFileDrop={(e) => fileUpload.handleFileDrop(e, 'customBackground', setCustomBackgroundText)}
            error={validation.validationErrors.customBackground}
            disabled={isFormDisabled}
          />          
        </AnimatePresence>

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

        {/* Batch Gene Sets */}
        <FormField 
          label="Batch Gene Sets" 
          required
          error={validation.validationErrors.excelFile}
          >
          <FileUploadZone 
            fileName={fileUpload.fileNames.excelFile}
            onDrop={(e) => fileUpload.handleFileDrop(e, 'excelFile')}
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
            Form submitted. An email will be sent when processing is complete.
          </div>
        )}
        
        {/* Submit Buttons */}
        <div className="flex justify-between w-full px-4 gap-4">
          <LoadingButton
            loading={isSubmitting}
            text="Send me an Email"
            loadingText="Sending..."
            onClick={handleSubmitAndEmail}
            disabled={isRunning || taskStatus === 'COMPLETED'}
          />
          <LoadingButton
            loading={isRunning}
            text="Let it run I'll wait"
            loadingText={`Processing... ${progress}%`}
            onClick={handleRunAndWait}
            disabled={isSubmitting || taskStatus === 'COMPLETED'}
          />
        </div>
      </form>
    </div>
  );
}