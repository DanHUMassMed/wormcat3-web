import React, { useState, useEffect, useCallback } from "react";
import { analyze_and_visualize_enrichment } from "../api/enrichmentAPI";
import { upload_file } from "../api/enrichmentAPI";

export const useWormCatBatchProcessor = (fields) => {
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [excelFileName, setExcelFileName] = useState("");

    const [websocket, setWebsocket] = useState(null);
    const [taskId, setTaskId] = useState(null);
    const [progress, setProgress] = useState(0);
    const [progressMessage, setProgressMessage] = useState('');
    const [taskStatus, setTaskStatus] = useState('Idle');
    const [isRunning, setIsRunning] = useState(false);
    const [submissionType, setSubmissionType] = useState("");
    const [resultUrl, setResultUrl] = useState(null);

    const onHandleFileDrop = async (e) => {
        setLoading(true);
        setErrorMessage("");

        const file = e.dataTransfer.files[0];
    
        try {
            if (!file) {
                throw new Error("No file provided for upload");
            }
        
            const formData = new FormData();
            formData.append("file", file);

            const response_data = await upload_file(formData);
            
            if (response_data && response_data.job_id) {
                setExcelFileName(`${response_data.job_id}/${file.name}`);
                return;
            } else {
                throw new Error("Invalid response from server");
            }

        } catch (error) {
            // Handle specific error types
            if (error.name === "AbortError") {
                setErrorMessage("Request timed out. Please try again later.");
            } else {
                setErrorMessage(`Error: ${error.message || "Failed to process analysis"}`);
            }
        } finally {
            setLoading(false);
        }
    };
        

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
          if (data.message !== undefined) {
            setProgressMessage(data.message);
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

      const handleRunAndWait = async () => {
        if (fields.validateFields()) return;
        // Validate Excel file file
        if (!excelFileName) {
            fields.validation.setValidationError('excelFile', 'Excel file is required')
            return
        }
      

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
          
        // Prepare request payload
        const enrichmentRequest = {
          gene_set: excelFileName,
          title: fields.analysisTitle || 'Analysis',
          email: fields.email,
          annotation_file_name: fields.annotationType,
          p_adjust_method: fields.significanceMethod,
          p_adjust_threshold: parseFloat(fields.significanceThreshold),
        };
    
        // Add custom background if selected
        if (fields.statisticalDomain === "custom") {
          enrichmentRequest.background_genes = fields.customBackgroundText.trim().split(/\r?\n/).filter(Boolean);
        }
          
          // Submit to API
          const response = await fetch('http://localhost:8000/wormcat3/run-and-wait', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(enrichmentRequest),
          });
          
          if (!response.ok) {
            throw new Error(`Server responded with ${response.status}`);
          }
          
          const data = await response.json();
          console.log("Task started:", data);
          
          // Set task ID which will trigger WebSocket connection in useEffect
          setTaskId(data.run_id);
          
        } catch (error) {
          console.error("Error starting task:", error);
          setTaskStatus('Failed');
          setIsRunning(false);
        }
      };
      
      const handleSubmitAndEmail = async () => {
        if (fields.validateFields()) return;
        // Validate Excel file file
        if (!excelFileName) {
          fields.validation.setValidationError('excelFile', 'Excel file is required')
          return
      }

        setIsRunning(true);

        // Prepare request payload
        const enrichmentRequest = {
          gene_set: excelFileName,
          title: fields.analysisTitle || 'Analysis',
          email: fields.email,
          annotation_file_name: fields.annotationType,
          p_adjust_method: fields.significanceMethod,
          p_adjust_threshold: parseFloat(fields.significanceThreshold),
        };
    
        // Add custom background if selected
        if (fields.statisticalDomain === "custom") {
          enrichmentRequest.background_genes = fields.customBackgroundText.trim().split(/\r?\n/).filter(Boolean);
        }
    
        try {
          // Submit to API
          const response = await fetch('http://localhost:8000/wormcat3/run-and-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(enrichmentRequest),
          });
          
          if (response.ok) {
            setSubmissionType("email");
            setTaskStatus('COMPLETED');
          }else{
            setTaskStatus('Failed');
            throw new Error(`Server responded with ${response.status}`);
          }
    
        } catch (error) {
          console.error("Error starting task:", error);
          setTaskStatus('Failed');
          setIsRunning(false);
        }
    
      };
      
      // Handle download button click
      const handleDownloadResults = useCallback((file_name) => {
        window.location.href = `/dynamic/wormcat_out/${file_name}`;
      }, []);
    
      return {
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
      };
}  
