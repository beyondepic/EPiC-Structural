import React, { useCallback } from 'react';
import { BiChevronUp, BiChevronDown } from 'react-icons/bi';
import FullscreenButton from './FullscreenButton';
import './DataSummaryWidget.css';

const DataSummaryWidget = ({ controls, chartData, isAuthenticated }) => {
  const [activeMaterialIndex, setActiveMaterialIndex] = React.useState(0);
  const [isCurrentConfigCollapsed, setIsCurrentConfigCollapsed] = React.useState(false);
  
  // Function to format numbers with comma separators
  const formatNumber = (num, decimals = 2) => {
    if (num === null || num === undefined || isNaN(num)) return '-';
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };
  
  // Convert controls data to expected format
  const { 
    materials: selectedMaterialKeys = [], 
    numberOfStoreys,
    shape 
  } = controls;

  // Create materials array with selected property
  const materials = selectedMaterialKeys.map(key => ({
    name: key,
    selected: true
  }));

  const selectedMaterials = materials || [];
  
  // Reset active material index if it's out of bounds
  React.useEffect(() => {
    if (activeMaterialIndex >= selectedMaterials.length) {
      setActiveMaterialIndex(0);
    }
  }, [selectedMaterials.length, activeMaterialIndex]);

  // Handle fullscreen callbacks (MUST be before early returns)
  const handleEnterFullscreen = useCallback(() => {
    // General Information will automatically adjust with CSS
  }, []);

  const handleExitFullscreen = useCallback(() => {
    // General Information will automatically adjust with CSS
  }, []);

  // Show login prompt if not authenticated - moved after all hooks
  if (!isAuthenticated) {
    return (
      <>
        <div className="widget-header">
          <h3 className="widget-title">Data Summary</h3>
        </div>
        <div className="auth-placeholder">
          <div className="auth-message">
            <h4>Login Required to View Data</h4>
            <p>Please log in to view detailed data analysis and performance metrics.</p>
            <div className="placeholder-summary">
              <div className="placeholder-section">
                <div className="placeholder-title"></div>
                <div className="placeholder-content">
                  <div className="placeholder-line"></div>
                  <div className="placeholder-line"></div>
                  <div className="placeholder-line"></div>
                </div>
              </div>
              <div className="placeholder-section">
                <div className="placeholder-title"></div>
                <div className="placeholder-content">
                  <div className="placeholder-line"></div>
                  <div className="placeholder-line"></div>
                </div>
              </div>
              <div className="placeholder-overlay">
                <span>🔒 Login Required</span>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Calculate building metrics based on controls
  const calculateBuildingMetrics = () => {
    const storeys = numberOfStoreys || 15;
    const widthSpans = controls.columnWidthSpans || 5;
    const depthSpans = controls.columnDepthSpans || 5;

    // Assume typical span length (could be made configurable)
    const spanLength = 6; // meters
    // Prefer explicit building dimensions from controls when provided, otherwise derive from spans
    const width = (controls.buildingWidth !== undefined && controls.buildingWidth !== null && !isNaN(Number(controls.buildingWidth)))
      ? Number(controls.buildingWidth)
      : widthSpans * spanLength;
    const actualDepth = (controls.buildingDepth !== undefined && controls.buildingDepth !== null && !isNaN(Number(controls.buildingDepth)))
      ? Number(controls.buildingDepth)
      : depthSpans * spanLength;
    
    // Floor area per floor
    const floorArea = width * actualDepth;
    
    // Gross floor area (total area across all floors)
    const grossFloorArea = floorArea * storeys;
    
    // Typical floor height
    const floorHeight = 3.5; // meters

    // Floor volume (per floor) and gross floor volume (all floors)
    const floorVolume = floorArea * floorHeight; // m³ per floor
    const grossFloorVolume = floorVolume * storeys; // total m³
    
    // Facade area (perimeter * height)
    const perimeter = 2 * (width + actualDepth);
    const facadeArea = perimeter * (storeys * floorHeight); // Total facade area
    const facadeAreaPerFloor = perimeter * floorHeight; // Facade area per floor
    
    // Building type determination (more sophisticated)
    let buildingType = 'Mixed Use';
    if (shape === 'rectangle') {
      if (storeys <= 4) {
        buildingType = 'Low-Rise Residential';
      } else if (storeys <= 12) {
        buildingType = 'Mid-Rise Residential';
      } else {
        buildingType = 'High-Rise Residential';
      }
    } else if (shape === 'L-shape') {
      buildingType = 'Commercial Complex';
    } else {
      buildingType = 'Institutional';
    }
    
    return {
      floorArea,
      grossFloorArea,
      floorVolume,
      grossFloorVolume,
      facadeArea,
      facadeAreaPerFloor,
      buildingType,
      width,
      depth: actualDepth,
      height: storeys * floorHeight
    };
  };

  const buildingMetrics = calculateBuildingMetrics();
  
  return (
    <div
      id="general-information-container"
      className={`configuration-section animated-panel ${isCurrentConfigCollapsed ? 'collapsed' : 'expanded'}`}
    >
      <div 
        className="config-header" 
        onClick={(e) => {
          // Prevent collapse/expand when clicking fullscreen button
          if (e.target.closest('.fullscreen-button-wrapper')) {
            return;
          }
          setIsCurrentConfigCollapsed(!isCurrentConfigCollapsed);
        }}
      >
        <div className="section-title-left">
          <span>General information</span>
        </div>
        <div className="section-actions-right">
          <FullscreenButton 
            targetId="general-information-container"
            label="General Information"
            onEnterFullscreen={handleEnterFullscreen}
            onExitFullscreen={handleExitFullscreen}
          />
          <div className="section-chevon-right">
            {isCurrentConfigCollapsed ? <BiChevronDown size={20} /> : <BiChevronUp size={20} />}
          </div>
        </div>
      </div>
      <div className={`config-content ${isCurrentConfigCollapsed ? 'collapsed' : 'expanded'}`}>
        <div className="config-grid-two-columns expanded">
          {/* Row 1: Building height | Span configuration */}
          <div className="config-item">
            <span className="config-label">Building height</span>
            <span className="config-value">{formatNumber(buildingMetrics.height, 1)} m</span>
          </div>
          <div className="config-item">
            <span className="config-label">Span configuration</span>
            <span className="config-value">{formatNumber(buildingMetrics.width, 0)} m × {formatNumber(buildingMetrics.depth, 0)} m</span>
          </div>
          
          {/* Row 2: GROSS FLOOR AREA | GROSS FLOOR AREA PER FLOOR */}
          <div className="config-item">
            <span className="config-label">GROSS FLOOR AREA</span>
            <span className="config-value">{formatNumber(buildingMetrics.grossFloorArea, 0)} m²</span>
          </div>
          <div className="config-item">
            <span className="config-label">GROSS FLOOR AREA PER FLOOR</span>
            <span className="config-value">{formatNumber(buildingMetrics.floorArea, 0)} m²</span>
          </div>
          
          {/* Row 3: GROSS FLOOR VOLUME | GROSS FLOOR VOLUME PER FLOOR */}
          <div className="config-item">
            <span className="config-label">GROSS FLOOR VOLUME</span>
            <span className="config-value">{formatNumber(buildingMetrics.grossFloorVolume, 0)} m³</span>
          </div>
          <div className="config-item">
            <span className="config-label">GROSS FLOOR VOLUME PER FLOOR</span>
            <span className="config-value">{formatNumber(buildingMetrics.floorVolume, 0)} m³</span>
          </div>
          
          {/* Row 4: FACADE AREA | FACADE AREA PER FLOOR */}
          <div className="config-item">
            <span className="config-label">FACADE AREA</span>
            <span className="config-value">{formatNumber(buildingMetrics.facadeArea, 0)} m²</span>
          </div>
          <div className="config-item">
            <span className="config-label">FACADE AREA PER FLOOR</span>
            <span className="config-value">{formatNumber(buildingMetrics.facadeAreaPerFloor, 0)} m²</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataSummaryWidget;
