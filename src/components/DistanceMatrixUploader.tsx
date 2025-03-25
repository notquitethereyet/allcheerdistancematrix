import React, { useState } from 'react';
import FileUpload from './FileUpload';
import DateTimePicker from './DateTimePicker';
import Button from './Button';
import { apiService, DistanceMatrixResponse } from '../services/api';
import DataVisualization from './DataVisualization';

interface DistanceMatrixUploaderProps {
  onUpload?: (result: DistanceMatrixResponse) => void;
}

const DistanceMatrixUploader: React.FC<DistanceMatrixUploaderProps> = ({ onUpload }) => {
  const [file, setFile] = useState<File | null>(null);
  const [departureDate, setDepartureDate] = useState<Date | null>(new Date());
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<DistanceMatrixResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (files: File[]) => {
    if (files && files.length > 0) {
      setFile(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !departureDate) {
      setError('Please select a file and departure date/time');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Format the date and time for the API
      const formattedDate = departureDate.toISOString().split('T')[0]; // YYYY-MM-DD
      const formattedTime = departureDate.toTimeString().split(' ')[0]; // HH:MM:SS

      // Create FormData object
      const formData = new FormData();
      formData.append('file', file);
      formData.append('departureDate', formattedDate);
      formData.append('departureTime', formattedTime);

      const response = await apiService.uploadDistanceMatrix(formData);

      setResult(response);
      if (onUpload) {
        onUpload(response);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to process the file');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (result && result.resultFilename) {
      // Create a download link
      const downloadUrl = apiService.downloadResult(result.resultFilename);
      
      // Create an anchor element and trigger the download
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = result.resultFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Distance Matrix Calculator</h2>
      
      <div className="space-y-6">
        <div className="p-4 bg-blue-50 rounded-md text-sm text-blue-700">
          <p>Upload an Excel file with addresses and transport modes to calculate the distance matrix.</p>
          <p className="mt-2">Required columns:</p>
          <ul className="list-disc list-inside ml-2 mt-1">
            <li>Address Code</li>
            <li>Address</li>
            <li>Transport Mode (values: DRIVE, TRANSIT, TELE)</li>
          </ul>
        </div>
        
        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Excel File <span className="text-red-500">*</span>
          </label>
          <FileUpload onFileUploaded={handleFileUpload} />
        </div>
        
        {/* Departure Date/Time */}
        <div>
          <DateTimePicker
            label="Departure Date & Time"
            value={departureDate}
            onChange={setDepartureDate}
            required
          />
          <p className="mt-1 text-sm text-gray-500">
            This is the time when the journeys will start.
          </p>
        </div>
        
        {/* Upload Button */}
        <div className="mt-6">
          <Button
            variant="primary"
            fullWidth
            isLoading={loading}
            disabled={loading || !file || !departureDate}
            onClick={handleUpload}
          >
            Process Distance Matrix
          </Button>
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600">
            {error}
          </div>
        )}
        
        {/* Results */}
        {result && (
          <div className="mt-6">
            <div className="bg-green-50 p-4 rounded-md mb-4">
              <p className="text-green-700 font-medium">{result.message}</p>
              <p className="text-gray-700 mt-2">
                Processed {result.totalPairs} address pairs.
              </p>
              
              <div className="mt-4">
                <Button variant="success" onClick={handleDownload}>
                  Download Results
                </Button>
              </div>
            </div>
            
            {result.sampleData && result.sampleData.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">Sample Results</h3>
                <DataVisualization data={result.sampleData} title="Sample Distance Matrix Data" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DistanceMatrixUploader;