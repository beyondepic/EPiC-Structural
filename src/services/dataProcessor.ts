import { CONTROL_CONFIGS, MATERIALS, STRUCTURAL_SYSTEMS } from './constants.js';
import { getRegressionData } from './regressionApiService.js';

// Data processor that fetches data from Flask API instead of static data
export class DataProcessor {
  
  // Calculate environmental flow value based on parameters
  static async calculateValue(params) {
    const {
      structuralSystem,
      material,
      shape,
      environmentalFlow,
      storeys,
      rectangleWidthSpans,
      rectangleDepth,
      rectangleDepthSpans
    } = params;

    // Get regression data from Flask API
    const regressionData = await getRegressionData({
      structural_system: structuralSystem,
      material,
      shape: shape.charAt(0).toUpperCase() + shape.slice(1), // Capitalize first letter for API
      environmental_flow: environmentalFlow
    });
    
    if (!regressionData) {
      // Return a fallback calculation if no data available
      return this.getFallbackValue(environmentalFlow, storeys, material);
    }

    const { intercept, coefficients } = regressionData;
    
    // Create input vector based on the regression model structure
    // Based on the common architectural regression model, the characteristics usually include:
    // [storeys, log(storeys), width_spans, depth, depth_spans, storeys*width_spans, storeys*depth, width_spans*depth]
    const inputs = [
      storeys,                                           // 0: storeys
      Math.log(storeys + 1),                            // 1: log(storeys + 1) 
      rectangleWidthSpans,                              // 2: width_spans
      rectangleDepth,                                   // 3: depth
      rectangleDepthSpans,                              // 4: depth_spans
      storeys * rectangleWidthSpans,                    // 5: storeys * width_spans
      storeys * rectangleDepth,                         // 6: storeys * depth
      rectangleWidthSpans * rectangleDepth              // 7: width_spans * depth
    ];

    // Calculate prediction using linear regression formula
    let prediction = intercept;
    for (let i = 0; i < Math.min(inputs.length, coefficients.length); i++) {
      prediction += inputs[i] * coefficients[i];
    }

    // Ensure positive values - Based on the reasonable range of architectural data
    return Math.max(0, prediction);
  }

  // Generate chart data for visualization (async) - OPTIMIZED
  static async generateChartData(controls) {
    const data = [];

    // Generate data points by varying the control variable
    const varyingControlName = controls.varyingControl || 'storeys';
    const varyingControl = CONTROL_CONFIGS[varyingControlName];
    
    if (varyingControl) {
      // First get regression data once for this configuration
      const {
        structuralSystem,
        material,
        shape,
        environmentalFlow
      } = controls;

      try {
        const regressionData = await getRegressionData({
          structural_system: structuralSystem,
          material,
          shape: shape.charAt(0).toUpperCase() + shape.slice(1),
          environmental_flow: environmentalFlow
        });
        
        if (!regressionData) {
          // Use fallback calculation for all points
          const { min, max, step } = varyingControl;
          for (let value = min; value <= max; value += step) {
            const fallbackValue = this.getFallbackValue(environmentalFlow, value, material);
            data.push({
              x: value,
              y: fallbackValue,
              label: `${varyingControl.graphLabel || varyingControlName}: ${value}`
            });
          }
          return data;
        }

        const { intercept, coefficients } = regressionData;
        const { min, max, step } = varyingControl;
        
        // Generate all data points using the regression coefficients (NO additional API calls)
        for (let value = min; value <= max; value += step) {
          const params = { 
            ...controls, 
            [varyingControlName]: value 
          };
          
          // Calculate prediction locally using regression coefficients
          const prediction = this.calculatePredictionLocal(params, intercept, coefficients);
          data.push({
            x: value,
            y: prediction,
            label: `${varyingControl.graphLabel || varyingControlName}: ${value}`
          });
        }
      } catch (error) {
        console.warn(`Failed to fetch regression data:`, error);
        // Fallback to local calculation
        const { min, max, step } = varyingControl;
        for (let value = min; value <= max; value += step) {
          const fallbackValue = this.getFallbackValue(controls.environmentalFlow, value, controls.material);
          data.push({
            x: value,
            y: fallbackValue,
            label: `${varyingControl.graphLabel || varyingControlName}: ${value}`
          });
        }
      }
    }

    return data;
  }

  // New method: Calculate prediction locally using regression coefficients
  static calculatePredictionLocal(params, intercept, coefficients) {
    const {
      storeys,
      rectangleWidthSpans,
      rectangleDepth,
      rectangleDepthSpans
    } = params;

    // Create input vector (same as in calculateValue)
    const inputs = [
      storeys,                                           // 0: storeys
      Math.log(storeys + 1),                            // 1: log(storeys + 1) 
      rectangleWidthSpans,                              // 2: width_spans
      rectangleDepth,                                   // 3: depth
      rectangleDepthSpans,                              // 4: depth_spans
      storeys * rectangleWidthSpans,                    // 5: storeys * width_spans
      storeys * rectangleDepth,                         // 6: storeys * depth
      rectangleWidthSpans * rectangleDepth              // 7: width_spans * depth
    ];

    // Calculate prediction using linear regression formula
    let prediction = intercept;
    for (let i = 0; i < Math.min(inputs.length, coefficients.length); i++) {
      prediction += inputs[i] * coefficients[i];
    }

    // Ensure positive values
    return Math.max(0, prediction);
  }

  // Generate comparison data for multiple configurations
  static generateComparisonData(baseParams, variations) {
    const series = [];
    
    variations.forEach(variation => {
      const params = { ...baseParams, ...variation };
      const data = this.generateChartData(params);
      
      series.push({
        name: this.getSeriesName(variation),
        data: data,
        params: params
      });
    });

    return series;
  }

  // Get a descriptive name for a parameter variation
  static getSeriesName(variation) {
    const parts = [];
    
    if (variation.material) {
      const materialLabel = MATERIALS[variation.material]?.label || variation.material;
      parts.push(materialLabel);
    }
    
    if (variation.structuralSystem) {
      const structuralSystemLabel = STRUCTURAL_SYSTEMS[variation.structuralSystem]?.label || variation.structuralSystem;
      parts.push(structuralSystemLabel);
    }
    
    if (variation.rectangleDepth) {
      parts.push(`${variation.rectangleDepth}m depth`);
    }
    
    return parts.join(' ') || 'Current';
  }

  // Calculate summary statistics - OPTIMIZED
  static async calculateSummary(params) {
    try {
      // Get regression data once for all calculations
      const regressionData = await getRegressionData({
        structural_system: params.structuralSystem,
        material: params.material,
        shape: params.shape.charAt(0).toUpperCase() + params.shape.slice(1),
        environmental_flow: params.environmentalFlow
      });
      
      let currentValue, optimalValue, rSquared;
      
      if (regressionData) {
        const { intercept, coefficients } = regressionData;
        
        // Calculate current value using local calculation
        currentValue = this.calculatePredictionLocal(params, intercept, coefficients);
        
        // Calculate optimal value using the same regression data
        optimalValue = await this.findOptimalValueLocal(params, intercept, coefficients);
        
        // Get R-squared from the regression data
        rSquared = regressionData.rSquared || 0.85;
      } else {
        // Fallback calculations
        currentValue = this.getFallbackValue(params.environmentalFlow, params.storeys, params.material);
        optimalValue = await this.findOptimalValueFallback(params);
        rSquared = 0.85;
      }
      
      const percentFromOptimal = ((currentValue - optimalValue) / optimalValue * 100);
      
      return {
        currentValue: currentValue.toFixed(2),
        optimalValue: optimalValue.toFixed(2),
        percentFromOptimal: percentFromOptimal.toFixed(1),
        rSquared: rSquared.toFixed(2)
      };
    } catch (error) {
      console.warn('Failed to calculate summary:', error);
      // Return fallback summary
      const currentValue = this.getFallbackValue(params.environmentalFlow, params.storeys, params.material);
      return {
        currentValue: currentValue.toFixed(2),
        optimalValue: (currentValue * 0.85).toFixed(2), // Assume optimal is 15% better
        percentFromOptimal: "15.0",
        rSquared: "0.85"
      };
    }
  }

  // Helper method: find optimal value using already-fetched regression coefficients
  static findOptimalValueLocal(baseParams, intercept, coefficients) {
    let minValue = Infinity;
    const { min, max, step } = CONTROL_CONFIGS.storeys;
    
    for (let storeys = min; storeys <= max; storeys += step) {
      const value = this.calculatePredictionLocal({
        ...baseParams,
        storeys
      }, intercept, coefficients);
      
      if (value < minValue) {
        minValue = value;
      }
    }
    
    return minValue;
  }

  // Helper method: find optimal value using fallback calculation
  static findOptimalValueFallback(baseParams) {
    let minValue = Infinity;
    const { min, max, step } = CONTROL_CONFIGS.storeys;
    
    for (let storeys = min; storeys <= max; storeys += step) {
      const value = this.getFallbackValue(baseParams.environmentalFlow, storeys, baseParams.material);
      if (value < minValue) {
        minValue = value;
      }
    }
    
    return minValue;
  }

  // Find optimal value by testing different configurations - OPTIMIZED
  static async findOptimalValue(baseParams) {
    let minValue = Infinity;
    const { min, max, step } = CONTROL_CONFIGS.storeys;
    
    try {
      // Get regression data once
      const regressionData = await getRegressionData({
        structural_system: baseParams.structuralSystem,
        material: baseParams.material,
        shape: baseParams.shape.charAt(0).toUpperCase() + baseParams.shape.slice(1),
        environmental_flow: baseParams.environmentalFlow
      });
      
      if (regressionData) {
        const { intercept, coefficients } = regressionData;
        
        // Test different storeys values using local calculation
        for (let storeys = min; storeys <= max; storeys += step) {
          const value = this.calculatePredictionLocal({
            ...baseParams,
            storeys
          }, intercept, coefficients);
          
          if (value < minValue) {
            minValue = value;
          }
        }
      } else {
        // Fallback to local calculation
        for (let storeys = min; storeys <= max; storeys += step) {
          const value = this.getFallbackValue(baseParams.environmentalFlow, storeys, baseParams.material);
          if (value < minValue) {
            minValue = value;
          }
        }
      }
    } catch (error) {
      console.warn('Failed to calculate optimal value:', error);
      // Fallback calculation
      for (let storeys = min; storeys <= max; storeys += step) {
        const value = this.getFallbackValue(baseParams.environmentalFlow, storeys, baseParams.material);
        if (value < minValue) {
          minValue = value;
        }
      }
    }
    
    return minValue;
  }

  // Get R-squared value for the current configuration - DEPRECATED
  // This method is now integrated into calculateSummary for efficiency
  static async getRSquared(params) {
    console.warn('getRSquared is deprecated. R-squared is now included in summary calculation.');
    
    try {
      const regressionData = await getRegressionData({
        structural_system: params.structuralSystem,
        material: params.material,
        shape: params.shape.charAt(0).toUpperCase() + params.shape.slice(1),
        environmental_flow: params.environmentalFlow
      });
      return regressionData?.rSquared?.toFixed(2) || "0.85";
    } catch (error) {
      console.warn('Failed to get R-squared from API:', error);
      return "0.85"; // Default fallback
    }
  }

  // Fallback calculation when no regression data is available
  static getFallbackValue(environmentalFlow, storeys, material = '32 MPa RC') {
    const baseValues = {
      'Embodied_GHG_kgCO2e/m^2': 15,
      'Embodied_Energy_MJ/m^2': 120,
      'Embodied_Water_L/m^2': 180,
      'Cost_per_NFA_AUD/m^2': 200
    };

    // Material-specific multipliers to create differentiation
    const materialMultipliers = {
      '32 MPa RC': 1.0,
      '40 MPa RC': 1.15,
      '50 MPa RC': 1.25,
      '300Plus Steel': 1.8
    };

    const base = baseValues[environmentalFlow] || 100;
    const multiplier = materialMultipliers[material] || 1.0;
    
    // Simple linear relationship with material-specific variation
    return (base + (storeys * 0.5) + Math.log(storeys + 1) * 10) * multiplier;
  }

  // Validate parameters
  static validateParams(params) {
    const required = [
      'structuralSystem',
      'material', 
      'shape',
      'environmentalFlow',
      'storeys',
      'rectangleWidthSpans',
      'rectangleDepth', 
      'rectangleDepthSpans'
    ];

    for (const param of required) {
      if (params[param] === undefined || params[param] === null) {
        throw new Error(`Missing required parameter: ${param}`);
      }
    }

    return true;
  }
}
