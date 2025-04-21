import React from 'react';

interface WorksheetSelectorProps {
  worksheetNames: string[];
  selectedWorksheet: string;
  onWorksheetChange: (worksheetName: string) => void;
  disabled?: boolean;
}

const WorksheetSelector: React.FC<WorksheetSelectorProps> = ({
  worksheetNames,
  selectedWorksheet,
  onWorksheetChange,
  disabled = false,
}) => {
  if (!worksheetNames || worksheetNames.length === 0) {
    return null;
  }

  return (
    <div className="worksheet-selector">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Select Worksheet (Tab)
      </label>
      <div className="relative">
        <select
          className="form-control"
          value={selectedWorksheet}
          onChange={(e) => onWorksheetChange(e.target.value)}
          disabled={disabled}
        >
          {worksheetNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default WorksheetSelector;
