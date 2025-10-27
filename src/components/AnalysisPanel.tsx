import { useState, useEffect, useMemo } from 'react';
import { DateRangeFilter, type DateRange } from './DateRangeFilter';
import { ValueRangeFilter, type ValueRange } from './ValueRangeFilter';
import { MovingAverageControl, type MovingAverageSettings } from './MovingAverageControl';
import { TrendLineControl, type TrendLineSettings } from './TrendLineControl';
import { AggregationControl, type AggregationSettings } from './AggregationControl';
import { AnomalyDetection, type AnomalySettings, type Anomaly } from './AnomalyDetection';
import {
  filterByDateRange,
  filterByValueRange,
  calculateSimpleMovingAverage,
  calculateExponentialMovingAverage,
  calculateLinearTrend,
  aggregateByTimePeriod,
  detectAnomalies,
  type DataPoint,
  type TrendResult,
} from '../utils/analysis';

export interface AnalysisState {
  dateRange: DateRange;
  valueRange: ValueRange;
  movingAverage: MovingAverageSettings;
  trendLine: TrendLineSettings;
  aggregation: AggregationSettings;
  anomaly: AnomalySettings;
}

export interface ProcessedData {
  filteredData: DataPoint[];
  movingAverageData: (number | null)[] | null;
  trendData: TrendResult | null;
  aggregatedData: DataPoint[] | null;
  anomalies: Anomaly[];
}

export interface AnalysisPanelProps {
  rawData: DataPoint[]; // Original data from NetCDF file
  onAnalysisChange: (state: AnalysisState, processed: ProcessedData) => void;
  variableName?: string;
  units?: string;
}

export function AnalysisPanel({
  rawData,
  onAnalysisChange,
  variableName: _variableName = '',
  units = '',
}: AnalysisPanelProps): React.JSX.Element {
  // Analysis state
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: null, endDate: null });
  const [valueRange, setValueRange] = useState<ValueRange>({
    min: null,
    max: null,
    excludeOutliers: false,
  });
  const [movingAverage, setMovingAverage] = useState<MovingAverageSettings>({
    type: 'none',
    windowSize: 7,
    alpha: 0.3,
    visible: true,
  });
  const [trendLine, setTrendLine] = useState<TrendLineSettings>({
    enabled: false,
    trendData: null,
  });
  const [aggregation, setAggregation] = useState<AggregationSettings>({
    enabled: false,
    period: 'daily',
    func: 'mean',
  });
  const [anomaly, setAnomaly] = useState<AnomalySettings>({
    enabled: false,
    threshold: 2.0,
    excludeFromStats: false,
  });

  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Compute data bounds
  const dataBounds = useMemo(() => {
    if (rawData.length === 0) {
      return {
        minDate: new Date(),
        maxDate: new Date(),
        minValue: 0,
        maxValue: 0,
        values: [],
      };
    }

    const timestamps = rawData.map(d => d.timestamp);
    const values = rawData.map(d => d.value);

    return {
      minDate: new Date(Math.min(...timestamps)),
      maxDate: new Date(Math.max(...timestamps)),
      minValue: Math.min(...values),
      maxValue: Math.max(...values),
      values,
    };
  }, [rawData]);

  // Process data based on all analysis settings
  const processedData = useMemo((): ProcessedData => {
    if (rawData.length === 0) {
      return {
        filteredData: [],
        movingAverageData: null,
        trendData: null,
        aggregatedData: null,
        anomalies: [],
      };
    }

    // Step 1: Apply date range filter
    let filtered = dateRange.startDate != null || dateRange.endDate != null
      ? filterByDateRange(rawData, dateRange.startDate ?? undefined, dateRange.endDate ?? undefined)
      : [...rawData];

    // Step 2: Apply value range filter
    if (valueRange.min !== null || valueRange.max !== null) {
      filtered = filterByValueRange(filtered, valueRange.min ?? undefined, valueRange.max ?? undefined);
    }

    // Step 3: Apply aggregation if enabled
    let dataForAnalysis = filtered;
    let aggregatedData: DataPoint[] | null = null;

    if (aggregation.enabled && filtered.length > 0) {
      aggregatedData = aggregateByTimePeriod(filtered, aggregation.period, aggregation.func);
      dataForAnalysis = aggregatedData;
    }

    // Step 4: Calculate moving average
    let movingAverageData: (number | null)[] | null = null;

    if (movingAverage.type !== 'none' && movingAverage.visible && dataForAnalysis.length > 0) {
      const values = dataForAnalysis.map(d => d.value);

      if (movingAverage.type === 'sma') {
        movingAverageData = calculateSimpleMovingAverage(values, movingAverage.windowSize);
      } else if (movingAverage.type === 'ema') {
        movingAverageData = calculateExponentialMovingAverage(values, movingAverage.alpha);
      }
    }

    // Step 5: Calculate trend line
    let trendData: TrendResult | null = null;

    if (trendLine.enabled && dataForAnalysis.length >= 2) {
      const x = dataForAnalysis.map(d => d.timestamp);
      const y = dataForAnalysis.map(d => d.value);
      trendData = calculateLinearTrend(x, y);
    }

    // Step 6: Detect anomalies
    let anomalies: Anomaly[] = [];

    if (anomaly.enabled && dataForAnalysis.length > 0) {
      const values = dataForAnalysis.map(d => d.value);
      const indices = detectAnomalies(values, anomaly.threshold);

      // Calculate z-scores for anomalies
      const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
      const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
      const stdDev = Math.sqrt(variance);

      anomalies = indices.map(index => {
        const point = dataForAnalysis[index];
        if (point == null) return null;
        return {
          index,
          timestamp: point.timestamp,
          value: point.value,
          zScore: (point.value - mean) / stdDev,
        };
      }).filter((a): a is NonNullable<typeof a> => a !== null);
    }

    return {
      filteredData: filtered,
      movingAverageData,
      trendData,
      aggregatedData,
      anomalies,
    };
  }, [rawData, dateRange, valueRange, movingAverage, trendLine, aggregation, anomaly]);

  // Emit analysis changes to parent
  useEffect(() => {
    const state: AnalysisState = {
      dateRange,
      valueRange,
      movingAverage,
      trendLine: { ...trendLine, trendData: processedData.trendData },
      aggregation,
      anomaly,
    };

    onAnalysisChange(state, processedData);
  }, [dateRange, valueRange, movingAverage, trendLine, aggregation, anomaly, processedData, onAnalysisChange]);

  const handleResetAll = (): void => {
    setDateRange({ startDate: null, endDate: null });
    setValueRange({ min: null, max: null, excludeOutliers: false });
    setMovingAverage({ type: 'none', windowSize: 7, alpha: 0.3, visible: true });
    setTrendLine({ enabled: false, trendData: null });
    setAggregation({ enabled: false, period: 'daily', func: 'mean' });
    setAnomaly({ enabled: false, threshold: 2.0, excludeFromStats: false });
  };

  const hasActiveFiltersOrAnalysis =
    dateRange.startDate !== null ||
    dateRange.endDate !== null ||
    valueRange.min !== null ||
    valueRange.max !== null ||
    valueRange.excludeOutliers ||
    movingAverage.type !== 'none' ||
    trendLine.enabled ||
    aggregation.enabled ||
    anomaly.enabled;

  return (
    <div className="analysis-panel">
      <div className="panel-header">
        <h3>Analysis & Filters</h3>
        <div className="panel-actions">
          {hasActiveFiltersOrAnalysis && (
            <button
              type="button"
              className="reset-all-button"
              onClick={handleResetAll}
              title="Reset all filters and analysis settings"
            >
              Reset All
            </button>
          )}
          <button
            type="button"
            className="collapse-button"
            onClick={() => { setIsExpanded(!isExpanded); }}
            title={isExpanded ? 'Collapse panel' : 'Expand panel'}
          >
            {isExpanded ? '▼' : '▲'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="panel-content">
          {/* Active Filters Summary */}
          {hasActiveFiltersOrAnalysis && (
            <div className="active-summary">
              <strong>Active:</strong>
              <div className="summary-tags">
                {dateRange.startDate != null || dateRange.endDate != null ? (
                  <span className="tag">Date Filter</span>
                ) : null}
                {valueRange.min !== null || valueRange.max !== null || valueRange.excludeOutliers ? (
                  <span className="tag">Value Filter</span>
                ) : null}
                {movingAverage.type !== 'none' ? (
                  <span className="tag">Moving Average</span>
                ) : null}
                {trendLine.enabled ? (
                  <span className="tag">Trend Line</span>
                ) : null}
                {aggregation.enabled ? (
                  <span className="tag">Aggregation</span>
                ) : null}
                {anomaly.enabled ? (
                  <span className="tag">Anomaly Detection</span>
                ) : null}
              </div>
            </div>
          )}

          {/* Data Count Info */}
          <div className="data-count-info">
            <div className="count-item">
              <span className="count-label">Total Data Points:</span>
              <span className="count-value">{rawData.length}</span>
            </div>
            {processedData.filteredData.length !== rawData.length && (
              <div className="count-item">
                <span className="count-label">Filtered:</span>
                <span className="count-value filtered">{processedData.filteredData.length}</span>
              </div>
            )}
            {processedData.aggregatedData != null && (
              <div className="count-item">
                <span className="count-label">Aggregated Periods:</span>
                <span className="count-value">{processedData.aggregatedData.length}</span>
              </div>
            )}
          </div>

          {/* Filters Section */}
          <section className="filter-section">
            <h4 className="section-title">Filters</h4>

            <DateRangeFilter
              minDate={dataBounds.minDate}
              maxDate={dataBounds.maxDate}
              onFilterChange={setDateRange}
              initialRange={dateRange}
            />

            <ValueRangeFilter
              dataMin={dataBounds.minValue}
              dataMax={dataBounds.maxValue}
              allValues={dataBounds.values}
              onFilterChange={setValueRange}
              initialRange={valueRange}
              units={units}
            />
          </section>

          {/* Analysis Section */}
          <section className="analysis-section">
            <h4 className="section-title">Analysis Tools</h4>

            <MovingAverageControl
              onSettingsChange={setMovingAverage}
              initialSettings={movingAverage}
              maxDataPoints={processedData.filteredData.length}
            />

            <TrendLineControl
              onSettingsChange={(settings) => {
                setTrendLine(settings);
              }}
              trendData={processedData.trendData}
              initialEnabled={trendLine.enabled}
            />

            <AggregationControl
              onSettingsChange={setAggregation}
              initialSettings={aggregation}
            />

            <AnomalyDetection
              anomalies={processedData.anomalies}
              dataPoints={processedData.aggregatedData ?? processedData.filteredData}
              onSettingsChange={setAnomaly}
              initialSettings={anomaly}
              units={units}
            />
          </section>
        </div>
      )}
    </div>
  );
}
