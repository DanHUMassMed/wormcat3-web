import React from 'react';

const Footer = () => {
  return (
    <footer id="contact" className="bg-gray-100 py-16">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap -mx-4">
          {/* Contact Info */}
          <div className="w-full md:w-1/3 px-4 mb-10">
            <div>
              <h4 className="text-xl font-semibold mb-4">Contact Info</h4>
              <p className="mb-4">Please send your comments, suggestions and bug reports to the team.</p>
              <div className="space-y-2 text-sm">
                <p>
                  <i className="fa fa-envelope-o mr-2 text-gray-600" />
                  <a href="mailto:amy.walker@umassmed.edu" className="text-blue-600 hover:underline">
                    WormCat Admin
                  </a>
                </p>
                <p>
                  <i className="fa fa-twitter mr-2 text-gray-600" />
                  <a href="https://twitter.com/akwalker_lab" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    akwalker_lab
                  </a>
                </p>
                <p>
                  <i className="fa fa-cloud mr-2 text-gray-600" />
                  <a href="http://www.amywalkerlab.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    www.amywalkerlab.com
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Category Data */}
          <div className="w-full md:w-1/3 px-4 mb-10">
            <div>
              <h4 className="text-xl font-semibold mb-4">Category Data</h4>
              <p className="mb-4">Downloads of the Category Data are available below.</p>

              {/* Story 1 */}
              <div className="flex mb-4">
                <img src="../static/images/download.jpg" alt="" className="w-16 h-16 object-cover mr-4" />
                <div>
                  <a href="../static/download/whole_genome_v2_nov-11-2021.csv" className="text-blue-600 hover:underline">
                    <h5 className="font-medium">Whole genome v2</h5>
                  </a>
                  <span className="text-sm text-gray-500">Nov 11 2021</span>
                </div>
              </div>

              {/* Story 2 */}
              <div className="flex">
                <img src="../static/images/download.jpg" alt="" className="w-16 h-16 object-cover mr-4" />
                <div>
                  <a href="../static/download/Cat_definitions.xlsx" className="text-blue-600 hover:underline">
                    <h5 className="font-medium">Category Definitions</h5>
                  </a>
                  <span className="text-sm text-gray-500">Nov 11 2021</span>
                </div>
              </div>
            </div>
          </div>

          {/* R Package Info */}
          <div className="w-full md:w-1/3 px-4 mb-10">
            <div>
              <h4 className="text-xl font-semibold mb-4">R Package</h4>
              <p className="mb-4">
                WormCat is also available as an R Package. To install load the devtools library and use <i>install_github</i>. See Wormcat on{' '}
                <a href="https://github.com/dphiggs01/Wormcat" className="text-blue-600 font-semibold hover:underline">
                  GitHub
                </a>{' '}
                for more details on how to install.
              </p>
              <p className="font-mono font-bold mb-2">library("devtools")</p>
              <p className="font-mono font-bold">install_github("dphiggs01/wormcat")</p>
            </div>
          </div>

          {/* Footer Bottom Row */}
          <div className="w-full border-t pt-6 flex flex-wrap justify-between items-center">
            <div className="w-full md:w-1/2 text-sm text-gray-600 px-4">
              <p>&copy; 2018 Amy K Walker Labs</p>
            </div>
            <div className="w-full md:w-1/2 text-right px-4">
              <a href="#top" className="text-gray-600 hover:text-gray-800 transition">
                <i className="fa fa-angle-up text-xl" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;