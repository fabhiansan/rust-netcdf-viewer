use thiserror::Error;

#[derive(Error, Debug)]
pub enum NetCDFError {
    #[error("Failed to open NetCDF file: {0}")]
    FileOpenError(String),

    #[error("Failed to read variable '{0}': {1}")]
    VariableReadError(String, String),

    #[error("Variable '{0}' not found in file")]
    VariableNotFound(String),

    #[error("Dimension '{0}' not found in file")]
    DimensionNotFound(String),

    #[error("Invalid file format: {0}")]
    InvalidFormat(String),

    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),

    #[error("NetCDF library error: {0}")]
    NetCDFLibError(String),

    #[error("Data conversion error: {0}")]
    ConversionError(String),

    #[error("Invalid subset request: {0}")]
    InvalidSubsetRequest(String),
}

impl From<netcdf::Error> for NetCDFError {
    fn from(err: netcdf::Error) -> Self {
        NetCDFError::NetCDFLibError(err.to_string())
    }
}

// Make the error Serialize-able for Tauri
impl serde::Serialize for NetCDFError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}
