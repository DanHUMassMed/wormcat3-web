import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from "react-router-dom";

// Helper functions moved outside component for better organization
const read_category_padj_csv = async (file_nm) => {
  try {
    const response = await fetch(file_nm);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${file_nm}: ${response.status} ${response.statusText}`);
    }
    
    const csvText = await response.text();
    if (csvText.trim().startsWith("<!DOCTYPE html") || csvText.includes("<html")) {
      throw new Error(`Report Data is not available.`);
    }

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
  } catch (error) {
    console.error("Error reading CSV:", error);
    throw error;
  }
};

const get_correction_method = (dataArray) => {
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
};

const create_ui_data = async (run_id) => {
  try {
    const cat1_apv = await read_category_padj_csv(`/dynamic/wormcat_out/${run_id}/category_1_padj_${run_id}.csv`);
    const correction_method = get_correction_method(cat1_apv);

    const [cat2_apv, cat3_apv] = await Promise.all([
      read_category_padj_csv(`/dynamic/wormcat_out/${run_id}/category_2_padj_${run_id}.csv`),
      read_category_padj_csv(`/dynamic/wormcat_out/${run_id}/category_3_padj_${run_id}.csv`)
    ]);

    return {
      dir: run_id,
      cat1_apv,
      cat2_apv,
      cat3_apv,
      correction_method
    };
  } catch (error) {
    console.error("Error creating UI data:", error);
    throw error;
  }
};

// Separate table component for better organization
const SortableTable = ({ data, sortConfig, onSort, correctionMethod }) => {
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

  return (
    <div className="card bg-white shadow-md rounded p-4 my-4">
      <div className="overflow-y-auto max-h-72">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-4 py-2 text-left cursor-pointer" onClick={() => onSort('Category')}>
                Category {renderSortIcon('Category')}
              </th>
              <th className="px-4 py-2 text-left cursor-pointer" onClick={() => onSort('RGS')}>
                RGS {renderSortIcon('RGS')}
              </th>
              <th className="px-4 py-2 text-left cursor-pointer" onClick={() => onSort('AC')}>
                AC {renderSortIcon('AC')}
              </th>
              <th className="px-4 py-2 text-left cursor-pointer" onClick={() => onSort('PValue')}>
                P-Value {renderSortIcon('PValue')}
              </th>
              <th className="px-4 py-2 text-left cursor-pointer" onClick={() => onSort(correctionMethod)}>
                {correctionMethod} {renderSortIcon(correctionMethod)}
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
                <td className="px-4 py-2">{line[correctionMethod]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Separate category section component
const CategorySection = ({ title, imageUrl, tableData, sortConfig, onSort, correctionMethod }) => (
  <div className="my-8">
    <h3 className="text-2xl font-semibold mb-4">{title}</h3>
    <div className="flex flex-col md:flex-row gap-6">
      <div className="flex-shrink-0 relative">
        <div className="overflow-visible transform-origin-left">
          <img
            className="w-96 h-auto transition-all duration-300 hover:scale-[2] hover:translate-x-1/2 hover:shadow-lg hover:border-2 hover:border-black hover:z-50 relative z-10 cursor-zoom-in" 
            src={imageUrl}
            alt={title}
            loading="lazy"
          />
        </div>
      </div>
      <div className="flex-grow">
        <SortableTable 
          data={tableData} 
          sortConfig={sortConfig}
          onSort={onSort}
          correctionMethod={correctionMethod}
        />
      </div>
    </div>
  </div>
);

export default function WormCatEnrichmentReport() {
  const { run_id } = useParams();
  const navigate = useNavigate();

  const [uiData, setUiData] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'PValue', direction: 'ascending' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleSort = useCallback((key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'ascending' ? 'descending' : 'ascending' };
      }
      return { key, direction: 'ascending' };
    });
  }, []);

  // Open popup window function
  const newPopup = useCallback((url, name) => {
    window.open(
      url,
      name,
      'height=600,width=800,left=10,top=10,resizable=yes,scrollbars=yes,toolbar=yes,menubar=no,location=no,directories=no,status=yes'
    );
  }, []);

  // Handle download button click
  const handleDownload = useCallback((dir) => {
    window.location.href = `/dynamic/wormcat_out/${dir}.zip`;
  }, []);

  useEffect(() => {
    // Validate run_id
    if (!run_id) {
      navigate('/');
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    const fetchData = async () => {
      try {
        const result = await create_ui_data(run_id);
        if (isMounted) {
          setUiData(result);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(`Failed to load report for ${run_id}: ${err.message}`);
          setLoading(false);
        }
      }
    };

    fetchData();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [run_id, navigate]);

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl">Loading WormCat Report...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-8">
        <h2 className="text-3xl font-bold mb-6">Error Loading Report</h2>
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p>{error}</p>
        </div>

      </div>
    );
  }

  // No data state
  if (!uiData) {
    return (
      <div className="p-8">
        <h2 className="text-3xl font-bold mb-6">No Data Available</h2>
        <p>Could not load report data for ID: {run_id}</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        >
          Return to Form
        </button>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold mb-6">
        WormCat Report 
        <span className="ml-2 text-gray-500 text-xl">({run_id})</span>
      </h2>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <button
          onClick={() => handleDownload(uiData.dir)}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded flex items-center"
        >
          <span>Download Report</span>
        </button>
        <button
          onClick={() => newPopup(`/dynamic/wormcat_out/${uiData.dir}/sunburst_${uiData.dir}.html`, uiData.dir)}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded flex items-center"
        >
          <span>Open Sunburst View</span>
        </button>
      </div>

      {/* Category sections */}
      <CategorySection 
        title="Category One" 
        imageUrl={`/dynamic/wormcat_out/${uiData.dir}/category_1_padj_${uiData.dir}.svg`}
        tableData={uiData.cat1_apv}
        sortConfig={sortConfig}
        onSort={handleSort}
        correctionMethod={uiData.correction_method}
      />
      
      <CategorySection 
        title="Category Two" 
        imageUrl={`/dynamic/wormcat_out/${uiData.dir}/category_2_padj_${uiData.dir}.svg`}
        tableData={uiData.cat2_apv}
        sortConfig={sortConfig}
        onSort={handleSort}
        correctionMethod={uiData.correction_method}
      />
      
      <CategorySection 
        title="Category Three" 
        imageUrl={`/dynamic/wormcat_out/${uiData.dir}/category_3_padj_${uiData.dir}.svg`}
        tableData={uiData.cat3_apv}
        sortConfig={sortConfig}
        onSort={handleSort}
        correctionMethod={uiData.correction_method}
      />
    </div>
  );
};
