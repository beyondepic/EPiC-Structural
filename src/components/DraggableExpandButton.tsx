import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BiChevronRight } from 'react-icons/bi';

const DraggableExpandButton = ({ onClick }) => {
  const buttonRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(() => {
    // Load position from localStorage, use default if not found
    const savedPosition = localStorage.getItem('expandButtonPosition');
    if (savedPosition) {
      try {
        return JSON.parse(savedPosition);
      } catch (e) {
        console.warn('Failed to parse saved button position:', e);
      }
    }
    // Default position: left side of screen, vertically centered
    return { x: 16, y: window.innerHeight / 2 - 24 };
  });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = useState(false);

  // Store latest coordinates to avoid frequent state updates
  const latestPositionRef = useRef(position);
  const animationFrameRef = useRef(null);

  // Save position to localStorage
  const savePosition = useCallback((newPosition) => {
    localStorage.setItem('expandButtonPosition', JSON.stringify(newPosition));
  }, []);

  // Use requestAnimationFrame to update DOM position
  const updatePosition = useCallback(() => {
    if (buttonRef.current) {
      const { x, y } = latestPositionRef.current;
      buttonRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }
    animationFrameRef.current = null;
  }, []);

  // Start animation frame loop
  const startAnimationFrame = useCallback(() => {
    if (!animationFrameRef.current) {
      animationFrameRef.current = requestAnimationFrame(updatePosition);
    }
  }, [updatePosition]);

  // Mouse down event
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
    setHasDragged(false);
    setDragStart({
      x: e.clientX - latestPositionRef.current.x,
      y: e.clientY - latestPositionRef.current.y
    });
  }, []);

  // Mouse move event - only update ref, don't trigger re-render
  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;

    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    // Boundary constraints: ensure button doesn't go outside viewport
    const buttonSize = 48;
    const constrainedX = Math.max(0, Math.min(window.innerWidth - buttonSize, newX));
    const constrainedY = Math.max(0, Math.min(window.innerHeight - buttonSize, newY));

    // Update coordinates in ref
    latestPositionRef.current = { x: constrainedX, y: constrainedY };

    // Start animation frame update
    startAnimationFrame();

    // If movement distance exceeds threshold, mark as dragging
    const deltaX = Math.abs(e.clientX - (dragStart.x + position.x));
    const deltaY = Math.abs(e.clientY - (dragStart.y + position.y));
    if (deltaX > 5 || deltaY > 5) {
      setHasDragged(true);
    }
  }, [isDragging, dragStart, position, startAnimationFrame]);

  // Mouse release event
  const handleMouseUp = useCallback((e) => {
    if (isDragging) {
      setIsDragging(false);

      // Update React state to keep synchronized
      setPosition(latestPositionRef.current);

      // Save new position
      savePosition(latestPositionRef.current);

      // If no significant dragging occurred, trigger click event
      if (!hasDragged) {
        onClick();
      }
    }
  }, [isDragging, hasDragged, onClick, savePosition]);

  // Add global mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Clean up animation frame
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // When position state changes, sync update ref
  useEffect(() => {
    latestPositionRef.current = position;
  }, [position]);

  // Adjust position when window size changes
  useEffect(() => {
    const handleResize = () => {
      setPosition(prevPosition => {
        const buttonSize = 48;
        const constrainedX = Math.max(0, Math.min(window.innerWidth - buttonSize, prevPosition.x));
        const constrainedY = Math.max(0, Math.min(window.innerHeight - buttonSize, prevPosition.y));
        const newPosition = { x: constrainedX, y: constrainedY };
        savePosition(newPosition);
        return newPosition;
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [savePosition]);

  return (
    <button
      ref={buttonRef}
      className="floating-expand-btn"
      onMouseDown={handleMouseDown}
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        cursor: isDragging ? 'grabbing' : 'grab',
        zIndex: 1000,
      }}
      title="Expand Control Panel (Drag to reposition)"
    >
      <BiChevronRight size={20} />
    </button>
  );
};

export default DraggableExpandButton;
