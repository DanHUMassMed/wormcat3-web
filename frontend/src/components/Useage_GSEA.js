import React from 'react';
import { Mail, Settings, FileText, UploadCloud, FileSpreadsheet, AlertTriangle } from 'lucide-react';

const Usage_GSEA = () => {
  return (
    <div id="usage-gsea" className="bg-gray-50 border-t border-gray-200 py-16">
      <div className="max-w-4xl mx-auto px-6">
        {/* Title with gradient bar */}
        <div className="relative mb-12">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full h-1 bg-gradient-to-r from-blue-200 via-blue-600 to-blue-200"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-gray-50 px-6 text-3xl font-semibold text-blue-800">
              How to Run Gene Set Enrichment Analysis (GSEA)
            </span>
          </div>
        </div>

        {/* Introductory Section */}
        <div className="mb-10 text-gray-700 text-lg">
          <p>
            <strong>WormCat GSEA</strong> (Gene Set Enrichment Analysis) ranks your genes based on a continuous metric
            —using fold change of expression levels—and compares this ranked list against WormCat categories. 
            Instead of using a fixed cutoff, GSEA identifies whether entire categories tend to appear at the top or bottom of your list, 
            providing deeper insight into patterns of enrichment across the full dataset. </p>
        </div>

        {/* Instructions */}
        <div className="space-y-8 text-gray-800 text-base">
          {/* Step 1 */}
          <div className="flex items-start space-x-4">
            <Mail className="w-6 h-6 text-blue-600 mt-1" />
            <div>
              <h3 className="text-lg font-medium">Enter Your Email</h3>
              <p>Use a valid email address.</p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start space-x-4">
            <Settings className="w-6 h-6 text-blue-600 mt-1" />
            <div>
              <h3 className="text-lg font-medium">Select Annotation Type</h3>
              <p>Choose from the available annotation databases. <strong>Whole genome</strong> is the default option.</p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start space-x-4">
            <FileText className="w-6 h-6 text-blue-600 mt-1" />
            <div>
              <h3 className="text-lg font-medium">Optional: Add an Analysis Title</h3>
              <p>This helps label your submission and organize the output later.</p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex items-start space-x-4">
            <UploadCloud className="w-6 h-6 text-blue-600 mt-1" />
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Upload Your CSV File</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Drag and drop your CSV file or click to browse and upload.</li>
                <li>The CSV must contain the following columns (case-sensitive): <code>ID</code>, <code>log2FoldChange</code>, and <code>pvalue</code>.</li>
                <li>Output from DESeq2 is typically compatible.</li>
              </ul>

              <div className="flex items-start space-x-3">
                <FileSpreadsheet className="w-6 h-6 text-green-600 mt-1" />
                <div>
                  <p className="font-medium text-gray-700">
                    Not sure what format to use?
                  </p>
                  <p>
                    You can download an example CSV file <a href="/static/download/sample_gsea.csv" className="text-blue-700 underline">here</a> to see the correct structure.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-6 h-6 text-yellow-600 mt-1" />
                <div>
                  <p className="font-semibold text-yellow-800">Formatting Tips:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Make sure all required columns are present with exact column names.</li>
                    <li>Extra columns in the input data are ignored.</li>
                    <li>Values must be numeric in <code>log2FoldChange</code> and <code>pvalue</code> columns.</li>
                  </ul>
                </div>
              </div>

              <div className="mt-4">
                <img src="/static/images/sample_gsea.png" alt="Sample Excel file" className="border rounded shadow-md" />
                <p className="text-sm text-gray-600 mt-2 text-center">Example of a correctly formatted GSEA CSV file</p>
              </div>
            </div>
          </div>

          {/* Final Step */}
          <div className="bg-blue-100 border-l-4 border-blue-500 p-4 rounded-lg">
            <p className="text-blue-800 font-medium">
              Once all fields are filled, click <strong>Submit and Run GSEA</strong> to begin your analysis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Usage_GSEA;