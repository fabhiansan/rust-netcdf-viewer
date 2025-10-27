import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import type { DataPoint } from '../utils/analysis';

export interface AnomalySettings {
  enabled: boolean;
  threshold: number; // Standard deviations
  excludeFromStats: boolean;
}

export interface Anomaly {
  index: number;
  timestamp: number;
  value: number;
  zScore: number;
}

export interface AnomalyDetectionProps {
  anomalies: Anomaly[]; // Computed anomalies from parent
  dataPoints: DataPoint[]; // For displaying anomaly details
  onSettingsChange: (settings: AnomalySettings) => void;
  onAnomalyClick?: (index: number) => void; // Jump to anomaly on chart
  initialSettings?: Partial<AnomalySettings>;
  units?: string;
}

const DEFAULT_SETTINGS: AnomalySettings = {
  enabled: false,
  threshold: 2.0,
  excludeFromStats: false,
};

export function AnomalyDetection({
  anomalies,
  dataPoints,
  onSettingsChange,
  onAnomalyClick,
  initialSettings = {},
  units = '',
}: AnomalyDetectionProps): React.JSX.Element {
  const [enabled, setEnabled] = useState<boolean>(
    initialSettings.enabled ?? DEFAULT_SETTINGS.enabled
  );
  const [threshold, setThreshold] = useState<number>(
    initialSettings.threshold ?? DEFAULT_SETTINGS.threshold
  );
  const [excludeFromStats, setExcludeFromStats] = useState<boolean>(
    initialSettings.excludeFromStats ?? DEFAULT_SETTINGS.excludeFromStats
  );
  const [expandedAnomalies, setExpandedAnomalies] = useState<boolean>(false);

  // Emit settings changes
  useEffect(() => {
    onSettingsChange({ enabled, threshold, excludeFromStats });
  }, [enabled, threshold, excludeFromStats, onSettingsChange]);

  const handleEnabledToggle = (): void => {
    setEnabled(!enabled);
  };

  const handleThresholdChange = (value: string): void => {
    const num = parseFloat(value);
    if (!isNaN(num) && num > 0) {
      setThreshold(num);
    }
  };

  const handleExcludeToggle = (): void => {
    setExcludeFromStats(!excludeFromStats);
  };

  const handleReset = (): void => {
    setEnabled(false);
    setThreshold(DEFAULT_SETTINGS.threshold);
    setExcludeFromStats(DEFAULT_SETTINGS.excludeFromStats);
  };

  const handleAnomalyItemClick = (index: number): void => {
    if (onAnomalyClick) {
      onAnomalyClick(index);
    }
  };

  const getSeverityClass = (zScore: number): string => {
    const absZ = Math.abs(zScore);
    if (absZ >= 3) return 'severity-high';
    if (absZ >= 2.5) return 'severity-medium';
    return 'severity-low';
  };

  const getSeverityLabel = (zScore: number): string => {
    const absZ = Math.abs(zScore);
    if (absZ >= 3) return 'High';
    if (absZ >= 2.5) return 'Medium';
    return 'Low';
  };

  const formatValue = (value: number): string => {
    return value.toFixed(2) + (units ? ` ${units}` : '');
  };

  return (
    <div className="anomaly-detection">
      <div className="control-header">
        <h4>Anomaly Detection</h4>
        {enabled && (
          <button
            type="button"
            className="reset-button"
            onClick={handleReset}
            title="Reset anomaly detection settings"
          >
            Reset
          </button>
        )}
      </div>

      {/* Enable/Disable Toggle */}
      <div className="anomaly-toggle">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={enabled}
            onChange={handleEnabledToggle}
          />
          <span>Highlight anomalies</span>
        </label>
      </div>

      {/* Threshold Setting */}
      {enabled && (
        <div className="anomaly-settings">
          <div className="setting-group">
            <label htmlFor="threshold">
              Detection Threshold (Standard Deviations)
            </label>
            <input
              type="number"
              id="threshold"
              value={threshold}
              min={0.5}
              max={5}
              step={0.1}
              onChange={(e) => { handleThresholdChange(e.target.value); }}
              className="number-input"
            />
            <small>
              Data points beyond {threshold}σ from the mean are flagged as anomalies
            </small>
          </div>

          <div className="threshold-slider">
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.1}
              value={threshold}
              onChange={(e) => { handleThresholdChange(e.target.value); }}
              className="range-slider"
            />
            <div className="slider-labels">
              <span>More sensitive</span>
              <span>Less sensitive</span>
            </div>
          </div>

          <div className="quick-select">
            <label>Common thresholds:</label>
            <div className="quick-select-buttons">
              <button
                type="button"
                className={`quick-select-button ${threshold === 1.5 ? 'active' : ''}`}
                onClick={() => { setThreshold(1.5); }}
              >
                1.5σ (sensitive)
              </button>
              <button
                type="button"
                className={`quick-select-button ${threshold === 2.0 ? 'active' : ''}`}
                onClick={() => { setThreshold(2.0); }}
              >
                2.0σ (standard)
              </button>
              <button
                type="button"
                className={`quick-select-button ${threshold === 3.0 ? 'active' : ''}`}
                onClick={() => { setThreshold(3.0); }}
              >
                3.0σ (conservative)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exclude from Statistics Option */}
      {enabled && anomalies.length > 0 && (
        <div className="exclude-option">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={excludeFromStats}
              onChange={handleExcludeToggle}
            />
            <span>Exclude anomalies from statistics</span>
          </label>
          {excludeFromStats && (
            <small className="exclude-info">
              Statistics will be recalculated without the {anomalies.length} detected anomal{anomalies.length === 1 ? 'y' : 'ies'}
            </small>
          )}
        </div>
      )}

      {/* Anomaly Count Summary */}
      {enabled && (
        <div className="anomaly-summary">
          <div className={`summary-box ${anomalies.length > 0 ? 'has-anomalies' : ''}`}>
            <strong>Detected Anomalies:</strong>
            <span className="anomaly-count">
              {anomalies.length} / {dataPoints.length} data points
              ({((anomalies.length / dataPoints.length) * 100).toFixed(1)}%)
            </span>
          </div>
        </div>
      )}

      {/* Anomaly List */}
      {enabled && anomalies.length > 0 && (
        <div className="anomaly-list">
          <div className="list-header">
            <strong>Anomaly Details</strong>
            <button
              type="button"
              className="expand-button"
              onClick={() => { setExpandedAnomalies(!expandedAnomalies); }}
            >
              {expandedAnomalies ? 'Collapse' : 'Expand'}
            </button>
          </div>

          {expandedAnomalies && (
            <div className="anomaly-items">
              {anomalies.slice(0, 50).map((anomaly) => (
                <div
                  key={anomaly.index}
                  className={`anomaly-item ${getSeverityClass(anomaly.zScore)}`}
                  onClick={() => { handleAnomalyItemClick(anomaly.index); }}
                  role="button"
                  tabIndex={0}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleAnomalyItemClick(anomaly.index);
                  }}
                >
                  <div className="anomaly-timestamp">
                    {format(anomaly.timestamp, 'MMM dd, yyyy HH:mm')}
                  </div>
                  <div className="anomaly-value">
                    Value: {formatValue(anomaly.value)}
                  </div>
                  <div className="anomaly-zscore">
                    Z-score: {anomaly.zScore.toFixed(2)}σ
                    <span className={`severity-badge ${getSeverityClass(anomaly.zScore)}`}>
                      {getSeverityLabel(anomaly.zScore)}
                    </span>
                  </div>
                </div>
              ))}
              {anomalies.length > 50 && (
                <div className="anomaly-overflow">
                  <small>Showing first 50 of {anomalies.length} anomalies</small>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* No Anomalies Message */}
      {enabled && anomalies.length === 0 && dataPoints.length > 0 && (
        <div className="no-anomalies">
          <small>
            No anomalies detected with current threshold ({threshold}σ).
            Try lowering the threshold to increase sensitivity.
          </small>
        </div>
      )}

      {/* Info when disabled */}
      {!enabled && (
        <div className="anomaly-info">
          <small>
            Anomaly detection uses the standard deviation method to identify unusual data points.
            Enable to highlight outliers on the chart and view detailed information.
          </small>
        </div>
      )}

      {/* Explanation */}
      {enabled && (
        <div className="anomaly-explanation">
          <details>
            <summary>How does it work?</summary>
            <div className="explanation-content">
              <p>
                <strong>Z-Score Method:</strong> Each data point's distance from the mean
                is measured in standard deviations (σ). Points beyond the threshold are
                flagged as anomalies.
              </p>
              <p>
                <strong>Threshold Guidelines:</strong>
              </p>
              <ul>
                <li><strong>1.5σ:</strong> ~13% of normal data flagged (very sensitive)</li>
                <li><strong>2.0σ:</strong> ~5% of normal data flagged (standard)</li>
                <li><strong>3.0σ:</strong> ~0.3% of normal data flagged (conservative)</li>
              </ul>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
