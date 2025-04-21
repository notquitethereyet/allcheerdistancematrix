import React from 'react';
import { apiService } from '../services/api';

interface ProcessingResultsCardProps {
  processedData: any;
  onDownloadButtonClick: () => void;
}

const ProcessingResultsCard: React.FC<ProcessingResultsCardProps> = ({
  processedData,
  onDownloadButtonClick,
}) => {
  if (!processedData) return null;

  return (
    <div className="card">
      <h2 className="section-header">Processing Results</h2>
      
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ marginBottom: '0.5rem', fontSize: '0.875rem', color: '#4B5563' }}>
          <strong>Status:</strong> {processedData.message}
        </div>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem' }}>
          <div className="stat-card">
            <div className="stat-value">{processedData.totalPairsInOutput || processedData.totalPairs || 0}</div>
            <div className="stat-label">Total Pairs</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-value">{processedData.processingTimeSeconds ? `${processedData.processingTimeSeconds.toFixed(1)}s` : 'N/A'}</div>
            <div className="stat-label">Processing Time</div>
          </div>
          
          {processedData.failedBatchCount !== undefined && (
            <div className="stat-card">
              <div className="stat-value">{processedData.failedBatchCount}</div>
              <div className="stat-label">Failed Batches</div>
            </div>
          )}
          
          {processedData.apiPairErrors !== undefined && (
            <div className="stat-card">
              <div className="stat-value">{processedData.apiPairErrors}</div>
              <div className="stat-label">API Errors</div>
            </div>
          )}
        </div>
      </div>
      
      {processedData.resultFilename ? (
        <a
          href={apiService.downloadResult(processedData.resultFilename)}
          className="btn btn-highlight"
          style={{ marginTop: '1rem', display: 'inline-flex', alignItems: 'center' }}
          download
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download Complete Results ({processedData.totalPairsInOutput || processedData.totalPairs} rows)
        </a>
      ) : (
        <button
          onClick={onDownloadButtonClick}
          className="btn btn-highlight"
          style={{ marginTop: '1rem', display: 'inline-flex', alignItems: 'center' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download Sample Results
        </button>
      )}
    </div>
  );
};

export default ProcessingResultsCard;
