import React from 'react';
import { FileText, UploadCloud, Settings, Mail, FileSpreadsheet, AlertTriangle } from 'lucide-react';

const UsageBatchRGS = () => {
  return (
    <div id="usage" className="bg-gray-50 border-t border-gray-200 py-16">
      <div className="max-w-4xl mx-auto px-6">
        {/* Title with gradient bar */}
        <div className="relative mb-12">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full h-1 bg-gradient-to-r from-blue-200 via-blue-600 to-blue-200"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-gray-50 px-6 text-3xl font-semibold text-blue-800">
              How to Process a Batch of Gene Sets
            </span>
          </div>
        </div>

        {/* Introductory Section */}
        <div className="mb-10 text-gray-700 text-lg">
          <p>
            <strong>WormCat Batch</strong> allows you to run gene set enrichment analysis on multiple datasets at once. 
            By uploading a Microsoft Excel file containing several gene sets, you can perform batch analysis efficiently. 
            For each gene set, WormCat provides individual enrichment results along with a summary Excel file that makes it easy 
            to compare across datasets. </p>
        </div>

        {/* Instructions */}
        <div className="space-y-8 text-gray-800 text-base">
          {/* Step 1 */}
          <div className="flex items-start space-x-4">
            <Mail className="w-6 h-6 text-blue-600 mt-1" />
            <div>
              <h3 className="text-lg font-medium">Enter Your Email</h3>
              <p>Use a valid email address to receive the results.</p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start space-x-4">
            <Settings className="w-6 h-6 text-blue-600 mt-1" />
            <div>
              <h3 className="text-lg font-medium">Select Analysis Settings</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Annotation Type:</strong> Choose <em>Whole genome</em> or another supported type.</li>
                <li><strong>Significance Method:</strong> Pick between <em>Bonferroni correction</em> or <em>Benjamini-Hochberg</em>.</li>
                <li><strong>Threshold:</strong> Set the p-value cutoff (commonly <code>0.05</code>).</li>
                <li><strong>Statistical Domain Scope:</strong> Decide if you want to compare against <em>All Genes</em> or a custom background.</li>
              </ul>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start space-x-4">
            <FileText className="w-6 h-6 text-blue-600 mt-1" />
            <div>
              <h3 className="text-lg font-medium">Add a Title (Optional)</h3>
              <p>This will label the batch analysis results, making it easier to track and organize them later.</p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex items-start space-x-4">
            <UploadCloud className="w-6 h-6 text-blue-600 mt-1" />
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Upload Excel File</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Drag and drop your Excel file or click to browse and upload.</li>
                <li>Each sheet in the Excel file should contain a single column of gene IDs.</li>
                <li>Supported ID formats: <code>WBGene</code> or <code>Sequence ID</code>.</li>
              </ul>

              <div className="flex items-start space-x-3">
                <FileSpreadsheet className="w-6 h-6 text-green-600 mt-1" />
                <div>
                    <p className="font-medium text-gray-700">
                    Not sure what format to use?
                    </p>
                    <p>
                    You can download an example Excel file <a href="/static/download/Murphy_TS.xlsx" className="text-blue-700 underline">here</a> to confirm the required format.
                    </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-6 h-6 text-yellow-600 mt-1" />
                <div>
                  <p className="font-semibold text-yellow-800">Formatting Requirements:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Spreadsheet file must end with <code>.xlsx</code> or <code>.xls</code>.</li>
                    <li>Spreadsheet name: Should be composed of ONLY Letters, Numbers, and Underscores (_).</li>
                    <li>Each sheet (tab name): Should be composed of ONLY Letters, Numbers, and Underscores (_).</li>
                    <li>Each sheet must include a column header named <code>Sequence ID</code> or <code>Wormbase ID</code> (case-sensitive).</li>
                  </ul>
                </div>
              </div>

              <div className="mt-4">
                <img src="/static/images/sample_excel.png" alt="Sample Excel file" className="border rounded shadow-md" />
                <p className="text-sm text-gray-600 mt-2 text-center">Example of a correctly formatted Excel file</p>
              </div>
            </div>
          </div>

          {/* Final Step */}
          <div className="bg-blue-100 border-l-4 border-blue-500 p-4 rounded-lg">
            <p className="text-blue-800 font-medium">
              Choose either <strong>Send me an Email</strong> to receive results by email, or <strong>Let it run I’ll wait</strong> to process immediately in-browser.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsageBatchRGS;