import React, { useState, useEffect } from 'react';
import apiService from '../services/api';

const ApiTest: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<string>('Checking...');
  const [error, setError] = useState<string | null>(null);
  const [apiUrl, setApiUrl] = useState<string>('');

  useEffect(() => {
    // Get the API URL - use Railway URL in production
    const isProduction = import.meta.env.PROD;
    const apiBaseUrl = isProduction 
      ? 'https://web-production-f17c2.up.railway.app/api'
      : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api');
    
    setApiUrl(apiBaseUrl);
    
    // Test the health endpoint
    testHealthEndpoint();
  }, []);

  const testHealthEndpoint = async () => {
    try {
      setHealthStatus('Checking...');
      setError(null);
      
      console.log('Testing health endpoint...');
      const isHealthy = await apiService.checkHealth();
      
      console.log('Health check result:', isHealthy);
      setHealthStatus(isHealthy ? 'API is healthy! ✅' : 'API is not healthy ❌');
    } catch (err) {
      console.error('Health check error:', err);
      setHealthStatus('Failed to check API health ❌');
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">API Connection Test</h2>
      
      <div className="mb-4">
        <p className="font-medium">API URL:</p>
        <p className="font-mono text-sm bg-gray-100 p-2 rounded">{apiUrl}</p>
      </div>
      
      <div className="mb-4">
        <p className="font-medium">Health Status:</p>
        <p className={`font-mono text-sm p-2 rounded ${
          healthStatus.includes('✅') 
            ? 'bg-green-100 text-green-800' 
            : healthStatus.includes('❌') 
              ? 'bg-red-100 text-red-800' 
              : 'bg-yellow-100 text-yellow-800'
        }`}>
          {healthStatus}
        </p>
      </div>
      
      {error && (
        <div className="mb-4">
          <p className="font-medium">Error:</p>
          <p className="font-mono text-sm bg-red-100 text-red-800 p-2 rounded overflow-auto max-h-40">
            {error}
          </p>
        </div>
      )}
      
      <button
        onClick={testHealthEndpoint}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        Test Connection Again
      </button>
    </div>
  );
};

export default ApiTest;
