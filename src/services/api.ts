import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

// Base URL - pointing to your Flask backend
// Make sure this is correctly pointing to your Flask backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// API endpoints - including the /api prefix to match backend routes
const API_ENDPOINTS = {
  HEALTH: '/api/health',
  CONVERT_TIME: '/api/convert-time',
  UPLOAD_MATRIX: '/api/upload-distance-matrix',
  DOWNLOAD_RESULT: '/api/download-result',
  CALCULATE_DISTANCE: '/api/calculate-distance',
};

// Log the API endpoints for debugging
console.log('API endpoints:', API_ENDPOINTS);

// You might need to log it to verify what URL is actually being used
console.log('API base URL:', API_BASE_URL);

// Create axios request configuration
const axiosConfig: AxiosRequestConfig = {
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000, // 30 seconds
  withCredentials: false, // Don't send cookies for cross-site requests
};

// Log the axios configuration for debugging
console.log('Axios config:', axiosConfig);

// Create axios instance
const axiosInstance: AxiosInstance = axios.create(axiosConfig);

// Add request interceptor for debugging
axiosInstance.interceptors.request.use(
  config => {
    console.log('Making request to:', config.url);
    console.log('Request config:', config);
    return config;
  },
  error => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
axiosInstance.interceptors.response.use(
  response => {
    console.log('Response received:', response.status);
    return response;
  },
  error => {
    console.error('Response error:', error.message);
    console.error('Full error:', error);
    if (error.response) {
      console.error('Error status:', error.response.status);
      console.error('Error data:', error.response.data);
    }
    return Promise.reject(error);
  }
);

// Type definitions
export interface ProcessedFileData {
  success: boolean;
  message: string;
  rowCount?: number;
  totalPairs?: number;
  resultFilename?: string;
}

export interface TimeConversionResponse {
  utcTime: string;
  unixTimestamp: number;
  dstActive: boolean;
}

export interface DistanceCalculationRequest {
  originAddress: string;
  destinationAddress: string;
  transportMode: string;
  departureTime: string;
}

export interface DistanceCalculationResponse {
  origin: string;
  destination: string;
  transportMode: string;
  timeInMinutes: number;
  distanceInKm: number;
  departureTime: string;
}

export interface DistanceMatrixResult {
  origin_code: string;
  origin_address: string;
  destination_code: string;
  destination_address: string;
  transport_mode: string;
  timeInMinutes: number;
}

export interface DistanceMatrixResponse {
  message: string;
  totalPairs: number;
  totalPairsCalculated?: number;
  sampleData: DistanceMatrixResult[];
  resultFilename: string;
  job_id?: string;
  processingTimeSeconds?: number;
}

// API methods
export const apiService = {
  // Check the health of the API
  checkHealth: async (): Promise<boolean> => {
    try {
      const fullUrl = `${API_BASE_URL}${API_ENDPOINTS.HEALTH}`;
      console.log('Health check API endpoint:', fullUrl);
      
      const response = await axios.get(fullUrl);
      return response.status === 200;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  },

  // Convert local time to UTC
  convertToUTC: async (localDate: Date): Promise<{ utcTime: string; unixTimestamp: number }> => {
    try {
      // Try to use the backend's time conversion API
      const fullUrl = `${API_BASE_URL}${API_ENDPOINTS.CONVERT_TIME}`;
      console.log('Time conversion API endpoint:', fullUrl);
      
      // Format the date as expected by the backend (YYYY-MM-DDTHH:MM:SS)
      const localTimeStr = localDate.toISOString();
      
      const response = await axios.post(fullUrl, {
        localTime: localTimeStr,
        fromTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });
      
      console.log('Time conversion response:', response.data);
      
      return {
        utcTime: response.data.data.utcTime,
        unixTimestamp: response.data.data.unixTimestamp
      };
    } catch (error: any) {
      console.error('Error converting time to UTC:', error);
      
      // Log detailed error information
      if (error.response) {
        console.log('Error status:', error.response.status);
        console.log('Error data:', error.response.data);
      }
      
      // Fallback: Do the conversion in the browser if the API is unavailable
      console.log('Using fallback time conversion method');
      
      // Convert to UTC using the browser's Date methods
      const utcDate = new Date(localDate.getTime());
      const utcTimeString = utcDate.toISOString();
      const unixTimestamp = Math.floor(utcDate.getTime() / 1000);
      
      return {
        utcTime: utcTimeString,
        unixTimestamp: unixTimestamp
      };
    }
  },

  // Mock method for processing XLSX data (can keep this during transition)
  processXlsxFile: (data: any[]): any => {
    console.log('Mock processing XLSX data:', data);
    // Return some mock processed data
    return {
      success: true,
      message: 'File processed successfully (mock)',
      rowCount: data.length,
      columnCount: data.length > 0 ? Object.keys(data[0]).length : 0,
      sampleData: data.slice(0, 5),
    };
  },

  // Upload distance matrix file
  uploadDistanceMatrix: async (formData: FormData): Promise<DistanceMatrixResponse> => {
    try {
      console.log('Sending FormData to /upload-distance-matrix');
      
      // Debug: Log FormData contents
      console.log('FormData entries:');
      for (const pair of formData.entries()) {
        console.log(`${pair[0]}: ${pair[1]}`);
      }
      
      // Log the API endpoint being used
      const fullUrl = `${API_BASE_URL}${API_ENDPOINTS.UPLOAD_MATRIX}`;
      console.log('API endpoint:', fullUrl);
      
      // Send the request with detailed logging
      const response = await axios.post(fullUrl, formData, {
        headers: {
          // Axios correctly sets multipart/form-data when FormData is passed
          'Content-Type': 'multipart/form-data',
        },
        // Increase timeout for the synchronous processing
        timeout: 300000, // 5 minutes for large files
        validateStatus: (status) => {
          return status < 500; // Resolve only if status is less than 500
        }
      });
      
      console.log('Server response received:', response.status, response.statusText);
      
      // Check if the response is successful
      if (response.status !== 200) {
        console.error('Server returned error status:', response.status, response.data);
        throw new Error(response.data?.message || `Server returned status ${response.status}`);
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error('Error uploading file for distance matrix:', error);
      
      // Handle timeout errors specifically
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. The process is taking too long. Please try with a smaller file or contact support.');
      }
      
      // Handle network errors
      if (error.message === 'Network Error') {
        throw new Error('Network error. Please check your internet connection and try again.');
      }
      
      // Pass through the error message from the server if available
      const errorMessage = error.response?.data?.message || error.message || 'Failed to upload file';
      throw new Error(errorMessage);
    }
  },

  // Calculate distance between two addresses
  calculateDistance: async (request: DistanceCalculationRequest): Promise<DistanceCalculationResponse> => {
    try {
      const fullUrl = `${API_BASE_URL}${API_ENDPOINTS.CALCULATE_DISTANCE}`;
      console.log('Calculate distance API endpoint:', fullUrl);
      
      const response = await axios.post(fullUrl, request);
      return response.data.data;
    } catch (error) {
      console.error('Error calculating distance:', error);
      throw error;
    }
  },

  // Download result file
  downloadResult: (filename: string): string => {
    // Ensure no double slashes if API_BASE_URL ends with /
    const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
    return `${baseUrl}${API_ENDPOINTS.DOWNLOAD_RESULT}/${filename}`;
  },
  
  // Download processed data as Excel file
  downloadProcessedData: async (data: any[], filename: string = 'processed_data.xlsx'): Promise<void> => {
    try {
      // Dynamically import xlsx
      const XLSX = await import('xlsx');
      
      // Convert data to worksheet
      const worksheet = XLSX.utils.json_to_sheet(data);
      
      // Create workbook and append worksheet
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Processed Data');
      
      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      
      // Create Blob from buffer
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      
      // Append link to body, click it, and remove it
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Release the object URL
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading processed data:', error);
      throw error;
    }
  },
};

export default apiService;