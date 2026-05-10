import { useState, useEffect, useRef } from 'react';
import { DataProcessor } from '../services/dataProcessor';
import { useAuth } from '../contexts/AuthContext';

// Get data for all materials under all environmentalFlows
export const useMultiFlowChartData = (controls) => {
  const { isAuthenticated } = useAuth();
  const [multiFlowData, setMultiFlowData] = useState({
    allFlows: {}, // { flowKey: [ { name, data, ... }, ... ] }
    isLoading: true,
    error: null
  });
  const abortControllerRef = useRef();

  useEffect(() => {
    const fetchAll = async () => {
      if (!isAuthenticated) {
        setMultiFlowData({ allFlows: {}, isLoading: false, error: null });
        return;
      }
      if (abortControllerRef.current) abortControllerRef.current.abort();
      abortControllerRef.current = new AbortController();
      try {
        setMultiFlowData(prev => ({ ...prev, isLoading: true, error: null }));
        const flows = controls.environmentalFlows || [];
        const materials = controls.materials || ['32 MPa RC'];
        const structuralSystems = controls.structuralSystems || ['ShearWall'];
        const allFlows = {};
        
        for (const flowKey of flows) {
          const baseParams = {
            ...controls,
            environmentalFlow: flowKey
          };
          
          // Generate data for each combination of material and structural system
          const combinationPromises = materials.flatMap(material =>
            structuralSystems.map(async (structuralSystem) => {
              const params = { ...baseParams, material, structuralSystem };
              try {
                const rawChartData = await DataProcessor.generateChartData(params);
                return {
                  name: `${material} - ${structuralSystem}`,
                  material: material,
                  structuralSystem: structuralSystem,
                  data: rawChartData || [],
                  params
                };
              } catch {
                return {
                  name: `${material} - ${structuralSystem}`,
                  material: material,
                  structuralSystem: structuralSystem,
                  data: [],
                  params
                };
              }
            })
          );
          
          allFlows[flowKey] = await Promise.all(combinationPromises);
        }
        if (abortControllerRef.current?.signal.aborted) return;
        setMultiFlowData({ allFlows, isLoading: false, error: null });
      } catch (error) {
        if (!abortControllerRef.current?.signal.aborted) {
          setMultiFlowData({ allFlows: {}, isLoading: false, error: error.message });
        }
      }
    };
    fetchAll();
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [controls, isAuthenticated]);

  return multiFlowData;
};
