import { useState, useEffect } from 'react';
import { calculateIQR } from '../utils/analysis';

export interface ValueRange {
  min: number | null;
  max: number | null;
  excludeOutliers: boolean;
}

export interface ValueRangeFilterProps {
  dataMin: number;
  dataMax: number;
  allValues: number[]; // For outlier detection
  onFilterChange: (range: ValueRange) => void;
  initialRange?: ValueRange;
  units?: string;
}

export function ValueRangeFilter({
  dataMin,
  dataMax,
  allValues,
  onFilterChange,
  initialRange,
  units = '',
}: ValueRangeFilterProps): React.JSX.Element {
  const [minValue, setMinValue] = useState<string>(
    initialRange?.min?.toString() ?? ''
  );
  const [maxValue, setMaxValue] = useState<string>(
    initialRange?.max?.toString() ?? ''
  );
  const [excludeOutliers, setExcludeOutliers] = useState<boolean>(
    initialRange?.excludeOutliers ?? false
  );
  const [sliderMin, setSliderMin] = useState<number>(dataMin);
  const [sliderMax, setSliderMax] = useState<number>(dataMax);
  const [validationError, setValidationError] = useState<string>('');
  const [iqrInfo, setIqrInfo] = useState<{
    lowerBound: number;
    upperBound: number;
    outlierCount: number;
  } | null>(null);

  // Calculate IQR on mount
  useEffect(() => {
    if (allValues.length > 0) {
      const iqr = calculateIQR(allValues);
      setIqrInfo({
        lowerBound: iqr.lowerBound,
        upperBound: iqr.upperBound,
        outlierCount: iqr.outlierIndices.length,
      });
    }
  }, [allValues]);

  // Apply filter when values change
  useEffect(() => {
    const min = minValue ? parseFloat(minValue) : null;
    const max = maxValue ? parseFloat(maxValue) : null;

    // Validation
    if (min !== null && max !== null && min > max) {
      setValidationError('Minimum value must be less than or equal to maximum value');
      return;
    }

    setValidationError('');

    // Emit filter change
    const range: ValueRange = {
      min: excludeOutliers && iqrInfo ? Math.max(min ?? iqrInfo.lowerBound, iqrInfo.lowerBound) : min,
      max: excludeOutliers && iqrInfo ? Math.min(max ?? iqrInfo.upperBound, iqrInfo.upperBound) : max,
      excludeOutliers,
    };

    onFilterChange(range);
  }, [minValue, maxValue, excludeOutliers, iqrInfo, onFilterChange]);

  const handleMinInputChange = (value: string): void => {
    setMinValue(value);
    if (value) {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        setSliderMin(num);
      }
    }
  };

  const handleMaxInputChange = (value: string): void => {
    setMaxValue(value);
    if (value) {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        setSliderMax(num);
      }
    }
  };

  const handleSliderMinChange = (value: string): void => {
    const num = parseFloat(value);
    setSliderMin(num);
    setMinValue(num.toFixed(2));
  };

  const handleSliderMaxChange = (value: string): void => {
    const num = parseFloat(value);
    setSliderMax(num);
    setMaxValue(num.toFixed(2));
  };

  const handleExcludeOutliersChange = (checked: boolean): void => {
    setExcludeOutliers(checked);
    if (checked && iqrInfo) {
      // Set bounds to IQR bounds
      setMinValue(iqrInfo.lowerBound.toFixed(2));
      setMaxValue(iqrInfo.upperBound.toFixed(2));
      setSliderMin(iqrInfo.lowerBound);
      setSliderMax(iqrInfo.upperBound);
    }
  };

  const handleClearFilter = (): void => {
    setMinValue('');
    setMaxValue('');
    setExcludeOutliers(false);
    setSliderMin(dataMin);
    setSliderMax(dataMax);
    setValidationError('');
  };

  const formatValue = (value: number): string => {
    return value.toFixed(2) + (units ? ` ${units}` : '');
  };

  return (
    <div className="value-range-filter">
      <div className="filter-header">
        <h4>Value Range Filter</h4>
        {(minValue || maxValue || excludeOutliers) && (
          <button
            type="button"
            className="clear-filter-button"
            onClick={handleClearFilter}
            title="Clear value range filter"
          >
            Clear
          </button>
        )}
      </div>

      <div className="value-bounds-info">
        <small>
          Data range: {formatValue(dataMin)} - {formatValue(dataMax)}
        </small>
      </div>

      {/* Min/Max Input Fields */}
      <div className="value-inputs">
        <div className="value-input-group">
          <label htmlFor="min-value">Minimum</label>
          <input
            type="number"
            id="min-value"
            value={minValue}
            step="any"
            placeholder={dataMin.toFixed(2)}
            onChange={(e) => { handleMinInputChange(e.target.value); }}
            className="value-input"
            disabled={excludeOutliers}
          />
          {units && <span className="value-unit">{units}</span>}
        </div>

        <div className="value-input-group">
          <label htmlFor="max-value">Maximum</label>
          <input
            type="number"
            id="max-value"
            value={maxValue}
            step="any"
            placeholder={dataMax.toFixed(2)}
            onChange={(e) => { handleMaxInputChange(e.target.value); }}
            className="value-input"
            disabled={excludeOutliers}
          />
          {units && <span className="value-unit">{units}</span>}
        </div>
      </div>

      {/* Range Sliders */}
      <div className="range-sliders">
        <div className="slider-group">
          <label htmlFor="min-slider">
            Min: {sliderMin.toFixed(2)} {units}
          </label>
          <input
            type="range"
            id="min-slider"
            min={dataMin}
            max={dataMax}
            step={(dataMax - dataMin) / 1000}
            value={sliderMin}
            onChange={(e) => { handleSliderMinChange(e.target.value); }}
            className="range-slider"
            disabled={excludeOutliers}
          />
        </div>

        <div className="slider-group">
          <label htmlFor="max-slider">
            Max: {sliderMax.toFixed(2)} {units}
          </label>
          <input
            type="range"
            id="max-slider"
            min={dataMin}
            max={dataMax}
            step={(dataMax - dataMin) / 1000}
            value={sliderMax}
            onChange={(e) => { handleSliderMaxChange(e.target.value); }}
            className="range-slider"
            disabled={excludeOutliers}
          />
        </div>
      </div>

      {/* Outlier Detection */}
      {iqrInfo && (
        <div className="outlier-detection">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={excludeOutliers}
              onChange={(e) => { handleExcludeOutliersChange(e.target.checked); }}
            />
            <span>Exclude Outliers (IQR method)</span>
          </label>
          {excludeOutliers && (
            <div className="outlier-info">
              <small>
                Excluded {iqrInfo.outlierCount} outlier{iqrInfo.outlierCount !== 1 ? 's' : ''}{' '}
                (values outside {formatValue(iqrInfo.lowerBound)} -{' '}
                {formatValue(iqrInfo.upperBound)})
              </small>
            </div>
          )}
        </div>
      )}

      {validationError && (
        <div className="validation-error" role="alert">
          {validationError}
        </div>
      )}

      {(minValue || maxValue) && !validationError && !excludeOutliers && (
        <div className="filter-status">
          <small>
            Showing: {minValue || 'Min'} - {maxValue || 'Max'} {units}
          </small>
        </div>
      )}
    </div>
  );
}
