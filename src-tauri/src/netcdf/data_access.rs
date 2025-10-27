use crate::errors::NetCDFError;
use crate::models::VariableDataResponse;
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

    // Read data based on type and convert to f64
    let (values, missing_count) = read_variable_as_f64(&var)?;

    Ok(VariableDataResponse {
        var_name: var_name.to_string(),
        values,
        shape,
        missing_count,
    })
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

    // Read subset based on type
    let (values, missing_count) = read_variable_subset_as_f64(&var, start, count)?;

    Ok(VariableDataResponse {
        var_name: var_name.to_string(),
        values,
        shape: count.to_vec(),
        missing_count,
    })
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
