import React from "react";

export const FormField = ({ label, children, required = false, error = null }) => {
  return (
    <div>
      <label className="block font-semibold mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-red-500 mt-1 text-sm">{error}</p>
      )}
    </div>
  );
}