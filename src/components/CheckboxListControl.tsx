import React, { useState, useRef, useEffect } from 'react';
import { BiChevronDown, BiChevronUp, BiCheck } from 'react-icons/bi';
import './CheckboxListControl.css';

/**
 * CheckboxListControl - A checkbox-based list multi-select component
 * Designed for the 3D Building Visualizer structural system selector
 */
const CheckboxListControl = ({ 
  id, 
  label, 
  selectedValues = [], 
  onSelectionChange, 
  options = [],
  placeholder = "Select options",
  disabled = false,
  compact = false // Compact mode for embedding in visualizer
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleOptionChange = (optionValue, isCurrentlySelected) => {
    if (!disabled) {
      // Toggle the selection
      onSelectionChange(optionValue, !isCurrentlySelected);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedCount = selectedValues.length;
  const displayText = selectedCount > 0 
    ? `${selectedCount} selected` 
    : placeholder;

  return (
    <div 
      ref={dropdownRef}
      className={`checkbox-list-control ${compact ? 'compact' : ''} ${disabled ? 'disabled' : ''}`}
    >
      {!compact && label && (
        <label htmlFor={id} className="control-label">
          {label}
        </label>
      )}
      
      <div className="checkbox-list-wrapper">
        <button
          id={id}
          type="button"
          className={`checkbox-list-button ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''}`}
          onClick={handleToggle}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          disabled={disabled}
        >
          <span className="selection-text">{displayText}</span>
          {isOpen ? <BiChevronUp size={16} /> : <BiChevronDown size={16} />}
        </button>
        
        {isOpen && !disabled && (
          <div className="checkbox-list-dropdown">
            <div className="checkbox-options-list" role="listbox">
              {options.map((option) => {
                const isSelected = selectedValues.includes(option.value);
                return (
                  <label
                    key={option.value}
                    className={`checkbox-option-item ${isSelected ? 'selected' : ''}`}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleOptionChange(option.value, isSelected)}
                      className="checkbox-input"
                    />
                    <span className="checkbox-custom">
                      {isSelected && <BiCheck size={14} />}
                    </span>
                    <span className="option-label">{option.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckboxListControl;
