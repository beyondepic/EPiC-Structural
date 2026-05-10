# CLAUDE.md - EPiC Structural Dashboard

This file provides guidance to Claude Code when working with the EPiC Structural Dashboard.

## Project Overview

**EPiC Structural Dashboard** is an interactive analytics dashboard built with React for structural engineering performance analysis and material comparison visualization. It provides real-time calculations and visualizations for environmental impacts (GHG, Energy, Water, Mass) across different structural materials and systems.

## Technology Stack

- **Frontend Framework**: React 18.3.1
- **Build Tool**: Vite 6.2.0
- **Language**: TypeScript 5.9.2 (loose mode)
- **Styling**: CSS Modules + Tailwind CSS v4
- **Visualization**: Plotly.js 3.0.1 + react-plotly.js 2.6.0
- **3D Rendering**: Three.js 0.180.0
- **Icons**: React Icons 5.5.0
- **PDF Export**: @react-pdf/renderer 4.3.1
- **Image Export**: html2canvas 1.4.1
- **Routing**: React Router DOM 7.5.0
- **Utilities**: clsx, crypto-js, axios

## Development Commands

### Start Development Server
```bash
npm run dev              # Starts Vite dev server on http://localhost:5175
```

### Build for Production
```bash
npm run build           # TypeScript type check + Vite production build
npm run build:staging   # Build for staging environment
npm run build:production # Build for production environment
npm run preview         # Preview production build locally
```

### Code Quality
```bash
npm run lint            # Run ESLint
npm run lint:fix        # Auto-fix ESLint issues
npm run format          # Format code with Prettier
npm run format:check    # Check code formatting
npm run type-check      # TypeScript type checking
```

### Testing
```bash
npm test                # Run Vitest tests
npm run test:ui         # Run tests with UI
npm run test:coverage   # Generate test coverage
```

## Project Structure

```
src/
├── components/             # React UI components
│   ├── Header.tsx         # Application header
│   ├── ControlPanel.tsx   # Interactive parameter controls
│   ├── ChartWidget_new.tsx # Material comparison charts
│   ├── DataSummaryWidget.tsx # Performance metrics display
│   ├── BuildingVisualizer.tsx # 3D building visualization
│   ├── MaterialTable.tsx  # Material data table
│   ├── LoginForm.tsx      # Authentication form
│   ├── PDFExport/         # PDF export components
│   └── [various controls] # Reusable input components
├── contexts/              # React contexts
│   └── AuthContext.tsx    # Authentication state
├── hooks/                 # Custom React hooks
│   ├── useControls.ts     # Control state management
│   ├── useChartData.ts    # Chart data processing
│   └── useMultiFlowChartData.ts # Multi-material flow data
├── services/              # Business logic
│   ├── dataProcessor.ts   # Core calculation engine
│   ├── constants.ts       # Environmental flows, materials, systems
│   ├── cryptoUtils.ts     # Cryptography utilities
│   └── regressionApiService.ts # API service
├── App.tsx               # Main application component
├── App.css              # Global styles
└── index.tsx            # Application entry point
```

## Key Features

### 1. Interactive Controls
- Multi-select materials for comparison
- Slider controls for building parameters
- Dropdown selectors for structural systems and shapes
- Real-time parameter adjustment with live updates

### 2. Material Comparison Visualizations
- Multi-material overlay charts with distinct line styles
- Interactive Plotly.js charts (zoom, pan, hover tooltips)
- Environmental flow calculations (GHG, Energy, Water, Mass)
- Carousel navigation for different metrics

### 3. 3D Building Visualization
- Three.js-based 3D rendering of building structures
- Interactive camera controls
- Dynamic updates based on building parameters

### 4. Performance Analytics
- Real-time LCA/MFA calculations
- Performance badges with color-coded status
- Comprehensive building configuration display
- Material-specific performance metrics

### 5. Export Capabilities
- PDF export with @react-pdf/renderer
- Image export with html2canvas
- Formatted reports with charts and tables

## TypeScript Configuration

This project uses **loose TypeScript settings** to allow gradual adoption:

```json
{
  "strict": false,
  "noImplicitAny": false,
  "strictNullChecks": false
}
```

This means:
- TypeScript won't error on implicit `any` types
- Null checks are more forgiving
- You can gradually add types without breaking the build

## Important Notes

### Authentication
The app includes an authentication system with:
- Login form component
- Auth context for state management
- Crypto-js for secure storage
- Protected routes and user sessions

### Data Processing
Core calculations happen in `src/services/dataProcessor.ts`:
- Environmental impact calculations
- Material-specific algorithms
- Building parameter computations
- Regression analysis integration

### Constants and Materials
`src/services/constants.ts` defines:
- Environmental flow types
- Structural materials (Concrete, Steel, Timber, etc.)
- Structural systems (Frame, Wall, Hybrid)
- Building shapes and configurations

### Plotly.js Integration
The project uses Plotly.js which requires buffer polyfills for browser compatibility. This is configured in `vite.config.ts`:
```typescript
resolve: {
  alias: {
    buffer: "buffer/",
  },
},
```

## Common Development Tasks

### Adding a New Component
```bash
# Create component file
touch src/components/MyComponent.tsx
touch src/components/MyComponent.css

# Component template
import React from 'react';
import './MyComponent.css';

export default function MyComponent() {
  return <div>My Component</div>;
}
```

### Adding a New Hook
```bash
# Create hook file
touch src/hooks/useMyHook.ts

# Hook template
import { useState, useEffect } from 'react';

export function useMyHook() {
  const [state, setState] = useState();
  // Hook logic
  return { state, setState };
}
```

### Adding a New Calculation
```typescript
// In src/services/dataProcessor.ts
export function calculateNewMetric(params) {
  // Calculation logic
  return result;
}
```

### Updating Constants
```typescript
// In src/services/constants.ts
export const NEW_CONSTANT = {
  // Define new materials, systems, etc.
};
```

## Styling Guidelines

### CSS Modules
Each component has its own CSS file with scoped styles:
```tsx
import './MyComponent.css';
// CSS classes are automatically scoped
```

### Tailwind CSS
Use Tailwind utility classes for common styling:
```tsx
<div className="flex items-center gap-4 p-4">
```

### Custom Properties
Global CSS variables defined in `src/App.css`:
```css
:root {
  --primary-color: #1771B0;
  --secondary-color: #64748b;
}
```

## Environment Variables

Create a `.env` file (see `.env.example`):
```bash
VITE_APP_TITLE=EPiC Structural Dashboard
VITE_APP_ENV=development
# VITE_API_BASE_URL=http://localhost:8000
```

## Port Configuration

- **Development**: http://localhost:5175
- **Preview**: http://localhost:4175

These ports are chosen to avoid conflicts with other EPiC projects:
- EPiC-Admin: 5174
- EPiC-Explorer: 5173
- EPiC-Structural: 5175

## Troubleshooting

### Vite Won't Start
```bash
pkill -f vite
npm run dev
```

### Dependencies Issues
```bash
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors
```bash
npm run type-check  # See all type errors
# Fix gradually or use `any` type for now
```

### Plotly.js Issues
If you see buffer-related errors, ensure `buffer` is installed:
```bash
npm install buffer --save-dev
```

## Migration History

This project was recently migrated from:
- Create React App → Vite
- JavaScript → TypeScript
- React 18.2.0 → React 18.3.1
- OpenSSL legacy workarounds → Modern build system

See `MIGRATION.md` for full migration details.

## Related Projects

This project is part of the BeyondEPiC ecosystem:
- **EPiC-Admin**: Admin interface (shares similar tech stack)
- **EPiC-Explorer**: Material search interface
- **NestedPhoenix**: Core Django backend API
- **EPiC-infrastructure**: AWS infrastructure (Terraform)

All projects follow similar TypeScript + Vite + React patterns.

## Best Practices

1. **Use TypeScript** - Add types gradually for better code quality
2. **Component Isolation** - Keep components small and focused
3. **Custom Hooks** - Extract reusable logic into hooks
4. **Service Layer** - Keep business logic in services/
5. **CSS Scoping** - Use CSS modules for component styles
6. **Code Quality** - Run `npm run lint` before committing
7. **Type Checking** - Run `npm run type-check` periodically

## Getting Help

- Check `README.md` for quick start guide
- See `MIGRATION.md` for migration details
- Review organization's main CLAUDE.md at project root
- Check TypeScript errors with `npm run type-check`
