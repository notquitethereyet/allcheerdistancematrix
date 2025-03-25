import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

// Base URL - pointing to your Flask backend
// Make sure this is correctly pointing to your Flask backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

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
  sampleData: DistanceMatrixResult[];
  resultFilename: string;
  job_id?: string;
}

// API methods
export const apiService = {
  // Check the health of the API
  checkHealth: async (): Promise<boolean> => {
    try {
      const response = await axiosInstance.get('/health');
      return response.status === 200;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  },

  // Convert local time to UTC
  convertToUTC: async (localDateTime: Date): Promise<TimeConversionResponse> => {
    try {
      // Create a date string in a simple format that won't be automatically converted
      // Format: YYYY-MM-DD HH:MM:SS
      const localDateString = `${localDateTime.getFullYear()}-${
        String(localDateTime.getMonth() + 1).padStart(2, '0')}-${
        String(localDateTime.getDate()).padStart(2, '0')} ${
        String(localDateTime.getHours()).padStart(2, '0')}:${
        String(localDateTime.getMinutes()).padStart(2, '0')}:${
        String(localDateTime.getSeconds()).padStart(2, '0')}`;
      
      console.log('Sending local date to backend:', localDateString);
      
      const response = await axiosInstance.post('/convert-time', {
        localTime: localDateString,
      });
      return response.data.data;
    } catch (error) {
      console.error('Error converting time to UTC:', error);
      throw error;
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
      console.log('Sending FormData to server');
      
      // Log the API endpoint being used
      console.log('API endpoint:', `${API_BASE_URL}/upload-distance-matrix`);
      
      // Send the request with detailed logging
      const response = await axiosInstance.post('/upload-distance-matrix', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        // Add timeout and validation options
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
    } catch (error) {
      console.error('Error uploading file for distance matrix:', error);
      throw error;
    }
  },

  // Calculate distance between two addresses
  calculateDistance: async (request: DistanceCalculationRequest): Promise<DistanceCalculationResponse> => {
    try {
      const response = await axiosInstance.post('/calculate-distance', request);
      return response.data.data;
    } catch (error) {
      console.error('Error calculating distance:', error);
      throw error;
    }
  },

  // Download result file
  downloadResult: (filename: string): string => {
    // Ensure the URL is properly formatted
    return `${API_BASE_URL}/download-result/${filename}`;
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