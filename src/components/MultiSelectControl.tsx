import React, { useState } from 'react';
import { BiChevronDown, BiChevronUp, BiCheck, BiX } from 'react-icons/bi';
import './MultiSelectControl.css';

// Icon mapping for performance metrics
const iconMap = {
  'Embodied_GHG_kgCO2e/m^2': 'GHG.png',
  'Embodied_Energy_MJ/m^2': 'Energy.png',
  'Embodied_Water_L/m^2': 'Water.png',
  'Cost_per_NFA_AUD/m^2': 'Cost.png'
};

const MultiSelectControl = ({ 
  id, 
  label, 
  selectedValues = [], 
  onSelectionChange, 
  options = [],
  placeholder = "Select options",
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleOptionChange = (optionValue, isChecked) => {
    if (!disabled) {
      onSelectionChange(optionValue, isChecked);
    }
  };

  const handleRemoveTag = (optionValue, e) => {
    e.stopPropagation(); // Prevent dropdown toggle
    handleOptionChange(optionValue, false);
  };

  const selectedOptions = options.filter(opt => selectedValues.includes(opt.value));

  return (
    <div className={`multi-select-control ${disabled ? 'disabled' : ''}`}>
      <label htmlFor={id} className="control-label">
        {label}
      </label>
      
      <div className="multi-select-wrapper">
        <button
          id={id}
          type="button"
          className={`multi-select-button ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''}`}
          onClick={handleToggle}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          disabled={disabled}
        >
          <div className="selected-tags">
            {selectedOptions.map(option => {
              const iconSrc = iconMap[option.value];
              return (
                <div key={option.value} className="tag-pill">
                  {iconSrc && (
                    <img
                      src={`/${iconSrc}`}
                      alt=""
                      className="tag-icon"
                    />
                  )}
                  <span className="tag-label">{option.label}</span>
                  <button
                    type="button"
                    className="tag-remove"
                    onClick={(e) => handleRemoveTag(option.value, e)}
                    title={`Remove ${option.label}`}
                  >
                    <BiX size={12} />
                  </button>
                </div>
              );
            })}
            {selectedOptions.length === 0 && (
              <span className="placeholder-text">{placeholder}</span>
            )}
          </div>
          {isOpen ? <BiChevronUp size={16} /> : <BiChevronDown size={16} />}
        </button>
        
        {isOpen && !disabled && (
          <div className="multi-select-dropdown">
            <div className="options-list" role="listbox">
              {options.map((option) => {
                const isSelected = selectedValues.includes(option.value);
                const iconSrc = iconMap[option.value] ? `/${iconMap[option.value]}` : null;
                return (
                  <div
                    key={option.value}
                    className={`option-item ${isSelected ? 'selected' : ''}`}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleOptionChange(option.value, !isSelected)}
                    title={`${option.label}: ${option.graphLabel}`}
                  >
                    {iconSrc && (
                      <img
                        src={iconSrc}
                        alt=""
                        className="metric-icon"
                      />
                    )}
                    <span className="option-label">{option.label}</span>
                    {isSelected && (
                      <div className="selection-indicator">
                        <BiCheck size={14} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiSelectControl;
