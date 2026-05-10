import { useState, useEffect, useRef } from 'react';
import { DataProcessor } from '../services/dataProcessor';
import { useAuth } from '../contexts/AuthContext';

// Hook for processing chart data based on control values
export const useChartData = (controls) => {
  const { isAuthenticated } = useAuth();
  const [chartData, setChartData] = useState({
    currentFlow: null,
    series: [],
    flowIndex: 0,
    totalFlows: 0,
    isLoading: true,
    error: null
  });
  
  const [summaryData, setSummaryData] = useState({
    currentValue: "0.00",
    optimalValue: "0.00",
    percentFromOptimal: "0.0",
    rSquared: "0.00"
  });

  const abortControllerRef = useRef();

  useEffect(() => {
    const generateChartData = async () => {
      // If not authenticated, don't fetch data
      if (!isAuthenticated) {
        setChartData({
          currentFlow: null,
          series: [],
          flowIndex: 0,
          totalFlows: 0,
          isLoading: false,
          error: null
        });
        setSummaryData({
          currentValue: "0.00",
          optimalValue: "0.00",
          percentFromOptimal: "0.0",
          rSquared: "0.00"
        });
        return;
      }

      // Cancel any previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();
      
      try {
        setChartData(prev => ({ ...prev, isLoading: true, error: null }));
        
        // Use a debounced delay to avoid too many API calls
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Check if request was cancelled
        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        const currentFlow = controls.environmentalFlows?.[controls.currentFlowIndex];
        if (!currentFlow) {
          setChartData({
            currentFlow: null,
            series: [],
            flowIndex: 0,
            totalFlows: 0,
            isLoading: false,
            error: null
          });
          setSummaryData({
            currentValue: "0.00",
            optimalValue: "0.00",
            percentFromOptimal: "0.0",
            rSquared: "0.00"
          });
          return;
        }

        // Base parameters for all materials and structural systems (without specific params)
        const baseParams = {
          environmentalFlow: currentFlow,
          storeys: controls.numberOfStoreys || controls.storeys || 25,
          rectangleWidthSpans: controls.columnWidthSpans || controls.rectangleWidthSpans || 5,
          rectangleDepth: controls.buildingDepth || controls.rectangleDepth || 35,
          rectangleDepthSpans: controls.columnDepthSpans || controls.rectangleDepthSpans || 5,
          shape: controls.shape || 'rectangle',
          varyingControl: controls.varyingControl || 'storeys'
        };

        // Generate chart data for each combination of material and structural system
        const materials = controls.materials || ['32 MPa RC'];
        const structuralSystems = controls.structuralSystems || ['ShearWall'];
        
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
                params: params
              };
            } catch (error) {
              console.warn(`Failed to generate chart data for ${material} - ${structuralSystem}:`, error);
              return {
                name: `${material} - ${structuralSystem}`,
                material: material,
                structuralSystem: structuralSystem,
                data: [],
                params: params
              };
            }
          })
        );

        const materialSeries = await Promise.all(combinationPromises);

        // Check if request was cancelled after async operations
        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        const newChartData = {
          currentFlow: currentFlow,
          series: materialSeries,
          flowIndex: controls.currentFlowIndex,
          totalFlows: controls.environmentalFlows.length,
          isLoading: false,
          error: null
        };

        setChartData(newChartData);

        // Calculate summary data for the first material
        const primaryMaterial = controls.materials?.[0] || '32 MPa RC';
        const summaryParams = { ...baseParams, material: primaryMaterial };
        
        try {
          const newSummaryData = await DataProcessor.calculateSummary(summaryParams);
          setSummaryData(newSummaryData);
        } catch (error) {
          console.warn('Failed to calculate summary data:', error);
          setSummaryData({
            currentValue: "0.00",
            optimalValue: "0.00",
            percentFromOptimal: "0.0",
            rSquared: "0.00"
          });
        }

      } catch (error) {
        if (!abortControllerRef.current?.signal.aborted) {
          console.error('Error generating chart data:', error);
          setChartData({
            currentFlow: null,
            series: [],
            flowIndex: 0,
            totalFlows: 0,
            isLoading: false,
            error: error.message
          });
        }
      }
    };

    generateChartData();

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [controls, isAuthenticated]);

  return { chartData, summaryData };
};
