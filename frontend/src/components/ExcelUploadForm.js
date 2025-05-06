import React, { useState } from "react";
import axios from "axios";

const UploadForm = () => {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setStatus("Please select a file first.");
      return;
    }

    const formData = new FormData();
    const requestConf = {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    };
    formData.append("file", file);
    setStatus("Prepare upload.");
    try {
      setStatus("Prepare upload....");
      const response = await axios.post("http://localhost:8000/wormcat3/upload_excel/", formData, );
      setStatus(`Upload successful. Job ID: ${response.data.job_id}`);
    } catch (error) {
      setStatus(`Upload failed.${error}`);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-bold mb-4">Upload Excel File</h2>
      <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} className="mb-4" />
      <button
        onClick={handleUpload}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Upload
      </button>
      {status && <p className="mt-4 text-sm text-gray-700">{status}</p>}
    </div>
  );
};

export default UploadForm;