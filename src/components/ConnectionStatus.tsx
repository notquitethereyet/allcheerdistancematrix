import React from 'react';

interface ConnectionStatusProps {
  isConnected: boolean | null;
  onRetry?: () => void;
  compact?: boolean;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  onRetry,
  compact = false
}) => {
  if (compact) {
    // Compact version for navbar
    return (
      <div className="flex items-center">
        <span className={`h-2 w-2 rounded-full ${
          isConnected === null
            ? 'bg-gray-500'
            : isConnected
              ? 'bg-green-500'
              : 'bg-red-500'
        }`}></span>
        
        {!isConnected && onRetry && (
          <button
            onClick={onRetry}
            className="ml-2 text-xs text-gray-600 hover:text-blue-600"
            title="Retry backend connection"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  // Full version for main content
  return (
    <div className="inline-flex items-center">
      <div className={`inline-flex items-center px-4 py-2 rounded-full ${
        isConnected === null
          ? 'bg-gray-100 text-gray-700'
          : isConnected
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
      }`}>
        <span className={`h-3 w-3 rounded-full mr-2 ${
          isConnected === null
            ? 'bg-gray-500'
            : isConnected
              ? 'bg-green-500'
              : 'bg-red-500'
        }`}></span>
        {isConnected === null
          ? 'Checking backend connection...'
          : isConnected
            ? 'Backend connected'
            : 'Backend not connected'}
      </div>
      
      {isConnected === false && onRetry && (
        <button
          onClick={onRetry}
          className="ml-2 px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Retry
        </button>
      )}
    </div>
  );
};

export default ConnectionStatus;