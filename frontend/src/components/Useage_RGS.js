import React from 'react';
import { FileText, UploadCloud, Settings, Mail, FileSpreadsheet, AlertTriangle } from 'lucide-react';

const UsageRGS = () => {
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
              How to Use WormCat
            </span>
          </div>
        </div>

        {/* Introductory Section */}
        <div className="mb-10 text-gray-700 text-lg">
          <p>
            <strong>WormCat</strong> is designed for <em>C. elegans</em> researchers to categorize and visualize gene set enrichment data. 
            Whether your input comes from RNA-seq, microarray, or RNAi screens, WormCat enables fast, intuitive annotation and generates a scaled bubble chart 
            that allows the visualization and direct comparison of complex datasets. 
            Follow the steps below to upload your gene list and run an analysis.
          </p>
        </div>

        {/* Instruction List */}
        <div className="space-y-8 text-gray-800 text-base">
          {/* Step 1 */}
          <div className="flex items-start space-x-4">
            <Mail className="w-6 h-6 text-blue-600 mt-1" />
            <div>
              <h3 className="text-lg font-medium">Enter Your Email</h3>
              <p>Provide a valid email address.</p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start space-x-4">
            <Settings className="w-6 h-6 text-blue-600 mt-1" />
            <div>
              <h3 className="text-lg font-medium">Select Analysis Settings</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Annotation Type:</strong> Choose a categorically named dataset such as <em>Whole genome</em>.</li>
                <li><strong>Significance Method:</strong> Select a method Bonferroni correction or Benjamini-Hochberg FDR.</li>
                <li><strong>Threshold:</strong> Adjust the p-value cutoff (e.g., 0.05).</li>
                <li><strong>Statistical Domain Scope:</strong> 
                  <ul className="list-disc list-inside ml-5">
                    <li><strong>All Genes:</strong> Compare against the full genome background.</li>
                    <li><strong>Custom:</strong> Provide your own background set.</li>
                  </ul>
                </li>
              </ul>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start space-x-4">
            <FileText className="w-6 h-6 text-blue-600 mt-1" />
            <div>
              <h3 className="text-lg font-medium">Add a Title</h3>
              <p>Optionally provide a title to label your analysis results.</p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex items-start space-x-4">
            <UploadCloud className="w-6 h-6 text-blue-600 mt-1" />
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Upload Your Gene Set</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Drag & drop a file or click to browse.</li>
                <li>Or paste gene IDs directly into the text box.</li>
                <li>Supported ID formats: <code>WBGene</code> or <code>Sequence ID</code>.</li>
              </ul>

              <div className="flex items-start space-x-3">
                <FileSpreadsheet className="w-6 h-6 text-green-600 mt-1" />
                <div>
                    <p className="font-medium text-gray-700">
                    Not sure what format to use?
                    </p>
                    <p>
                    You can download an example CSV file <a href="/static/download/sample_rgs.csv" className="text-blue-700 underline">here</a> to confirm the required format.
                    </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-6 h-6 text-yellow-600 mt-1" />
                <div>
                  <p className="font-semibold text-yellow-800">Formatting Requirements:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>The CSV file must include a column header named <code>Sequence ID</code> or <code>Wormbase ID</code> (case-sensitive).</li>
                  </ul>
                </div>
              </div>

              <div className="mt-4">
                <img src="/static/images/sample_rgs.png" alt="Sample CSV file" className="border rounded shadow-md" />
                <p className="text-sm text-gray-600 mt-2 text-center">Example of a correctly formatted CSV file</p>
              </div>
            </div>
          </div>

          {/* Final Step */}
          <div className="bg-blue-100 border-l-4 border-blue-500 p-4 rounded-lg">
            <p className="text-blue-800 font-medium">
              When ready, click <span className="font-bold">Submit and Run Analysis</span> to process your gene set.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsageRGS;