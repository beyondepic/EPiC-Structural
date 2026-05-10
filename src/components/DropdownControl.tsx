import React from 'react';
import './DropdownControl.css';

const DropdownControl = ({ 
  label, 
  value, 
  onChange, 
  options, 
  id,
  disabled = false 
}) => {
  // Find the selected option to show its full label as tooltip
  const selectedOption = options.find(option => option.name === value);
  
  return (
    <div className="dropdown-control">
      <label htmlFor={id} className="control-label">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="dropdown-select"
        disabled={disabled}
        title={selectedOption?.label || ''}
      >
        {options.map((option) => (
          <option key={option.name} value={option.name} title={option.label}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default DropdownControl;
