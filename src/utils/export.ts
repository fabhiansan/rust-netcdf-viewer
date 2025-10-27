import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import { format } from 'date-fns';
import type { VariableDataResponse, Variable } from '../types/netcdf';
import type { DataPoint } from './analysis';

export interface ExportSettings {
  csvDelimiter: ',' | ';' | '\t';
  decimalPrecision: number;
  missingValuePlaceholder: string;
  includeMetadataComments: boolean;
}

export interface JSONExportSettings {
  prettyPrint: boolean;
  includeFullMetadata: boolean;
}

export const defaultExportSettings: ExportSettings = {
  csvDelimiter: ',',
  decimalPrecision: 4,
  missingValuePlaceholder: 'NA',
  includeMetadataComments: true,
};

export const defaultJSONExportSettings: JSONExportSettings = {
  prettyPrint: true,
  includeFullMetadata: true,
};

/**
 * Export variable data to CSV format
 */
export async function exportToCSV(
  data: VariableDataResponse,
  variable: Variable,
  settings: ExportSettings = defaultExportSettings
): Promise<void> {
  const { csvDelimiter, decimalPrecision, missingValuePlaceholder, includeMetadataComments } = settings;

  // Prepare CSV content
  let csvContent = '';

  // Add metadata comments if enabled
  if (includeMetadataComments) {
    csvContent += `# Variable: ${variable.name}\n`;
    csvContent += `# Data Type: ${variable.data_type}\n`;
    csvContent += `# Dimensions: ${variable.dimensions.join(' × ')}\n`;
    csvContent += `# Shape: ${variable.shape.join(' × ')}\n`;

    const units = variable.attributes['units'];
    if (units !== undefined && units !== '') {
      csvContent += `# Units: ${units}\n`;
    }
    const longName = variable.attributes['long_name'];
    if (longName !== undefined && longName !== '') {
      csvContent += `# Long Name: ${longName}\n`;
    }

    csvContent += `# Total Data Points: ${String(data.values.data.length)}\n`;
    csvContent += `# Missing Values: ${String(data.missing_count)}\n`;
    csvContent += '\n';
  }

  // Add header row
  const headers = ['Index', ...variable.dimensions.filter(d => d !== 'index'), 'Value'];
  csvContent += headers.join(csvDelimiter) + '\n';

  // Add data rows
  const values = data.values.data;
  values.forEach((value, index) => {
    let formattedValue: string;

    if (typeof value === 'string') {
      // String data - escape if contains delimiter
      formattedValue = value.includes(csvDelimiter) ? `"${value}"` : value;
    } else {
      // Numeric data
      formattedValue = isNaN(value) || !isFinite(value)
        ? missingValuePlaceholder
        : value.toFixed(decimalPrecision);
    }

    const row = [index.toString(), formattedValue];
    csvContent += row.join(csvDelimiter) + '\n';
  });

  // Prompt user to save file
  const filePath = await save({
    defaultPath: `${variable.name}.csv`,
    filters: [
      {
        name: 'CSV Files',
        extensions: ['csv'],
      },
    ],
  });

  if (filePath !== null && filePath !== undefined && filePath !== '') {
    await writeTextFile(filePath, csvContent);
  }
}

/**
 * Export variable data to JSON format
 */
export async function exportToJSON(
  data: VariableDataResponse,
  variable: Variable,
  settings: JSONExportSettings = defaultJSONExportSettings
): Promise<void> {
  const { prettyPrint, includeFullMetadata } = settings;

  // Prepare JSON structure
  const jsonData: any = {};

  if (includeFullMetadata) {
    jsonData.metadata = {
      variable: variable.name,
      data_type: variable.data_type,
      dimensions: variable.dimensions,
      shape: variable.shape,
      attributes: variable.attributes,
      value_type: data.values.type, // Include data type (Numeric or Text)
      total_points: data.values.data.length,
      missing_count: data.missing_count,
    };
  }

  const values = data.values.data;
  jsonData.data = values.map((value, index) => ({
    index,
    value: typeof value === 'string' ? value : (isNaN(value) || !isFinite(value) ? null : value),
  }));

  // Convert to JSON string
  const jsonContent = prettyPrint
    ? JSON.stringify(jsonData, null, 2)
    : JSON.stringify(jsonData);

  // Prompt user to save file
  const filePath = await save({
    defaultPath: `${variable.name}.json`,
    filters: [
      {
        name: 'JSON Files',
        extensions: ['json'],
      },
    ],
  });

  if (filePath !== null && filePath !== undefined && filePath !== '') {
    await writeTextFile(filePath, jsonContent);
  }
}

/**
 * Export time-series data points to CSV (with optional analysis data)
 */
export async function exportTimeSeriesCSV(
  dataPoints: DataPoint[],
  variableName: string,
  settings: ExportSettings = defaultExportSettings,
  metadata?: {
    units?: string;
    longName?: string;
    filterInfo?: string;
    movingAverageData?: (number | null)[];
    movingAverageLabel?: string;
  }
): Promise<void> {
  const { csvDelimiter, decimalPrecision, missingValuePlaceholder, includeMetadataComments } = settings;

  let csvContent = '';

  // Add metadata comments if enabled
  if (includeMetadataComments) {
    csvContent += `# Variable: ${variableName}\n`;
    if (metadata?.units) {
      csvContent += `# Units: ${metadata.units}\n`;
    }
    if (metadata?.longName) {
      csvContent += `# Long Name: ${metadata.longName}\n`;
    }
    if (metadata?.filterInfo) {
      csvContent += `# Filters Applied: ${metadata.filterInfo}\n`;
    }
    csvContent += `# Total Data Points: ${dataPoints.length}\n`;
    csvContent += `# Export Date: ${new Date().toISOString()}\n`;
    csvContent += '\n';
  }

  // Build header
  const headers = ['timestamp', 'datetime', 'value'];
  if (metadata?.movingAverageData) {
    headers.push(metadata.movingAverageLabel ?? 'moving_average');
  }
  csvContent += headers.join(csvDelimiter) + '\n';

  // Add data rows
  dataPoints.forEach((point, index) => {
    const formattedValue = isNaN(point.value) || !isFinite(point.value)
      ? missingValuePlaceholder
      : point.value.toFixed(decimalPrecision);

    const row = [
      point.timestamp.toString(),
      format(point.timestamp, 'yyyy-MM-dd HH:mm:ss'),
      formattedValue,
    ];

    if (metadata?.movingAverageData && index < metadata.movingAverageData.length) {
      const maValue = metadata.movingAverageData[index];
      const formattedMA =
        maValue === null || maValue === undefined || isNaN(maValue) || !isFinite(maValue)
          ? missingValuePlaceholder
          : maValue.toFixed(decimalPrecision);
      row.push(formattedMA);
    }

    csvContent += row.join(csvDelimiter) + '\n';
  });

  // Prompt user to save file
  const filePath = await save({
    defaultPath: `${variableName}_${format(new Date(), 'yyyy-MM-dd')}.csv`,
    filters: [
      {
        name: 'CSV Files',
        extensions: ['csv'],
      },
    ],
  });

  if (filePath !== null && filePath !== undefined && filePath !== '') {
    await writeTextFile(filePath, csvContent);
  }
}

/**
 * Export time-series data points to JSON (with optional analysis data)
 */
export async function exportTimeSeriesJSON(
  dataPoints: DataPoint[],
  variableName: string,
  settings: JSONExportSettings = defaultJSONExportSettings,
  metadata?: {
    units?: string;
    longName?: string;
    filterInfo?: string;
    movingAverageData?: (number | null)[];
    movingAverageLabel?: string;
  }
): Promise<void> {
  const { prettyPrint, includeFullMetadata } = settings;

  const jsonData: any = {};

  if (includeFullMetadata && metadata) {
    jsonData.metadata = {
      variable: variableName,
      units: metadata.units,
      long_name: metadata.longName,
      filters_applied: metadata.filterInfo,
      total_points: dataPoints.length,
      export_date: new Date().toISOString(),
    };
  }

  jsonData.data = dataPoints.map((point, index) => {
    const entry: any = {
      timestamp: point.timestamp,
      datetime: format(point.timestamp, 'yyyy-MM-dd HH:mm:ss'),
      value: isNaN(point.value) || !isFinite(point.value) ? null : point.value,
    };

    if (metadata?.movingAverageData && index < metadata.movingAverageData.length) {
      const maValue = metadata.movingAverageData[index];
      entry[metadata.movingAverageLabel ?? 'moving_average'] =
        maValue === null || maValue === undefined || isNaN(maValue) || !isFinite(maValue) ? null : maValue;
    }

    return entry;
  });

  const jsonContent = prettyPrint
    ? JSON.stringify(jsonData, null, 2)
    : JSON.stringify(jsonData);

  const filePath = await save({
    defaultPath: `${variableName}_${format(new Date(), 'yyyy-MM-dd')}.json`,
    filters: [
      {
        name: 'JSON Files',
        extensions: ['json'],
      },
    ],
  });

  if (filePath !== null && filePath !== undefined && filePath !== '') {
    await writeTextFile(filePath, jsonContent);
  }
}

/**
 * Export multiple variables in batch
 */
export async function exportBatch(
  variables: { data: VariableDataResponse; variable: Variable }[],
  format: 'csv' | 'json',
  csvSettings?: ExportSettings,
  jsonSettings?: JSONExportSettings
): Promise<{ success: number; failed: { variable: string; error: string }[] }> {
  const results = {
    success: 0,
    failed: [] as { variable: string; error: string }[],
  };

  for (const { data, variable } of variables) {
    try {
      if (format === 'csv') {
        await exportToCSV(data, variable, csvSettings);
      } else {
        await exportToJSON(data, variable, jsonSettings);
      }
      results.success++;
    } catch (error) {
      results.failed.push({
        variable: variable.name,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return results;
}
