import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import './FullscreenButton.css';

/**
 * FullscreenButton Component
 * Provides modal fullscreen functionality with custom corner icon
 * 
 * @param {string} targetId - ID of the element to display in modal
 * @param {string} label - Accessible label for the button
 * @param {function} onEnterFullscreen - Callback when opening modal
 * @param {function} onExitFullscreen - Callback when closing modal
 */
const FullscreenButton = ({ 
  targetId, 
  label = 'Fullscreen',
  onEnterFullscreen,
  onExitFullscreen,
  className = ''
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const previousFocusRef = useRef(null);
  const modalRef = useRef(null);

  // Custom corner icon component
  const CornerIcon = ({ isExpanded }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="corner-icon"
  >
    {isExpanded ? (
      /* 缩小：左上 Γ 开口向内，右下 L 开口向内 */
      <>
        <path d="M 2 6 L 6 6 L 6 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M 12 16 L 12 12 L 16 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </>
    ) : (
      /* 放大：左上 L 开口向外，右下 Γ 开口向外 */
      <>
        <path
          d="M 2 6 L 2 2 L 6 2"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M 16 12 L 16 16 L 12 16"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </>
    )}
  </svg>
);

  // Open modal
  const openModal = useCallback(() => {
    const element = document.getElementById(targetId);
    if (!element) {
      console.error(`Element with id "${targetId}" not found`);
      return;
    }

    // Save current focus
    previousFocusRef.current = document.activeElement;

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    setIsModalOpen(true);

    // Call enter callback
    if (onEnterFullscreen) {
      onEnterFullscreen();
    }
  }, [targetId, onEnterFullscreen]);

  // Close modal
  const closeModal = useCallback(() => {
    // Restore body scroll
    document.body.style.overflow = '';

    setIsModalOpen(false);

    // Restore focus
    if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }

    // Call exit callback
    if (onExitFullscreen) {
      onExitFullscreen();
    }
  }, [onExitFullscreen]);

  // Handle ESC key
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape' && isModalOpen) {
        closeModal();
      }
    };

    if (isModalOpen) {
      document.addEventListener('keydown', handleEscKey);
      return () => document.removeEventListener('keydown', handleEscKey);
    }
  }, [isModalOpen, closeModal]);

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  const toggleModal = () => {
    if (isModalOpen) {
      closeModal();
    } else {
      openModal();
    }
  };

  // Removed tooltip functionality as per user request

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleModal();
    }
  };

  // Move element to modal and back
  useEffect(() => {
    if (!isModalOpen) return;

    const element = document.getElementById(targetId);
    const modalContent = document.querySelector('.fullscreen-modal-content');
    
    if (!element || !modalContent) return;

    // Hide all fullscreen buttons in the element
    const fullscreenButtons = element.querySelectorAll('.fullscreen-button-wrapper, .fullscreen-button');
    fullscreenButtons.forEach(btn => {
      btn.style.display = 'none';
    });

    // Store original parent and next sibling for restoration
    const originalParent = element.parentNode;
    const originalNextSibling = element.nextSibling;
    
    // Store original styles
    const originalStyles = {
      width: element.style.width,
      height: element.style.height,
      maxWidth: element.style.maxWidth,
      maxHeight: element.style.maxHeight,
    };

    // Apply modal styles
    element.classList.add('fullscreen-modal-content-element');
    
    // Move element to modal
    modalContent.appendChild(element);

    // Trigger resize event for 3D canvas
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);

    // Cleanup function to restore element
    return () => {
      // Restore original styles
      Object.assign(element.style, originalStyles);
      element.classList.remove('fullscreen-modal-content-element');
      
      // Restore fullscreen buttons visibility
      fullscreenButtons.forEach(btn => {
        btn.style.display = '';
      });

      // Move element back to original position
      if (originalNextSibling) {
        originalParent.insertBefore(element, originalNextSibling);
      } else {
        originalParent.appendChild(element);
      }

      // Trigger resize event again
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 100);
    };
  }, [isModalOpen, targetId]);

  // Render modal structure
  const renderModalContent = () => {
    return (
      <div 
        className="fullscreen-modal-backdrop" 
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
        aria-label={`${label} - Modal view`}
      >
        <div className="fullscreen-modal-container" ref={modalRef}>
          <div className="fullscreen-modal-header">
            <button
              className="fullscreen-modal-close-button"
              onClick={closeModal}
              aria-label="Close modal"
              type="button"
            >
              <CornerIcon isExpanded={true} />
            </button>
          </div>
          <div className="fullscreen-modal-content">
            {/* Element will be moved here by useEffect */}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="fullscreen-button-wrapper">
        <button
          className={`fullscreen-button ${className}`}
          onClick={toggleModal}
          onKeyDown={handleKeyDown}
          aria-label={isModalOpen ? `Close modal (${label})` : `Open modal (${label})`}
          title={isModalOpen ? `Close modal (${label})` : `Open modal (${label})`}
          type="button"
        >
          <CornerIcon isExpanded={isModalOpen} />
        </button>
      </div>

      {isModalOpen && ReactDOM.createPortal(
        renderModalContent(),
        document.body
      )}
    </>
  );
};

export default FullscreenButton;
