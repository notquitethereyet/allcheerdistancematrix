import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import DateTimePicker from './components/DateTimePicker';
import WorksheetSelector from './components/WorksheetSelector';
import Button from './components/Button';
import ProcessingResultsCard from './components/ProcessingResultsCard';
import { ToastProvider, useToast } from './contexts/ToastContext';
import { apiService } from './services/api';
import logoImage from './assets/logo.png';
import * as XLSX from 'xlsx';

// Main App component wrapper with ToastProvider
const AppWrapper: React.FC = () => {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
};

// Actual app content
const AppContent: React.FC = () => {
  // State
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [xlsxData, setXlsxData] = useState<any[] | null>(null);
  const [processedData, setProcessedData] = useState<any | null>(null);
  const [utcDepartureTime, setUtcDepartureTime] = useState<string | null>(null);
  const [utcUnixTimestamp, setUtcUnixTimestamp] = useState<number | null>(null);
  const [usedTimeApi, setUsedTimeApi] = useState<boolean | null>(null);
  const [worksheetNames, setWorksheetNames] = useState<string[]>([]);
  const [selectedWorksheet, setSelectedWorksheet] = useState<string>('');
  const [excelWorkbook, setExcelWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [progress, setProgress] = useState<{
    jobId: string | null;
    completed: number;
    total: number;
    percent: number;
    status: 'idle' | 'processing' | 'completed' | 'error';
  }>({
    jobId: null,
    completed: 0,
    total: 0,
    percent: 0,
    status: 'idle'
  });

  // Toast notification
  const toast = useToast();

  // Handle file upload
  const handleFileUpload = (data: any[], sheetNames: string[], workbook: XLSX.WorkBook, _file?: File) => {
    setXlsxData(data);
    setWorksheetNames(sheetNames);
    setSelectedWorksheet(sheetNames[0]); // Select first worksheet by default
    setExcelWorkbook(workbook);
    // Clear processed data when a new file is uploaded
    setProcessedData(null);
    toast.addToast('File uploaded successfully', 'success');
  };

  // Handle worksheet change
  const handleWorksheetChange = (worksheetName: string) => {
    if (!excelWorkbook || !worksheetName) return;

    try {
      setSelectedWorksheet(worksheetName);
      // Clear processed data when worksheet changes
      setProcessedData(null);

      // Get the selected worksheet
      const worksheet = excelWorkbook.Sheets[worksheetName];

      // Convert to JSON with these specific options to preserve spaces in headers
      const data = XLSX.utils.sheet_to_json(worksheet, {
        raw: true,
        defval: null,
        header: 'A', // Use A, B, C as headers initially
      });

      // If data is empty, throw an error
      if (!data || data.length === 0) {
        throw new Error(`The worksheet "${worksheetName}" is empty or could not be parsed`);
      }

      // Get the header row (first row)
      const headerRow = data[0] as Record<string, unknown>;

      // Create a mapping of column letters to actual headers
      const headerMap: Record<string, string> = {};
      Object.entries(headerRow).forEach(([col, value]) => {
        if (value !== null && value !== undefined) {
          headerMap[col] = String(value);
        }
      });

      // Transform the data to use the actual headers and skip the header row
      const formattedData = data.slice(1).map((row: unknown) => {
        const typedRow = row as Record<string, unknown>;
        const newRow: Record<string, any> = {};
        Object.entries(typedRow).forEach(([col, value]) => {
          if (headerMap[col]) {
            newRow[headerMap[col]] = value;
          }
        });
        return newRow;
      });

      setXlsxData(formattedData);
      toast.addToast(`Switched to worksheet: ${worksheetName}`, 'info');
    } catch (err: any) {
      console.error('Error parsing worksheet:', err);
      setError(err.message || `Error parsing worksheet: ${worksheetName}`);
      toast.addToast(`Error loading worksheet: ${worksheetName}`, 'error');
    }
  };

  // Handle time conversion
  const handleConvertDepartureTimeToUTC = async () => {
    if (!selectedDate) return;

    setLoading(true);
    setError(null);
    // Clear processed data when time is converted
    setProcessedData(null);

    try {
      // Call the API to convert to UTC - pass the Date object directly
      const result = await apiService.convertToUTC(selectedDate);

      // Update state with the result
      setUtcDepartureTime(result.utcTime);
      setUtcUnixTimestamp(result.unixTimestamp);
      setUsedTimeApi(result.usedApi);

      toast.addToast('Time converted successfully', 'success');
    } catch (err: any) {
      console.error('Error converting time:', err);
      setError(err.message || 'Error converting time to UTC');
      toast.addToast('Error converting time', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle file processing
  const handleProcessFile = async () => {
    if (!xlsxData || !selectedDate || !utcDepartureTime) return;

    setLoading(true);
    setError(null);
    setProgress({
      jobId: null,
      completed: 0,
      total: xlsxData.length * xlsxData.length, // Estimate total pairs
      percent: 0,
      status: 'processing'
    });

    try {
      // Create FormData object
      const formData = new FormData();

      // Convert xlsxData to an Excel file
      const XLSX = await import('xlsx');

      // Create a worksheet from the data
      const worksheet = XLSX.utils.json_to_sheet(xlsxData);

      // Create a workbook and append the worksheet
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

      // Generate Excel file as array buffer
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

      // Create a Blob from the buffer
      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      // Create a File object from the Blob
      const file = new File([blob], 'data.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      // Append the file to FormData
      formData.append('file', file);

      // Add other parameters
      formData.append('departureDate', selectedDate.toISOString().split('T')[0]);

      // Format the UTC time string to match the expected format "HH:MM:SS"
      // The utcDepartureTime is in format like "2025-03-25T15:30:00"
      const utcTimeOnly = utcDepartureTime.split('T')[1].split('.')[0];
      formData.append('departureTime', utcTimeOnly);

      // Use the Unix timestamp directly from the time conversion
      formData.append('timestamp', String(utcUnixTimestamp || 0));

      console.log('Sending to backend:', {
        departureDate: selectedDate.toISOString().split('T')[0],
        departureTime: utcTimeOnly,
        timestamp: utcUnixTimestamp
      });

      // Show processing toast
      toast.addToast('Processing started - this may take several minutes for large files', 'info');

      // Set up a progress simulator to give user feedback during long processing
      let progressInterval: number | null = null;
      const startProgressSimulation = () => {
        let simulatedProgress = 0;
        progressInterval = window.setInterval(() => {
          // Slowly increase progress to give user feedback
          simulatedProgress += Math.random() * 2;
          if (simulatedProgress > 95) {
            simulatedProgress = 95; // Cap at 95% until we get real completion
            clearInterval(progressInterval!);
          }

          setProgress(prev => ({
            ...prev,
            percent: Math.min(95, Math.floor(simulatedProgress)),
            completed: Math.floor((prev.total * simulatedProgress) / 100)
          }));
        }, 1000);
      };

      // Start progress simulation
      startProgressSimulation();

      try {
        // Call API to process the file with FormData
        const result = await apiService.uploadDistanceMatrix(formData);

        // Clear progress simulation
        if (progressInterval) clearInterval(progressInterval);

        // Set progress to 100%
        setProgress({
          jobId: null,
          completed: result.totalPairsCalculated || result.totalPairs || 0,
          total: result.totalPairsCalculated || result.totalPairs || 0,
          percent: 100,
          status: 'completed'
        });

        // Update state with the result
        setProcessedData(result);

        toast.addToast('File processing completed successfully', 'success');
      } catch (err: any) {
        // Clear progress simulation
        if (progressInterval) clearInterval(progressInterval);

        console.error('Error processing file:', err);
        setError(err.message || 'Error processing file');
        toast.addToast(`Error: ${err.message || 'Error processing file'}`, 'error');
        setProgress((prev) => ({ ...prev, status: 'error' }));
      } finally {
        setLoading(false);
      }
    } catch (err: any) {
      // This catch block handles errors in the file preparation stage
      console.error('Error preparing file:', err);
      setError(err.message || 'Error preparing file for upload');
      toast.addToast('Error preparing file for upload', 'error');
      setProgress((prev) => ({ ...prev, status: 'error' }));
      setLoading(false);
    }
  };

  // Handle download button click
  const handleDownloadButtonClick = () => {
    // This function would handle any special logic before downloading
    // For now, it's just a placeholder
    toast.addToast('Downloading sample data...', 'info');
  };

  const testApiConnection = async () => {
    console.log('Testing API connection...');
    try {
      // Get the API URL - use Railway URL in production
      const isProduction = import.meta.env.PROD;
      const apiBaseUrl = isProduction
        ? 'https://web-production-f17c2.up.railway.app/api'
        : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api');

      toast.addToast(`Testing connection to: ${apiBaseUrl}`, 'info');

      const isHealthy = await apiService.checkHealth();

      if (isHealthy) {
        toast.addToast('API connection successful! ', 'success');
      } else {
        toast.addToast('API is not healthy ', 'error');
      }
    } catch (err) {
      console.error('Health check error:', err);
      toast.addToast(`API connection failed: ${err instanceof Error ? err.message : String(err)} `, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F1DE] text-[#2D2A32]">
      {/* Navbar */}
      <nav className="bg-[#FC6060] text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          {/* Empty navbar - removed logo and text */}
        </div>
      </nav>

      {/* Main content */}
      <main className="section">
        <div className="container mx-auto px-4 md:px-6">
          {/* Header with logo and connection status */}
          <div className="card" style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <img src={logoImage} alt="AllCheer Logo" style={{ height: '50px', marginRight: '15px' }} />
                <h1 className="section-header">AllCheer Distance Matrix Calculator</h1>
              </div>

              {/* API Test Button */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <button
                  onClick={testApiConnection}
                  className="btn btn-primary"
                >
                  Test API
                </button>
              </div>
            </div>
          </div>

          {/* File Processor Page */}
          <div className="card">
            <h2 className="section-header">Upload & Process</h2>

            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.75rem' }}>
                Step 1: Upload your data file
              </h3>
              <p style={{ color: '#4B5563', marginBottom: '1rem' }}>
                Upload an Excel file with origin and destination addresses.
              </p>

              {/* Sample input table to show the expected format */}
              <div className="sample-table-container">
                <div className="sample-table-header">
                  Required Spreadsheet Format
                </div>
                <div style={{ padding: '1rem' }}>
                  <p style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
                    Your Excel file should include the following columns. Here's a sample of the expected format:
                  </p>

                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Address Code</th>
                          <th>Address</th>
                          <th>Transport Mode</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>SF001</td>
                          <td>1315 Ellis Street, San Francisco, California 94115</td>
                          <td>DRIVE</td>
                        </tr>
                        <tr>
                          <td>SF002</td>
                          <td>1329 7th Avenue, San Francisco, California 94122</td>
                          <td>DRIVE</td>
                        </tr>
                        <tr>
                          <td>SF003</td>
                          <td>27 Fountain St, San Francisco, California 94114</td>
                          <td>TRANSIT</td>
                        </tr>
                        <tr>
                          <td>SF004</td>
                          <td>123 Main St, San Francisco, California 94105</td>
                          <td>TELE</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--primary-highlight)' }}>
                    <p><strong>Notes:</strong></p>
                    <ul style={{ listStyleType: 'disc', paddingLeft: '1.25rem' }}>
                      <li>The column names must be exactly as shown above</li>
                      <li>Transport Mode should be one of: DRIVE, TRANSIT, or TELE</li>
                      <li>Addresses should be complete with city, state, and zip code for best results</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <FileUpload onFileUploaded={handleFileUpload} />

                {xlsxData && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--primary-highlight)' }}>
                    File loaded successfully with {xlsxData.length} rows of data.
                  </div>
                )}

                {worksheetNames.length > 0 && (
                  <div style={{ marginTop: '1rem', maxWidth: '400px' }}>
                    <WorksheetSelector
                      worksheetNames={worksheetNames}
                      selectedWorksheet={selectedWorksheet}
                      onWorksheetChange={handleWorksheetChange}
                      disabled={loading}
                    />
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '500', color: 'var(--text-color)', marginBottom: '0.75rem' }}>
                Step 2: Select departure date and time
              </h3>
              <p style={{ color: '#4B5563', marginBottom: '1rem' }}>
                Choose when you plan to start your journey. This affects travel time estimates.
              </p>

              <div style={{ maxWidth: '400px' }}>
                <DateTimePicker
                  label="Departure Date & Time"
                  value={selectedDate}
                  onChange={(date) => {
                    setSelectedDate(date);
                    // Clear processed data when date changes
                    setProcessedData(null);
                  }}
                  required
                />
              </div>

              <div style={{ marginTop: '1rem' }}>
                <Button
                  onClick={handleConvertDepartureTimeToUTC}
                  variant="secondary"
                  disabled={!selectedDate || loading}
                  className="btn btn-highlight"
                >
                  Convert to UTC
                </Button>
              </div>

              {utcDepartureTime && (
                <div className="utc-time-card">
                  <div className="utc-time-header">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <h3>UTC Time for Google Maps API</h3>
                  </div>

                  <div className="utc-time-content">
                    <div className="utc-time-item">
                      <span className="utc-time-label">UTC Time:</span>
                      <span className="utc-time-value">{utcDepartureTime}</span>
                    </div>

                    <div className="utc-time-item">
                      <span className="utc-time-label">Unix Timestamp:</span>
                      <span className="utc-time-value">{utcUnixTimestamp}</span>
                    </div>

                    <div className="utc-time-item">
                      <span className="utc-time-label">Conversion Method:</span>
                      <span className="utc-time-value" style={{ color: usedTimeApi ? 'var(--success-color)' : 'var(--warning-color)' }}>
                        {usedTimeApi ? 'Time API (Server)' : 'Client-side Fallback'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ marginTop: '1.5rem' }}>
                <Button
                  onClick={handleProcessFile}
                  disabled={!xlsxData || !utcDepartureTime || loading}
                  isLoading={loading && progress.status === 'processing'}
                  className="btn btn-primary"
                >
                  Calculate Distance Matrix
                </Button>
                {!xlsxData && (
                  <p className="validation-message">Please upload a file first</p>
                )}
                {xlsxData && !utcDepartureTime && (
                  <p className="validation-message">Please convert the time to UTC first</p>
                )}
              </div>
            </div>
          </div>

          {processedData && (
            <ProcessingResultsCard
              processedData={processedData}
              onDownloadButtonClick={handleDownloadButtonClick}
            />
          )}

          {progress.status === 'processing' && (
            <div className="card">
              <h3 style={{ fontSize: '1.125rem', fontWeight: '500', color: 'var(--primary-highlight)', marginBottom: '1rem' }}>
                Processing Distance Matrix
              </h3>

              <div style={{ width: '100%', backgroundColor: '#E5E7EB', borderRadius: '9999px', height: '8px', marginBottom: '0.5rem' }}>
                <div
                  style={{
                    width: `${progress.percent}%`,
                    backgroundColor: 'var(--primary-color)',
                    height: '8px',
                    borderRadius: '9999px',
                    transition: 'width 0.3s ease-in-out'
                  }}
                ></div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#4B5563' }}>
                <span>
                  {progress.completed} of {progress.total} address pairs processed
                </span>
                <span>{progress.percent}%</span>
              </div>
            </div>
          )}

          {error && (
            <div className="card" style={{ backgroundColor: '#FEF2F2', borderColor: '#FC6060' }}>
              <p style={{ color: '#B91C1C' }}>{error}</p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '1.5rem 0', borderTop: '1px solid #E5E7EB', marginTop: '2rem' }}>
        <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
          AllCheer Distance Matrix Calculator &copy; {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
};

export default AppWrapper;
