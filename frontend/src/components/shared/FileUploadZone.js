import React, { useState, useRef } from "react";

// File Upload Component with improved drag handling, click-to-browse functionality, and error display
export  const FileUploadZone = ({ fileName, onDrop, label, id, errorMessage, disabled = false }) => {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [error, setError] = useState(errorMessage || null);
  const dropzoneRef = useRef(null);
  const fileInputRef = useRef(null);
  const dragCounter = useRef(0);
  
  const handleDragIn = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDraggingOver(true);
    }
  };
  
  const handleDragOut = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDraggingOver(false);
    }
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    dragCounter.current = 0;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      try {
        setError(null); // Clear any previous errors
        const result = await onDrop(e);
        
        // Process the specific return format from onDrop
        if (result && typeof result === 'object') {
          if (!result.valid && result.message) {
            setError(result.message);
          }
        }
      } catch (err) {
        setError(err.message || "Failed to upload file");
      } finally {
        e.dataTransfer.clearData();
      }
    }
  };
  
  const handleFileInputChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      // Create a synthetic drop event to use the same handler
      const event = {
        preventDefault: () => {},
        dataTransfer: {
          files: e.target.files,
          clearData: () => {}
        }
      };
      
      try {
        setError(null); // Clear any previous errors
        const result = await onDrop(event);
        
        // Process the specific return format from onDrop
        if (result && typeof result === 'object') {
          if (!result.valid && result.message) {
            setError(result.message);
          }
        }
      } catch (err) {
        setError(err.message || "Failed to upload file");
      }
    }
  };

  // Update error state if errorMessage prop changes
  React.useEffect(() => {
    setError(errorMessage || null);
  }, [errorMessage]);

  return (
    <div className="mb-4">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileInputChange}
        aria-label={`Upload ${label} file`}
      />
      <div
        ref={dropzoneRef}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current && fileInputRef.current.click()}
        className={`border-2 border-dashed rounded p-6 text-center cursor-pointer transition-all duration-200 ${
          error 
            ? "border-red-500 bg-red-50" 
            : isDraggingOver 
              ? "border-blue-500 bg-blue-50" 
              : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
        }`}
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        style={{ pointerEvents: disabled ? "none" : "auto", opacity: disabled ? 0.5 : 1 }}
      >
        {error ? (
          <div className="flex flex-col items-center justify-center">
            <svg className="w-8 h-8 text-red-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <p className="text-red-600 font-medium">{error}</p>
            <p className="text-sm text-red-400 mt-1">
              Click to try again
            </p>
          </div>
        ) : fileName ? (
          <div className="flex flex-col items-center justify-center">
            <svg className="w-8 h-8 text-green-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <p className="text-green-600 font-medium">{fileName} loaded</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <svg className={`w-8 h-8 mb-2 ${isDraggingOver ? "text-blue-500" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
            </svg>
            <p className={`font-medium ${isDraggingOver ? "text-blue-600" : "text-gray-500"}`}>
              {isDraggingOver ? "Release to upload file" : `Drag & drop your ${label} file here`}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              or click to browse
            </p>
          </div>
        )}
      </div>

    </div>
  );
};
