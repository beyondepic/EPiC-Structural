import { useState, useMemo } from 'react';
import { ENVIRONMENTAL_FLOWS, MATERIALS, STRUCTURAL_SYSTEMS, SHAPES } from '../services/constants';

// Hook for managing control states
export const useControls = () => {
  const [controls, setControls] = useState({
    numberOfStoreys: 25,
    columnWidthSpans: 5,
    buildingWidth: 30,
    buildingDepth: 35,
    columnDepthSpans: 5,
    environmentalFlows: ['Embodied_GHG_kgCO2e/m^2'],
    currentFlowIndex: 0,
    materials: ['32 MPa RC'], // Changed to array for multi-select
    structuralSystems: ['ShearWall'], // Changed to array for multi-select
    currentStructuralSystem: 'ShearWall', // Currently displayed structural system in 3D
    shape: 'rectangle'
  });

  const updateControl = (key, value) => {
    setControls(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Special handler for environmental flows
  const updateEnvironmentalFlows = (flowKey, isSelected) => {
    setControls(prev => {
      let newFlows;
      if (isSelected) {
        // Add flow if not already present
        newFlows = prev.environmentalFlows.includes(flowKey) 
          ? prev.environmentalFlows 
          : [...prev.environmentalFlows, flowKey];
      } else {
        // Remove flow, but keep at least one
        newFlows = prev.environmentalFlows.length > 1 
          ? prev.environmentalFlows.filter(f => f !== flowKey)
          : prev.environmentalFlows;
      }

      // Adjust current index if needed
      const newCurrentIndex = Math.min(prev.currentFlowIndex, newFlows.length - 1);

      return {
        ...prev,
        environmentalFlows: newFlows,
        currentFlowIndex: newCurrentIndex
      };
    });
  };

  // Special handler for materials multi-select
  const updateMaterials = (materialKey, isSelected) => {
    setControls(prev => {
      let newMaterials;
      if (isSelected) {
        // Add material if not already present
        newMaterials = prev.materials.includes(materialKey) 
          ? prev.materials 
          : [...prev.materials, materialKey];
      } else {
        // Remove material, but keep at least one
        newMaterials = prev.materials.length > 1 
          ? prev.materials.filter(m => m !== materialKey)
          : prev.materials;
      }

      return {
        ...prev,
        materials: newMaterials
      };
    });
  };

  // Special handler for structural systems multi-select
  const updateStructuralSystems = (systemKey, isSelected) => {
    setControls(prev => {
      let newSystems;
      if (isSelected) {
        // Add system if not already present
        newSystems = prev.structuralSystems.includes(systemKey) 
          ? prev.structuralSystems 
          : [...prev.structuralSystems, systemKey];
      } else {
        // Remove system, but keep at least one
        newSystems = prev.structuralSystems.length > 1 
          ? prev.structuralSystems.filter(s => s !== systemKey)
          : prev.structuralSystems;
      }

      // Update current structural system if needed
      const newCurrentSystem = newSystems.includes(prev.currentStructuralSystem)
        ? prev.currentStructuralSystem
        : newSystems[0];

      return {
        ...prev,
        structuralSystems: newSystems,
        currentStructuralSystem: newCurrentSystem
      };
    });
  };

  const setCurrentFlowIndex = (index) => {
    setControls(prev => ({
      ...prev,
      currentFlowIndex: Math.max(0, Math.min(index, prev.environmentalFlows.length - 1))
    }));
  };

  const resetControls = () => {
    setControls({
      numberOfStoreys: 25,
      columnWidthSpans: 5,
      buildingWidth: 30,
      buildingDepth: 35,
      columnDepthSpans: 5,
      environmentalFlows: ['Embodied_GHG_kgCO2e/m^2'],
      currentFlowIndex: 0,
      materials: ['32 MPa RC'], // Updated to array
      structuralSystems: ['ShearWall'], // Updated to array
      currentStructuralSystem: 'ShearWall',
      shape: 'rectangle'
    });
  };

  // Memoized options for dropdowns
  const options = useMemo(() => ({
    environmentalFlows: Object.entries(ENVIRONMENTAL_FLOWS).map(([key, flow]) => ({
      value: key,
      label: flow.label
    })),
    materials: Object.entries(MATERIALS).map(([key, material]) => ({
      value: key,
      label: material.label
    })),
    structuralSystems: Object.entries(STRUCTURAL_SYSTEMS).map(([key, system]) => ({
      value: key,
      name: key,
      label: system.label
    })),
    shapes: Object.values(SHAPES)
  }), []);

  return {
    controls,
    updateControl,
    updateEnvironmentalFlows,
    updateMaterials, // Add the new function
    updateStructuralSystems, // Add structural systems multi-select handler
    setCurrentFlowIndex,
    resetControls,
    options
  };
};
