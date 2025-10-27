use crate::errors::NetCDFError;
use crate::models::{VariableDataResponse, VariableData};
use netcdf::types::{VariableType, BasicType};
use std::path::Path;

/// Get all data for a variable
pub fn get_variable_data(
    path: &str,
    var_name: &str,
) -> Result<VariableDataResponse, NetCDFError> {
    if !Path::new(path).exists() {
        return Err(NetCDFError::FileOpenError(format!(
            "File not found: {}",
            path
        )));
    }

    let file = netcdf::open(path)?;
    let var = file
        .variable(var_name)
        .ok_or_else(|| NetCDFError::VariableNotFound(var_name.to_string()))?;

    // Get the shape
    let shape: Vec<usize> = var.dimensions().iter().map(|d| d.len()).collect();

    // Determine if variable is string or numeric based on type
    let is_string_type = matches!(
        var.vartype(),
        VariableType::Basic(BasicType::Char) | VariableType::String
    );

    if is_string_type {
        // Read as string data
        let string_values = read_variable_as_string(&var)?;
        Ok(VariableDataResponse {
            var_name: var_name.to_string(),
            values: VariableData::Text(string_values),
            shape,
            missing_count: 0, // Not applicable for strings
        })
    } else {
        // Read as numeric data and convert to f64
        let (numeric_values, missing_count) = read_variable_as_f64(&var)?;
        Ok(VariableDataResponse {
            var_name: var_name.to_string(),
            values: VariableData::Numeric(numeric_values),
            shape,
            missing_count,
        })
    }
}

/// Get a subset of variable data
pub fn get_variable_subset(
    path: &str,
    var_name: &str,
    start: &[usize],
    count: &[usize],
) -> Result<VariableDataResponse, NetCDFError> {
    if !Path::new(path).exists() {
        return Err(NetCDFError::FileOpenError(format!(
            "File not found: {}",
            path
        )));
    }

    let file = netcdf::open(path)?;
    let var = file
        .variable(var_name)
        .ok_or_else(|| NetCDFError::VariableNotFound(var_name.to_string()))?;

    // Validate subset request
    let ndims = var.dimensions().len();
    if start.len() != ndims || count.len() != ndims {
        return Err(NetCDFError::InvalidSubsetRequest(format!(
            "Variable has {} dimensions, but got start={} and count={}",
            ndims,
            start.len(),
            count.len()
        )));
    }

    // Determine if variable is string or numeric based on type
    let is_string_type = matches!(
        var.vartype(),
        VariableType::Basic(BasicType::Char) | VariableType::String
    );

    if is_string_type {
        // Read subset as string data
        let string_values = read_variable_subset_as_string(&var, start, count)?;
        Ok(VariableDataResponse {
            var_name: var_name.to_string(),
            values: VariableData::Text(string_values),
            shape: count.to_vec(),
            missing_count: 0, // Not applicable for strings
        })
    } else {
        // Read subset as numeric data
        let (numeric_values, missing_count) = read_variable_subset_as_f64(&var, start, count)?;
        Ok(VariableDataResponse {
            var_name: var_name.to_string(),
            values: VariableData::Numeric(numeric_values),
            shape: count.to_vec(),
            missing_count,
        })
    }
}

/// Read entire variable as f64 array, handling different data types
fn read_variable_as_f64(
    var: &netcdf::Variable,
) -> Result<(Vec<f64>, usize), NetCDFError> {
    // Get fill value if it exists
    let fill_value = get_fill_value(var);

    match var.vartype() {
        VariableType::Basic(BasicType::Double) => {
            let data: Vec<f64> = var
                .get_values(..)
                .map_err(|e| NetCDFError::VariableReadError(var.name().to_string(), e.to_string()))?;
            let missing_count = count_missing(&data, fill_value);
            Ok((data, missing_count))
        }
        VariableType::Basic(BasicType::Float) => {
            let data: Vec<f32> = var
                .get_values(..)
                .map_err(|e| NetCDFError::VariableReadError(var.name().to_string(), e.to_string()))?;
            let converted: Vec<f64> = data.iter().map(|&x| x as f64).collect();
            let missing_count = count_missing(&converted, fill_value);
            Ok((converted, missing_count))
        }
        VariableType::Basic(BasicType::Int) => {
            let data: Vec<i32> = var
                .get_values(..)
                .map_err(|e| NetCDFError::VariableReadError(var.name().to_string(), e.to_string()))?;
            let converted: Vec<f64> = data.iter().map(|&x| x as f64).collect();
            let missing_count = count_missing(&converted, fill_value);
            Ok((converted, missing_count))
        }
        VariableType::Basic(BasicType::Short) => {
            let data: Vec<i16> = var
                .get_values(..)
                .map_err(|e| NetCDFError::VariableReadError(var.name().to_string(), e.to_string()))?;
            let converted: Vec<f64> = data.iter().map(|&x| x as f64).collect();
            let missing_count = count_missing(&converted, fill_value);
            Ok((converted, missing_count))
        }
        VariableType::Basic(BasicType::Byte) => {
            let data: Vec<i8> = var
                .get_values(..)
                .map_err(|e| NetCDFError::VariableReadError(var.name().to_string(), e.to_string()))?;
            let converted: Vec<f64> = data.iter().map(|&x| x as f64).collect();
            let missing_count = count_missing(&converted, fill_value);
            Ok((converted, missing_count))
        }
        VariableType::Basic(BasicType::Uint) => {
            let data: Vec<u32> = var
                .get_values(..)
                .map_err(|e| NetCDFError::VariableReadError(var.name().to_string(), e.to_string()))?;
            let converted: Vec<f64> = data.iter().map(|&x| x as f64).collect();
            let missing_count = count_missing(&converted, fill_value);
            Ok((converted, missing_count))
        }
        VariableType::Basic(BasicType::Ushort) => {
            let data: Vec<u16> = var
                .get_values(..)
                .map_err(|e| NetCDFError::VariableReadError(var.name().to_string(), e.to_string()))?;
            let converted: Vec<f64> = data.iter().map(|&x| x as f64).collect();
            let missing_count = count_missing(&converted, fill_value);
            Ok((converted, missing_count))
        }
        VariableType::Basic(BasicType::Ubyte) => {
            let data: Vec<u8> = var
                .get_values(..)
                .map_err(|e| NetCDFError::VariableReadError(var.name().to_string(), e.to_string()))?;
            let converted: Vec<f64> = data.iter().map(|&x| x as f64).collect();
            let missing_count = count_missing(&converted, fill_value);
            Ok((converted, missing_count))
        }
        VariableType::Basic(BasicType::Int64) => {
            let data: Vec<i64> = var
                .get_values(..)
                .map_err(|e| NetCDFError::VariableReadError(var.name().to_string(), e.to_string()))?;
            let converted: Vec<f64> = data.iter().map(|&x| x as f64).collect();
            let missing_count = count_missing(&converted, fill_value);
            Ok((converted, missing_count))
        }
        VariableType::Basic(BasicType::Uint64) => {
            let data: Vec<u64> = var
                .get_values(..)
                .map_err(|e| NetCDFError::VariableReadError(var.name().to_string(), e.to_string()))?;
            let converted: Vec<f64> = data.iter().map(|&x| x as f64).collect();
            let missing_count = count_missing(&converted, fill_value);
            Ok((converted, missing_count))
        }
        _ => Err(NetCDFError::ConversionError(format!(
            "Unsupported variable type: {:?}",
            var.vartype()
        ))),
    }
}

/// Read variable subset as f64 array
fn read_variable_subset_as_f64(
    var: &netcdf::Variable,
    start: &[usize],
    count: &[usize],
) -> Result<(Vec<f64>, usize), NetCDFError> {
    let fill_value = get_fill_value(var);

    // Create extents from start and count
    let extents: Vec<_> = start.iter().zip(count.iter())
        .map(|(&s, &c)| s..(s + c))
        .collect();

    match var.vartype() {
        VariableType::Basic(BasicType::Double) => {
            let data: Vec<f64> = var
                .get_values(extents)
                .map_err(|e| NetCDFError::VariableReadError(var.name().to_string(), e.to_string()))?;
            let missing_count = count_missing(&data, fill_value);
            Ok((data, missing_count))
        }
        VariableType::Basic(BasicType::Float) => {
            let data: Vec<f32> = var
                .get_values(extents)
                .map_err(|e| NetCDFError::VariableReadError(var.name().to_string(), e.to_string()))?;
            let converted: Vec<f64> = data.iter().map(|&x| x as f64).collect();
            let missing_count = count_missing(&converted, fill_value);
            Ok((converted, missing_count))
        }
        VariableType::Basic(BasicType::Int) => {
            let data: Vec<i32> = var
                .get_values(extents)
                .map_err(|e| NetCDFError::VariableReadError(var.name().to_string(), e.to_string()))?;
            let converted: Vec<f64> = data.iter().map(|&x| x as f64).collect();
            let missing_count = count_missing(&converted, fill_value);
            Ok((converted, missing_count))
        }
        VariableType::Basic(BasicType::Short) => {
            let data: Vec<i16> = var
                .get_values(extents)
                .map_err(|e| NetCDFError::VariableReadError(var.name().to_string(), e.to_string()))?;
            let converted: Vec<f64> = data.iter().map(|&x| x as f64).collect();
            let missing_count = count_missing(&converted, fill_value);
            Ok((converted, missing_count))
        }
        VariableType::Basic(BasicType::Byte) => {
            let data: Vec<i8> = var
                .get_values(extents)
                .map_err(|e| NetCDFError::VariableReadError(var.name().to_string(), e.to_string()))?;
            let converted: Vec<f64> = data.iter().map(|&x| x as f64).collect();
            let missing_count = count_missing(&converted, fill_value);
            Ok((converted, missing_count))
        }
        VariableType::Basic(BasicType::Uint) => {
            let data: Vec<u32> = var
                .get_values(extents)
                .map_err(|e| NetCDFError::VariableReadError(var.name().to_string(), e.to_string()))?;
            let converted: Vec<f64> = data.iter().map(|&x| x as f64).collect();
            let missing_count = count_missing(&converted, fill_value);
            Ok((converted, missing_count))
        }
        VariableType::Basic(BasicType::Ushort) => {
            let data: Vec<u16> = var
                .get_values(extents)
                .map_err(|e| NetCDFError::VariableReadError(var.name().to_string(), e.to_string()))?;
            let converted: Vec<f64> = data.iter().map(|&x| x as f64).collect();
            let missing_count = count_missing(&converted, fill_value);
            Ok((converted, missing_count))
        }
        VariableType::Basic(BasicType::Ubyte) => {
            let data: Vec<u8> = var
                .get_values(extents)
                .map_err(|e| NetCDFError::VariableReadError(var.name().to_string(), e.to_string()))?;
            let converted: Vec<f64> = data.iter().map(|&x| x as f64).collect();
            let missing_count = count_missing(&converted, fill_value);
            Ok((converted, missing_count))
        }
        VariableType::Basic(BasicType::Int64) => {
            let data: Vec<i64> = var
                .get_values(extents)
                .map_err(|e| NetCDFError::VariableReadError(var.name().to_string(), e.to_string()))?;
            let converted: Vec<f64> = data.iter().map(|&x| x as f64).collect();
            let missing_count = count_missing(&converted, fill_value);
            Ok((converted, missing_count))
        }
        VariableType::Basic(BasicType::Uint64) => {
            let data: Vec<u64> = var
                .get_values(extents)
                .map_err(|e| NetCDFError::VariableReadError(var.name().to_string(), e.to_string()))?;
            let converted: Vec<f64> = data.iter().map(|&x| x as f64).collect();
            let missing_count = count_missing(&converted, fill_value);
            Ok((converted, missing_count))
        }
        _ => Err(NetCDFError::ConversionError(format!(
            "Unsupported variable type for subset: {:?}",
            var.vartype()
        ))),
    }
}

/// Get the fill value for a variable
fn get_fill_value(var: &netcdf::Variable) -> Option<f64> {
    use netcdf::AttributeValue;

    if let Some(attr) = var.attribute("_FillValue") {
        if let Ok(value) = attr.value() {
            match value {
                AttributeValue::Double(val) => return Some(val),
                AttributeValue::Float(val) => return Some(val as f64),
                AttributeValue::Int(val) => return Some(val as f64),
                AttributeValue::Short(val) => return Some(val as f64),
                AttributeValue::Schar(val) => return Some(val as f64),
                AttributeValue::Uint(val) => return Some(val as f64),
                AttributeValue::Ushort(val) => return Some(val as f64),
                AttributeValue::Uchar(val) => return Some(val as f64),
                // Note: Int64 and Uint64 are not available as AttributeValue variants in netcdf 0.9
                _ => {}
            }
        }
    }
    None
}

/// Count missing values (NaN or fill values)
fn count_missing(data: &[f64], fill_value: Option<f64>) -> usize {
    data.iter()
        .filter(|&&x| {
            x.is_nan() || fill_value.map_or(false, |fv| (x - fv).abs() < 1e-10)
        })
        .count()
}

/// Read entire variable as string array
fn read_variable_as_string(
    var: &netcdf::Variable,
) -> Result<Vec<String>, NetCDFError> {
    match var.vartype() {
        VariableType::Basic(BasicType::Char) => {
            // For char arrays, read as bytes and convert to strings
            let data: Vec<u8> = var
                .get_values(..)
                .map_err(|e| NetCDFError::VariableReadError(var.name().to_string(), e.to_string()))?;

            // Convert bytes to string, handling multi-dimensional char arrays
            let shape: Vec<usize> = var.dimensions().iter().map(|d| d.len()).collect();

            if shape.is_empty() {
                // Scalar char - convert single byte to string
                Ok(vec![String::from_utf8_lossy(&data).to_string()])
            } else if shape.len() == 1 {
                // 1D char array - single string
                Ok(vec![String::from_utf8_lossy(&data).trim_end_matches('\0').to_string()])
            } else {
                // Multi-dimensional char array - last dimension is string length
                let str_len = shape[shape.len() - 1];
                let num_strings = data.len() / str_len;
                let strings: Vec<String> = (0..num_strings)
                    .map(|i| {
                        let start = i * str_len;
                        let end = start + str_len;
                        String::from_utf8_lossy(&data[start..end])
                            .trim_end_matches('\0')
                            .to_string()
                    })
                    .collect();
                Ok(strings)
            }
        }
        _ => {
            // For true string types (NetCDF-4), try to read as strings directly
            // Note: The netcdf crate may not fully support string type reading yet
            Err(NetCDFError::ConversionError(format!(
                "String variable reading not yet implemented for type: {:?}",
                var.vartype()
            )))
        }
    }
}

/// Read variable subset as string array
fn read_variable_subset_as_string(
    var: &netcdf::Variable,
    start: &[usize],
    count: &[usize],
) -> Result<Vec<String>, NetCDFError> {
    // Create extents from start and count
    let extents: Vec<_> = start.iter().zip(count.iter())
        .map(|(&s, &c)| s..(s + c))
        .collect();

    match var.vartype() {
        VariableType::Basic(BasicType::Char) => {
            let data: Vec<u8> = var
                .get_values(extents)
                .map_err(|e| NetCDFError::VariableReadError(var.name().to_string(), e.to_string()))?;

            if count.is_empty() {
                Ok(vec![String::from_utf8_lossy(&data).to_string()])
            } else if count.len() == 1 {
                Ok(vec![String::from_utf8_lossy(&data).trim_end_matches('\0').to_string()])
            } else {
                let str_len = count[count.len() - 1];
                let num_strings = data.len() / str_len;
                let strings: Vec<String> = (0..num_strings)
                    .map(|i| {
                        let start = i * str_len;
                        let end = start + str_len;
                        String::from_utf8_lossy(&data[start..end])
                            .trim_end_matches('\0')
                            .to_string()
                    })
                    .collect();
                Ok(strings)
            }
        }
        _ => Err(NetCDFError::ConversionError(format!(
            "String variable subset reading not yet implemented for type: {:?}",
            var.vartype()
        ))),
    }
}
