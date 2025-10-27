# Add NetCDF Viewer Desktop Application

## Why

Scientists and researchers working with NetCDF (Network Common Data Form) files currently lack a user-friendly, cross-platform desktop application for visualizing and analyzing their data. The existing file `fsru_mwd_2005-2009.nc` contains ocean wave direction data spanning 2005-2009 with 14,608 time points, which is difficult to explore without specialized tools. A dedicated viewer will enable quick data exploration, visualization, and export without requiring programming knowledge or command-line tools.

## What Changes

This change introduces a complete desktop application built with Rust (Tauri) and modern web technologies:

- **Generic NetCDF File Loading**: Automatic detection and parsing of any NetCDF file format, including variables, dimensions, attributes, and metadata
- **Interactive Data Visualization**:
  - Time series charts with zoom, pan, and hover tooltips
  - Sortable/filterable data table view
  - Real-time statistics panel (min, max, mean, median, std dev)
  - Map view for geospatial data visualization
- **Data Export**: Export filtered/selected data to CSV and JSON formats
- **Analysis Tools**:
  - Date range filtering for time-series data
  - Trend analysis with moving averages
- **Cross-platform**: macOS, Windows, and Linux support via Tauri

## Impact

### Affected Specs
- **NEW** `file-loading` - Generic NetCDF file parsing and metadata extraction
- **NEW** `data-visualization` - Interactive charts, tables, statistics, and maps
- **NEW** `data-export` - Multi-format data export capabilities
- **NEW** `data-analysis` - Filtering and trend analysis tools

### Affected Code
- **NEW** Tauri application structure (`src-tauri/` directory)
- **NEW** Rust backend for NetCDF parsing (`src-tauri/src/netcdf_loader.rs`)
- **NEW** Frontend UI components (`src/` directory)
- **NEW** Build configuration (`tauri.conf.json`, `Cargo.toml`)

### Dependencies
- Rust crates: `tauri`, `netcdf` (or `hdf5-rust`), `serde`, `chrono`
- Frontend: React/Svelte/Vue + charting library (Plotly.js/Chart.js)
- Build tools: Node.js, npm/pnpm/yarn

### Breaking Changes
None - this is a new application.

### Migration Path
Not applicable - new capability.
