import React from 'react';
import { Info, FileText, UploadCloud, Settings } from 'lucide-react';

const Usage_RGS = () => {
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

        {/* Instruction List */}
        <div className="space-y-8 text-gray-800 text-base">
          {/* Step 1 */}
          <div className="flex items-start space-x-4">
            <Info className="w-6 h-6 text-blue-600 mt-1" />
            <div>
              <h3 className="text-lg font-medium">Enter Your Email</h3>
              <p>Provide a valid email address where you want to receive your results.</p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start space-x-4">
            <Settings className="w-6 h-6 text-blue-600 mt-1" />
            <div>
              <h3 className="text-lg font-medium">Select Analysis Settings</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Annotation Type:</strong> Choose a dataset such as <em>Whole genome</em>.</li>
                <li><strong>Significance Method:</strong> Select a method like Bonferroni correction.</li>
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
            <div>
              <h3 className="text-lg font-medium">Upload Your Gene Set</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Drag & drop a file or click to browse.</li>
                <li>Or paste gene IDs directly into the text box below.</li>
                <li>Each ID should be on a separate line (e.g., WBGene or sequence IDs).</li>
              </ul>
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

export default Usage_RGS;