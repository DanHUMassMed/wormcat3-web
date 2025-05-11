import { useState } from "react";
import axios from 'axios';
import { useFormValidation } from "./useFormValidation";

export const useFileUpload = (setUploadId) => {
  const [fileNames, setFileNames] = useState({});
  const [fileContents, setFileContents] = useState({});
  const [uploadStatus, setUploadStatus] = useState("");
  const validation = useFormValidation();

  // Separate function to handle Excel file uploads
  const uploadFile = async (context, file) => {
    try {
      if (!file) {
        throw new Error("No file provided for upload");
      }
      
      setUploadStatus("Preparing upload...");
      
      const formData = new FormData();
      formData.append("file", file);
      
      const requestConfig = {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      };
      
      setUploadStatus("Uploading file...");
      const response = await axios.post(
        "http://localhost:8000/wormcat3/upload_file", 
        formData, 
        requestConfig
      );
      
      if (response.data && response.data.job_id) {
        setUploadId(`${response.data.job_id}/${file.name}`);
        const successMessage = `Upload successful. Job ID: ${response.data.job_id}`;
        setUploadStatus(successMessage);
        validation.setValidationErrors(context, "Upload successful.")
        return { success: true, jobId: response.data.job_id, message: successMessage };
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      const errorMessage = `Upload failed: ${error.message || error}`;
      validation.setValidationErrors(context, errorMessage)
      setUploadStatus(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  // Helper function to read a text file and validate ASCII content
  const readTextFile = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const text = event.target.result;
        // Check if text contains only ASCII characters
        const isAscii = /^[\x00-\x7F]*$/.test(text);
        
        if (!isAscii) {
          resolve({
            valid: false,
            text: null,
            message: "Error: File contains non-ASCII characters. Please use ASCII text only."
          });
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

  const handleFileDrop = async (e, context, textSetter = null) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];

    if (!file) return { valid: false, message: "Please upload a valid file." };

    if (context === "excelFile") {
      const excelFileValidation = validation.isValidExcelFile(file);
      if (!excelFileValidation.valid) {
        validation.setValidationErrors(context, excelFileValidation.message)
        return { valid: false, message: excelFileValidation.message };
      }
      
      // Call the separate upload function
      const uploadResult = await uploadFile(context, file);

      // Update file name
      if (uploadResult.success) {
        setFileNames(prev => ({
          ...prev,
          [context]: file.name
        }));
      }

      return { 
        valid: uploadResult.success, 
        jobId: uploadResult.jobId,
        message: uploadResult.message,
        file: file
      };
    }else if (context === "gseaFile") {
        // Call the separate upload function
        const uploadResult = await uploadFile(context, file);
  
        // Update file name
        if (uploadResult.success) {
          setFileNames(prev => ({
            ...prev,
            [context]: file.name
          }));
        }
  
        return { 
          valid: uploadResult.success, 
          jobId: uploadResult.jobId,
          message: uploadResult.message,
          file: file
        };
    } else {
      // Handle non-Excel files
      
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
            validation.setValidationErrors(context, readResult.message);
          }
        }
        
        return {
          valid: readResult.valid,
          message: readResult.message,
          file: file
        };
      } 
      // For binary files (non-Excel)
      else {
        setFileContents(prev => ({
          ...prev,
          [context]: file
        }));
        
        // Update file name for binary files
        setFileNames(prev => ({
          ...prev,
          [context]: file.name
        }));
        
        return {
          valid: true,
          message: "",
          file: file
        };
      }
    }
  };

  return {
    fileNames,
    fileContents,
    handleFileDrop,
    uploadStatus,
    setUploadStatus,
    uploadFile // Exposing this in case it needs to be called directly
  };
};