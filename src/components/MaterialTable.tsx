import React, { useState, useMemo, useCallback } from 'react';
import { useMultiFlowChartData } from '../hooks/useMultiFlowChartData';
import { BiChevronDown, BiChevronUp } from 'react-icons/bi';
import { MATERIALS, STRUCTURAL_SYSTEMS } from '../services/constants';
import FullscreenButton from './FullscreenButton';
import './MaterialTable.css';

// Metric icons and tooltips for table headers
const metricIcons = {
  'Embodied_GHG_kgCO2e/m^2': '/GHG.png',
  'Embodied_Energy_MJ/m^2': '/Energy.png',
  'Embodied_Water_L/m^2': '/Water.png',
  'Cost_per_NFA_AUD/m^2': '/Cost.png'
};

const metricTooltips = {
  'Embodied_GHG_kgCO2e/m^2': 'Embodied GHG (kgCO₂e/m²)',
  'Embodied_Energy_MJ/m^2': 'Embodied Energy (MJ/m²)',
  'Embodied_Water_L/m^2': 'Embodied Water (L/m²)',
  'Cost_per_NFA_AUD/m^2': 'Cost per NFA (AUD/m²)'
};

// Abbreviation mapping for structural systems
const systemAbbreviationMap = {
  'ShearWall': 'SW',
  'OutriggerBelt': 'OB',
  'BracedTube': 'BT',
  'Shear Wall': 'SW',
  'Outrigger And Belt': 'OB',
  'Braced Tube': 'BT'
};

const MaterialTable = ({ chartData, controls, selectedMaterial, setSelectedMaterial, hoveredMaterial, setHoveredMaterial, onSorted }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Function to format numbers with comma separators
  const formatNumber = (num) => {
    if (num === null || num === undefined || isNaN(num)) return '-';
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Sorting function
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = null; // Clear sort
    }
    setSortConfig({ key: direction ? key : null, direction });
  };

  // Function to render sort icon
  const renderSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <BiChevronUp className="sort-icon inactive" size={14} />;
    }
    if (sortConfig.direction === 'asc') {
      return <BiChevronUp className="sort-icon active" size={14} />;
    }
    if (sortConfig.direction === 'desc') {
      return <BiChevronDown className="sort-icon active" size={14} />;
    }
    return <BiChevronUp className="sort-icon inactive" size={14} />;
  };

  // Performance status based on percentage
  const getPerformanceBadge = (pct) => {
    if (pct <= 10) return { status: ' Perfect', color: '#10b981', bgColor: '#ecfdf5' };
    if (pct <= 25) return { status: 'Good', color: '#3b82f6', bgColor: '#eff6ff' };
    if (pct <= 50) return { status: 'Poor', color: '#f59e0b', bgColor: '#fffbeb' };
    return { status: 'Poor', color: '#ef4444', bgColor: '#fef2f2' };
  };

  // Use multi-metrics hook
  const { allFlows, isLoading, error } = useMultiFlowChartData(controls);

  // Generate rows for all materials, ensuring consistent order
  const materialKeys = useMemo(() => {
    // Use first flow's series as reference
    const firstFlow = controls.environmentalFlows?.[0];
    if (!firstFlow || !allFlows[firstFlow]) return [];
    return allFlows[firstFlow].map(s => s.name);
  }, [allFlows, controls.environmentalFlows]);

  // Generate table data structure
  const unsortedTableData = useMemo(() => {
    if (!materialKeys.length) return [];
    
    return materialKeys.map((matKey) => {
      // matKey format is now "32 MPa RC - ShearWall" (material - structuralSystem)
      const seriesArr = allFlows[controls.environmentalFlows?.[0]] || [];
      const matSeries = seriesArr.find(s => s.name === matKey);
      
      let displayName = matKey;
      
      if (matSeries && matSeries.material && matSeries.structuralSystem) {
        // Extract from series object
        const materialName = matSeries.material;
        const structuralSystemName = matSeries.structuralSystem;
        const materialLabel = MATERIALS[materialName]?.label || materialName;
        
        // Get structural system abbreviation
        const systemAbbr = systemAbbreviationMap[structuralSystemName] 
          || systemAbbreviationMap[STRUCTURAL_SYSTEMS[structuralSystemName]?.label]
          || structuralSystemName;
        
        // Format: "SW - 32 MPa RC"
        displayName = systemAbbr ? `${systemAbbr} - ${materialLabel}` : materialLabel;
      } else {
        // Fallback: parse from matKey
        const parts = matKey.split(' - ');
        if (parts.length === 2) {
          const materialName = parts[0];
          const structuralSystemName = parts[1];
          const materialLabel = MATERIALS[materialName]?.label || materialName;
          const systemAbbr = systemAbbreviationMap[structuralSystemName] 
            || systemAbbreviationMap[STRUCTURAL_SYSTEMS[structuralSystemName]?.label]
            || structuralSystemName;
          displayName = systemAbbr ? `${systemAbbr} - ${materialLabel}` : materialLabel;
        } else {
          displayName = MATERIALS[matKey]?.label || matKey;
        }
      }
      
      const valuesByFlow = {};
      controls.environmentalFlows.forEach(flowKey => {
        const seriesArr = allFlows[flowKey] || [];
        const matSeries = seriesArr.find(s => s.name === matKey);
        let value = null;
        if (matSeries && matSeries.data) {
          const pt = matSeries.data.find(d => d.x === controls.numberOfStoreys);
          value = pt ? pt.y : null;
        }
        valuesByFlow[flowKey] = { value };
      });
      return {
        material: displayName,
        materialKey: matKey,
        valuesByFlow
      };
    });
  }, [materialKeys, allFlows, controls]);

  // Sort table data
  const tableData = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) {
      return unsortedTableData;
    }

    const sorted = [...unsortedTableData].map((row, index) => ({ ...row, __originalIndex: index }));

    sorted.sort((a, b) => {
      let aValue, bValue;

      if (sortConfig.key === 'material') {
        aValue = a.material;
        bValue = b.material;
      } else {
        // Sort by metric value
        aValue = a.valuesByFlow[sortConfig.key]?.value;
        bValue = b.valuesByFlow[sortConfig.key]?.value;
      }

      // Handle null/undefined/empty values - always at the end
      if (aValue == null || aValue === '') return 1;
      if (bValue == null || bValue === '') return -1;

      // Try to parse as numbers first
      const aNum = parseFloat(aValue);
      const bNum = parseFloat(bValue);

      let comparison = 0;
      if (!isNaN(aNum) && !isNaN(bNum)) {
        // Both are numbers
        comparison = aNum - bNum;
      } else {
        // At least one is not a number, sort as strings
        comparison = String(aValue).localeCompare(String(bValue));
      }

      // Apply sort direction
      if (sortConfig.direction === 'desc') {
        comparison = -comparison;
      }

      // Stable sort: if values are equal, maintain original order
      return comparison || (a.__originalIndex - b.__originalIndex);
    });

    // Remove the temporary index property
    const result = sorted.map(({ __originalIndex, ...row }) => row);

    // Notify parent component
    if (onSorted) {
      onSorted(result);
    }

    return result;
  }, [unsortedTableData, sortConfig, onSorted]);

  // Calculate optimal values and percentages for each flow
  useMemo(() => {
    controls.environmentalFlows.forEach(flowKey => {
      let minValue = Infinity;
      tableData.forEach(row => {
        const v = row.valuesByFlow[flowKey]?.value;
        if (typeof v === 'number' && !isNaN(v)) minValue = Math.min(minValue, v);
      });
      tableData.forEach(row => {
        const v = row.valuesByFlow[flowKey]?.value;
        row.valuesByFlow[flowKey].percentDiff = (typeof v === 'number' && !isNaN(v))
          ? (v === minValue ? 0 : ((v - minValue) / minValue) * 100)
          : null;
      });
    });
  }, [tableData, controls.environmentalFlows]);

  // Handle fullscreen callbacks (no special resize needed for table)
  const handleEnterFullscreen = useCallback(() => {
    // Table will automatically adjust with CSS
  }, []);

  const handleExitFullscreen = useCallback(() => {
    // Table will automatically adjust with CSS
  }, []);

  if (isLoading) return <div className="material-table-widget"><div className="table-container">Loading...</div></div>;
  if (error) return <div className="material-table-widget"><div className="table-container">Error: {error}</div></div>;
  if (!tableData.length) return null;

  return (
    <div className="material-table-widget" id="material-table-container">
      <div className="widget-header">
        <div className="widget-actions">
          <FullscreenButton 
            targetId="material-table-container"
            label="Table"
            onEnterFullscreen={handleEnterFullscreen}
            onExitFullscreen={handleExitFullscreen}
          />
        </div>
      </div>
      <div className="table-container">
        <table className="material-data-table">
            <thead>
              <tr>
                <th className="sortable" onClick={() => handleSort('material')}>
                  <div className="th-content th-content-centered">
                    <span>Material</span>
                    {renderSortIcon('material')}
                  </div>
                </th>
                {controls.environmentalFlows.map((flowKey, idx) => {
                  const isActive = idx === controls.currentFlowIndex;
                  return (
                    <th
                      key={flowKey}
                      className={`sortable metric-col-header${isActive ? ' active-metric-col' : ''}`}
                      onClick={() => {
                        if (typeof controls.setCurrentFlowIndex === 'function') {
                          controls.setCurrentFlowIndex(idx);
                        }
                        handleSort(flowKey);
                      }}
                    >
                      <div className="th-content th-content-icon">
                        <img 
                          src={metricIcons[flowKey]} 
                          alt="" 
                          title={metricTooltips[flowKey] || flowKey} // 确保鼠标悬停时显示完整名称
                          style={{
                            width: '20px', 
                            height: '20px',
                            objectFit: 'contain',
                            objectPosition: 'center'
                          }}
                        />
                        {renderSortIcon(flowKey)}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, index) => (
                <tr
                  key={row.materialKey}
                  className={`
                    ${hoveredMaterial === row.materialKey ? 'highlighted-row' : ''}
                    ${selectedMaterial === row.materialKey ? 'selected-row' : ''}
                  `.trim()}
                  onClick={() => {
                    if (selectedMaterial === row.materialKey) {
                      setSelectedMaterial(null);
                    } else {
                      setSelectedMaterial(row.materialKey);
                    }
                  }}
                  onMouseEnter={() => setHoveredMaterial && setHoveredMaterial(row.materialKey)}
                  onMouseLeave={() => setHoveredMaterial && setHoveredMaterial(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>
                    <svg
                      width="24"
                      height="14"
                      viewBox="0 0 24 14"
                      style={{ marginRight: 8, verticalAlign: 'middle' }}
                    >
                      <line
                        x1="2" y1="7" x2="22" y2="7"
                        stroke={['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'][index % 5]}
                        strokeWidth="3"
                        strokeDasharray={(() => {
                          const style = ['solid', 'dash', 'dot', 'dashdot', 'longdash'][index % 5];
                          if (style === 'solid') return '0';
                          if (style === 'dash') return '8,6';
                          if (style === 'dot') return '2,5';
                          if (style === 'dashdot') return '8,5,2,5';
                          if (style === 'longdash') return '14,6';
                          return '0';
                        })()}
                        strokeLinecap="round"
                      />
                    </svg>
                    {row.material}
                  </td>
                  {controls.environmentalFlows.map((flowKey, idx) => {
                    const v = row.valuesByFlow[flowKey];
                    const isActive = idx === controls.currentFlowIndex;
                    const isOptimal = v && v.percentDiff === 0;
                    return (
                      <td key={flowKey} className={isActive ? 'active-metric-col' : ''}>
                        <div className="performance-cell">
                          {v && typeof v.value === 'number' ? (
                            <>
                              <div className="value-display">{formatNumber(v.value)}</div>
                              <div className="status-container">
                                {isOptimal ? (
                                  <div className="status-box optimal-status-box">
                                    <div className="status-text optimal-status-text">Optimal</div>
                                  </div>
                                ) : (
                                  (() => {
                                    const badge = getPerformanceBadge(Math.abs(v.percentDiff));
                                    const percentage = Math.round(v.percentDiff);
                                    const percentageSign = percentage >= 0 ? '+' : '';
                                    return (
                                      <div 
                                        className="status-box"
                                        style={{ 
                                          backgroundColor: badge.bgColor,
                                          border: `1px solid ${badge.color}40`
                                        }}
                                      >
                                        <div 
                                          className="status-text"
                                          style={{ color: badge.color }}
                                        >
                                          {badge.status}
                                        </div>
                                        <div 
                                          className="percentage-box"
                                          style={{ 
                                            backgroundColor: badge.bgColor,
                                            color: badge.color 
                                          }}
                                        >
                                          {percentageSign}{percentage}%
                                        </div>
                                      </div>
                                    );
                                  })()
                                )}
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="value-display">-</div>
                              <div className="status-container">
                                <div className="status-box empty-status-box">
                                  <div className="status-text">--</div>
                                  <div className="percentage-box">(--)</div>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
    </div>
  );
};

export default MaterialTable;