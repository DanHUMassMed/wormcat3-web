import React from "react";
import { motion } from "framer-motion";
import { FormField } from "./FormField";
import { FileUploadZone } from "./FileUploadZone.js";

export const CustomBackgroundSection = ({
  show,
  fileName,
  customBackgroundText,
  setCustomBackgroundText,
  handleFileDrop,
  error,
  disabled = false
}) => {
  if (!show) return null;
  
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="overflow-hidden"
    >
      <div className="border-2 border-dashed border-orange-400 rounded-md p-4 md:p-6 mb-4">
        <FormField label="Custom Background Gene Set" 
          required
          error={error}>
            <FileUploadZone 
              fileName={fileName}
              onDrop={(e) => handleFileDrop(e, 'customBackground')}
              label="Custom Background"
              id="custom-background-drop"
              disabled={disabled}
            />
            <textarea
              id="custom-background-textarea-id"
              value={customBackgroundText}
              onChange={(e) => setCustomBackgroundText(e.target.value)}
              placeholder="Or paste custom background gene set (one gene ID per line)"
              rows="5"
              className={`w-full border rounded p-2 mt-2 focus:outline-none focus:ring-2 ${
                error 
                  ? "border-red-500 focus:ring-red-500" 
                  : "focus:ring-blue-500"
              }`}
              disabled={disabled}
            />
        </FormField>
      </div>
    </motion.div>
  );
};
