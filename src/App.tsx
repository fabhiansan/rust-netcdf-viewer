import { useState } from 'react';
import { FileLoader } from './components/FileLoader';
import { MetadataPanel } from './components/MetadataPanel';
import { TimeSeriesChart } from './components/TimeSeriesChart';
import { DataTable } from './components/DataTable';
import { StatsPanel } from './components/StatsPanel';
import { MapView } from './components/MapView';
import { ChartControls, type ChartSettings } from './components/ChartControls';
import { ExportDialog } from './components/ExportDialog';
import type { FileMetadata, Variable } from './types/netcdf';
import './App.css';

type TabType = 'chart' | 'table' | 'stats' | 'map';

function App(): React.JSX.Element {
  const [metadata, setMetadata] = useState<FileMetadata | null>(null);
  const [selectedVariable, setSelectedVariable] = useState<Variable | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('chart');
  const [showExportDialog, setShowExportDialog] = useState<boolean>(false);
  const [chartSettings, setChartSettings] = useState<ChartSettings>({
    chartType: 'line',
    showGrid: true,
    xAxisLabel: '',
    yAxisLabel: '',
  });

  const handleFileLoaded = (loadedMetadata: FileMetadata): void => {
    setMetadata(loadedMetadata);
    setSelectedVariable(null);
    setActiveTab('chart');
  };

  const handleVariableSelect = (variable: Variable): void => {
    setSelectedVariable(variable);
    setActiveTab('chart');
  };

  const handleNewFile = (): void => {
    setMetadata(null);
    setSelectedVariable(null);
    setActiveTab('chart');
  };

  return (
    <div className="app">
      {metadata === null ? (
        <FileLoader onFileLoaded={handleFileLoaded} />
      ) : (
        <div className="app-layout">
          <aside className="sidebar">
            <div className="sidebar-header">
              <h2>NetCDF Viewer</h2>
              <button onClick={handleNewFile} className="new-file-button">
                Open New File
              </button>
            </div>
            <MetadataPanel
              metadata={metadata}
              onVariableSelect={handleVariableSelect}
              selectedVariable={selectedVariable?.name ?? null}
            />
          </aside>

          <main className="main-content">
            {selectedVariable !== null ? (
              <div className="variable-view">
                <div className="variable-header">
                  <div>
                    <h2>{selectedVariable.name}</h2>
                    <div className="variable-meta">
                      <span>Type: {selectedVariable.data_type}</span>
                      <span>Dimensions: {selectedVariable.dimensions.join(' × ')}</span>
                      <span>Shape: {selectedVariable.shape.join(' × ')}</span>
                      {(selectedVariable.attributes['units'] ?? '') !== '' && (
                        <span>Units: {selectedVariable.attributes['units']}</span>
                      )}
                    </div>
                  </div>
                  <button className="export-button" onClick={() => { setShowExportDialog(true); }}>
                    Export Data
                  </button>
                </div>

                <div className="tabs">
                  <button
                    className={activeTab === 'chart' ? 'tab active' : 'tab'}
                    onClick={() => { setActiveTab('chart'); }}
                  >
                    Chart
                  </button>
                  <button
                    className={activeTab === 'table' ? 'tab active' : 'tab'}
                    onClick={() => { setActiveTab('table'); }}
                  >
                    Table
                  </button>
                  <button
                    className={activeTab === 'stats' ? 'tab active' : 'tab'}
                    onClick={() => { setActiveTab('stats'); }}
                  >
                    Statistics
                  </button>
                  <button
                    className={activeTab === 'map' ? 'tab active' : 'tab'}
                    onClick={() => { setActiveTab('map'); }}
                  >
                    Map
                  </button>
                </div>

                <div className="tab-content">
                  {activeTab === 'chart' && (
                    <div className="chart-view">
                      <ChartControls
                        settings={chartSettings}
                        onSettingsChange={setChartSettings}
                      />
                      <TimeSeriesChart
                        filePath={metadata.file_path}
                        variable={selectedVariable}
                        metadata={metadata}
                      />
                    </div>
                  )}

                  {activeTab === 'table' && (
                    <DataTable filePath={metadata.file_path} variable={selectedVariable} />
                  )}

                  {activeTab === 'stats' && (
                    <StatsPanel filePath={metadata.file_path} variable={selectedVariable} />
                  )}

                  {activeTab === 'map' && (
                    <MapView
                      filePath={metadata.file_path}
                      variable={selectedVariable}
                      metadata={metadata}
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="no-selection">
                <h2>Welcome to NetCDF Viewer</h2>
                <p>Select a variable from the sidebar to visualize and analyze data</p>
                <ul>
                  <li>View time-series charts with zoom and pan</li>
                  <li>Explore data in sortable, filterable tables</li>
                  <li>Calculate statistics (min, max, mean, median, std dev)</li>
                  <li>Visualize geospatial data on interactive maps</li>
                </ul>
              </div>
            )}
          </main>
        </div>
      )}

      {showExportDialog && selectedVariable !== null && metadata !== null && (
        <ExportDialog
          filePath={metadata.file_path}
          variable={selectedVariable}
          onClose={() => { setShowExportDialog(false); }}
        />
      )}
    </div>
  );
}

export default App;
