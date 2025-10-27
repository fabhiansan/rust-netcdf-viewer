// TypeScript types matching Rust backend structures

export interface FileMetadata {
  file_path: string;
  dimensions: Dimension[];
  variables: Variable[];
  global_attrs: Record<string, string>;
  coordinates: CoordinateInfo | null;
}

export interface Dimension {
  name: string;
  size: number;
  is_unlimited: boolean;
}

export interface Variable {
  name: string;
  data_type: string;
  dimensions: string[];
  shape: number[];
  attributes: Record<string, string>;
}

export interface CoordinateInfo {
  time_var: string | null;
  lat_var: string | null;
  lon_var: string | null;
  time_units: string | null;
}

export interface DataPoint {
  time: string;
  value: number;
}

// Discriminated union for variable data (matches Rust VariableData enum)
export type VariableData =
  | { type: 'Numeric'; data: number[] }
  | { type: 'Text'; data: string[] };

export interface VariableDataResponse {
  var_name: string;
  values: VariableData;
  shape: number[];
  missing_count: number;
}

// Helper function to check if data is numeric
export function isNumericData(data: VariableData): data is { type: 'Numeric'; data: number[] } {
  return data.type === 'Numeric';
}

// Helper function to check if data is text
export function isTextData(data: VariableData): data is { type: 'Text'; data: string[] } {
  return data.type === 'Text';
}

export interface VariableSubsetRequest {
  file_path: string;
  var_name: string;
  start: number[];
  count: number[];
}
