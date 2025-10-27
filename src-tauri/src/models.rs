use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Represents metadata for an entire NetCDF file
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileMetadata {
    /// Path to the NetCDF file
    pub file_path: String,
    /// List of dimensions in the file
    pub dimensions: Vec<Dimension>,
    /// List of variables in the file
    pub variables: Vec<Variable>,
    /// Global attributes (key-value pairs)
    pub global_attrs: HashMap<String, String>,
    /// Information about detected coordinates
    pub coordinates: Option<CoordinateInfo>,
}

/// Represents a dimension in a NetCDF file
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Dimension {
    /// Dimension name
    pub name: String,
    /// Size of the dimension
    pub size: usize,
    /// Whether this is an unlimited dimension
    pub is_unlimited: bool,
}

/// Represents a variable in a NetCDF file
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Variable {
    /// Variable name
    pub name: String,
    /// Data type as a string (e.g., "f64", "i32")
    pub data_type: String,
    /// Dimensions that define this variable's shape
    pub dimensions: Vec<String>,
    /// Shape of the variable (size along each dimension)
    pub shape: Vec<usize>,
    /// Variable attributes (units, long_name, etc.)
    pub attributes: HashMap<String, String>,
}

/// Information about detected coordinate variables
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CoordinateInfo {
    /// Name of the time coordinate variable (if detected)
    pub time_var: Option<String>,
    /// Name of the latitude coordinate variable (if detected)
    pub lat_var: Option<String>,
    /// Name of the longitude coordinate variable (if detected)
    pub lon_var: Option<String>,
    /// Time units string (e.g., "seconds since 1970-01-01")
    pub time_units: Option<String>,
}

/// Represents a data point with time and value
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataPoint {
    /// Timestamp (ISO 8601 format or numeric)
    pub time: String,
    /// Data value
    pub value: f64,
}

/// Request for fetching a subset of variable data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VariableSubsetRequest {
    /// Path to the NetCDF file
    pub file_path: String,
    /// Variable name
    pub var_name: String,
    /// Starting indices for each dimension
    pub start: Vec<usize>,
    /// Count (number of elements) along each dimension
    pub count: Vec<usize>,
}

/// Enum representing variable data that can be either numeric or text
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "data")]
pub enum VariableData {
    /// Numeric data (converted to f64)
    Numeric(Vec<f64>),
    /// Text/string data
    Text(Vec<String>),
}

/// Response containing variable data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VariableDataResponse {
    /// Variable name
    pub var_name: String,
    /// Variable data (either numeric or text)
    pub values: VariableData,
    /// Shape of the returned data
    pub shape: Vec<usize>,
    /// Number of missing/fill values (only applicable for numeric data)
    pub missing_count: usize,
}
