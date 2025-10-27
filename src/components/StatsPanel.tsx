import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { VariableDataResponse, Variable } from '../types/netcdf';
import { isNumericData } from '../types/netcdf';

interface StatsPanelProps {
  filePath: string;
  variable: Variable;
}

interface Statistics {
  count: number;
  missing: number;
  min: number;
  max: number;
  mean: number;
  median: number;
  stdDev: number;
  p25: number;
  p75: number;
}

function calculateStatistics(values: number[]): Statistics {
  const validValues = values.filter((v) => !isNaN(v) && isFinite(v));
  const count = validValues.length;
  const missing = values.length - count;

  if (count === 0) {
    return {
      count: 0,
      missing,
      min: NaN,
      max: NaN,
      mean: NaN,
      median: NaN,
      stdDev: NaN,
      p25: NaN,
      p75: NaN,
    };
  }

  // Sort for percentile calculations
  const sorted = [...validValues].sort((a, b) => a - b);

  const min = sorted[0] ?? NaN;
  const max = sorted[sorted.length - 1] ?? NaN;
  const mean = validValues.reduce((sum, v) => sum + v, 0) / count;

  // Median
  const midIndex = Math.floor(count / 2);
  const median =
    count % 2 === 0
      ? ((sorted[midIndex - 1] ?? 0) + (sorted[midIndex] ?? 0)) / 2
      : sorted[midIndex] ?? NaN;

  // Standard deviation
  const variance = validValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / count;
  const stdDev = Math.sqrt(variance);

  // Percentiles
  const p25Index = Math.floor(count * 0.25);
  const p75Index = Math.floor(count * 0.75);
  const p25 = sorted[p25Index] ?? NaN;
  const p75 = sorted[p75Index] ?? NaN;

  return { count, missing, min, max, mean, median, stdDev, p25, p75 };
}

export function StatsPanel({ filePath, variable }: StatsPanelProps): React.JSX.Element {
  const [data, setData] = useState<VariableDataResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Statistics | null>(null);

  useEffect(() => {
    const loadData = async (): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        const response = await invoke<VariableDataResponse>('get_variable_data', {
          path: filePath,
          varName: variable.name,
        });
        setData(response);

        // Calculate statistics only for numeric data
        if (isNumericData(response.values)) {
          const calculatedStats = calculateStatistics(response.values.data);
          setStats(calculatedStats);
        } else {
          setError('Statistics are only available for numeric variables');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [filePath, variable.name]);

  if (loading) {
    return <div className="loading">Calculating statistics...</div>;
  }

  if (error !== null) {
    return <div className="error">Error loading data: {error}</div>;
  }

  if (stats === null || data === null) {
    return <div className="no-data">No statistics available</div>;
  }

  const units = variable.attributes['units'] ?? variable.attributes['unit'] ?? '';
  const formatValue = (value: number): string => {
    if (isNaN(value) || !isFinite(value)) return 'N/A';
    return value.toFixed(4);
  };

  return (
    <div className="stats-panel">
      <h3>Statistics</h3>

      <div className="stats-grid">
        <div className="stat-item">
          <span className="stat-label">Count:</span>
          <span className="stat-value">{stats.count.toLocaleString()}</span>
        </div>

        {stats.missing > 0 && (
          <div className="stat-item">
            <span className="stat-label">Missing:</span>
            <span className="stat-value missing">{stats.missing.toLocaleString()}</span>
          </div>
        )}

        <div className="stat-item">
          <span className="stat-label">Min:</span>
          <span className="stat-value">
            {formatValue(stats.min)}
            {units !== '' && ` ${units}`}
          </span>
        </div>

        <div className="stat-item">
          <span className="stat-label">Max:</span>
          <span className="stat-value">
            {formatValue(stats.max)}
            {units !== '' && ` ${units}`}
          </span>
        </div>

        <div className="stat-item">
          <span className="stat-label">Mean:</span>
          <span className="stat-value">
            {formatValue(stats.mean)}
            {units !== '' && ` ${units}`}
          </span>
        </div>

        <div className="stat-item">
          <span className="stat-label">Median:</span>
          <span className="stat-value">
            {formatValue(stats.median)}
            {units !== '' && ` ${units}`}
          </span>
        </div>

        <div className="stat-item">
          <span className="stat-label">Std Dev:</span>
          <span className="stat-value">
            {formatValue(stats.stdDev)}
            {units !== '' && ` ${units}`}
          </span>
        </div>

        <div className="stat-item">
          <span className="stat-label">25th Percentile:</span>
          <span className="stat-value">
            {formatValue(stats.p25)}
            {units !== '' && ` ${units}`}
          </span>
        </div>

        <div className="stat-item">
          <span className="stat-label">75th Percentile:</span>
          <span className="stat-value">
            {formatValue(stats.p75)}
            {units !== '' && ` ${units}`}
          </span>
        </div>
      </div>

      {stats.count > 0 && (
        <div className="stats-summary">
          <p>Range: {formatValue(stats.max - stats.min)}</p>
          <p>IQR: {formatValue(stats.p75 - stats.p25)}</p>
        </div>
      )}
    </div>
  );
}
