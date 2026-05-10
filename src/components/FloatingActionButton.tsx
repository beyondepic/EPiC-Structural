import React, { useRef, useCallback } from 'react';
import './FloatingActionButton.css';

const FloatingActionButton = ({ onClick }) => {
  const buttonRef = useRef(null);

  // Use useCallback to optimize performance and avoid unnecessary re-renders
  const handleClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Immediate click response, no delay
    if (onClick) {
      onClick();
    }

    // Add click ripple effect
    const button = buttonRef.current;
    if (button) {
      button.classList.add('fab-clicked');
      setTimeout(() => {
        button.classList.remove('fab-clicked');
      }, 300);
    }
  }, [onClick]);

  // Fast hover response
  const handleMouseEnter = useCallback(() => {
    const button = buttonRef.current;
    if (button) {
      button.classList.add('fab-hover');
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    const button = buttonRef.current;
    if (button) {
      button.classList.remove('fab-hover');
    }
  }, []);

  return (
    <button
      ref={buttonRef}
      className="floating-action-button"
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      title="Expand control panel"
      aria-label="Expand control panel"
    >
      <svg 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        className="fab-icon"
      >
        <path 
          d="M9 18L15 12L9 6" 
          stroke="currentColor" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
};

export default FloatingActionButton;