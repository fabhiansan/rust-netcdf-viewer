use crate::models::{CoordinateInfo, FileMetadata};

/// Detect time and spatial coordinates in the NetCDF file
pub fn detect_coordinates(metadata: &FileMetadata) -> CoordinateInfo {
    CoordinateInfo {
        time_var: detect_time_coordinate(metadata),
        lat_var: detect_latitude_coordinate(metadata),
        lon_var: detect_longitude_coordinate(metadata),
        time_units: detect_time_units(metadata),
    }
}

/// Detect time coordinate variable
fn detect_time_coordinate(metadata: &FileMetadata) -> Option<String> {
    // Look for variables with standard time-related names or attributes
    for var in &metadata.variables {
        // Check standard_name attribute
        if let Some(standard_name) = var.attributes.get("standard_name") {
            if standard_name.contains("time") {
                return Some(var.name.clone());
            }
        }

        // Check common time variable names
        let name_lower = var.name.to_lowercase();
        if name_lower == "time" || name_lower == "time_counter" || name_lower == "t" {
            return Some(var.name.clone());
        }

        // Check units for time-like units
        if let Some(units) = var.attributes.get("units") {
            let units_lower = units.to_lowercase();
            if units_lower.contains("since")
                || units_lower.contains("seconds")
                || units_lower.contains("days")
                || units_lower.contains("hours")
            {
                return Some(var.name.clone());
            }
        }
    }

    None
}

/// Detect latitude coordinate variable
fn detect_latitude_coordinate(metadata: &FileMetadata) -> Option<String> {
    for var in &metadata.variables {
        // Check standard_name attribute
        if let Some(standard_name) = var.attributes.get("standard_name") {
            if standard_name == "latitude" {
                return Some(var.name.clone());
            }
        }

        // Check common latitude variable names
        let name_lower = var.name.to_lowercase();
        if name_lower == "latitude"
            || name_lower == "lat"
            || name_lower == "y"
            || name_lower == "nav_lat"
        {
            return Some(var.name.clone());
        }

        // Check units
        if let Some(units) = var.attributes.get("units") {
            let units_lower = units.to_lowercase();
            if units_lower == "degrees_north"
                || units_lower == "degree_north"
                || units_lower == "degree_n"
                || units_lower == "degrees_n"
            {
                return Some(var.name.clone());
            }
        }
    }

    None
}

/// Detect longitude coordinate variable
fn detect_longitude_coordinate(metadata: &FileMetadata) -> Option<String> {
    for var in &metadata.variables {
        // Check standard_name attribute
        if let Some(standard_name) = var.attributes.get("standard_name") {
            if standard_name == "longitude" {
                return Some(var.name.clone());
            }
        }

        // Check common longitude variable names
        let name_lower = var.name.to_lowercase();
        if name_lower == "longitude"
            || name_lower == "lon"
            || name_lower == "x"
            || name_lower == "nav_lon"
        {
            return Some(var.name.clone());
        }

        // Check units
        if let Some(units) = var.attributes.get("units") {
            let units_lower = units.to_lowercase();
            if units_lower == "degrees_east"
                || units_lower == "degree_east"
                || units_lower == "degree_e"
                || units_lower == "degrees_e"
            {
                return Some(var.name.clone());
            }
        }
    }

    None
}

/// Extract time units from the time variable
fn detect_time_units(metadata: &FileMetadata) -> Option<String> {
    // First detect which variable is the time variable
    let time_var_name = detect_time_coordinate(metadata)?;

    // Find that variable and get its units
    for var in &metadata.variables {
        if var.name == time_var_name {
            return var.attributes.get("units").cloned();
        }
    }

    None
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::{Dimension, Variable};
    use std::collections::HashMap;

    #[test]
    fn test_detect_time_coordinate() {
        let mut attrs = HashMap::new();
        attrs.insert("units".to_string(), "seconds since 1970-01-01".to_string());

        let metadata = FileMetadata {
            file_path: "test.nc".to_string(),
            dimensions: vec![],
            variables: vec![Variable {
                name: "time".to_string(),
                data_type: "f64".to_string(),
                dimensions: vec!["time".to_string()],
                shape: vec![100],
                attributes: attrs,
            }],
            global_attrs: HashMap::new(),
            coordinates: None,
        };

        assert_eq!(
            detect_time_coordinate(&metadata),
            Some("time".to_string())
        );
    }
}
