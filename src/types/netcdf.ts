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

export interface VariableDataResponse {
  var_name: string;
  values: number[];
  shape: number[];
  missing_count: number;
}

export interface VariableSubsetRequest {
  file_path: string;
  var_name: string;
  start: number[];
  count: number[];
}
