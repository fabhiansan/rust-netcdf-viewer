pub mod coordinates;
pub mod data_access;
pub mod loader;

pub use coordinates::detect_coordinates;
pub use data_access::{get_variable_data, get_variable_subset};
pub use loader::open_netcdf;
