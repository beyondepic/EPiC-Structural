import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import Plot from 'react-plotly.js';
import { BiChevronLeft, BiChevronRight } from 'react-icons/bi';
import { ENVIRONMENTAL_FLOWS, MATERIALS, STRUCTURAL_SYSTEMS } from '../services/constants';
import FullscreenButton from './FullscreenButton';
import './ChartWidget.css';

// Metric icons mapping - same as MaterialTable
const metricIcons = {
  'Embodied_GHG_kgCO2e/m^2': '/GHG.png',
  'Embodied_Energy_MJ/m^2': '/Energy.png',
  'Embodied_Water_L/m^2': '/Water.png',
  'Cost_per_NFA_AUD/m^2': '/Cost.png'
};

const ChartWidget = ({ chartData, controls, setCurrentFlowIndex, isAuthenticated, selectedMaterial, hoveredMaterial, isSidebarVisible, sortedMaterials }) => {
  const plotRef = useRef(null);
  const containerRef = useRef(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipTimer, setTooltipTimer] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [isFullscreen, setIsFullscreen] = useState(false);
  const yAxisRange = useMemo(() => {
    if (!chartData?.series || chartData.series.length === 0) {
      return null;
    }

    let maxValue = Number.NEGATIVE_INFINITY;
    let minValue = Number.POSITIVE_INFINITY;

    chartData.series.forEach(series => {
      series?.data?.forEach(point => {
        const yVal = point?.y;
        if (typeof yVal === 'number' && !Number.isNaN(yVal)) {
          maxValue = Math.max(maxValue, yVal);
          minValue = Math.min(minValue, yVal);
        }
      });
    });

    if (!Number.isFinite(maxValue)) {
      return null;
    }

    const lowerBound = Math.min(0, minValue);
  // Extend upper bound by roughly 70% to keep lines from hugging the top axis
  let upperBound = maxValue > 0 ? maxValue * 1 : maxValue * 1;

    if (!Number.isFinite(upperBound) || upperBound === lowerBound) {
      upperBound = lowerBound + Math.max(Math.abs(lowerBound) * 0.5, 1);
    }

    return [lowerBound, upperBound];
  }, [chartData?.series]);
  
  // Update chart when hover state changes
  useEffect(() => {
    if (plotRef.current && window.Plotly && chartData.series?.length > 0) {
      // Use restyle for better performance than full redraw
      // Only update if we have actual chart data
      try {
        window.Plotly.restyle(plotRef.current, {}, Array.from({length: chartData.series.length}, (_, i) => i));
      } catch (error) {
        // Fallback to redraw if restyle fails
        console.warn('Chart restyle failed, using redraw fallback:', error);
        window.Plotly.redraw(plotRef.current);
      }
    }
  }, [hoveredMaterial, selectedMaterial, chartData.series]);
  
  // Force resize when container size changes with size change detection
  useEffect(() => {
    if (!containerRef.current) return;
    
    let lastWidth = 0;
    let lastHeight = 0;
    let resizeTimeout = null;
    let resizeCount = 0;
    
    const resizeObserver = new ResizeObserver((entries) => {
      // Skip resize ONLY during horizontal dragging for performance
      const isHorizontalResizing = document.body.classList.contains('is-resizing');
      if (isHorizontalResizing) return;
      
      // Only resize if the container actually changed size
      const entry = entries[0];
      if (entry && plotRef.current && window.Plotly) {
        const { width, height } = entry.contentRect;
        
        // Debug logging
        resizeCount++;
        console.log(`📊 [ChartWidget] Resize #${resizeCount}: ${width.toFixed(1)}x${height.toFixed(1)} (last: ${lastWidth.toFixed(1)}x${lastHeight.toFixed(1)})`);
        
        // Only trigger if dimensions changed by more than 2px (prevent micro-fluctuations)
        const widthChanged = Math.abs(width - lastWidth) > 2;
        const heightChanged = Math.abs(height - lastHeight) > 2;
        
        if (!widthChanged && !heightChanged) {
          console.log(`📊 [ChartWidget] Skipped - change too small`);
          return; // Skip if no significant change
        }
        
        lastWidth = width;
        lastHeight = height;
        
        // Debounce resize to avoid excessive updates
        if (resizeTimeout) {
          clearTimeout(resizeTimeout);
        }
        
        resizeTimeout = setTimeout(() => {
          // Use requestAnimationFrame for smooth resizing
          requestAnimationFrame(() => {
            try {
              window.Plotly.Plots.resize(plotRef.current);
              console.log(`📊 [ChartWidget] Plotly resized to ${width.toFixed(0)}x${height.toFixed(0)}px`);
            } catch (error) {
              console.warn('ResizeObserver resize failed:', error);
            }
          });
        }, 200); // Increased debounce to 200ms
      }
    });
    
    resizeObserver.observe(containerRef.current);
    
    return () => {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      resizeObserver.disconnect();
    };
  }, []);
  
    // Force resize when sidebar visibility changes - simplified to single attempt
  useEffect(() => {
    console.log(`📊 [ChartWidget] Sidebar visibility changed: ${isSidebarVisible}`);
    
    // Single resize attempt after layout transition completes
    const resizeTimeout = setTimeout(() => {
      if (plotRef.current && window.Plotly) {
        try {
          // Only use Plots.resize, avoid relayout which can trigger loops
          window.Plotly.Plots.resize(plotRef.current);
          console.log(`📊 [ChartWidget] Sidebar resize completed for ${isSidebarVisible ? 'visible' : 'hidden'}`);
        } catch (error) {
          console.warn('Sidebar visibility resize failed:', error);
        }
      }
    }, 400); // Single 400ms delay after transition
    
    return () => clearTimeout(resizeTimeout);
  }, [isSidebarVisible]); // Only trigger when sidebar visibility changes
  
  // Listen to custom dashboard resize events
  useEffect(() => {
    const handleDashboardResize = (event) => {
      if (plotRef.current && window.Plotly) {
        requestAnimationFrame(() => {
          try {
            window.Plotly.Plots.resize(plotRef.current);
            console.debug('Chart resized from dashboard-resized event');
          } catch (error) {
            console.warn('Dashboard resize event handling failed:', error);
          }
        });
      }
    };
    
    window.addEventListener('dashboard-resized', handleDashboardResize);
    
    return () => {
      window.removeEventListener('dashboard-resized', handleDashboardResize);
    };
  }, []);
  
  // Cleanup tooltip timer on unmount
  useEffect(() => {
    return () => {
      if (tooltipTimer) {
        clearTimeout(tooltipTimer);
      }
    };
  }, [tooltipTimer]);

  // Handle fullscreen callbacks for chart resize - MUST be before early returns
  const handleEnterFullscreen = useCallback(() => {
    setIsFullscreen(true);
    setTimeout(() => {
      if (plotRef.current && window.Plotly) {
        try {
          window.Plotly.Plots.resize(plotRef.current);
          window.Plotly.relayout(plotRef.current, {
            autosize: true,
            'margin.t': 40,
            'margin.r': 40,
            'margin.b': 50,
            'margin.l': 60
          });
        } catch (error) {
          console.warn('Chart fullscreen resize failed:', error);
        }
      }
    }, 250);
  }, []);

  const handleExitFullscreen = useCallback(() => {
    setIsFullscreen(false);
    setTimeout(() => {
      if (plotRef.current && window.Plotly) {
        try {
          window.Plotly.Plots.resize(plotRef.current);
          window.Plotly.relayout(plotRef.current, {
            autosize: true,
            'margin.t': 5,
            'margin.r': 36,
            'margin.b': 48,
            'margin.l': 80
          });
        } catch (error) {
          console.warn('Chart fullscreen exit resize failed:', error);
        }
      }
    }, 200);
  }, []);
  
  // Remove authentication check - always show data
  
  if (chartData.error) {
    return (
      <div className="chart-widget">
        <div className="widget-header">
          <h3 className="widget-title">Chart</h3>
        </div>
        <div className="chart-error">
          <p>Error loading chart data: {chartData.error}</p>
        </div>
      </div>
    );
  }

  if (chartData.isLoading) {
    return (
      <div className="chart-widget">
        <div className="widget-header">
          <h3 className="widget-title">Chart</h3>
        </div>
        <div className="chart-loading">
          <p>Loading chart data...</p>
        </div>
      </div>
    );
  }

  if (!chartData.currentFlow) {
    return (
      <div className="chart-widget">
        <div className="widget-header">
          <div className="chart-title-info single">
            <h3 className="chart-title">No Data Available</h3>
          </div>
        </div>
        <div className="chart-error">
          <p>Please select a performance metric to display the chart.</p>
        </div>
      </div>
    );
  }

  // Get the environmental flow object from the constant using the currentFlow key
  const environmentalFlowKey = chartData.currentFlow;
  const environmentalFlow = ENVIRONMENTAL_FLOWS[environmentalFlowKey];
  
  // Abbreviation mapping for structural systems
  const systemAbbreviationMap = {
    'ShearWall': 'SW',
    'OutriggerBelt': 'OB',
    'BracedTube': 'BT',
    'Shear Wall': 'SW',
    'Outrigger And Belt': 'OB',
    'Braced Tube': 'BT'
  };

  /*
   * Chart traces with synchronized highlighting
   * 
   * Highlighting Priority System:
   * 1. Selected Material (click): Thickest line (4px), full opacity
   * 2. Hovered Material (table hover): Medium thick line (3px), full opacity  
   * 3. Other Materials: Normal line (2px), dimmed opacity (0.3) when any material is active
   * 4. Default State: All materials normal line (2px), full opacity
   * 
   * This creates visual hierarchy: Selected > Hovered > Dimmed > Normal
   */
  // Sort series if sortedMaterials is provided
  const sortedSeries = sortedMaterials 
    ? chartData.series?.slice().sort((a, b) => {
        const aIndex = sortedMaterials.indexOf(a.name);
        const bIndex = sortedMaterials.indexOf(b.name);
        return aIndex - bIndex;
      })
    : chartData.series;

  const traces = sortedSeries?.map((materialSeries, index) => {
    // Extract material and structural system from the series object
    const materialName = materialSeries.material || materialSeries.name;
    const structuralSystemName = materialSeries.structuralSystem;
    
    const materialLabel = MATERIALS[materialName]?.label || materialName;
    
    // Get structural system abbreviation
    const systemAbbr = systemAbbreviationMap[structuralSystemName] 
      || systemAbbreviationMap[STRUCTURAL_SYSTEMS[structuralSystemName]?.label]
      || structuralSystemName;
    
    const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'];
    const lineStyles = ['solid', 'dash', 'dot', 'dashdot', 'longdash'];
    
    // Material state checks
    const isSelected = selectedMaterial === materialSeries.name;
    const isHovered = hoveredMaterial === materialSeries.name;
    
    // Line styling based on material state priority
    let lineWidth = 2;
    let opacity = 1;
    
    if (isSelected) {
      // Highest priority: Selected material (clicked in table)
      lineWidth = 4;
      opacity = 1;
    } else if (isHovered) {
      // Medium priority: Hovered material (mouse over table row)
      lineWidth = 3;
      opacity = 1;
    } else if (selectedMaterial || hoveredMaterial) {
      // Low priority: Other materials when any material is active
      lineWidth = 2;
      opacity = 0.3;
    } else {
      // Default state: No active materials
      lineWidth = 2;
      opacity = 1;
    }
    
    // Enhanced legend with structural system abbreviation and material info
    // Format: "SW - 32 MPa RC" or "OB - Grade 300 Steel"
    const legendName = `${systemAbbr} - ${materialLabel}`;
    
    return {
      x: materialSeries.data?.map(d => d.x) || [],
      y: materialSeries.data?.map(d => d.y) || [],
      type: 'scatter',
      mode: 'lines',
      name: legendName,
      showlegend: true,
      line: {
        color: colors[index % colors.length],
        width: lineWidth,
        dash: lineStyles[index % lineStyles.length]
      },
      opacity: opacity,
      legendgroup: materialSeries.name,
      hovertemplate: '<b>Material:</b> ' + materialLabel + '<br>' +
                    '<b>Storeys:</b> %{x}<br>' +
                    '<b>' + (environmentalFlow.unit || '') + ':</b> %{y:,.2f}<extra></extra>'
    };
  }) || [];

  // Add current point marker if exists
  if (controls.numberOfStoreys && chartData.series?.length > 0) {
    chartData.series.forEach((materialSeries, index) => {
      const currentPoint = materialSeries.data?.find(d => d.x === controls.numberOfStoreys);
      if (currentPoint) {
        const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'];
        
        // Current point marker highlighting (synchronized with line highlighting)
        const isSelected = selectedMaterial === materialSeries.name;
        const isHovered = hoveredMaterial === materialSeries.name;
        
        // Marker styling with same priority system as lines
        let markerSize = 8;
        let markerOpacity = 1;
        let borderWidth = 1;
        
        if (isSelected) {
          // Selected: Largest marker with thick border
          markerSize = 10;
          markerOpacity = 1;
          borderWidth = 2;
        } else if (isHovered) {
          // Hovered: Medium size marker with medium border
          markerSize = 9;
          markerOpacity = 1;
          borderWidth = 1.5;
        } else if (selectedMaterial || hoveredMaterial) {
          // Dimmed: Normal size but reduced opacity
          markerSize = 8;
          markerOpacity = 0.4;
          borderWidth = 1;
        } else {
          // Default: Normal visibility
          markerSize = 8;
          markerOpacity = 1;
          borderWidth = 1;
        }
        
        traces.push({
          x: [currentPoint.x],
          y: [currentPoint.y],
          type: 'scatter',
          mode: 'markers',
          marker: {
            color: colors[index % colors.length],
            size: markerSize,
            symbol: 'circle',
            line: {
              width: borderWidth,
              color: '#ffffff'
            }
          },
          opacity: markerOpacity,
          hovertemplate: '<b>Current:</b> %{x} storeys<br><b>' + 
                       (environmentalFlow.unit || '') + ':</b> %{y:,.2f}<extra></extra>',
          showlegend: false,
          legendgroup: materialSeries.name,
          // 关键：为当前配置点添加自定义底色（白色）
          markerColor: '#fff',
        });
      }
    });
  }

  // Apply Plotly legend maxheight (introduced in Plotly.js 2.35) to keep long legends scrollable.
  const legendMaxHeight = isFullscreen ? 220 : 120;

  // Chart layout
  const chartLayout = {
    autosize: true,
    responsive: true,
    // Remove internal chart title as requested
    xaxis: { 
      title: 'Number of Storeys',
      gridcolor: '#E5E7EB',
      zerolinecolor: '#D1D5DB',
      showline: true,
      linewidth: 1,
      linecolor: '#374151',
      mirror: true,
      rangemode: 'tozero' // Force x-axis to start from 0
    },
    yaxis: (() => {
      const baseConfig = {
        title: environmentalFlow?.graphLabel || environmentalFlow?.label || 'Value',
        gridcolor: '#E5E7EB',
        zerolinecolor: '#D1D5DB',
        showline: true,
        linewidth: 1,
        linecolor: '#374151',
        mirror: true
      };

      if (yAxisRange) {
        baseConfig.autorange = false;
        baseConfig.range = yAxisRange;
      } else {
        baseConfig.autorange = true;
        baseConfig.rangemode = 'tozero';
      }

      return baseConfig;
    })(),
    plot_bgcolor: 'white',
    paper_bgcolor: 'white',
    font: { family: 'Inter, sans-serif' },
    hovermode: 'closest',
    showlegend: true,
    legend: {
      orientation: 'v',
      x: 1.02,
      y: 1,
      xanchor: 'left',
      yanchor: 'top',
      xref: 'paper',
      yref: 'paper',
      bgcolor: 'rgba(255, 255, 255, 0.92)',
      bordercolor: 'rgba(55, 71, 79, 0.25)',
      borderwidth: 1,
      font: {
        size: 10,
        color: '#1f2937'
      },
      maxheight: legendMaxHeight,
      itemgap: 0,
      itemsizing: 'constant',
      tracegroupgap: 2
    },
    margin: {
      t: 5,
      r: isFullscreen ? 220 : 180,
      b: 48,
      l: 80
    }
  };

  const config = {
    // displayModeBar: true,
    displayModeBar: false,
    responsive: true,
    modeBarButtonsToRemove: [
      'pan2d', 'select2d', 'lasso2d', 'autoScale2d',
      'hoverClosestCartesian', 'hoverCompareCartesian'
    ],
    displaylogo: false,
    toImageButtonOptions: {
      format: 'png',
      filename: 'rephrame-chart',
      height: 600,
      width: 800,
      scale: 2
    }
  };

  // Carousel navigation functions
  const handlePrevious = () => {
    const newIndex = Math.max(0, chartData.flowIndex - 1);
    setCurrentFlowIndex(newIndex);
  };

  const handleNext = () => {
    const newIndex = Math.min(chartData.totalFlows - 1, chartData.flowIndex + 1);
    setCurrentFlowIndex(newIndex);
  };

  // Tooltip handlers
  const handleMouseEnter = () => {
    const timer = setTimeout(() => {
      setShowTooltip(true);
    }, 200); // 0.2s delay
    setTooltipTimer(timer);
  };

  const handleMouseLeave = () => {
    if (tooltipTimer) {
      clearTimeout(tooltipTimer);
    }
    setShowTooltip(false);
  };

  // Get icon for current metric
  const currentMetricIcon = metricIcons[environmentalFlowKey];

  return (
    <div className="chart-widget" id="chart-widget-container">
      <div className="widget-header">
        <div className="chart-title-info">
          <h3 className="chart-title">
            {currentMetricIcon && (
              <div 
                className="chart-title-icon-wrapper"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <img 
                  src={currentMetricIcon} 
                  alt={environmentalFlow.label}
                  className="chart-title-icon"
                />
                {showTooltip && (
                  <div className="chart-icon-tooltip">
                    {environmentalFlow.unit}
                  </div>
                )}
              </div>
            )}
            <span>{environmentalFlow.label}</span>
          </h3>
          {chartData.totalFlows > 1 && (
            <span className="chart-counter">
              {chartData.flowIndex + 1} of {chartData.totalFlows}
            </span>
          )}
        </div>
        <div className="chart-actions">
          <FullscreenButton 
            targetId="chart-widget-container"
            label="2D"
            onEnterFullscreen={handleEnterFullscreen}
            onExitFullscreen={handleExitFullscreen}
          />
        </div>
      </div>
      
      <div className="chart-container" ref={containerRef}>
        {/* Left navigation button */}
        {chartData.totalFlows > 1 && (
          <button 
            className={`chart-nav-btn chart-nav-left ${chartData.flowIndex === 0 ? 'disabled' : ''}`}
            onClick={handlePrevious}
            disabled={chartData.flowIndex === 0}
            title="Previous metric"
          >
            <BiChevronLeft size={24} />
          </button>
        )}
        
        {/* Right navigation button */}
        {chartData.totalFlows > 1 && (
          <button 
            className={`chart-nav-btn chart-nav-right ${chartData.flowIndex === chartData.totalFlows - 1 ? 'disabled' : ''}`}
            onClick={handleNext}
            disabled={chartData.flowIndex === chartData.totalFlows - 1}
            title="Next metric"
          >
            <BiChevronRight size={24} />
          </button>
        )}
        
        <Plot
          ref={plotRef}
          data={traces}
          layout={chartLayout}
          config={config}
          style={{ width: '100%', height: '100%' }}
          useResizeHandler={true}
        />
      </div>
    </div>
  );
};

export default ChartWidget;
