import React from 'react';
import { Mail, MessageCircleCode, Earth, CloudDownload } from 'lucide-react';

const Footer = () => {
  return (
    <footer id="contact" className="bg-gray-100 py-3">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap -mx-4">
          
          <div className="w-full md:w-1/3 px-2 mb-0">
            <div>
              <h4 className="text-xl font-semibold mb-4">Contact Info</h4>
              <p className="mb-4">Please send your comments, suggestions and bug reports to the team.</p>
              <div className="space-y-2 text-sm">
                <p className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <a href="mailto:amy.walker@umassmed.edu" className="text-blue-600 hover:underline">
                    WormCat Admin
                  </a>
                </p>
                <p className="flex items-center space-x-2">
                  <MessageCircleCode className="w-4 h-4 text-gray-500" />
                  <a href="https://twitter.com/akwalker_lab" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    akwalker_lab
                  </a>
                </p>
                <p className="flex items-center space-x-2">
                  <Earth className="w-4 h-4 text-gray-500" />
                  <a href="http://www.amywalkerlab.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    www.amywalkerlab.com
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Category Data */}
          <div className="w-full md:w-1/3 px-2 mb-0">
            <div>
              <h4 className="text-xl font-semibold mb-4">Category Data</h4>
              <p className="mb-4">Downloads of the Category Data are available below.</p>

              <div className="flex mb-4">
              <div className="flex items-top space-x-2">
                <CloudDownload className="w-5 h-5 text-gray-500" />
                <div>
                  <a href="/static/download/whole_genome_v2_nov-11-2021.csv" className="text-blue-600 hover:underline">
                    <div className="font-medium">Whole genome v2</div>
                  </a>
                  <span className="text-sm text-gray-500">Nov 11 2021</span>
                </div>
                </div>
              </div>

              <div className="flex mb-4">
              <div className="flex items-top space-x-2">
                <CloudDownload className="w-5 h-5 text-gray-500" />
                <div>
                  <a href="/static/download/Cat_definitions.xlsx" className="text-blue-600 hover:underline">
                    <div className="font-medium">Category Definitions</div>
                  </a>
                  <span className="text-sm text-gray-500">Nov 11 2021</span>
                </div>
                </div>
              </div>
            </div>
          </div>

        
          <div className="w-full md:w-1/3 px-2 mb-0">
            <div>
              <h4 className="text-xl font-semibold mb-4">Python Package</h4>
              <p className="mb-4">
                WormCat3 source code is available on{' '} 
                <a href="https://github.com/DanHUMassMed/wormcat3" className="text-blue-600 font-semibold hover:underline">
                  GitHub
                </a>{' '}We welcome contributions.
              </p>
              WormCat3 can also be installed using pip.
              <p className="font-mono font-bold mb-2">pip install wormcat3</p>
            </div>
          </div>

          {/* Footer Bottom Row */}
          <div className="border-t text-sm text-gray-600 text-center">
            &copy; 2018 Amy K Walker Labs
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;