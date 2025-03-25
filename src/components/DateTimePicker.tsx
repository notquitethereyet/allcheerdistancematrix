import React, { useState } from 'react';
import DatePicker from 'react-datepicker';

interface DateTimePickerProps {
  label: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  required?: boolean;
  disabled?: boolean;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({
  label,
  value,
  onChange,
  required = false,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (date: Date | null) => {
    onChange(date);
    setIsOpen(false);
  };

  const handleClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="date-time-picker-input">
        <div 
          className={`input-container ${disabled ? 'disabled' : ''}`}
          onClick={handleClick}
        >
          <div className="calendar-icon">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="1.5" />
              <line x1="3" y1="10" x2="21" y2="10" strokeWidth="1.5" />
              <line x1="8" y1="2" x2="8" y2="6" strokeWidth="1.5" />
              <line x1="16" y1="2" x2="16" y2="6" strokeWidth="1.5" />
            </svg>
          </div>
          
          <input
            type="text"
            className="date-input"
            value={value ? value.toLocaleString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }) : ''}
            readOnly
            placeholder="Select date and time"
            disabled={disabled}
          />
        </div>
      </div>

      {isOpen && (
        <div className="date-picker-popup">
          <DatePicker
            selected={value}
            onChange={handleChange}
            onClickOutside={() => setIsOpen(false)}
            showTimeSelect
            timeFormat="HH:mm"
            timeIntervals={15}
            dateFormat="MMMM d, yyyy h:mm aa"
            inline
          />
        </div>
      )}
    </div>
  );
};

export default DateTimePicker;