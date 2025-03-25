// Common interfaces and types for the application

// Navigation
export type Page = 'home' | 'time-converter' | 'file-processor' | 'about';

// Time conversion
export interface TimeConversionRequest {
  localDateTime: string;
}

export interface TimeConversionResponse {
  utcTime: string;
  localTime: string;
}

// File processing
export interface ProcessedFileData {
  success: boolean;
  message: string;
  rowCount: number;
  columnCount?: number;
  sampleData?: any[];
}

// API Responses
export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

// Error handling
export interface ApiError {
  message: string;
  status?: number;
  errors?: Record<string, string>;
}

// User preferences
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  timeFormat: '12h' | '24h';
}