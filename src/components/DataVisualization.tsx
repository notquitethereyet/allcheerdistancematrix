import React, { useState, useEffect } from 'react';

interface DataVisualizationProps {
  data: any[];
  title?: string;
  maxResults?: number;
}

const DataVisualization: React.FC<DataVisualizationProps> = ({
  data,
  title = 'Data Visualization',
  maxResults = 5,
}) => {
  const [columns, setColumns] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [displayData, setDisplayData] = useState<any[]>([]);

  // Initialize columns and pagination
  useEffect(() => {
    if (data && data.length > 0) {
      const cols = Object.keys(data[0]);
      setColumns(cols);
      
      // Set initial display data
      updateDisplayData(1);
    }
  }, [data]);

  // Update display data when page changes
  const updateDisplayData = (page: number) => {
    const startIndex = (page - 1) * maxResults;
    const endIndex = startIndex + maxResults;
    setDisplayData(data.slice(startIndex, endIndex));
    setCurrentPage(page);
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    updateDisplayData(newPage);
  };

  // No data state
  if (!data || data.length === 0) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{title}</h2>
        <div className="text-center p-6 bg-gray-50 rounded-md">
          <p className="text-gray-500">No data available to visualize</p>
        </div>
      </div>
    );
  }

  // Calculate total pages
  const totalPages = Math.ceil(data.length / maxResults);

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">{title}</h2>
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayData.map((row, rowIndex) => (
              <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {columns.map((column) => (
                  <td key={`${rowIndex}-${column}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {row[column] !== null && row[column] !== undefined
                      ? String(row[column])
                      : '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded ${
              currentPage === 1 
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            Previous
          </button>
          
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 rounded ${
              currentPage === totalPages 
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            Next
          </button>
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-700">
        Showing {Math.min(maxResults, displayData.length)} of {data.length} results
      </div>
    </div>
  );
};

export default DataVisualization;