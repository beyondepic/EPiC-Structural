import React, { useState, useEffect } from 'react';
import './NumberInput.css';

const NumberInput = ({ 
  id, 
  label, 
  value = 0, 
  onChange, 
  min, 
  max, 
  step = 1,
  unit,
  placeholder = "Enter value",
  disabled = false
}) => {
  const [inputValue, setInputValue] = useState((value || 0).toString());
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    setInputValue((value || 0).toString());
  }, [value]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Validate the input
    const numValue = parseFloat(newValue);
    if (newValue === '' || isNaN(numValue)) {
      setIsValid(false);
      return;
    }

    if (numValue < min || numValue > max) {
      setIsValid(false);
      return;
    }

    setIsValid(true);
    onChange(numValue);
  };

  const handleBlur = () => {
    // On blur, ensure we have a valid value
    const numValue = parseFloat(inputValue);
    if (isNaN(numValue) || numValue < min || numValue > max) {
      // Reset to current valid value
      setInputValue(value.toString());
      setIsValid(true);
    }
  };

  const handleKeyDown = (e) => {
    // Allow: backspace, delete, tab, escape, enter
    if ([46, 8, 9, 27, 13].indexOf(e.keyCode) !== -1 ||
        // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        (e.keyCode === 65 && e.ctrlKey === true) ||
        (e.keyCode === 67 && e.ctrlKey === true) ||
        (e.keyCode === 86 && e.ctrlKey === true) ||
        (e.keyCode === 88 && e.ctrlKey === true) ||
        // Allow: home, end, left, right
        (e.keyCode >= 35 && e.keyCode <= 39)) {
      return;
    }
    // Ensure that it is a number and stop the keypress
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
      e.preventDefault();
    }
  };

  return (
    <div className="number-input-control">
      <label htmlFor={id} className="control-label">
        {label}
      </label>
      
      <div className="number-input-container">
        <input
          type="number"
          id={id}
          className={`number-input ${!isValid ? 'invalid' : ''} ${disabled ? 'disabled' : ''}`}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          min={min}
          max={max}
          step={step}
          placeholder={placeholder}
          disabled={disabled}
        />
        {unit && <span className="input-unit">{unit}</span>}
      </div>
      
      <div className="input-info">
        <span className="range-info">Range: {min} - {max}</span>
        {!isValid && (
          <span className="error-message">
            Please enter a value between {min} and {max}
          </span>
        )}
      </div>
    </div>
  );
};

export default NumberInput;
