// Constants for the application
export const ENVIRONMENTAL_FLOWS = {
  'Embodied_GHG_kgCO2e/m^2': {
    name: 'Embodied_GHG_kgCO2e/m^2',
    label: 'EGHGE/NFA',
    graphLabel: 'EGHGE/NFA (kgCO₂e/m²)',
    unit: 'kgCO₂e/m²'
  },
  'Embodied_Energy_MJ/m^2': {
    name: 'Embodied_Energy_MJ/m^2',
    label: 'EE/NFA',
    graphLabel: 'EE/NFA (MJ/m²)',
    unit: 'MJ/m²'
  },
  'Embodied_Water_L/m^2': {
    name: 'Embodied_Water_L/m^2',
    label: 'EW/NFA',
    graphLabel: 'EW/NFA (L/m²)',
    unit: 'L/m²'
  },
  'Cost_per_NFA_AUD/m^2': {
    name: 'Cost_per_NFA_AUD/m^2',
    label: 'C/NFA',
    graphLabel: 'C/NFA (AUD/m²)',
    unit: 'AUD/m²'
  }
};

export const MATERIALS = {
  '32 MPa RC': {
    name: '32 MPa RC',
    label: '32 MPa RC'
  },
  '40 MPa RC': {
    name: '40 MPa RC',
    label: '40 MPa RC'
  },
  '50 MPa RC': {
    name: '50 MPa RC',
    label: '50 MPa RC'
  },
  '300Plus Steel': {
    name: '300Plus Steel',
    label: 'Grade 300 Steel'
  }
};

export const STRUCTURAL_SYSTEMS = {
  'ShearWall': {
    name: 'ShearWall',
    label: 'Shear Wall'
  },
  'OutriggerBelt': {
    name: 'OutriggerBelt',
    label: 'Outrigger And Belt'
  },
  'BracedTube': {
    name: 'BracedTube',
    label: 'Braced Tube'
  }
};

export const SHAPES = {
  'rectangle': {
    name: 'rectangle',
    label: 'Rectangle'
  },
  'circle': {
    name: 'circle',
    label: 'Circle (Under Development)'
  }
};

// Control configurations
export const CONTROL_CONFIGS = {
  storeys: {
    min: 5,
    max: 95,
    step: 1,  // Further reduce step size to 1 for maximum smoothness
    defaultValue: 25,
    label: 'Select number of storeys',
    graphLabel: 'Storeys'
  },
  rectangleWidthSpans: {
    min: 3,
    max: 9,
    step: 1,
    defaultValue: 5,
    label: 'Select number of column spans along building width',
    graphLabel: 'Spans (Along Width)'
  },
  rectangleDepth: {
    min: 20,
    max: 50,
    step: 5,
    defaultValue: 35,
    label: 'Select depth (m)',
    graphLabel: 'Depth (m)'
  },
  rectangleDepthSpans: {
    min: 3,
    max: 9,
    step: 1,
    defaultValue: 5,
    label: 'Select number of column spans along building depth',
    graphLabel: 'Spans (Along Depth)'
  }
};

// Regression data has been moved to src/services/regression-data.json
