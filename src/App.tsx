import React, { useState, useRef, useCallback } from 'react';
import Header from './components/Header';
import ControlPanel from './components/ControlPanel';
import ChartWidget from './components/ChartWidget_new';
import MaterialTable from './components/MaterialTable';
import DataSummaryWidget from './components/DataSummaryWidget';
import BuildingVisualizer from './components/BuildingVisualizer';
import ControlPanelExpandButton from './components/ControlPanelExpandButton';
import ExportPDFButton from './components/PDFExport/ExportPDFButton';
import LoginForm from './components/LoginForm';
import { useControls } from './hooks/useControls';
import { useChartData } from './hooks/useChartData';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './App.css';

function DashboardContent() {
  const { controls, updateControl, updateEnvironmentalFlows, updateMaterials, updateStructuralSystems, setCurrentFlowIndex, options } = useControls();
  const { chartData } = useChartData(controls);
  const { isAuthenticated, user, logout } = useAuth();
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [hoveredMaterial, setHoveredMaterial] = useState(null);
  const [sortedMaterials, setSortedMaterials] = useState(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    // Load from localStorage or use default
    const savedWidth = localStorage.getItem('sidebarWidth');
    const initialWidth = savedWidth ? parseInt(savedWidth, 10) : 420;
    const maxWidth = Math.floor(window.innerWidth * 0.3); // Maximum 30% of window width
    return Math.min(Math.max(initialWidth, 320), maxWidth); // Min 320px, max 30% of window
  });
  const [isResizing, setIsResizing] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const sidebarRef = useRef(null);
  const animationFrameRef = useRef(null);

  const handleMouseDown = useCallback((e) => {
    setIsResizing(true);
    e.preventDefault();
    
    // Add is-resizing class to freeze child component updates during drag
    document.body.classList.add('is-resizing');
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isResizing) return;
    
    // Cancel previous animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    // Use requestAnimationFrame for smooth updates
    animationFrameRef.current = requestAnimationFrame(() => {
      const newWidth = e.clientX;
      const minWidth = 320; // Minimum usable width
  const maxWidth = Math.floor(window.innerWidth * 0.3); // Maximum 30% of window width
      
      // Clamp the width within bounds
      const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      
      setSidebarWidth(clampedWidth);
    });
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    
    // Cancel any pending animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Remove is-resizing class
    document.body.classList.remove('is-resizing');
    
    // Save to localStorage
    localStorage.setItem('sidebarWidth', sidebarWidth.toString());
    
    // Single resize notification - let ResizeObserver handle the rest
    const performResize = () => {
      // Dispatch custom event for components that need to know about layout changes
      window.dispatchEvent(new CustomEvent('dashboard-resized', {
        detail: { sidebarWidth }
      }));
      
      // Trigger window resize event once to notify ResizeObservers
      window.dispatchEvent(new Event('resize'));
    };
    
    // Single execution after layout settles
    setTimeout(performResize, 300);
  }, [sidebarWidth]);

  // Handle horizontal resizing events
  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Cleanup animation frame on unmount
  React.useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const handleTableSorted = useCallback((sortedTableData) => {
    // Extract sorted material keys for chart synchronization
    const sortedMaterialKeys = sortedTableData.map(row => row.materialKey);
    setSortedMaterials(sortedMaterialKeys);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  const handleLoginClick = useCallback(() => {
    setIsLoginModalOpen(true);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  React.useEffect(() => {
    if (isAuthenticated) {
      setIsLoginModalOpen(false);
    }
  }, [isAuthenticated]);

  return (
    <div className="app">
      <Header 
        isAuthenticated={isAuthenticated}
        user={user}
        onLoginClick={handleLoginClick}
        onLogout={handleLogout}
        exportButton={
          isAuthenticated ? (
            <ExportPDFButton 
              controls={controls}
              chartData={chartData}
              username={user?.username || 'User'}
            />
          ) : null
        }
      />
      
      <div className="dashboard">
        {!isAuthenticated && isLoginModalOpen && (
          <LoginForm onClose={() => setIsLoginModalOpen(false)} />
        )}

        {/* Mobile overlay when sidebar is visible */}
        {isSidebarVisible && (
          <div className="sidebar-overlay" onClick={toggleSidebar}></div>
        )}

        {/* Expand control panel button */}
        <ControlPanelExpandButton
          onClick={() => {
            if (!isSidebarVisible) {
              toggleSidebar();
            }
          }}
          isSidebarVisible={isSidebarVisible}
        />
        
        {isSidebarVisible && (
          <aside 
            ref={sidebarRef}
            className="sidebar resizable-sidebar"
            style={{ 
              width: `${sidebarWidth}px`, 
              minWidth: `${sidebarWidth}px` 
            }}
          >
            <ControlPanel 
              controls={controls}
              updateControl={updateControl}
              updateEnvironmentalFlows={updateEnvironmentalFlows}
              updateMaterials={updateMaterials}
              updateStructuralSystems={updateStructuralSystems}
              options={options}
              isAuthenticated={isAuthenticated}
              onToggleSidebar={toggleSidebar}
              isSidebarVisible={isSidebarVisible}
            />
          </aside>
        )}

        {isSidebarVisible && (
          <div 
            className={`resize-handle ${isResizing ? 'resizing' : ''}`}
            onMouseDown={handleMouseDown}
          >
            <div className="resize-handle-line"></div>
          </div>
        )}

        <main
          className="main-content"
          style={{
            marginLeft: isSidebarVisible ? 0 : 0,
            width: isSidebarVisible ? 'auto' : '100%'
          }}
        >
          <div className="content-grid">
            <div className="main-layout">
              {/* Left Column: 3D Building Visualizer (40%) */}
              <div className="left-column">
                <div className="visualizer-section">
                  <BuildingVisualizer
                    storeys={controls.numberOfStoreys}
                    floorHeight={controls.floorHeight}
                    width={controls.buildingWidth}
                    depth={controls.buildingDepth}
                    widthSpans={controls.columnWidthSpans}
                    depthSpans={controls.columnDepthSpans}
                    structureType={controls.currentStructuralSystem?.toLowerCase()}
                    materialType={(() => {
                      const m = controls.materials?.[0] || '';
                      if (m.toLowerCase().includes('steel')) return 'steel';
                      if (m.toLowerCase().includes('concrete')) return 'concrete';
                      if (m.toLowerCase().includes('timber')) return 'timber';
                      return 'steel';
                    })()}
                    flowData={chartData?.flowData || []}
                    isAuthenticated={isAuthenticated}
                    // Structural system selector props
                    showStructuralSelector={controls.structuralSystems && controls.structuralSystems.length >= 1}
                    currentStructuralSystem={controls.currentStructuralSystem}
                    availableStructuralSystems={
                      // Generate options list from left panel selected items
                      controls.structuralSystems.map(systemKey => {
                        const systemInfo = options.structuralSystems.find(
                          s => s.value === systemKey || s.name === systemKey
                        );
                        return {
                          value: systemKey,
                          label: systemInfo?.label || systemKey
                        };
                      })
                    }
                    onStructuralSystemChange={(value) => updateControl('currentStructuralSystem', value)}
                  />
                </div>
              </div>

              {/* Right Column: Chart and Table (60%) */}
              <div className="right-column">
                <div className="chart-section">
                  <div className="chart-only-section">
                    <ChartWidget
                      chartData={chartData}
                      controls={controls}
                      setCurrentFlowIndex={setCurrentFlowIndex}
                      isAuthenticated={isAuthenticated}
                      selectedMaterial={selectedMaterial}
                      hoveredMaterial={hoveredMaterial}
                      isSidebarVisible={isSidebarVisible}
                      sortedMaterials={sortedMaterials}
                    />
                  </div>
                </div>

                <div className="table-section">
                  <MaterialTable
                    chartData={chartData}
                    controls={controls}
                    selectedMaterial={selectedMaterial}
                    setSelectedMaterial={setSelectedMaterial}
                    hoveredMaterial={hoveredMaterial}
                    setHoveredMaterial={setHoveredMaterial}
                    onSorted={handleTableSorted}
                  />
                </div>
              </div>
            </div>

            <div className="full-width-section">
              <DataSummaryWidget
                controls={controls}
                chartData={chartData}
                isAuthenticated={isAuthenticated}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
}

export default App;