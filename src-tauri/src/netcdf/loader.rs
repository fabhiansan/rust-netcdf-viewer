use crate::errors::NetCDFError;
use crate::models::{Dimension, FileMetadata, Variable};
use std::collections::HashMap;
use std::path::Path;

/// Open a NetCDF file and extract all metadata
pub fn open_netcdf(path: &str) -> Result<FileMetadata, NetCDFError> {
    // Validate file exists
    if !Path::new(path).exists() {
        return Err(NetCDFError::FileOpenError(format!(
            "File not found: {}",
            path
        )));
    }

    // Open the NetCDF file
    let file = netcdf::open(path).map_err(|e| {
        NetCDFError::FileOpenError(format!("Failed to open {}: {}", path, e))
    })?;

    // Extract dimensions
    let dimensions = extract_dimensions(&file)?;

    // Extract variables
    let variables = extract_variables(&file)?;

    // Extract global attributes
    let global_attrs = extract_global_attributes(&file)?;

    Ok(FileMetadata {
        file_path: path.to_string(),
        dimensions,
        variables,
        global_attrs,
        coordinates: None, // Will be populated by coordinate detection
    })
}

/// Extract all dimensions from the NetCDF file
fn extract_dimensions(file: &netcdf::File) -> Result<Vec<Dimension>, NetCDFError> {
    let mut dimensions = Vec::new();

    for dim in file.dimensions() {
        dimensions.push(Dimension {
            name: dim.name().to_string(),
            size: dim.len(),
            is_unlimited: dim.is_unlimited(),
        });
    }

    Ok(dimensions)
}

/// Extract all variables from the NetCDF file
fn extract_variables(file: &netcdf::File) -> Result<Vec<Variable>, NetCDFError> {
    let mut variables = Vec::new();

    for var in file.variables() {
        // Get dimension names
        let dimensions: Vec<String> = var
            .dimensions()
            .iter()
            .map(|d| d.name().to_string())
            .collect();

        // Get shape
        let shape: Vec<usize> = var.dimensions().iter().map(|d| d.len()).collect();

        // Get data type
        let data_type = format!("{:?}", var.vartype());

        // Extract variable attributes
        let mut attributes = HashMap::new();

        // Common CF convention attributes
        for attr_name in &["units", "long_name", "standard_name", "_FillValue", "missing_value", "valid_min", "valid_max"] {
            if let Some(attr) = var.attribute(attr_name) {
                if let Some(value) = attribute_to_string(&attr) {
                    attributes.insert(attr_name.to_string(), value);
                }
            }
        }

        // Get all other attributes
        for attr in var.attributes() {
            let name = attr.name().to_string();
            if !attributes.contains_key(&name) {
                if let Some(value) = attribute_to_string(&attr) {
                    attributes.insert(name, value);
                }
            }
        }

        variables.push(Variable {
            name: var.name().to_string(),
            data_type,
            dimensions,
            shape,
            attributes,
        });
    }

    Ok(variables)
}

/// Extract global attributes from the NetCDF file
fn extract_global_attributes(file: &netcdf::File) -> Result<HashMap<String, String>, NetCDFError> {
    let mut attrs = HashMap::new();

    for attr in file.attributes() {
        if let Some(value) = attribute_to_string(&attr) {
            attrs.insert(attr.name().to_string(), value);
        }
    }

    Ok(attrs)
}

/// Convert a NetCDF attribute to a string representation
fn attribute_to_string(attr: &netcdf::Attribute) -> Option<String> {
    use netcdf::AttributeValue;

    let value = attr.value().ok()?;

    match value {
        AttributeValue::Str(s) => Some(s),
        AttributeValue::Strs(v) => Some(format!("{:?}", v)),
        AttributeValue::Uchar(v) => Some(v.to_string()),
        AttributeValue::Uchars(v) => Some(format!("{:?}", v)),
        AttributeValue::Schar(v) => Some(v.to_string()),
        AttributeValue::Schars(v) => Some(format!("{:?}", v)),
        AttributeValue::Ushort(v) => Some(v.to_string()),
        AttributeValue::Ushorts(v) => Some(format!("{:?}", v)),
        AttributeValue::Short(v) => Some(v.to_string()),
        AttributeValue::Shorts(v) => Some(format!("{:?}", v)),
        AttributeValue::Uint(v) => Some(v.to_string()),
        AttributeValue::Uints(v) => Some(format!("{:?}", v)),
        AttributeValue::Int(v) => Some(v.to_string()),
        AttributeValue::Ints(v) => Some(format!("{:?}", v)),
        AttributeValue::Ulonglong(v) => Some(v.to_string()),
        AttributeValue::Ulonglongs(v) => Some(format!("{:?}", v)),
        AttributeValue::Longlong(v) => Some(v.to_string()),
        AttributeValue::Longlongs(v) => Some(format!("{:?}", v)),
        AttributeValue::Float(v) => Some(v.to_string()),
        AttributeValue::Floats(v) => Some(format!("{:?}", v)),
        AttributeValue::Double(v) => Some(v.to_string()),
        AttributeValue::Doubles(v) => Some(format!("{:?}", v)),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_open_nonexistent_file() {
        let result = open_netcdf("/nonexistent/file.nc");
        assert!(result.is_err());
    }
}
