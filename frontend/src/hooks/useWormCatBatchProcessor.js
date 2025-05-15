import React, { useState, useEffect, useCallback } from "react";
import { run_and_email, run_and_wait, upload_file } from "../api/enrichmentAPI";

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
        fields.validation.resetValidationErrors();
        const file = e.dataTransfer.files[0];
        if (!file) {
          const message = "No file was provided";
          fields.validation.setValidationError('excelFile', message);
          return {valid: false, message: message};
      }

        const isExcel = await isExcelFile(file);
        if (!isExcel) {
          const message = "The dropped file is not Excel format";
          fields.validation.setValidationError('excelFile', message);
          return {valid: false, message: message};
        }

        try {
          setLoading(true);
          setErrorMessage("");
          
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
        
    function isExcelFile(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        const blob = file.slice(0, 8); // First 8 bytes should be enough
    
        reader.onload = function (e) {
          const arr = new Uint8Array(e.target.result);
          const hex = Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join(' ');
    
          const isXls = hex.startsWith('d0 cf 11 e0 a1 b1 1a e1');
          const isXlsx = hex.startsWith('50 4b 03 04');
    
          resolve(isXls || isXlsx);
        };
    
        reader.onerror = () => resolve(false); // fallback: treat errors as "not Excel"
        reader.readAsArrayBuffer(blob);
      });
    }

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
        const ws = new WebSocket(`${process.env.REACT_APP_FASTAPI_BASE_WS}/wormcat3/ws/${taskId}`);
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

        setIsRunning(true);
        // Reset states
        setProgress(0);
        setResultUrl(null);
        setTaskStatus('Starting');
        setSubmissionType("run");
                  
                  
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
            const response_data = await run_and_wait(enrichmentRequest);

            if (response_data?.run_id) {
              // Set task ID which will trigger WebSocket connection in useEffect
              setTaskId(response_data.run_id);
            }else{
              setTaskStatus('FAILED');
              setErrorMessage(`Run and Wait Failed: ${response_data.message}`)
              setIsRunning(false);
            }
        } catch (error) {
          const message = error?.response?.data?.message || error?.message || String(error);
          setErrorMessage(`Unexpected error: ${message}`);
          setTaskStatus('FAILED');
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
          const response_data = await run_and_email(enrichmentRequest);
          
          if (response_data?.run_id) {
            setSubmissionType("email");
            setTaskStatus('EMAILED');
            setIsRunning(false);
          }else{
            setTaskStatus('FAILED');
            setErrorMessage(`Run and Email Failed: ${response_data.message}`)
            setIsRunning(false);
          }
    
        } catch (error) {
          // Extract a message if possible, fallback to stringified error
          const message = error?.response?.data?.message || error?.message || String(error);
          setErrorMessage(`Unexpected error: ${message}`);
          setTaskStatus('FAILED');
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
