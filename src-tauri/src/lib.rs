// Modules
mod errors;
mod models;
mod netcdf;

use errors::NetCDFError;
use models::{FileMetadata, VariableDataResponse};
use std::collections::HashMap;
use std::sync::Mutex;

// Global state to cache opened files
struct AppState {
    open_files: Mutex<HashMap<String, ()>>, // For now, just track paths
}

// Tauri commands

/// Open a NetCDF file and return metadata
#[tauri::command]
fn open_netcdf_file(path: String) -> Result<FileMetadata, NetCDFError> {
    let mut metadata = netcdf::open_netcdf(&path)?;

    // Detect coordinates
    let coords = netcdf::detect_coordinates(&metadata);
    metadata.coordinates = Some(coords);

    Ok(metadata)
}

/// Get all data for a variable
#[tauri::command]
fn get_variable_data(
    path: String,
    var_name: String,
) -> Result<VariableDataResponse, NetCDFError> {
    netcdf::get_variable_data(&path, &var_name)
}

/// Get a subset of variable data
#[tauri::command]
fn get_variable_subset(
    path: String,
    var_name: String,
    start: Vec<usize>,
    count: Vec<usize>,
) -> Result<VariableDataResponse, NetCDFError> {
    netcdf::get_variable_subset(&path, &var_name, &start, &count)
}

/// Close a NetCDF file (for cleanup)
#[tauri::command]
fn close_netcdf_file(path: String, state: tauri::State<AppState>) -> Result<(), String> {
    let mut files = state.open_files.lock().unwrap();
    files.remove(&path);
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(AppState {
            open_files: Mutex::new(HashMap::new()),
        })
        .invoke_handler(tauri::generate_handler![
            open_netcdf_file,
            get_variable_data,
            get_variable_subset,
            close_netcdf_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
