import React from 'react';

interface ProgressBarProps {
  percent: number;
  label?: string;
  showPercentage?: boolean;
  height?: number;
  className?: string;
  bgColor?: string;
  barColor?: string;
  message?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  percent,
  label,
  showPercentage = true,
  height = 8,
  className = '',
  bgColor = '#E5E7EB',
  barColor = '#03CF9C',
  message
}) => {
  // Ensure percent is between 0 and 100
  const safePercent = Math.min(100, Math.max(0, percent));
  
  return (
    <div className={`w-full ${className}`}>
      {/* Label and percentage */}
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
          {showPercentage && <span className="text-sm font-medium text-gray-700">{safePercent}%</span>}
        </div>
      )}
      
      {/* Progress bar */}
      <div 
        className="w-full rounded-full overflow-hidden" 
        style={{ 
          height: `${height}px`, 
          backgroundColor: bgColor 
        }}
      >
        <div 
          className="h-full rounded-full transition-all duration-300" 
          style={{ 
            width: `${safePercent}%`, 
            backgroundColor: barColor 
          }}
        ></div>
      </div>
      
      {/* Optional message below the progress bar */}
      {message && (
        <p className="mt-1 text-xs text-gray-500">{message}</p>
      )}
    </div>
  );
};

export default ProgressBar;
