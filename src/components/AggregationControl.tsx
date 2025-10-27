import { useState, useEffect } from 'react';
import type { AggregationPeriod, AggregationFunction } from '../utils/analysis';

export interface AggregationSettings {
  enabled: boolean;
  period: AggregationPeriod;
  func: AggregationFunction;
}

export interface AggregationControlProps {
  onSettingsChange: (settings: AggregationSettings) => void;
  initialSettings?: Partial<AggregationSettings>;
}

const DEFAULT_SETTINGS: AggregationSettings = {
  enabled: false,
  period: 'daily',
  func: 'mean',
};

export function AggregationControl({
  onSettingsChange,
  initialSettings = {},
}: AggregationControlProps): React.JSX.Element {
  const [enabled, setEnabled] = useState<boolean>(
    initialSettings.enabled ?? DEFAULT_SETTINGS.enabled
  );
  const [period, setPeriod] = useState<AggregationPeriod>(
    initialSettings.period ?? DEFAULT_SETTINGS.period
  );
  const [func, setFunc] = useState<AggregationFunction>(
    initialSettings.func ?? DEFAULT_SETTINGS.func
  );

  // Emit settings changes
  useEffect(() => {
    onSettingsChange({ enabled, period, func });
  }, [enabled, period, func, onSettingsChange]);

  const handleEnabledToggle = (): void => {
    setEnabled(!enabled);
  };

  const handlePeriodChange = (newPeriod: AggregationPeriod): void => {
    setPeriod(newPeriod);
    if (!enabled) {
      setEnabled(true);
    }
  };

  const handleFuncChange = (newFunc: AggregationFunction): void => {
    setFunc(newFunc);
    if (!enabled) {
      setEnabled(true);
    }
  };

  const handleReset = (): void => {
    setEnabled(false);
    setPeriod(DEFAULT_SETTINGS.period);
    setFunc(DEFAULT_SETTINGS.func);
  };

  const getPeriodLabel = (p: AggregationPeriod): string => {
    const labels: Record<AggregationPeriod, string> = {
      hourly: 'Hourly',
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      yearly: 'Yearly',
    };
    return labels[p];
  };

  const getFunctionLabel = (f: AggregationFunction): string => {
    const labels: Record<AggregationFunction, string> = {
      mean: 'Mean (Average)',
      median: 'Median',
      sum: 'Sum',
      min: 'Minimum',
      max: 'Maximum',
      count: 'Count',
    };
    return labels[f];
  };

  const getFunctionDescription = (f: AggregationFunction): string => {
    const descriptions: Record<AggregationFunction, string> = {
      mean: 'Average value for each period',
      median: 'Middle value for each period',
      sum: 'Total of all values in each period',
      min: 'Lowest value in each period',
      max: 'Highest value in each period',
      count: 'Number of data points in each period',
    };
    return descriptions[f];
  };

  return (
    <div className="aggregation-control">
      <div className="control-header">
        <h4>Temporal Aggregation</h4>
        {enabled && (
          <button
            type="button"
            className="reset-button"
            onClick={handleReset}
            title="Reset aggregation settings"
          >
            Reset
          </button>
        )}
      </div>

      {/* Enable/Disable Toggle */}
      <div className="aggregation-toggle">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={enabled}
            onChange={handleEnabledToggle}
          />
          <span>Enable temporal aggregation</span>
        </label>
      </div>

      {/* Period Selector */}
      <div className="aggregation-period">
        <label>Aggregation Period</label>
        <div className="button-group">
          {(['hourly', 'daily', 'weekly', 'monthly', 'yearly'] as AggregationPeriod[]).map((p) => (
            <button
              key={p}
              type="button"
              className={`period-button ${period === p ? 'active' : ''} ${!enabled ? 'disabled' : ''}`}
              onClick={() => { handlePeriodChange(p); }}
              disabled={!enabled}
            >
              {getPeriodLabel(p)}
            </button>
          ))}
        </div>
      </div>

      {/* Function Selector */}
      <div className="aggregation-function">
        <label htmlFor="agg-function">Aggregation Function</label>
        <select
          id="agg-function"
          value={func}
          onChange={(e) => { handleFuncChange(e.target.value as AggregationFunction); }}
          disabled={!enabled}
          className="function-select"
        >
          {(['mean', 'median', 'sum', 'min', 'max', 'count'] as AggregationFunction[]).map((f) => (
            <option key={f} value={f}>
              {getFunctionLabel(f)}
            </option>
          ))}
        </select>
        {enabled && (
          <small className="function-description">
            {getFunctionDescription(func)}
          </small>
        )}
      </div>

      {/* Summary */}
      {enabled && (
        <div className="aggregation-summary">
          <div className="summary-box">
            <strong>Active Aggregation:</strong>
            <p>
              Computing <strong>{func}</strong> for each <strong>{period}</strong> period
            </p>
          </div>
        </div>
      )}

      {/* Info when disabled */}
      {!enabled && (
        <div className="aggregation-info">
          <small>
            Temporal aggregation groups data by time period (hourly, daily, weekly, etc.)
            and computes a summary statistic for each period. This is useful for
            reducing noise and identifying longer-term trends.
          </small>
        </div>
      )}

      {/* Examples */}
      {enabled && (
        <div className="aggregation-examples">
          <details>
            <summary>Examples</summary>
            <div className="examples-content">
              <ul>
                <li>
                  <strong>Daily Mean:</strong> Average value for each day
                </li>
                <li>
                  <strong>Weekly Max:</strong> Highest value each week
                </li>
                <li>
                  <strong>Monthly Sum:</strong> Total of all values each month
                </li>
                <li>
                  <strong>Yearly Count:</strong> Number of data points each year
                </li>
              </ul>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
