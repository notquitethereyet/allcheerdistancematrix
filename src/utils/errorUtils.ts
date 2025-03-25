import axios, { AxiosError } from 'axios';

export type ErrorType = 'network' | 'server' | 'validation' | 'auth' | 'forbidden' | 'notFound' | 'unknown';

export interface AppError {
  type: ErrorType;
  message: string;
  originalError?: unknown;
  statusCode?: number;
  fieldErrors?: Record<string, string>;
}

/**
 * Parse different types of errors into a standardized format
 */
export const parseError = (error: unknown): AppError => {
  // Handle Axios errors
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    const statusCode = axiosError.response?.status;

    // Network error
    if (!axiosError.response) {
      return {
        type: 'network',
        message: 'Unable to connect to the server. Please check your internet connection.',
        originalError: error,
      };
    }

    // Authentication error
    if (statusCode === 401) {
      return {
        type: 'auth',
        message: 'Authentication required. Please log in again.',
        statusCode,
        originalError: error,
      };
    }

    // Forbidden
    if (statusCode === 403) {
      return {
        type: 'forbidden',
        message: 'You do not have permission to perform this action.',
        statusCode,
        originalError: error,
      };
    }

    // Not found
    if (statusCode === 404) {
      return {
        type: 'notFound',
        message: 'The requested resource was not found.',
        statusCode,
        originalError: error,
      };
    }

    // Validation errors
    if (statusCode === 400 || statusCode === 422) {
      // Try to extract field errors if available
      let message = 'Invalid data provided.';
      let fieldErrors = undefined;

      try {
        const data = axiosError.response.data as any;
        
        if (typeof data === 'object' && data !== null) {
          // Check for message
          if (typeof data.message === 'string') {
            message = data.message;
          }
          
          // Check for field errors
          if (typeof data.errors === 'object' && data.errors !== null) {
            fieldErrors = data.errors;
          }
        }
      } catch (e) {
        // Ignore parsing errors
      }

      return {
        type: 'validation',
        message,
        fieldErrors,
        statusCode,
        originalError: error,
      };
    }

    // Server error
    if (statusCode && statusCode >= 500) {
      return {
        type: 'server',
        message: 'An unexpected server error occurred. Please try again later.',
        statusCode,
        originalError: error,
      };
    }

    // Other HTTP errors
    return {
      type: 'unknown',
      message: axiosError.message || 'An unknown error occurred.',
      statusCode,
      originalError: error,
    };
  }

  // Handle generic Error objects
  if (error instanceof Error) {
    return {
      type: 'unknown',
      message: error.message || 'An unknown error occurred.',
      originalError: error,
    };
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      type: 'unknown',
      message: error,
    };
  }

  // Default fallback
  return {
    type: 'unknown',
    message: 'An unknown error occurred.',
    originalError: error,
  };
};

/**
 * Helper to safely handle async operations with error parsing
 */
export const safeAsync = async <T>(
  promise: Promise<T>,
  errorMessage = 'An error occurred'
): Promise<[T | null, AppError | null]> => {
  try {
    const data = await promise;
    return [data, null];
  } catch (error) {
    const parsedError = parseError(error);
    
    // Override default message if provided
    if (errorMessage) {
      parsedError.message = errorMessage;
    }
    
    return [null, parsedError];
  }
};