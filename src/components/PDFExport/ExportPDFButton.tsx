import React, { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { BiDownload } from 'react-icons/bi';
import { DataProcessor } from '../../services/dataProcessor';
import { ENVIRONMENTAL_FLOWS, MATERIALS, STRUCTURAL_SYSTEMS, CONTROL_CONFIGS } from '../../services/constants';
import PDFDocument from './PDFDocument';
import './ExportPDFButton.css';

const COLOR_PALETTE = [
  '#1F77B4', '#FF7F0E', '#2CA02C', '#D62728', '#9467BD',
  '#8C564B', '#E377C2', '#7F7F7F', '#BCBD22', '#17BECF'
];

const formatSeriesLabel = (materialKey, structuralKey) => {
  const materialLabel = MATERIALS[materialKey]?.label || materialKey;
  const structuralLabel = STRUCTURAL_SYSTEMS[structuralKey]?.label || structuralKey;
  return `${materialLabel} - ${structuralLabel}`;
};

const ExportPDFButton = ({ controls, chartData, username }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  // Capture 3D Visualization screenshot
  const attemptCanvasCapture = (canvas) => {
    try {
      if (!canvas || !canvas.width || !canvas.height) {
        return null;
      }
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      return dataUrl && dataUrl.startsWith('data:image') ? dataUrl : null;
    } catch (error) {
      console.warn('Canvas capture attempt failed:', error);
      return null;
    }
  };

  const capture3DVisualization = async () => {
    try {
      const canvases = Array.from(
        document.querySelectorAll('#building-visualizer-container canvas')
      ).filter(canvas => canvas.width > 0 && canvas.height > 0);

      for (const canvas of canvases) {
        let capture = attemptCanvasCapture(canvas);
        if (capture) {
          return capture;
        }

        for (let attempt = 0; attempt < 5; attempt += 1) {
          await new Promise(resolve => requestAnimationFrame(resolve));
          await new Promise(resolve => setTimeout(resolve, 16));
          capture = attemptCanvasCapture(canvas);
          if (capture) {
            return capture;
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Failed to capture 3D visualization:', error);
      return null;
    }
  };

  // Capture individual chart screenshot
  const captureChart = async (flowName) => {
    try {
      // Dynamically import html2canvas
      const html2canvas = (await import('html2canvas')).default;
      
      const chartContainer = document.querySelector('#chart-widget-container');
      if (!chartContainer) return null;

      const canvas = await html2canvas(chartContainer, {
        scale: 2, // 2x resolution for high quality
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      return canvas.toDataURL('image/png', 0.95);
    } catch (error) {
      console.error(`Failed to capture chart ${flowName}:`, error);
      return null;
    }
  };

  // Collect General Information data
  const collectGeneralInfo = () => {
    const {
      numberOfStoreys = 15,
      floorHeight = 3.5,
      buildingWidth,
      buildingDepth,
      columnWidthSpans = 5,
      columnDepthSpans = 5,
    } = controls;

    // Calculate building dimensions (matching DataSummaryWidget logic)
    const spanLength = 6; // meters
    const width = (buildingWidth !== undefined && buildingWidth !== null && !isNaN(Number(buildingWidth)))
      ? Number(buildingWidth)
      : columnWidthSpans * spanLength;
    const depth = (buildingDepth !== undefined && buildingDepth !== null && !isNaN(Number(buildingDepth)))
      ? Number(buildingDepth)
      : columnDepthSpans * spanLength;
    
    const height = numberOfStoreys * floorHeight;
    const floorArea = width * depth;
    const grossFloorArea = floorArea * numberOfStoreys;
    const floorVolume = floorArea * floorHeight;
    const grossFloorVolume = floorVolume * numberOfStoreys;
    const perimeter = 2 * (width + depth);
    const facadeArea = perimeter * height;
    const facadeAreaPerFloor = perimeter * floorHeight;

    // Format number with commas
    const formatNumber = (num, decimals = 0) => {
      if (num === null || num === undefined || isNaN(num)) return '-';
      return num.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      });
    };

    return [
      { label: 'BUILDING HEIGHT', value: `${formatNumber(height, 1)} m` },
      { label: 'SPAN CONFIGURATION', value: `${formatNumber(width, 0)} m × ${formatNumber(depth, 0)} m` },
      { label: 'GROSS FLOOR AREA', value: `${formatNumber(grossFloorArea, 0)} m²` },
      { label: 'GROSS FLOOR AREA PER FLOOR', value: `${formatNumber(floorArea, 0)} m²` },
      { label: 'GROSS FLOOR VOLUME', value: `${formatNumber(grossFloorVolume, 0)} m³` },
      { label: 'GROSS FLOOR VOLUME PER FLOOR', value: `${formatNumber(floorVolume, 0)} m³` },
      { label: 'FACADE AREA', value: `${formatNumber(facadeArea, 0)} m²` },
      { label: 'FACADE AREA PER FLOOR', value: `${formatNumber(facadeAreaPerFloor, 0)} m²` },
    ];
  };

  // Collect Control Panel data
  const collectControlPanelData = () => {
    const {
      numberOfStoreys,
      floorHeight,
      buildingWidth,
      buildingDepth,
      columnWidthSpans,
      columnDepthSpans,
      structuralSystem,
      materials = [],
      environmentalFlows = [],
    } = controls;

    return [
      { parameter: 'Number of Storeys', value: numberOfStoreys || 'N/A' },
      { parameter: 'Floor Height (m)', value: floorHeight?.toFixed(2) || 'N/A' },
      { parameter: 'Building Width (m)', value: buildingWidth?.toFixed(2) || 'N/A' },
      { parameter: 'Building Depth (m)', value: buildingDepth?.toFixed(2) || 'N/A' },
      { parameter: 'Column Width Spans', value: columnWidthSpans || 'N/A' },
      { parameter: 'Column Depth Spans', value: columnDepthSpans || 'N/A' },
      { parameter: 'Structural System', value: structuralSystem || 'N/A' },
      { parameter: 'Selected Materials', value: materials.join(', ') || 'None' },
      { parameter: 'Environmental Flows', value: environmentalFlows.join(', ') || 'None' },
    ];
  };

  // Collect all chart screenshots
  const buildChartTraces = async (flowName, materialsList, systemsList, varyingControl, colorMapping, usedLabels) => {
    const traces = [];

    for (const material of materialsList) {
      for (const structuralSystem of systemsList) {
        const params = {
          environmentalFlow: flowName,
          structuralSystem,
          material,
          shape: controls.shape || 'rectangle',
          storeys: controls.numberOfStoreys || controls.storeys || 25,
          rectangleWidthSpans: controls.columnWidthSpans || controls.rectangleWidthSpans || 5,
          rectangleDepth: controls.buildingDepth || controls.rectangleDepth || 35,
          rectangleDepthSpans: controls.columnDepthSpans || controls.rectangleDepthSpans || 5,
          varyingControl,
        };

        try {
          const seriesData = await DataProcessor.generateChartData(params);
          if (!seriesData || !seriesData.length) {
            continue;
          }

          const seriesLabel = formatSeriesLabel(material, structuralSystem);
          const color = colorMapping.get(seriesLabel) || COLOR_PALETTE[0];
          usedLabels.add(seriesLabel);

          traces.push({
            x: seriesData.map(point => point.x),
            y: seriesData.map(point => point.y),
            type: 'scatter',
            mode: 'lines',
            name: seriesLabel,
            line: {
              width: 3,
              color,
            },
            hovertemplate: '<b>%{y:.2f}</b> at %{x}<extra></extra>',
          });

          const targetStoreys = controls.numberOfStoreys || controls.storeys || 25;
          const currentPoint = seriesData.find(point => point.x === targetStoreys);
          if (currentPoint) {
            traces.push({
              x: [currentPoint.x],
              y: [currentPoint.y],
              type: 'scatter',
              mode: 'markers',
              name: `${seriesLabel} (Current)`,
              marker: {
                color,
                size: 8,
                symbol: 'circle',
                line: {
                  width: 1,
                  color: '#ffffff',
                },
              },
              showlegend: false,
              hovertemplate: `<b>Current configuration</b><br />${targetStoreys} storeys<br />Value: %{y:.2f}<extra></extra>`,
            });
          }
        } catch (error) {
          console.warn(`Failed to build chart series for ${material} - ${structuralSystem}:`, error);
        }
      }
    }

    return traces;
  };

  const collectChartArtifacts = async () => {
    const { environmentalFlows = [], materials = [], structuralSystems = [] } = controls;
    if (!environmentalFlows.length) {
      return { chartImages: [], legendItems: [] };
    }

    const chartImages = [];
    const materialsList = materials.length ? materials : ['32 MPa RC'];
    const systemsList = structuralSystems.length ? structuralSystems : ['ShearWall'];
    const varyingControl = controls.varyingControl || 'storeys';
    const xAxisLabel = CONTROL_CONFIGS[varyingControl]?.graphLabel || 'Number of Storeys';
    const usedLabels = new Set();
    const colorMapping = new Map();
    materialsList.forEach((material, materialIdx) => {
      systemsList.forEach((system, systemIdx) => {
        const label = formatSeriesLabel(material, system);
        const paletteIndex = (materialIdx * systemsList.length + systemIdx) % COLOR_PALETTE.length;
        colorMapping.set(label, COLOR_PALETTE[paletteIndex]);
      });
    });
    let Plotly; 

    try {
  const plotlyModule = await import('plotly.js/dist/plotly');
  Plotly = plotlyModule.default || plotlyModule.Plotly || plotlyModule;
    } catch (error) {
      console.error('Failed to load Plotly for PDF export, falling back to DOM capture:', error);
    }

    const progressStep = environmentalFlows.length ? 40 / environmentalFlows.length : 40;

    for (let index = 0; index < environmentalFlows.length; index += 1) {
      const flowName = environmentalFlows[index];
      const flowMeta = ENVIRONMENTAL_FLOWS[flowName];
      const sanitizedTitle = flowMeta?.graphLabel || flowMeta?.label || flowName.replace(/_/g, ' ').replace('/m^2', '/m²');

      try {
        if (Plotly) {
          const traces = await buildChartTraces(
            flowName,
            materialsList,
            systemsList,
            varyingControl,
            colorMapping,
            usedLabels
          );

          if (traces.length) {
            const container = document.createElement('div');
            container.style.position = 'fixed';
            container.style.left = '-10000px';
            container.style.top = '0';
            container.style.width = '1200px';
            container.style.height = '675px';
            container.style.opacity = '0';
            container.style.pointerEvents = 'none';
            document.body.appendChild(container);

            const layout = {
              width: 1200,
              height: 675,
              plot_bgcolor: 'white',
              paper_bgcolor: 'white',
              font: { family: 'Inter, sans-serif' },
              title: {
                text: sanitizedTitle,
                font: { size: 22, color: '#1F2937' },
                x: 0,
                xanchor: 'left',
              },
              margin: { t: 70, r: 60, b: 70, l: 90 },
              xaxis: {
                title: xAxisLabel,
                gridcolor: '#E5E7EB',
                zerolinecolor: '#D1D5DB',
                showline: true,
                linewidth: 1,
                linecolor: '#374151',
                mirror: true,
                rangemode: 'tozero',
              },
              yaxis: {
                title: flowMeta?.graphLabel || sanitizedTitle,
                gridcolor: '#E5E7EB',
                zerolinecolor: '#D1D5DB',
                showline: true,
                linewidth: 1,
                linecolor: '#374151',
                mirror: true,
                rangemode: 'tozero',
              },
              legend: {
                orientation: 'v',
                x: 0.02,
                y: 0.98,
                xanchor: 'left',
                yanchor: 'top',
                bgcolor: 'rgba(255, 255, 255, 0.85)',
                bordercolor: 'rgba(55, 71, 79, 0.25)',
                borderwidth: 1,
                font: { size: 12, color: '#374151' },
                itemgap: 4,
              },
              hovermode: 'closest',
              showlegend: false,
            };

            const config = {
              displayModeBar: false,
              responsive: false,
              staticPlot: true,
            };

            await Plotly.newPlot(container, traces, layout, config);
            const image = await Plotly.toImage(container, {
              format: 'png',
              width: 1200,
              height: 675,
              scale: 2,
            });

            chartImages.push({
              title: sanitizedTitle,
              image,
            });

            Plotly.purge(container);
            container.remove();
          } else {
            const fallbackImage = await captureChart(flowName);
            if (fallbackImage) {
              chartImages.push({ title: sanitizedTitle, image: fallbackImage });
            }
          }
        } else {
          const fallbackImage = await captureChart(flowName);
          if (fallbackImage) {
            chartImages.push({ title: sanitizedTitle, image: fallbackImage });
          }
        }
      } catch (error) {
        console.error(`Failed to generate PDF chart for ${flowName}:`, error);
        const fallbackImage = await captureChart(flowName);
        if (fallbackImage) {
          chartImages.push({ title: sanitizedTitle, image: fallbackImage });
        }
      } finally {
        setProgress(prev => Math.min(prev + progressStep, 70));
      }
    }

    const legendItems = Array.from(usedLabels).map(label => ({
      label,
      color: colorMapping.get(label) || COLOR_PALETTE[0],
    }));

    return { chartImages, legendItems };
  };

  // Collect table data
  const collectTableData = () => {
    const { environmentalFlows = [] } = controls;

    // Extract table data from chartData
    const headers = environmentalFlows.map(flow => {
      const meta = ENVIRONMENTAL_FLOWS[flow];
      return meta?.graphLabel || meta?.label || flow.replace(/_/g, ' ').replace('/m^2', '/m²');
    });

    const rows = [];
    
    if (chartData && chartData.series) {
      chartData.series.forEach(series => {
        const row = {
          material: series.name,
          values: []
        };

        // Collect data for each environmental flow
        environmentalFlows.forEach(flowName => {
          // This needs to be adjusted based on actual data structure
          const dataPoint = series.data?.find(d => d.x === controls.numberOfStoreys);
          row.values.push(dataPoint ? dataPoint.y.toFixed(2) : 'N/A');
        });

        rows.push(row);
      });
    }

    return { headers, rows };
  };

  // Main export function
  const handleExportPDF = async () => {
    if (isExporting) return;

    setIsExporting(true);
    setProgress(0);

    try {
      console.log('Starting PDF export...');
      
      // 1. Capture 3D visualization (10%)
      setProgress(10);
      const visualizationImage = await capture3DVisualization();
      console.log('3D screenshot completed');

      // 2. Collect General Information (30%)
      setProgress(30);
      const generalInfo = collectGeneralInfo();
      const controlPanelData = collectControlPanelData();
      console.log('Information collection completed');

      // 3. Capture all charts (30-70%)
  const { chartImages, legendItems } = await collectChartArtifacts();
  console.log('Chart screenshots completed', chartImages.length);

      // 4. Collect table data (85%)
      setProgress(85);
      const tableData = collectTableData();
      console.log('Table data collection completed');

      // 5. Generate PDF (95%)
      setProgress(95);
      const blob = await pdf(
        <PDFDocument
          visualizationImage={visualizationImage}
          generalInfo={generalInfo}
          controlPanelData={controlPanelData}
          chartImages={chartImages}
          legendItems={legendItems}
          tableData={tableData}
          username={username}
        />
      ).toBlob();

      // 6. Download file (100%)
      setProgress(100);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'EPiC_Structural_Report.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('PDF export completed');
      
      // Delay state reset
      setTimeout(() => {
        setIsExporting(false);
        setProgress(0);
      }, 1000);

    } catch (error) {
      console.error('PDF export failed:', error);
      alert(`Export failed: ${error.message}`);
      setIsExporting(false);
      setProgress(0);
    }
  };

  return (
    <button
      className="export-pdf-button"
      onClick={handleExportPDF}
      disabled={isExporting}
      title="Export as PDF"
    >
      <BiDownload size={16} />
      {isExporting ? (
        <span>Exporting... {progress}%</span>
      ) : (
        <span>Export PDF</span>
      )}
    </button>
  );
};

export default ExportPDFButton;
