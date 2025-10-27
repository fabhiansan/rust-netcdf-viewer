import { useState } from 'react';

export interface ChartSettings {
  chartType: 'line' | 'scatter' | 'bar';
  showGrid: boolean;
  xAxisLabel: string;
  yAxisLabel: string;
}

interface ChartControlsProps {
  settings: ChartSettings;
  onSettingsChange: (settings: ChartSettings) => void;
  onExportPNG?: () => void;
}

export function ChartControls({
  settings,
  onSettingsChange,
  onExportPNG,
}: ChartControlsProps): React.JSX.Element {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const handleChartTypeChange = (chartType: 'line' | 'scatter' | 'bar'): void => {
    onSettingsChange({ ...settings, chartType });
  };

  const handleGridToggle = (): void => {
    onSettingsChange({ ...settings, showGrid: !settings.showGrid });
  };

  const handleXAxisLabelChange = (xAxisLabel: string): void => {
    onSettingsChange({ ...settings, xAxisLabel });
  };

  const handleYAxisLabelChange = (yAxisLabel: string): void => {
    onSettingsChange({ ...settings, yAxisLabel });
  };

  return (
    <div className="chart-controls">
      <button className="controls-toggle" onClick={() => { setIsExpanded(!isExpanded); }}>
        {isExpanded ? '▼' : '▶'} Chart Controls
      </button>

      {isExpanded && (
        <div className="controls-panel">
          <div className="control-group">
            <label>Chart Type:</label>
            <div className="button-group">
              <button
                className={settings.chartType === 'line' ? 'active' : ''}
                onClick={() => { handleChartTypeChange('line'); }}
              >
                Line
              </button>
              <button
                className={settings.chartType === 'scatter' ? 'active' : ''}
                onClick={() => { handleChartTypeChange('scatter'); }}
              >
                Scatter
              </button>
              <button
                className={settings.chartType === 'bar' ? 'active' : ''}
                onClick={() => { handleChartTypeChange('bar'); }}
              >
                Bar
              </button>
            </div>
          </div>

          <div className="control-group">
            <label>
              <input
                type="checkbox"
                checked={settings.showGrid}
                onChange={handleGridToggle}
              />
              Show Grid Lines
            </label>
          </div>

          <div className="control-group">
            <label>
              X-Axis Label:
              <input
                type="text"
                value={settings.xAxisLabel}
                onChange={(e) => { handleXAxisLabelChange(e.target.value); }}
                placeholder="Auto"
              />
            </label>
          </div>

          <div className="control-group">
            <label>
              Y-Axis Label:
              <input
                type="text"
                value={settings.yAxisLabel}
                onChange={(e) => { handleYAxisLabelChange(e.target.value); }}
                placeholder="Auto"
              />
            </label>
          </div>

          {onExportPNG !== undefined && (
            <div className="control-group">
              <button className="export-button" onClick={onExportPNG}>
                Export Chart as PNG
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
