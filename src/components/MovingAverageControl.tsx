import { useState, useEffect } from 'react';

export type MovingAverageType = 'none' | 'sma' | 'ema';

export interface MovingAverageSettings {
  type: MovingAverageType;
  windowSize: number; // For SMA
  alpha: number; // For EMA (0 < alpha <= 1)
  visible: boolean;
}

export interface MovingAverageControlProps {
  onSettingsChange: (settings: MovingAverageSettings) => void;
  initialSettings?: MovingAverageSettings;
  maxDataPoints?: number; // To suggest reasonable window sizes
}

const DEFAULT_SETTINGS: MovingAverageSettings = {
  type: 'none',
  windowSize: 7,
  alpha: 0.3,
  visible: true,
};

export function MovingAverageControl({
  onSettingsChange,
  initialSettings = DEFAULT_SETTINGS,
  maxDataPoints = 1000,
}: MovingAverageControlProps): React.JSX.Element {
  const [type, setType] = useState<MovingAverageType>(initialSettings.type);
  const [windowSize, setWindowSize] = useState<number>(initialSettings.windowSize);
  const [alpha, setAlpha] = useState<number>(initialSettings.alpha);
  const [visible, setVisible] = useState<boolean>(initialSettings.visible);

  // Emit settings changes
  useEffect(() => {
    onSettingsChange({ type, windowSize, alpha, visible });
  }, [type, windowSize, alpha, visible, onSettingsChange]);

  const handleTypeChange = (newType: MovingAverageType): void => {
    setType(newType);
    // Auto-enable visibility when a type is selected
    if (newType !== 'none') {
      setVisible(true);
    }
  };

  const handleWindowSizeChange = (value: string): void => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num > 0) {
      setWindowSize(num);
    }
  };

  const handleAlphaChange = (value: string): void => {
    const num = parseFloat(value);
    if (!isNaN(num) && num > 0 && num <= 1) {
      setAlpha(num);
    }
  };

  const handleVisibilityToggle = (): void => {
    setVisible(!visible);
  };

  const handleReset = (): void => {
    setType('none');
    setWindowSize(DEFAULT_SETTINGS.windowSize);
    setAlpha(DEFAULT_SETTINGS.alpha);
    setVisible(DEFAULT_SETTINGS.visible);
  };

  // Suggest reasonable window sizes based on data length
  const suggestedWindowSizes = [
    { label: '7 (week)', value: 7 },
    { label: '30 (month)', value: 30 },
    { label: '90 (quarter)', value: 90 },
    { label: String(Math.max(1, Math.floor(maxDataPoints / 20))), value: Math.max(1, Math.floor(maxDataPoints / 20)), displayLabel: '5% of data' },
    { label: String(Math.max(1, Math.floor(maxDataPoints / 10))), value: Math.max(1, Math.floor(maxDataPoints / 10)), displayLabel: '10% of data' },
  ].filter(item => (item.value ?? 0) <= maxDataPoints);

  return (
    <div className="moving-average-control">
      <div className="control-header">
        <h4>Moving Average</h4>
        {type !== 'none' && (
          <button
            type="button"
            className="reset-button"
            onClick={handleReset}
            title="Reset moving average settings"
          >
            Reset
          </button>
        )}
      </div>

      {/* Type Selector */}
      <div className="ma-type-selector">
        <label>Type</label>
        <div className="radio-group">
          <label className="radio-label">
            <input
              type="radio"
              name="ma-type"
              value="none"
              checked={type === 'none'}
              onChange={() => { handleTypeChange('none'); }}
            />
            <span>None</span>
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name="ma-type"
              value="sma"
              checked={type === 'sma'}
              onChange={() => { handleTypeChange('sma'); }}
            />
            <span>Simple (SMA)</span>
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name="ma-type"
              value="ema"
              checked={type === 'ema'}
              onChange={() => { handleTypeChange('ema'); }}
            />
            <span>Exponential (EMA)</span>
          </label>
        </div>
      </div>

      {/* SMA Settings */}
      {type === 'sma' && (
        <div className="ma-settings">
          <div className="setting-group">
            <label htmlFor="window-size">Window Size</label>
            <input
              type="number"
              id="window-size"
              value={windowSize}
              min={1}
              max={maxDataPoints}
              onChange={(e) => { handleWindowSizeChange(e.target.value); }}
              className="number-input"
            />
            <small>Number of data points to average</small>
          </div>

          {suggestedWindowSizes.length > 0 && (
            <div className="quick-select">
              <label>Quick select:</label>
              <div className="quick-select-buttons">
                {suggestedWindowSizes.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    className={`quick-select-button ${windowSize === item.value ? 'active' : ''}`}
                    onClick={() => { setWindowSize(item.value ?? 7); }}
                  >
                    {item.displayLabel ?? item.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* EMA Settings */}
      {type === 'ema' && (
        <div className="ma-settings">
          <div className="setting-group">
            <label htmlFor="alpha">Smoothing Factor (α)</label>
            <input
              type="number"
              id="alpha"
              value={alpha}
              min={0.01}
              max={1}
              step={0.01}
              onChange={(e) => { handleAlphaChange(e.target.value); }}
              className="number-input"
            />
            <small>Higher values (closer to 1) are more responsive to recent changes</small>
          </div>

          <div className="alpha-slider">
            <input
              type="range"
              min={0.01}
              max={1}
              step={0.01}
              value={alpha}
              onChange={(e) => { handleAlphaChange(e.target.value); }}
              className="range-slider"
            />
            <div className="slider-labels">
              <span>More smoothing</span>
              <span>Less smoothing</span>
            </div>
          </div>

          <div className="quick-select">
            <label>Quick select:</label>
            <div className="quick-select-buttons">
              <button
                type="button"
                className={`quick-select-button ${alpha === 0.1 ? 'active' : ''}`}
                onClick={() => { setAlpha(0.1); }}
              >
                0.1 (slow)
              </button>
              <button
                type="button"
                className={`quick-select-button ${alpha === 0.3 ? 'active' : ''}`}
                onClick={() => { setAlpha(0.3); }}
              >
                0.3 (medium)
              </button>
              <button
                type="button"
                className={`quick-select-button ${alpha === 0.7 ? 'active' : ''}`}
                onClick={() => { setAlpha(0.7); }}
              >
                0.7 (fast)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Visibility Toggle */}
      {type !== 'none' && (
        <div className="visibility-toggle">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={visible}
              onChange={handleVisibilityToggle}
            />
            <span>Show moving average on chart</span>
          </label>
        </div>
      )}

      {/* Info */}
      {type !== 'none' && visible && (
        <div className="ma-info">
          <small>
            {type === 'sma' && `Computing ${windowSize}-point simple moving average`}
            {type === 'ema' && `Computing exponential moving average with α=${alpha}`}
          </small>
        </div>
      )}
    </div>
  );
}
