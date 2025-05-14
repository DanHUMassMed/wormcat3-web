import { useState } from "react";
import { useFieldValidation } from "./useFieldValidation";
import { upload_file } from "../api/enrichmentAPI";
import { ANNOTATION_OPTIONS } from "../components/constants";
import { useNavigate } from "react-router-dom";
import { perform_gsea_analysis } from "../api/enrichmentAPI";


export const useWormCatGSEAProcessor = () => {
    const navigate = useNavigate();
    const validation = useFieldValidation();

    // Basic form state
    const [email, setEmail] = useState("daniel.higgins@umassmed.edu");
    const [annotationType, setAnnotationType] = useState(ANNOTATION_OPTIONS[0].value);
    const [analysisTitle, setAnalysisTitle] = useState("");
    const [gseaFileName, setGSEAFileName] = useState("");
    
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // Form validation logic
    const validateFields = () => {
        const newErrors = {};
        validation.resetValidationErrors();

        // Validate email
        if (!email) {
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
        console.log("Validation errors:", newErrors);
        
        return hasErrors;
    };

    // Utility function to check ASCII characters
    const isASCII = (text) => /^[\x09\x0A\x0D\x20-\x7E]*$/.test(text);

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
        console.log("in handleGSEASubmit")
        validation.resetValidationErrors();
        // Validate email
        if (validateFields()) return;
        
        setLoading(true);
        setErrorMessage("");
        
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
            navigate(`/gsea_report/${response_data.run_id}`);
        } else {
            setErrorMessage("Analysis failed: no run ID returned from the server.");
        }
        } catch (error) {
        // Handle specific error types
        if (error.name === "AbortError") {
            setErrorMessage("Request timed out. Please try again later.");
        } else {
            setErrorMessage(`Error: ${error.message || "Failed to process analysis"}`);
        }
        console.error("Analysis error:", error);
        } finally {
        setLoading(false);
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
    onClickRunGSEA
  };
};