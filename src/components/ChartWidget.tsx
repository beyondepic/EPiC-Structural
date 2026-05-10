import React from 'react';
import Plot from 'react-plotly.js';
import { BiDownload, BiRefresh } from 'react-icons/bi';
import { ENVIRONMENTAL_FLOWS } from '../services/constants';
import './ChartWidget.css';

const ChartWidget = ({ chartData, controls }) => {
  
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

  const environmentalFlow = ENVIRONMENTAL_FLOWS[controls.environmentalFlow];
  
  // Prepare main trace
  const mainTrace = {
    x: chartData.main.map(d => d.x),
    y: chartData.main.map(d => d.y),
    type: 'scatter',
    mode: 'lines+markers',
    name: 'Current Configuration',
    line: { 
      color: '#1771B0', 
      width: 3 
    },
    marker: { 
      color: '#1771B0', 
      size: 6 
    },
    showlegend: false, // Disable legend for this trace
    hovertemplate: '<b>Storeys:</b> %{x}<br><b>' + environmentalFlow.unit + ':</b> %{y:.2f}<extra></extra>'
  };

  // Prepare comparison traces
  const comparisonTraces = chartData.comparison.map((series, index) => {
    const colors = ['#3182CE', '#059669', '#DC2626'];
    return {
      x: series.data.map(d => d.x),
      y: series.data.map(d => d.y),
      type: 'scatter',
      mode: 'lines',
      name: series.name,
      line: { 
        color: colors[index % colors.length], 
        width: 2,
        dash: 'dot'
      },
      showlegend: false, // Disable legend for this trace
      hovertemplate: '<b>Storeys:</b> %{x}<br><b>' + environmentalFlow.unit + ':</b> %{y:.2f}<extra></extra>'
    };
  });

  // Current storeys indicator
  const currentPoint = chartData.main.find(d => d.x === controls.storeys);
  const currentIndicator = currentPoint ? {
    x: [currentPoint.x],
    y: [currentPoint.y],
    type: 'scatter',
    mode: 'markers',
    name: 'Current Selection',
    marker: { 
      color: '#DC2626', 
      size: 12,
      symbol: 'diamond',
      line: { color: 'white', width: 2 }
    },
    showlegend: false, // Disable legend for this trace
    hovertemplate: '<b>Current:</b> %{x} storeys<br><b>' + environmentalFlow.unit + ':</b> %{y:.2f}<extra></extra>'
  } : null;

  // Vertical line for current storeys
  const verticalLine = {
    x: [controls.storeys, controls.storeys],
    y: [Math.min(...chartData.main.map(d => d.y)) * 0.9, Math.max(...chartData.main.map(d => d.y)) * 1.1],
    type: 'scatter',
    mode: 'lines',
    name: 'Current Storeys',
    line: { 
      color: '#DC2626', 
      width: 2, 
      dash: 'dash' 
    },
    showlegend: false,
    hoverinfo: 'skip'
  };

  const traces = [mainTrace, ...comparisonTraces, verticalLine];
  if (currentIndicator) {
    traces.push(currentIndicator);
  }

  const layout = {
    xaxis: { 
      title: 'Number of Storeys',
      gridcolor: '#E5E7EB',
      zerolinecolor: '#D1D5DB'
    },
    yaxis: { 
      title: environmentalFlow.graphLabel,
      gridcolor: '#E5E7EB',
      zerolinecolor: '#D1D5DB'
    },
    plot_bgcolor: 'white',
    paper_bgcolor: 'white',
    font: { family: 'Inter, sans-serif' },
    hovermode: 'closest',
    showlegend: false, // Disable internal legend
    margin: { t: 20, r: 20, b: 60, l: 80 } // Reduced top margin since title is external
  };

  const config = {
    displayModeBar: true,
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

  const handleExportPNG = () => {
    // This would typically use Plotly's built-in export functionality
    // For now, we'll use the toImage button in the modebar
    alert('Use the download button in the chart toolbar to export as PNG');
  };

  const handleReset = () => {
    // Reset zoom - this would typically be handled by Plotly's autoScale
    alert('Use the autoscale button in the chart toolbar to reset zoom');
  };

  return (
    <div className="chart-widget">
      <div className="widget-header">
        <h3 className="widget-title">{environmentalFlow.graphLabel} vs Number of Storeys</h3>
        <div className="chart-controls">
          <button 
            className="chart-control-btn"
            onClick={handleExportPNG}
            title="Export as PNG"
          >
            <BiDownload size={16} />
          </button>
          <button 
            className="chart-control-btn"
            onClick={handleReset}
            title="Reset Zoom"
          >
            <BiRefresh size={16} />
          </button>
        </div>
      </div>
      
      <div className="chart-legend">
        {traces.map((trace, index) => (
          <div key={index} className="chart-legend-item">
            <div 
              className="legend-swatch" 
              style={{ backgroundColor: trace.line?.color || '#1771B0' }}
            ></div>
            <span className="legend-label">{trace.name}</span>
          </div>
        ))}
      </div>
      
      <div className="chart-container">
        <Plot
          data={traces}
          layout={layout}
          config={config}
          style={{ width: '100%', height: '100%' }}
          useResizeHandler={true}
        />
      </div>
    </div>
  );
};

export default ChartWidget;
