import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

// ---------- Base URL handling ----------
let API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Ensure protocol
if (!API_BASE_URL.startsWith('http://') && !API_BASE_URL.startsWith('https://')) {
  API_BASE_URL = `https://${API_BASE_URL}`;
}

// Allows either ".../api" or no suffix; endpoints adjust accordingly
const baseUrlHasApiSuffix = API_BASE_URL.endsWith('/api');

// ---------- Endpoints actually implemented by backend ----------
const API_ENDPOINTS = {
  HEALTH: baseUrlHasApiSuffix ? '/health' : '/api/health',
  UPLOAD_MATRIX: baseUrlHasApiSuffix ? '/upload-distance-matrix' : '/api/upload-distance-matrix',
  DOWNLOAD_RESULT: baseUrlHasApiSuffix ? '/download-result' : '/api/download-result',
  // NOTE: No /convert-time and no /calculate-distance in backend
};

console.log('[API] base:', API_BASE_URL);
console.log('[API] endpoints:', API_ENDPOINTS);

// ---------- Axios instance ----------
const axiosConfig: AxiosRequestConfig = {
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000,
  withCredentials: false,
};

const axiosInstance: AxiosInstance = axios.create(axiosConfig);

axiosInstance.interceptors.request.use(
  (config) => {
    console.log('[API] →', config.method?.toUpperCase(), config.baseURL + (config.url || ''));
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (res) => {
    console.log('[API] ←', res.status, res.config.url);
    return res;
  },
  (error) => {
    console.error('[API] error:', error?.response?.status, error?.response?.data || error?.message);
    return Promise.reject(error);
  }
);

// ---------- Types ----------
export interface DistanceMatrixResult {
  origin_code: string;
  origin_address: string;
  destination_code: string;
  destination_address: string;
  transport_mode: string;
  timeInMinutes: number | null;
  distanceMeters?: number | null;
  element_status?: string | null;
  element_condition?: string | null;
}

export interface DistanceMatrixResponse {
  message: string;
  totalPairsInOutput: number;
  resultFilename: string | null;
  processingTimeSeconds?: number;
  timestampSource?: string;
  failedBatchCount?: number;
  apiPairErrors?: number;
  apiUsed?: string;
  batchSizeUsed?: string;
}

// ---------- Helpers ----------
/** Returns true if any row in the parsed sheet is TRANSIT (case-insensitive). */
export const hasTransitRows = (rows: any[]): boolean =>
  Array.isArray(rows) &&
  rows.some((r) => String(r?.['Transport Mode'] ?? r?.transport_mode ?? '').toLowerCase() === 'transit');

/** Client-side UTC conversion. Returns unix seconds + ISO string. */
export const toUtcUnix = (localDate: Date) => {
  const unix = Math.floor(localDate.getTime() / 1000); // getTime() is epoch ms since 1970-01-01T00:00:00Z
  return {
    unixTimestamp: unix,
    utcTime: new Date(unix * 1000).toISOString(),
  };
};

// ---------- API surface ----------
export const apiService = {
  // Health check
  checkHealth: async (): Promise<boolean> => {
    try {
      const fullUrl = `${API_BASE_URL}${API_ENDPOINTS.HEALTH}`;
      const res = await axios.get(fullUrl);
      return res.status === 200;
    } catch {
      return false;
    }
  },

  /**
   * Build FormData for /upload-distance-matrix.
   * Automatically attaches `timestamp` only if there are any TRANSIT rows.
   */
  buildUploadFormData: (file: File, rowsFromSheet: any[], departureDate?: Date): FormData => {
    const fd = new FormData();
    fd.append('file', file);

    if (hasTransitRows(rowsFromSheet)) {
      if (!departureDate) {
        throw new Error('A departure time is required when the sheet contains TRANSIT rows.');
      }
      const { unixTimestamp } = toUtcUnix(departureDate);
      fd.append('timestamp', String(unixTimestamp));
    }

    return fd;
  },

  // Upload distance matrix file (expects FormData already built)
  uploadDistanceMatrix: async (formData: FormData): Promise<DistanceMatrixResponse> => {
    try {
      const fullUrl = `${API_BASE_URL}${API_ENDPOINTS.UPLOAD_MATRIX}`;

      const res = await axios.post(fullUrl, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300000, // 5 minutes
        validateStatus: (s) => s < 500,
      });

      if (res.status !== 200) {
        throw new Error(res.data?.message || `Server returned status ${res.status}`);
      }

      return res.data.data as DistanceMatrixResponse;
    } catch (error: any) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. Try a smaller file or try again.');
      }
      if (error.message === 'Network Error') {
        throw new Error('Network error. Check your connection and try again.');
      }
      throw new Error(error.response?.data?.message || error.message || 'Failed to upload file');
    }
  },

  // Build a download URL for a result file
  downloadResultUrl: (filename: string): string => {
    const base = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
    return `${base}${API_ENDPOINTS.DOWNLOAD_RESULT}/${filename}`;
  },
};

export default apiService;
