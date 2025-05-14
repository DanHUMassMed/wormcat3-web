import { useState } from "react";
import { useFieldValidation } from "./useFieldValidation";
import { ANNOTATION_OPTIONS, SIGNIFICANCE_METHODS, DOMAIN_SCOPES } from "../components/constants";
import { assertDefined } from "../util/utilities"

export const useWormCatFields = (requiredGeneSet = false) => {
    const validation = useFieldValidation();

    // Basic form state
    const [email, setEmail] = useState("daniel.higgins@gatech.edu");
    const [annotationType, setAnnotationType] = useState(ANNOTATION_OPTIONS[0].value);
    const [significanceMethod, setSignificanceMethod] = useState(SIGNIFICANCE_METHODS[0].value);
    const [significanceThreshold, setSignificanceThreshold] = useState("0.05");
    const [analysisTitle, setAnalysisTitle] = useState("");
    const [statisticalDomain, setStatisticalDomain] = useState(DOMAIN_SCOPES[0].value);
    const [customBackgroundText, setCustomBackgroundText] = useState("");
    const [geneSetText, setGeneSetText] = useState("");
    const [fileNames, setFileNames] = useState({});

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

        // Validate significanceThreshold threshold
        const thresholdValue = parseFloat(significanceThreshold);
        if (isNaN(thresholdValue) || thresholdValue <= 0 || thresholdValue > 1) {
            newErrors.significanceThreshold = "Significance Threshold must be a number > 0 and ≤ 1";
        }

        // Validate analysis title (if provided)
        if (analysisTitle) {
            if (analysisTitle.length > 20) {
                newErrors.analysisTitle = "Title must be 20 characters or fewer";
            } else if (!isASCII(analysisTitle)) {
                newErrors.analysisTitle = "Title must contain only text characters";
            }
        }

        // Validate custom background if selected
        if (statisticalDomain === "custom") {
            const backgroundValidation = isValidGeneSet(customBackgroundText);
            if (!backgroundValidation.valid) {
                newErrors.customBackground = backgroundValidation.message;
            }
        }
        
        // Validate gene set if required
        if(requiredGeneSet){
            const geneSetValidation = isValidGeneSet(geneSetText);
            if (!geneSetValidation.valid) {
                newErrors.geneSet = geneSetValidation.message;
            }
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
    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    
    const isValidGeneSet = (text) => {
        if (!text.trim()) {
            return { valid: false, message: "Gene Set cannot be empty" };
        }
        
        if(!isASCII(text)){
            return { valid: false, message: "Gene Set must contain only text characters" };
        }

        // Split input into non-empty trimmed lines
        const lines = text
            .split("\n")
            .map(line => line.trim())
            .filter(line => line !== "");
        
        // Rule 1: At least 2 rows
        if (lines.length < 2) {
            return { valid: false, message: "Gene Set must have at least 2 entries" };
        }
        
        // Rule 2: Each line ≤ 20 characters
        if (lines.some(line => line.length > 20)) {
            return { 
            valid: false, 
            message: "Some lines exceed 20 characters (only one Gene Id per line)" 
            };
        }
        
        const startsWithWBGene = line => line.startsWith("WBGene");
        
        // Rule 3: Consistency in format
        // Either both lines start with WBGene or both do not
        const isConsistent =
            startsWithWBGene(lines[0]) === startsWithWBGene(lines[1]);

        if (!isConsistent) {
            return { 
            valid: false, 
            message: "The first two Gene Ids must use the same format" 
            };
        }
        
        // All rules passed
        return { valid: true };
    };

    // Helper function to read a text file and validate ASCII content
    const readTextFile = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                const text = event.target.result;
                // Check if text contains only ASCII characters
                const isValidGeneSetResult = isValidGeneSet(text);
                if (!isValidGeneSetResult.valid) {
                    resolve(isValidGeneSetResult);
                } else {
                    resolve({
                    valid: true,
                    text: text,
                    message: ""
                    });
                }
            };
            
            reader.onerror = () => {
            resolve({
                valid: false,
                text: null,
                message: "Error reading file. Please try again."
            });
            };
            
            reader.readAsText(file);
        });
    };

    const handleLocalFileExpand = async (e, context, textSetter = null) => {
        assertDefined(context,"context")
        e.preventDefault();
        validation.resetValidationErrors();
        const file = e.dataTransfer.files[0];
    
        if (!file) {
            validation.setValidationError(context, "Please upload a valid file.");
            return;
        }
       
        // For text files that need to be read into a textarea
        if (textSetter) {
            // Use the helper function to read and validate the text file
            const readResult = await readTextFile(file);
            
            if (readResult.valid) {
                // Set the text and update filename only if valid
                textSetter(readResult.text);
                setFileNames(prev => ({
                    ...prev,
                    [context]: file.name
                }));
            } else {
                // If we have validation errors, set them
                if (context) {
                    validation.setValidationError(context, readResult.message);
                }
            }
            
            return {
                valid: readResult.valid,
                message: readResult.message,
                file: file
            };
        } 
        
      };
    

  return {
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
    geneSetText, 
    setGeneSetText,
    
    // Validation
    validation,
    validateFields,

    // File load
    handleLocalFileExpand,
    fileNames
  };
};