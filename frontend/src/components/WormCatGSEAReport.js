import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from "react-router-dom";

// Helper functions moved outside component for better organization
const read_category_csv = async (file_nm) => {
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


const create_ui_data = async (run_id) => {
  try {
    const cat1_apv = await read_category_csv(`/dynamic/wormcat_out/${run_id}/gsea_category_1_${run_id}.csv`);
    
    const [cat2_apv, cat3_apv] = await Promise.all([
      read_category_csv(`/dynamic/wormcat_out/${run_id}/gsea_category_2_${run_id}.csv`),
      read_category_csv(`/dynamic/wormcat_out/${run_id}/gsea_category_3_${run_id}.csv`)
    ]);

    return {
      dir: run_id,
      cat1_apv,
      cat2_apv,
      cat3_apv
    };
  } catch (error) {
    console.error("Error creating UI data:", error);
    throw error;
  }
};

// Separate table component for better organization
const SortableTable = ({ data, sortConfig, onSort }) => {
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
              <th className="px-4 py-2 text-left cursor-pointer" onClick={() => onSort('Term')}>
                Category {renderSortIcon('Term')}
              </th>
              <th className="px-4 py-2 text-left cursor-pointer" onClick={() => onSort('FDR')}>
                FDR {renderSortIcon('FDR')}
              </th>
              <th className="px-4 py-2 text-left cursor-pointer" onClick={() => onSort('ES')}>
                ES {renderSortIcon('ES')}
              </th>
              <th className="px-4 py-2 text-left cursor-pointer" onClick={() => onSort('NES')}>
                NES {renderSortIcon('NES')}
              </th>
              <th className="px-4 py-2 text-left cursor-pointer" onClick={() => onSort('P-value')}>
                P-Value {renderSortIcon('P-value')}
              </th>
              <th className="px-4 py-2 text-left cursor-pointer" onClick={() => onSort('Tag %')}>
                Tag % {renderSortIcon('Tag %')}
              </th>
            </tr>
          </thead>
          <tbody>
            {getSortedData(data).map((line, idx) => (
              <tr key={idx} className="odd:bg-white even:bg-gray-100">
                <th className="px-4 py-2 text-left">{line.Term}</th>
                <td className="px-4 py-2">{line.FDR}</td>
                <td className="px-4 py-2">{line.ES}</td>
                <td className="px-4 py-2">{line.NES}</td>
                <td className="px-4 py-2">{line['P-value']}</td>
                <td className="px-4 py-2">{line['Tag %']}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Separate category section component
const CategorySection = ({ title, tableData, sortConfig, onSort }) => (
  <div className="my-8">
    <h3 className="text-2xl font-semibold mb-4">{title}</h3>
    <div className="flex flex-col md:flex-row gap-6">
      <div className="flex-shrink-0 relative">

      </div>
      <div className="flex-grow">
        <SortableTable 
          data={tableData} 
          sortConfig={sortConfig}
          onSort={onSort}
        />
      </div>
    </div>
  </div>
);

const WormCatGSEAReport = () => {
  const { run_id } = useParams();
  const navigate = useNavigate();

  const [uiData, setUiData] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'P-value', direction: 'ascending' });
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
        <div className="text-xl">Loading WormCat GSEA Report...</div>
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
        WormCat GSEA Report 
        <span className="ml-2 text-gray-500 text-xl">({run_id})</span>
      </h2>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <button
          onClick={() => handleDownload(uiData.dir)}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded flex items-center"
        >
          <span>Download Report</span>
        </button>
      </div>

      {/* Category sections */}
      <CategorySection 
        title="Category One" 
        tableData={uiData.cat1_apv}
        sortConfig={sortConfig}
        onSort={handleSort}
      />
      
      <CategorySection 
        title="Category Two" 
        tableData={uiData.cat2_apv}
        sortConfig={sortConfig}
        onSort={handleSort}
      />
      
      <CategorySection 
        title="Category Three" 
        tableData={uiData.cat3_apv}
        sortConfig={sortConfig}
        onSort={handleSort}
      />
    </div>
  );
};

export default WormCatGSEAReport;