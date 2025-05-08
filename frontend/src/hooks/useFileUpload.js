import { useState } from "react";
import { useFormValidation } from "./useFormValidation";

export const useFileUpload = () => {
  const [fileNames, setFileNames] = useState({});
  const [fileContents, setFileContents] = useState({});
  const validation = useFormValidation();

  const handleFileDrop = (e, context, textSetter = null) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];

    if (context === "excelFile") {
      const excelFileValidation = validation.isValidExcelFile(file);
      if (!excelFileValidation.valid) {
        return { valid: false, message: excelFileValidation.message };
      }
    }
    if (!file) return { valid: false, message: "Please upload a valid file." };

    // Update file name
    setFileNames(prev => ({
      ...prev,
      [context]: file.name
    }));

    // For text files that need to be read into a textarea
    if (textSetter) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        textSetter(text);
      };
      reader.readAsText(file);
    } 
    // For binary files like Excel
    else {
      setFileContents(prev => ({
        ...prev,
        [context]: file
      }));
    }
    return { valid: true, file };
  };

  return {
    fileNames,
    fileContents,
    handleFileDrop
  };
};