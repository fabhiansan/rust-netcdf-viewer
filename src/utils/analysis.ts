/**
 * Analysis utilities for time-series data processing
 * Implements moving averages, trend analysis, aggregation, and anomaly detection
 */

export interface DataPoint {
  timestamp: number; // Unix timestamp in milliseconds
  value: number;
}

export interface TrendResult {
  slope: number;
  intercept: number;
  r2: number; // R-squared value (coefficient of determination)
}

export type AggregationPeriod = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly';
export type AggregationFunction = 'mean' | 'sum' | 'min' | 'max' | 'count' | 'median';

/**
 * Calculate Simple Moving Average (SMA)
 * @param data Array of numbers
 * @param windowSize Number of points in the moving window
 * @returns Array of moving averages (same length as input, with nulls at the start)
 */
export function calculateSimpleMovingAverage(
  data: number[],
  windowSize: number
): (number | null)[] {
  if (windowSize <= 0 || windowSize > data.length) {
    throw new Error('Window size must be positive and <= data length');
  }

  const result: (number | null)[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < windowSize - 1) {
      // Not enough data points for full window - compute partial average
      const partialWindow = data.slice(0, i + 1);
      const sum = partialWindow.reduce((acc, val) => acc + val, 0);
      result.push(sum / partialWindow.length);
    } else {
      // Full window available
      const window = data.slice(i - windowSize + 1, i + 1);
      const sum = window.reduce((acc, val) => acc + val, 0);
      result.push(sum / windowSize);
    }
  }

  return result;
}

/**
 * Calculate Exponential Moving Average (EMA)
 * EMA_t = alpha * value_t + (1 - alpha) * EMA_{t-1}
 * @param data Array of numbers
 * @param alpha Smoothing factor (0 < alpha <= 1). Higher = more responsive to recent changes
 * @returns Array of exponential moving averages
 */
export function calculateExponentialMovingAverage(
  data: number[],
  alpha: number
): number[] {
  if (alpha <= 0 || alpha > 1) {
    throw new Error('Alpha must be in range (0, 1]');
  }

  if (data.length === 0) {
    return [];
  }

  const firstVal = data[0];
  if (firstVal === undefined) return [];

  const result: number[] = [firstVal]; // First EMA value is the first data point

  for (let i = 1; i < data.length; i++) {
    const currentVal = data[i];
    const prevEma = result[i - 1];
    if (currentVal === undefined || prevEma === undefined) continue;
    const ema = alpha * currentVal + (1 - alpha) * prevEma;
    result.push(ema);
  }

  return result;
}

/**
 * Calculate linear regression trend line using least squares method
 * @param x Array of x values (e.g., timestamps)
 * @param y Array of y values (data points)
 * @returns Trend line parameters (slope, intercept, R²)
 */
export function calculateLinearTrend(x: number[], y: number[]): TrendResult {
  if (x.length !== y.length || x.length === 0) {
    throw new Error('X and Y arrays must have the same non-zero length');
  }

  const n = x.length;

  // Calculate means
  const xMean = x.reduce((sum, val) => sum + val, 0) / n;
  const yMean = y.reduce((sum, val) => sum + val, 0) / n;

  // Calculate slope and intercept using least squares
  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    const xVal = x[i];
    const yVal = y[i];
    if (xVal === undefined || yVal === undefined) continue;
    const xDiff = xVal - xMean;
    const yDiff = yVal - yMean;
    numerator += xDiff * yDiff;
    denominator += xDiff * xDiff;
  }

  const slope = denominator === 0 ? 0 : numerator / denominator;
  const intercept = yMean - slope * xMean;

  // Calculate R² (coefficient of determination)
  let ssTotal = 0; // Total sum of squares
  let ssResidual = 0; // Residual sum of squares

  for (let i = 0; i < n; i++) {
    const xVal = x[i];
    const yVal = y[i];
    if (xVal === undefined || yVal === undefined) continue;
    const yPredicted = slope * xVal + intercept;
    ssTotal += (yVal - yMean) ** 2;
    ssResidual += (yVal - yPredicted) ** 2;
  }

  const r2 = ssTotal === 0 ? 0 : 1 - ssResidual / ssTotal;

  return { slope, intercept, r2 };
}

/**
 * Aggregate data by time period
 * @param data Array of data points with timestamps
 * @param period Aggregation period (hourly, daily, weekly, monthly, yearly)
 * @param func Aggregation function (mean, sum, min, max, count, median)
 * @returns Array of aggregated data points
 */
export function aggregateByTimePeriod(
  data: DataPoint[],
  period: AggregationPeriod,
  func: AggregationFunction
): DataPoint[] {
  if (data.length === 0) {
    return [];
  }

  // Group data by period
  const groups = new Map<number, number[]>();

  data.forEach(point => {
    const periodStart = getPeriodStart(point.timestamp, period);
    if (!groups.has(periodStart)) {
      groups.set(periodStart, []);
    }
    groups.get(periodStart)!.push(point.value);
  });

  // Aggregate each group
  const result: DataPoint[] = [];

  groups.forEach((values, timestamp) => {
    const aggregatedValue = applyAggregationFunction(values, func);
    result.push({ timestamp, value: aggregatedValue });
  });

  // Sort by timestamp
  result.sort((a, b) => a.timestamp - b.timestamp);

  return result;
}

/**
 * Get the start timestamp of the period containing the given timestamp
 */
function getPeriodStart(timestamp: number, period: AggregationPeriod): number {
  const date = new Date(timestamp);

  switch (period) {
    case 'hourly':
      date.setMinutes(0, 0, 0);
      return date.getTime();

    case 'daily':
      date.setHours(0, 0, 0, 0);
      return date.getTime();

    case 'weekly': {
      const dayOfWeek = date.getDay();
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Start week on Monday
      date.setDate(date.getDate() - diff);
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    }

    case 'monthly':
      date.setDate(1);
      date.setHours(0, 0, 0, 0);
      return date.getTime();

    case 'yearly':
      date.setMonth(0, 1);
      date.setHours(0, 0, 0, 0);
      return date.getTime();

    default:
      throw new Error(`Unknown aggregation period: ${period}`);
  }
}

/**
 * Apply aggregation function to an array of values
 */
function applyAggregationFunction(
  values: number[],
  func: AggregationFunction
): number {
  if (values.length === 0) {
    return NaN;
  }

  switch (func) {
    case 'mean':
      return values.reduce((sum, val) => sum + val, 0) / values.length;

    case 'sum':
      return values.reduce((sum, val) => sum + val, 0);

    case 'min': {
      const minVal = Math.min(...values);
      return minVal !== undefined ? minVal : 0;
    }

    case 'max': {
      const maxVal = Math.max(...values);
      return maxVal !== undefined ? maxVal : 0;
    }

    case 'count':
      return values.length;

    case 'median': {
      const sorted = [...values].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      if (sorted.length % 2 === 0) {
        const val1 = sorted[mid - 1] ?? 0;
        const val2 = sorted[mid] ?? 0;
        return (val1 + val2) / 2;
      }
      return sorted[mid] ?? 0;
    }

    default:
      throw new Error(`Unknown aggregation function: ${func}`);
  }
}

/**
 * Detect anomalies in data using standard deviation method
 * @param data Array of numbers
 * @param threshold Number of standard deviations beyond which a point is considered anomalous
 * @returns Array of indices where anomalies were detected
 */
export function detectAnomalies(data: number[], threshold: number): number[] {
  if (data.length === 0 || threshold <= 0) {
    return [];
  }

  // Calculate mean and standard deviation
  const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
  const variance =
    data.reduce((sum, val) => sum + (val - mean) ** 2, 0) / data.length;
  const stdDev = Math.sqrt(variance);

  // Find anomalies
  const anomalyIndices: number[] = [];

  data.forEach((value, index) => {
    const zScore = Math.abs((value - mean) / stdDev);
    if (zScore > threshold) {
      anomalyIndices.push(index);
    }
  });

  return anomalyIndices;
}

/**
 * Calculate Interquartile Range (IQR) and identify outliers
 * @param data Array of numbers
 * @returns Object containing IQR statistics and outlier indices
 */
export function calculateIQR(data: number[]): {
  q1: number;
  q3: number;
  iqr: number;
  lowerBound: number;
  upperBound: number;
  outlierIndices: number[];
} {
  if (data.length === 0) {
    return {
      q1: 0,
      q3: 0,
      iqr: 0,
      lowerBound: 0,
      upperBound: 0,
      outlierIndices: [],
    };
  }

  const sorted = [...data].sort((a, b) => a - b);
  const n = sorted.length;

  // Calculate quartiles
  const q1Index = Math.floor(n * 0.25);
  const q3Index = Math.floor(n * 0.75);
  const q1 = sorted[q1Index] ?? 0;
  const q3 = sorted[q3Index] ?? 0;
  const iqr = q3 - q1;

  // Calculate outlier bounds (1.5 * IQR rule)
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  // Find outliers
  const outlierIndices: number[] = [];
  data.forEach((value, index) => {
    if (value < lowerBound || value > upperBound) {
      outlierIndices.push(index);
    }
  });

  return { q1, q3, iqr, lowerBound, upperBound, outlierIndices };
}

/**
 * Filter data by value range
 * @param data Array of data points
 * @param min Minimum value (inclusive), or undefined for no lower bound
 * @param max Maximum value (inclusive), or undefined for no upper bound
 * @returns Filtered array of data points
 */
export function filterByValueRange(
  data: DataPoint[],
  min?: number,
  max?: number
): DataPoint[] {
  return data.filter(point => {
    if (min !== undefined && point.value < min) return false;
    if (max !== undefined && point.value > max) return false;
    return true;
  });
}

/**
 * Filter data by date range
 * @param data Array of data points
 * @param startDate Start date (inclusive), or undefined for no start bound
 * @param endDate End date (inclusive), or undefined for no end bound
 * @returns Filtered array of data points
 */
export function filterByDateRange(
  data: DataPoint[],
  startDate?: Date,
  endDate?: Date
): DataPoint[] {
  const startTime = startDate?.getTime();
  const endTime = endDate?.getTime();

  return data.filter(point => {
    if (startTime !== undefined && point.timestamp < startTime) return false;
    if (endTime !== undefined && point.timestamp > endTime) return false;
    return true;
  });
}
