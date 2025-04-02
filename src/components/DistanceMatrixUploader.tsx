import React, { useState } from 'react';
import FileUpload from './FileUpload';
import DateTimePicker from './DateTimePicker';
import Button from './Button';
import { apiService, DistanceMatrixResponse } from '../services/api';
import DataVisualization from './DataVisualization';
import { useToast } from '../contexts/ToastContext';
import ProgressBar from './ProgressBar';

interface DistanceMatrixUploaderProps {
  onUpload?: (result: DistanceMatrixResponse) => void;
}

const DistanceMatrixUploader: React.FC<DistanceMatrixUploaderProps> = ({ onUpload }) => {
  const [xlsxData, setXlsxData] = useState<any[] | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [departureDate, setDepartureDate] = useState<Date | null>(new Date());
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<DistanceMatrixResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{
    percent: number;
    status: 'idle' | 'processing' | 'completed' | 'error';
  }>({
    percent: 0,
    status: 'idle'
  });
  const [utcTimestamp, setUtcTimestamp] = useState<number | null>(null);

  // Get toast context
  const toast = useToast();

  const handleFileUpload = (data: any[], file?: File) => {
    setXlsxData(data);
    if (file) {
      setOriginalFile(file);
      console.log('Original file received:', file.name, file.type, file.size);
    }
  };

  // Create Excel file from data with proper MIME type
  const createExcelFile = async (data: any[]): Promise<File> => {
    // Convert xlsxData to an Excel file
    const XLSX = await import('xlsx');
    
    // Create a worksheet from the data
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Create a workbook and append the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    
    // Generate Excel file as array buffer
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    
    // Create a Blob from the buffer with the correct MIME type for Excel
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    // Create a File object from the Blob with .xlsx extension
    return new File([blob], 'data.xlsx', { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
  };

  const handleUpload = async () => {
    if (!xlsxData || !departureDate) {
      setError('Please select a file and departure date/time');
      return;
    }

    setLoading(true);
    setError(null);
    setProgress({
      percent: 0,
      status: 'processing'
    });

    // Variable to store the interval ID for progress simulation
    let progressIntervalId: number | null = null;

    try {
      // First, convert the local time to UTC timestamp
      try {
        const result = await apiService.convertToUTC(departureDate);
        setUtcTimestamp(result.unixTimestamp);
        
        // Log the conversion result
        console.log('Time conversion result:', result);
        toast.addToast(`Time converted to UTC: ${new Date(result.utcTime).toLocaleString()}`, 'info');
      } catch (err: any) {
        console.error('Error converting time to UTC:', err);
        toast.addToast('Error converting time to UTC. Using local time instead.', 'warning');
        // Continue with the process using local time
      }
      
      // Create FormData object
      const formData = new FormData();
      
      // Use the original file if available, otherwise create a new Excel file
      let fileToUpload: File;
      
      if (originalFile && (originalFile.type.includes('spreadsheet') || originalFile.type.includes('excel') || originalFile.name.endsWith('.xlsx') || originalFile.name.endsWith('.xls') || originalFile.name.endsWith('.csv'))) {
        fileToUpload = originalFile;
        console.log('Using original file for upload:', originalFile.name, originalFile.type);
      } else {
        // Create the Excel file if we don't have the original or it's not in the right format
        fileToUpload = await createExcelFile(xlsxData);
        console.log('Created new Excel file for upload with proper MIME type');
      }
      
      // Append the file to FormData - this is the crucial part
      formData.append('file', fileToUpload);
      
      // Format the date and time for the API
      const formattedDate = departureDate.toISOString().split('T')[0]; // YYYY-MM-DD
      const formattedTime = departureDate.toTimeString().split(' ')[0]; // HH:MM:SS
      formData.append('departureDate', formattedDate);
      formData.append('departureTime', formattedTime);
      
      // Add the Unix timestamp if available (preferred by backend)
      if (utcTimestamp) {
        formData.append('timestamp', String(utcTimestamp));
        console.log('Using Unix timestamp:', utcTimestamp);
      }
      
      // Show initial toast
      toast.addToast('Processing started - this may take several minutes for large files', 'info');
      
      // Set up progress simulation for user feedback
      const startProgressSimulation = () => {
        let simulatedProgress = 0;
        progressIntervalId = window.setInterval(() => {
          // Slowly increase progress to give user feedback
          simulatedProgress += Math.random() * 2;
          if (simulatedProgress > 95) {
            simulatedProgress = 95; // Cap at 95% until we get real completion
            if (progressIntervalId) clearInterval(progressIntervalId);
          }
          
          setProgress({
            percent: Math.min(95, Math.floor(simulatedProgress)),
            status: 'processing'
          });
        }, 1000);
      };
      
      // Start progress simulation
      startProgressSimulation();

      // Make the API call - this will be a longer synchronous request
      const response = await apiService.uploadDistanceMatrix(formData);

      // Clear progress simulation
      if (progressIntervalId) clearInterval(progressIntervalId);
      
      // Set progress to 100%
      setProgress({
        percent: 100,
        status: 'completed'
      });
      
      // Update state with the result
      setResult(response);
      if (onUpload) {
        onUpload(response);
      }
      
      // Show success toast
      toast.addToast('File processing completed successfully', 'success');
    } catch (err: any) {
      // Clear progress simulation
      if (progressIntervalId) clearInterval(progressIntervalId);
      
      console.error('Error processing file:', err);
      setError(err.message || 'Failed to process the file');
      setProgress({
        percent: 0,
        status: 'error'
      });
      
      // Show error toast
      toast.addToast(`Error: ${err.message || 'Failed to process the file'}`, 'error');
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
      
      // Show toast
      toast.addToast('Downloading results...', 'info');
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
          {xlsxData && (
            <p className="mt-1 text-sm text-green-600">File loaded successfully with {xlsxData.length} rows</p>
          )}
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
            disabled={loading || !xlsxData || !departureDate}
            onClick={handleUpload}
          >
            Process Distance Matrix
          </Button>
        </div>
        
        {/* Processing Progress */}
        {progress.status === 'processing' && (
          <div className="mt-4">
            <ProgressBar 
              percent={progress.percent}
              label="Processing..."
              height={10}
              barColor="#3B82F6"
              message="This may take several minutes for large files. Please don't close this page."
            />
          </div>
        )}
        
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
                Processed {result.totalPairsCalculated || result.totalPairs} address pairs
                {result.processingTimeSeconds && ` in ${result.processingTimeSeconds.toFixed(1)} seconds`}.
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