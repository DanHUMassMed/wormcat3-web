import React from 'react';
import { BookOpenCheck, ExternalLink } from 'lucide-react';

const Citation = () => {
  return (
    <div id="citation" className="bg-gray-50 border-t border-gray-200 py-16">
      <div className="max-w-3xl mx-auto px-6">
        {/* Title with gradient bar */}
        <div className="relative mb-12">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full h-1 bg-gradient-to-r from-purple-200 via-purple-600 to-purple-200"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-gray-50 px-6 text-3xl font-semibold text-purple-800">
              Citation
            </span>
          </div>
        </div>

        {/* Citation Info Box */}
        <div className="bg-white shadow-md rounded-lg border-l-4 border-purple-600 p-6 space-y-5">
          <div className="flex items-start space-x-4">
            <BookOpenCheck className="w-6 h-6 text-purple-700 mt-1" />
            <p className="text-gray-700 text-base">
              If you use <span className="font-semibold text-gray-900">WormCat</span> in a published work, please cite:
            </p>
          </div>

          <div className="pl-10">
            <h3 className="text-lg font-semibold text-gray-900">
              WormCat: an online tool for annotation and visualization of Caenorhabditis elegans genome-scale data
            </h3>
            <p className="text-sm text-gray-700">
              Amy D Holdorf, Daniel P Higgins, Anne C. Hart, Peter R Boag, Gregory Pazour, Albertha J. M. Walhout, Amy Karol Walker
            </p>
            <p className="text-sm font-medium text-gray-800 flex items-center space-x-2">
              <a
                href="https://www.genetics.org/content/214/2/279"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200"
              >
                GENETICS February 1, 2020 vol. 214 no. 2 279–294
              </a>
              <ExternalLink className="w-4 h-4 text-blue-500" />
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Citation;