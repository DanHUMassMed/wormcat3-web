import React, { useState, useRef } from "react";

// File Upload Component with improved drag handling and click-to-browse functionality
const FileUploadZone = ({ fileName, onDrop, label, id }) => {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
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
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    dragCounter.current = 0;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onDrop(e);
      e.dataTransfer.clearData();
    }
  };
  
  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      // Create a synthetic drop event to use the same handler
      const event = {
        preventDefault: () => {},
        dataTransfer: {
          files: e.target.files,
          clearData: () => {}
        }
      };
      onDrop(event);
    }
  };

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
          isDraggingOver 
            ? "border-blue-500 bg-blue-50" 
            : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
        }`}
        id={id}
      >
        {fileName ? (
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

export default FileUploadZone;