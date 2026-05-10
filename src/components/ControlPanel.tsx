import React from 'react';
import { BiChevronLeft, BiChevronRight } from 'react-icons/bi';
import DropdownControl from './DropdownControl';
import SliderControl from './SliderControl';
import MultiSelectControl from './MultiSelectControl';
import './ControlPanel.css';

const ControlPanel = ({ controls, updateControl, updateEnvironmentalFlows, updateMaterials, updateStructuralSystems, options, isAuthenticated, onToggleSidebar, isSidebarVisible }) => {
  return (
    <div className="control-panel">
      <div className="control-panel-header">
        <h2 className="control-panel-title">Select your parametris action</h2>
        <button 
          className="panel-toggle" 
          onClick={onToggleSidebar} 
          title={isSidebarVisible ? "Collapse Panel" : "Expand Panel"}
        >
          {isSidebarVisible ? <BiChevronLeft size={20} /> : <BiChevronRight size={20} />}
        </button>
        {!isAuthenticated && (
          <div className="auth-status">
            <span className="auth-indicator">🔒 Please Login</span>
          </div>
        )}
      </div>

      <div className="control-panel-content">
        <div className="control-section">
          <h3 className="section-title">Performance Metrics</h3>
          
          <MultiSelectControl
            id="environmentalFlows"
            label=""
            selectedValues={controls.environmentalFlows}
            onSelectionChange={updateEnvironmentalFlows}
            options={options.environmentalFlows}
            placeholder="Metrics to analyze"
            disabled={!isAuthenticated}
          />
        </div>

        <div className="control-section">
          <h3 className="section-title">Building Configuration</h3>
          
          <SliderControl
            id="numberOfStoreys"
            label="Number of storeys"
            value={controls.numberOfStoreys}
            onChange={(value) => updateControl('numberOfStoreys', value)}
            min={5}
            max={95}
            step={10}
            disabled={!isAuthenticated}
          />
          
          <DropdownControl
            id="shape"
            label="Floor plan shape"
            value={controls.shape}
            onChange={(value) => updateControl('shape', value)}
            options={options.shapes}
            disabled={!isAuthenticated}
          />
          
          <SliderControl
            id="buildingWidth"
            label="Width (m)"
            value={controls.buildingWidth || 30}
            onChange={(value) => updateControl('buildingWidth', value)}
            min={20}
            max={50}
            step={5}
            unit="m"
            disabled={!isAuthenticated}
          />
          
          <SliderControl
            id="columnWidthSpans"
            label="Number of column spans along building width"
            value={controls.columnWidthSpans}
            onChange={(value) => updateControl('columnWidthSpans', value)}
            min={3}
            max={9}
            step={1}
            disabled={!isAuthenticated}
          />
          
          <SliderControl
            id="buildingDepth"
            label="Depth (m)"
            value={controls.buildingDepth}
            onChange={(value) => updateControl('buildingDepth', value)}
            min={20}
            max={50}
            step={5}
            unit="m"
            disabled={!isAuthenticated}
          />
          
          <SliderControl
            id="columnDepthSpans"
            label="Number of column spans along building depth"
            value={controls.columnDepthSpans}
            onChange={(value) => updateControl('columnDepthSpans', value)}
            min={3}
            max={9}
            step={1}
            disabled={!isAuthenticated}
          />
          
          <MultiSelectControl
            id="materials"
            label="Materials"
            selectedValues={controls.materials}
            onSelectionChange={updateMaterials}
            options={options.materials}
            placeholder="Materials to compare"
            disabled={!isAuthenticated}
          />
          
          <MultiSelectControl
            id="structuralSystems"
            label="Structural systems"
            selectedValues={controls.structuralSystems}
            onSelectionChange={updateStructuralSystems}
            options={options.structuralSystems}
            placeholder="Systems to compare"
            disabled={!isAuthenticated}
          />
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
