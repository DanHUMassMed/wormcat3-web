import React from "react";

export const FormField = ({ label, children, required = false, error = null }) => {
  return (
    <div className="mb-3">
      <label className="block font-semibold mb-0.5 text-sm">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-red-500 mt-0.5 text-xs">{error}</p>
      )}
    </div>
  );
}