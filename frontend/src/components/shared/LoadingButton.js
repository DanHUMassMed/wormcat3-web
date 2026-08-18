
import React from "react";

// LoadingButton component
export const LoadingButton = ({ loading, text, loadingText = "Processing...", onClick, disabled = false }) => {
  return (
    <button
      type="button" // Changed from "submit" to allow multiple buttons
      disabled={loading || disabled}
      onClick={onClick}
      className={`w-full p-3 text-white font-bold rounded-lg transition-colors ${
        loading || disabled
          ? "bg-gray-500 cursor-not-allowed" 
          : "bg-blue-600 hover:bg-blue-700"
      }`}
    >
      {loading ? (
        <div className="flex items-center justify-center space-x-2">
          <svg
            className="animate-spin h-5 w-5 text-white"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="white"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="white"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span>{loadingText}</span>
        </div>
      ) : (
        text
      )}
    </button>
  );
};