import { useState, useEffect } from 'react';
import type { TrendResult } from '../utils/analysis';

export interface TrendLineSettings {
  enabled: boolean;
  trendData: TrendResult | null;
}

export interface TrendLineControlProps {
  onSettingsChange: (settings: TrendLineSettings) => void;
  trendData: TrendResult | null; // Computed trend from parent
  initialEnabled?: boolean;
}

export function TrendLineControl({
  onSettingsChange,
  trendData,
  initialEnabled = false,
}: TrendLineControlProps): React.JSX.Element {
  const [enabled, setEnabled] = useState<boolean>(initialEnabled);

  // Emit settings changes
  useEffect(() => {
    onSettingsChange({ enabled, trendData });
  }, [enabled, trendData, onSettingsChange]);

  const handleToggle = (): void => {
    setEnabled(!enabled);
  };

  const formatEquation = (trend: TrendResult): string => {
    const { slope, intercept } = trend;
    const slopeStr = slope.toExponential(3);
    const interceptStr = intercept.toFixed(2);
    const sign = intercept >= 0 ? '+' : '-';

    return `y = ${slopeStr}x ${sign} ${Math.abs(parseFloat(interceptStr))}`;
  };

  const formatR2 = (r2: number): string => {
    return r2.toFixed(4);
  };

  const interpretR2 = (r2: number): string => {
    if (r2 >= 0.9) return 'Very strong fit';
    if (r2 >= 0.7) return 'Strong fit';
    if (r2 >= 0.5) return 'Moderate fit';
    if (r2 >= 0.3) return 'Weak fit';
    return 'Very weak fit';
  };

  const getTrendDirection = (slope: number): string => {
    if (Math.abs(slope) < 1e-10) return 'No trend (flat)';
    return slope > 0 ? 'Increasing trend' : 'Decreasing trend';
  };

  return (
    <div className="trend-line-control">
      <div className="control-header">
        <h4>Trend Line</h4>
      </div>

      {/* Enable/Disable Toggle */}
      <div className="trend-toggle">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={enabled}
            onChange={handleToggle}
          />
          <span>Show linear trend line</span>
        </label>
      </div>

      {/* Trend Information */}
      {enabled && trendData && (
        <div className="trend-info">
          <div className="trend-equation">
            <strong>Equation:</strong>
            <code>{formatEquation(trendData)}</code>
          </div>

          <div className="trend-r2">
            <strong>R² Value:</strong>
            <span className="r2-value">{formatR2(trendData.r2)}</span>
            <small className="r2-interpretation">
              ({interpretR2(trendData.r2)})
            </small>
          </div>

          <div className="trend-direction">
            <strong>Direction:</strong>
            <span className={`direction ${trendData.slope > 0 ? 'increasing' : 'decreasing'}`}>
              {getTrendDirection(trendData.slope)}
            </span>
          </div>

          <div className="trend-slope">
            <strong>Slope:</strong>
            <code>{trendData.slope.toExponential(4)}</code>
            <small>
              {trendData.slope > 0 ? 'Positive' : 'Negative'} rate of change
            </small>
          </div>

          <div className="trend-intercept">
            <strong>Intercept:</strong>
            <code>{trendData.intercept.toFixed(4)}</code>
          </div>

          {/* Explanation */}
          <div className="trend-explanation">
            <details>
              <summary>What does this mean?</summary>
              <div className="explanation-content">
                <p>
                  <strong>Linear Regression:</strong> The trend line is computed using
                  the least squares method to find the best-fit straight line through the data.
                </p>
                <p>
                  <strong>R² Value:</strong> Indicates how well the trend line fits the data.
                  A value of 1.0 means perfect fit, while 0.0 means no correlation.
                </p>
                <p>
                  <strong>Slope:</strong> The rate of change. A positive slope indicates
                  an increasing trend, while a negative slope indicates a decreasing trend.
                </p>
              </div>
            </details>
          </div>
        </div>
      )}

      {/* No Data Warning */}
      {enabled && !trendData && (
        <div className="trend-warning">
          <small>
            Insufficient data to compute trend line. Please ensure you have at least 2 data points.
          </small>
        </div>
      )}

      {/* Info when disabled */}
      {!enabled && (
        <div className="trend-disabled-info">
          <small>
            Enable to overlay a linear regression trend line on the chart.
            The trend line helps identify overall patterns and direction in the data.
          </small>
        </div>
      )}
    </div>
  );
}
