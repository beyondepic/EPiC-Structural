import React from 'react';
import './SliderControl.css';

const SliderControl = ({
  label,
  value,
  onChange,
  min,
  max,
  step,
  id,
  unit = '',
  disabled = false
}) => {
  return (
    <div className="slider-control">
      <div className="slider-header">
        <label htmlFor={id} className="control-label">
          {label}
        </label>
        <span className="slider-value">
          {value}{unit}
        </span>
      </div>
      
      <div className="slider-wrapper">
        <input
          type="range"
          id={id}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="slider-input"
          disabled={disabled}
        />
        <div className="slider-track">
          <div 
            className="slider-progress"
            style={{
              width: `${((value - min) / (max - min)) * 100}%`
            }}
          />
        </div>
      </div>
      
      <div className="slider-range">
        <span className="range-min">{min}{unit}</span>
        <span className="range-max">{max}{unit}</span>
      </div>
    </div>
  );
};

export default SliderControl;
