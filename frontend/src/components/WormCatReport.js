import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from "react-router-dom";


async function read_category_padj_csv(file_nm) {
  const response = await fetch(file_nm);
  const csvText = await response.text();

  const lines = csvText.trim().split("\n");
  const headers = lines[0].split(",");

  return lines.slice(1).map(line => {
    const cols = line.split(",");
    const entry = {};

    headers.forEach((key, index) => {
      const value = cols[index];
      // Convert numeric strings to numbers when possible
      const num = Number(value);
      entry[key] = isNaN(num) ? value : num;
    });
    return entry;
  });
}

function get_correction_method(dataArray) {
  // Check if the array is not empty
  if (!dataArray || dataArray.length === 0) {
    return 'Adj P-Value'; // Default to FDR if array is empty or null
  }
  
  // Check the first object in the array to see if it has a 'Bonferroni' key
  const firstItem = dataArray[0];
  
  // Check if 'Bonferroni' is a key and is not undefined
  if (firstItem && 'Bonferroni' in firstItem && firstItem.Bonferroni !== undefined) {
    return 'Bonferroni';
  } else {
    return 'FDR';
  }
}

async function create_ui_data(run_id) {

  const cat1_apv = await read_category_padj_csv(`/dynamic/wormcat_out/${run_id}/category_1_padj_${run_id}.csv`)
  const correction_method = get_correction_method(cat1_apv)

  const uiData = {
    dir: run_id,
    cat1_apv: cat1_apv,
    cat2_apv: await read_category_padj_csv(`/dynamic/wormcat_out/${run_id}/category_2_padj_${run_id}.csv`),
    cat3_apv: await read_category_padj_csv(`/dynamic/wormcat_out/${run_id}/category_3_padj_${run_id}.csv`),
    correction_method: correction_method
  };

  return uiData
};

const WormCatReport = () => {
  const location = useLocation();
  const data_loc = location.state?.data;

  const [uiData, setUiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: 'PValue', direction: 'ascending' });
  const isMountedRef = useRef(true);


  useEffect(() => {
    console.log("WormCatReport Component mounted");
    isMountedRef.current = true;

    const fetchData = async () => {
      if (data_loc?.run_id) {
        const result = await create_ui_data(data_loc.run_id);
        console.log(result)
        setUiData(result);
        setLoading(false);
      }
    };
    fetchData();

    // Cleanup function to run when component unmounts
    return () => {
      console.log("WormCatReport Component unmounting - setting mounted ref to false");
      isMountedRef.current = false;
    };
    
  }, [data_loc]);

  if (loading || !uiData) return <div>Loading...</div>;

  const newPopup = (url, name) => {
    window.open(
      url,
      name,
      'height=400,width=500,left=10,top=10,resizable=yes,scrollbars=no,toolbar=yes,menubar=no,location=no,directories=no,status=yes'
    );
  };

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'ascending' ? 'descending' : 'ascending' };
      }
      return { key, direction: 'ascending' };
    });
  };

  const getSortedData = (data) => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      if (a[sortConfig.key] === null) return 1;
      if (b[sortConfig.key] === null) return -1;
      if (a[sortConfig.key] === null && b[sortConfig.key] === null) return 0;

      const aValue = typeof a[sortConfig.key] === 'string' ? a[sortConfig.key].toLowerCase() : a[sortConfig.key];
      const bValue = typeof b[sortConfig.key] === 'string' ? b[sortConfig.key].toLowerCase() : b[sortConfig.key];

      if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
      return 0;
    });
  };

  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) return <span className="ml-1 text-gray-400">⇅</span>;
    return sortConfig.direction === 'ascending' ? (
      <span className="ml-1 text-gray-600">▲</span>
    ) : (
      <span className="ml-1 text-gray-600">▼</span>
    );
  };

  const renderTable = (data) => (
    <div className="card bg-white shadow-md rounded p-4 my-4">
      <div className="overflow-y-auto max-h-72">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-4 py-2 text-left cursor-pointer" onClick={() => handleSort('Category')}>
                Category {renderSortIcon('Category')}
              </th>
              <th className="px-4 py-2 text-left cursor-pointer" onClick={() => handleSort('RGS')}>
                RGS {renderSortIcon('RGS')}
              </th>
              <th className="px-4 py-2 text-left cursor-pointer" onClick={() => handleSort('AC')}>
                AC {renderSortIcon('AC')}
              </th>
              <th className="px-4 py-2 text-left cursor-pointer" onClick={() => handleSort('PValue')}>
                P-Value {renderSortIcon('PValue')}
              </th>
              <th className="px-4 py-2 text-left cursor-pointer" onClick={() => handleSort(uiData.correction_method)}>
              {uiData.correction_method} {renderSortIcon(uiData.correction_method)}
              </th>
            </tr>
          </thead>
          <tbody>
            {getSortedData(data).map((line, idx) => (
              <tr key={idx} className="odd:bg-white even:bg-gray-100">
                <th className="px-4 py-2 text-left">{line.Category}</th>
                <td className="px-4 py-2">{line.RGS}</td>
                <td className="px-4 py-2">{line.AC}</td>
                <td className="px-4 py-2">{line.PValue}</td>
                <td className="px-4 py-2">{line[uiData.correction_method]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="p-8">

      <h2 className="text-3xl font-bold mb-6">WormCat Report</h2>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <button
          onClick={() => window.location.href = `/dynamic/wormcat_out/${uiData.dir}.zip`}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
        >
          Download Report
        </button>
        <button
          onClick={() => newPopup(`/dynamic/wormcat_out/${uiData.dir}/sunburst_${uiData.dir}.html`, uiData.dir)}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        >
          Open Sunburst View
        </button>
      </div>

      {/* Category One */}
      <div className="my-8">
        <h3 className="text-2xl font-semibold mb-4">Category One</h3>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-shrink-0 relative">
            <div className="overflow-visible transform-origin-left">
              <img
                className="w-96 h-auto transition-all duration-300 hover:scale-[2] hover:translate-x-1/2 hover:shadow-lg hover:border-2 hover:border-black hover:z-50 relative z-10 cursor-zoom-in" 
                src={`/dynamic/wormcat_out/${uiData.dir}/category_1_padj_${uiData.dir}.svg`}
                alt="Category One"
              />
            </div>
          </div>
          <div className="flex-grow">
            {renderTable(uiData.cat1_apv)}
          </div>
        </div>
      </div>

      {/* Category Two */}
      <div className="my-8">
        <h3 className="text-2xl font-semibold mb-4">Category Two</h3>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-shrink-0 relative">
            <div className="overflow-visible transform-origin-left">
              <img
                className="w-96 h-auto transition-all duration-300 hover:scale-[2] hover:translate-x-1/2 hover:shadow-lg hover:border-2 hover:border-black hover:z-50 relative z-10 cursor-zoom-in" 
                src={`/dynamic/wormcat_out/${uiData.dir}/category_2_padj_${uiData.dir}.svg`}
                alt="Category Two"
              />
            </div>
          </div>
          <div className="flex-grow">
            {renderTable(uiData.cat2_apv)}
          </div>
        </div>
      </div>

      {/* Category Three */}
      <div className="my-8">
        <h3 className="text-2xl font-semibold mb-4">Category Three</h3>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-shrink-0 relative">
            <div className="overflow-visible transform-origin-left">
              <img
                className="w-96 h-auto transition-all duration-300 hover:scale-[2] hover:translate-x-1/2 hover:shadow-lg hover:border-2 hover:border-black hover:z-50 relative z-10 cursor-zoom-in" 
                src={`/dynamic/wormcat_out/${uiData.dir}/category_3_padj_${uiData.dir}.svg`}
                alt="Category Three"
              />
            </div>
          </div>
          <div className="flex-grow">
            {renderTable(uiData.cat3_apv)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WormCatReport;