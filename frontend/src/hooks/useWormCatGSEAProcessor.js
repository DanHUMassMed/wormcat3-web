import { useState } from "react";
import { useFieldValidation } from "./useFieldValidation";
import { upload_file } from "../api/enrichmentAPI";
import { ANNOTATION_OPTIONS } from "../components/constants";
import { useNavigate } from "react-router-dom";
import { perform_gsea_analysis } from "../api/enrichmentAPI";
import { useTaskWebSocket } from "./useTaskWebSocket";


export const useWormCatGSEAProcessor = () => {
    const navigate = useNavigate();
    const validation = useFieldValidation();

    // Basic form state
    const [email, setEmail] = useState("");
    const [annotationType, setAnnotationType] = useState(ANNOTATION_OPTIONS[0].value);
    const [analysisTitle, setAnalysisTitle] = useState("");
    const [gseaFileName, setGSEAFileName] = useState("");
    
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const [taskId, setTaskId] = useState(null);
    const [taskStatus, setTaskStatus] = useState('Idle');
    const [isRunning, setIsRunning] = useState(false);
    const { progress, progressMessage, resultUrl } = useTaskWebSocket(taskId, setTaskStatus, setIsRunning);
    
    // Form validation logic
    const validateFields = () => {
        const newErrors = {};
        validation.resetValidationErrors();

        // Validate email
        if (email) {
            if(!isValidEmail(email)){
                newErrors.email = "Email format is not valid";
            }
        } else {
            newErrors.email = "Email is required";
        }

        // Validate analysis title (if provided)
        if (analysisTitle) {
            if (analysisTitle.length > 20) {
                newErrors.analysisTitle = "Title must be 20 characters or fewer";
            } else if (!isASCII(analysisTitle)) {
                newErrors.analysisTitle = "Title must contain only text characters";
            }
        }
        
        // Validate GSEA gene set file
        if (!gseaFileName) {
            newErrors.gseaFile = "GSEA Gene Set is required";
        }

        // Set all errors at once
        validation.resetValidationErrors();
        Object.entries(newErrors).forEach(([field, message]) =>
            validation.setValidationError(field, message)
        );
        
        const hasErrors = Object.keys(newErrors).length > 0;
        
        return hasErrors;
    };

    // Utility function to check ASCII characters
    const isASCII = (text) => /^[\x09\x0A\x0D\x20-\x7E]*$/.test(text);
    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const hasRequiredColumns = (file) => {
        const requiredColumns = ['ID', 'log2FoldChange', 'pvalue'];
      
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
      
          reader.onload = (event) => {
            const text = event.target.result;
            const [headerLine] = text.split(/\r?\n/);
      
            const headers = headerLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      
            const hasAll = requiredColumns.every(col => headers.includes(col));
            resolve(hasAll);
          };
      
          reader.onerror = (error) => reject(error);
      
          const blob = file.slice(0, 1024);
          reader.readAsText(blob);
        });
      };

    const onHandleFileDrop = async (e) => {
        validation.resetValidationErrors();
        const file = e.dataTransfer.files[0];

        if (!file) {
            const message = "No file was provided";
            validation.setValidationError('gseaFile', message);
            return {valid: false, message: message};
        }

        try {
            const valid = await hasRequiredColumns(file);
            if (!valid) {
                const message = "Input CSV requires header with: [ ID, log2FoldChange, and pvalue ] columns";
                validation.setValidationError('gseaFile', message);
                return {valid: false, message: message};
            }
        } catch (err) {
            const message = "Unable to read file header line";
            validation.setValidationError('gseaFile', message);
            return {valid: false, message: message};
        }
      

        try {
            setLoading(true);
            setErrorMessage("");
        
            const formData = new FormData();
            formData.append("file", file);

            const response_data = await upload_file(formData);
            
            if (response_data && response_data.job_id) {
                setGSEAFileName(`${response_data.job_id}/${file.name}`);
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
    

    const onClickRunGSEA = async () => {
        if (validateFields()) return;
        
        setIsRunning(true);
        setTaskStatus('Starting');
        
        // Prepare request payload
        const gseaRequest = {
            gene_set: gseaFileName,
            title: analysisTitle || "GSEA", // Default title if empty
            email: email,
            annotation_file_name: annotationType,
        };

        try {
            const response_data = await perform_gsea_analysis(gseaRequest);
        
            if (response_data?.run_id) {
                setTaskId(response_data.run_id);
            } else {
                setTaskStatus('FAILED');
                setErrorMessage(`GSEA Analysis Failed: ${response_data.message}`)
                setIsRunning(false);
            }
        } catch (error) {
            const message = error?.response?.data?.message || error?.message || String(error);
            setErrorMessage(`Unexpected error: ${message}`);
            setTaskStatus('FAILED');
            setIsRunning(false);
        } 
    };

  return {
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
  };
};