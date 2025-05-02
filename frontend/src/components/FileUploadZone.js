import React, { useState } from "react";

// File Upload Component
const FileUploadZone = ({ fileName, onDrop, label, id }) => {
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    
    return (
      <div>
        <div
          onDrop={(e) => {
            e.preventDefault();
            setIsDraggingOver(false);
            onDrop(e);
          }}
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={(e) => {
            e.preventDefault();
            setIsDraggingOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDraggingOver(false);
          }}
          className={`border-2 border-dashed rounded p-6 text-center cursor-pointer mb-2 transition-colors ${
            isDraggingOver 
              ? "border-blue-500 bg-blue-50" 
              : "border-gray-300 hover:border-blue-500"
          }`}
          id={id}
        >
          {fileName ? (
            <p className="text-green-600 font-medium">{fileName} loaded</p>
          ) : (
            <p className={`${isDraggingOver ? "text-blue-600" : "text-gray-500"}`}>
              {isDraggingOver ? "Release to upload file" : `Drop ${label} File Here`}
            </p>
          )}
        </div>
      </div>
    );
  };
  
  export default FileUploadZone;