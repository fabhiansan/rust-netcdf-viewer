# Implementation Tasks

## 1. Project Setup

- [x] 1.1 Initialize Tauri project with React + TypeScript template
  - Run `npm create tauri-app@latest` with React-TS option
  - Verify project structure (`src/`, `src-tauri/`)

- [x] 1.2 Configure Rust dependencies in `Cargo.toml`
  - Add `netcdf = "0.9"` (latest stable version)
  - Add `serde = { version = "1.0", features = ["derive"] }`
  - Add `serde_json = "1.0"`
  - Add `chrono = "0.4"`
  - Add `thiserror = "2.0"` for error handling

- [x] 1.3 Configure frontend dependencies in `package.json`
  - Add `plotly.js` and `react-plotly.js` for charting
  - Add `leaflet` and `react-leaflet` for map view
  - Add `@tanstack/react-table` for data tables
  - Add `date-fns` for date formatting
  - Add `lucide-react` for icons

- [x] 1.4 Set up Tauri configuration in `tauri.conf.json`
  - Configure app name: "NetCDF Viewer"
  - Set window title and dimensions (1280x800 default)
  - Enable file dialog permissions for opening NetCDF files

- [x] 1.5 Create basic folder structure
  - `src/components/` for React components
  - `src/hooks/` for custom React hooks
  - `src/types/` for TypeScript type definitions
  - `src-tauri/src/netcdf/` for NetCDF parsing logic
  - `src-tauri/src/models.rs` for data structures

## 2. Rust Backend - File Loading

- [x] 2.1 Create `src-tauri/src/models.rs` with data structures
  - Define `FileMetadata` struct (dimensions, variables, global attributes)
  - Define `Dimension` struct (name, size, unlimited flag)
  - Define `Variable` struct (name, data type, dimensions, attributes, shape)
  - Derive `Serialize` for Tauri IPC

- [x] 2.2 Create `src-tauri/src/netcdf/loader.rs` for NetCDF parsing
  - Implement `open_netcdf(path: String) -> Result<FileMetadata, Error>`
  - Extract dimensions with names and sizes
  - Extract variables with metadata (units, long_name, standard_name)
  - Extract global attributes
  - Handle errors (file not found, invalid format, permission denied)

- [x] 2.3 Create `src-tauri/src/netcdf/data_access.rs` for variable data fetching
  - Implement `get_variable_data(path: String, var_name: String) -> Result<Vec<f64>, Error>`
  - Implement `get_variable_subset(path: String, var_name: String, start: Vec<usize>, count: Vec<usize>) -> Result<Vec<f64>, Error>`
  - Handle missing values (_FillValue, NaN)
  - Add data type conversion (handle i32, f32, f64, etc.)

- [x] 2.4 Create `src-tauri/src/netcdf/coordinates.rs` for coordinate detection
  - Implement `detect_time_coordinate(metadata: &FileMetadata) -> Option<String>`
  - Implement `detect_spatial_coordinates(metadata: &FileMetadata) -> Option<(String, String)>`
  - Parse time units (e.g., "seconds since 1970-01-01") using `chrono`
  - Follow CF conventions for coordinate detection

- [x] 2.5 Expose Tauri commands in `src-tauri/src/main.rs`
  - Register `open_netcdf` command
  - Register `get_variable_data` command
  - Register `get_variable_subset` command
  - Register `close_file` command for cleanup

- [x] 2.6 Add file handle caching
  - Create a global state to cache opened NetCDF files (using `Mutex<HashMap<String, File>>`)
  - Implement `close_file` to explicitly close and remove from cache
  - Auto-close previous file when opening a new one

## 3. Frontend - File Loading UI

- [x] 3.1 Create `src/types/netcdf.ts` for TypeScript type definitions
  - Define `FileMetadata`, `Dimension`, `Variable` interfaces matching Rust structs
  - Define `CoordinateInfo` type for detected coordinates

- [x] 3.2 Create `src/hooks/useTauriCommand.ts` for Tauri IPC hook
  - Generic hook for invoking Tauri commands with error handling
  - Add loading and error states

- [x] 3.3 Create `src/components/FileLoader.tsx`
  - Implement file picker button (uses Tauri `open` dialog)
  - Add drag-and-drop zone for NetCDF files
  - Display file loading status (loading spinner)
  - Show error messages for invalid files
  - Call `open_netcdf` Tauri command on file selection

- [x] 3.4 Create `src/components/MetadataPanel.tsx`
  - Display file metadata in a collapsible sidebar
  - Show dimensions list with sizes
  - Show variables list with data types, dimensions, and units
  - Show global attributes as key-value pairs
  - Add search/filter for variables

## 4. Frontend - Data Visualization

- [x] 4.1 Create `src/components/TimeSeriesChart.tsx`
  - Use `react-plotly.js` for interactive line chart
  - Fetch variable data via `get_variable_data` Tauri command
  - Display time on x-axis (convert from seconds since epoch using `date-fns`)
  - Display variable values on y-axis with units label
  - Enable zoom, pan, and hover tooltips
  - Add loading state during data fetch

- [x] 4.2 Create `src/components/DataTable.tsx`
  - Use `@tanstack/react-table` with virtual scrolling
  - Display dimensions as columns (time, lat, lon, value)
  - Implement column sorting (ascending/descending)
  - Add column filtering inputs (min/max value range)
  - Show row count and filtered count

- [x] 4.3 Create `src/components/StatsPanel.tsx`
  - Calculate and display min, max, mean, median, std dev
  - Use Web Workers or Rust backend for calculation on large datasets
  - Update statistics when filters are applied
  - Display count of total and missing values
  - Show percentiles (25th, 50th, 75th)

- [x] 4.4 Create `src/components/MapView.tsx`
  - Use `react-leaflet` for map rendering
  - Detect if lat/lon coordinates exist (via coordinate detection)
  - Plot scalar field as heatmap overlay (use Leaflet heatmap plugin)
  - Handle single-point data (display marker with tooltip)
  - Add zoom and pan controls
  - Display lat/lon tooltip on hover

- [x] 4.5 Create `src/components/ChartControls.tsx`
  - Add chart type selector (line, scatter, bar)
  - Add grid lines toggle
  - Add axis label customization inputs
  - Add "Export Chart as PNG" button (use Plotly's `toImage` API)

- [x] 4.6 Implement responsive layout in `src/App.tsx`
  - Use CSS Grid or Flexbox for main layout
  - Left sidebar for metadata panel
  - Main area with tabs (Chart, Table, Map, Stats)
  - Collapsible sidebar for narrow screens
  - Enforce minimum window size (800x600)

## 5. Frontend - Data Export

- [x] 5.1 Create `src/components/ExportDialog.tsx`
  - Add format selector (CSV, JSON)
  - Add "Export Current Variable" button
  - Add "Export All Variables" button (batch mode)
  - Add "Export Filtered Data" option
  - Display export progress bar for large datasets

- [x] 5.2 Implement CSV export in `src/utils/export.ts`
  - Generate CSV string from variable data
  - Include header row with dimension names
  - Handle missing values (configurable placeholder)
  - Use Tauri `save` dialog to choose file location
  - Write file via Tauri filesystem API
  - Added enhanced `exportTimeSeriesCSV` for time-series data with analysis features

- [x] 5.3 Implement JSON export in `src/utils/export.ts`
  - Generate JSON with metadata and data
  - Structure as `{ metadata: {...}, data: [...] }`
  - Include variable attributes (units, long_name)
  - Handle nested structures for multi-dimensional data
  - Added enhanced `exportTimeSeriesJSON` for time-series data with analysis features

- [x] 5.4 Create `src/components/ExportSettings.tsx`
  - Add CSV delimiter selector (comma, semicolon, tab)
  - Add decimal precision input (number of decimal places)
  - Add missing value placeholder input
  - Add "Include Metadata Comments" checkbox for CSV
  - Store settings in localStorage for persistence
  - Added JSON settings (pretty print, include full metadata)

- [x] 5.5 Implement batch export
  - Loop through selected variables
  - Call export function for each variable
  - Display overall progress (e.g., "Exporting 3 of 10")
  - Handle errors gracefully (show which files failed)

## 6. Frontend - Data Analysis

- [x] 6.1 Create `src/components/DateRangeFilter.tsx`
  - Add start and end date pickers (native HTML5 date input)
  - Display dataset's min/max dates as boundaries
  - Add preset buttons (All, Last 30 days, Last 90 days, Last year)
  - Validate start date < end date with error messaging
  - Apply filter to chart and table views

- [x] 6.2 Create `src/components/ValueRangeFilter.tsx`
  - Add min/max value inputs
  - Add range sliders for visual adjustment
  - Add "Exclude Outliers" checkbox (uses IQR method with 1.5*IQR rule)
  - Apply filter to visualizations
  - Show outlier count and bounds when excluding outliers

- [x] 6.3 Create `src/utils/analysis.ts` for analysis functions
  - Implement `calculateSimpleMovingAverage(data: number[], windowSize: number): (number|null)[]`
  - Implement `calculateExponentialMovingAverage(data: number[], alpha: number): number[]`
  - Implement `calculateLinearTrend(x: number[], y: number[]): TrendResult` with slope, intercept, and R²
  - Implement `aggregateByTimePeriod()` supporting hourly/daily/weekly/monthly/yearly periods
  - Implement `detectAnomalies(data: number[], threshold: number): number[]` using z-score method
  - Added `calculateIQR()` for outlier detection
  - Added `filterByValueRange()` and `filterByDateRange()` utilities

- [x] 6.4 Create `src/components/MovingAverageControl.tsx`
  - Add moving average type selector (None, Simple, Exponential)
  - Add window size input for SMA with quick-select presets
  - Add alpha slider and input for EMA with quick-select presets
  - Add toggle to show/hide moving average line
  - Update chart to overlay moving average line

- [x] 6.5 Create `src/components/TrendLineControl.tsx`
  - Add "Show Trend Line" checkbox
  - Calculate and display trend equation (y = mx + b)
  - Display R² value with interpretation (very strong/strong/moderate/weak/very weak fit)
  - Show trend direction (increasing/decreasing/flat)
  - Display slope and intercept values
  - Added educational explanations for regression analysis

- [x] 6.6 Create `src/components/AggregationControl.tsx`
  - Add time period selector (hourly, daily, weekly, monthly, yearly)
  - Add aggregation function selector (mean, median, sum, min, max, count)
  - Apply aggregation and update chart/table
  - Display aggregation level in axis labels
  - Show function descriptions and examples

- [x] 6.7 Create `src/components/AnomalyDetection.tsx`
  - Add threshold input (standard deviations) with slider
  - Highlight anomalies on chart with severity indicators
  - Display anomaly list with timestamps, values, and z-scores
  - Add "Exclude from Statistics" option
  - Show outlier count and percentage
  - Added quick-select thresholds (1.5σ, 2.0σ, 3.0σ)
  - Severity classification (high/medium/low based on z-score)
  - Educational explanations for anomaly detection

- [x] 6.8 Implement filter persistence
  - Created `AnalysisPanel.tsx` component to manage all analysis state
  - Store active filters in React state with automatic propagation
  - Apply filters across all views (chart, table, map, stats)
  - Add "Reset All" button to clear all filters and analysis
  - Real-time data processing pipeline: filtering → aggregation → analysis
  - Filter summary display showing active filters
  - Data count tracking (total, filtered, aggregated)

## 7. Testing and Validation

- [ ] 7.1 Test file loading with various NetCDF formats
  - Test with NetCDF-3 Classic files
  - Test with NetCDF-4 (HDF5) files
  - Test with large files (> 1 GB)
  - Test with multi-dimensional variables (3D, 4D)
  - Test with missing values and _FillValue attributes

- [ ] 7.2 Test error handling
  - Test with non-NetCDF files (should show error)
  - Test with corrupted NetCDF files
  - Test with files lacking read permissions
  - Test with non-existent file paths

- [ ] 7.3 Test visualizations
  - Verify time-series chart with zoom/pan
  - Verify data table sorting and filtering
  - Verify statistics calculations (manually verify against known values)
  - Verify map view with single-point and multi-point data

- [ ] 7.4 Test export functionality
  - Export to CSV and verify format/content
  - Export to JSON and verify structure
  - Export filtered data and verify subset correctness
  - Test batch export with multiple variables

- [ ] 7.5 Test analysis features
  - Verify date range filter correctness
  - Verify moving average calculations (compare with manual calculation)
  - Verify trend line equation and R² value
  - Verify anomaly detection threshold

- [ ] 7.6 Test cross-platform builds
  - Build for macOS (Apple Silicon and Intel)
  - Build for Windows (x64)
  - Build for Linux (x64)
  - Verify binary size and startup time

## 8. Documentation and Polish

- [ ] 8.1 Write README.md
  - Add project description and features
  - Add installation instructions (download from releases)
  - Add usage guide with screenshots
  - Document supported NetCDF formats
  - Add build instructions for developers

- [ ] 8.2 Create user documentation
  - Quick start guide (how to open a file)
  - Visualization guide (chart types, interactivity)
  - Export guide (CSV/JSON formats)
  - Analysis guide (filters, moving averages, trends)

- [ ] 8.3 Add keyboard shortcuts
  - Ctrl/Cmd+O: Open file
  - Ctrl/Cmd+E: Export current variable
  - Ctrl/Cmd+R: Reset all filters
  - Ctrl/Cmd+Q: Quit application

- [ ] 8.4 Improve error messages
  - Review all error messages for clarity
  - Add actionable suggestions (e.g., "Check file permissions")
  - Display errors in a consistent UI component (toast/notification)

- [ ] 8.5 Add application icon and branding
  - Design app icon (ocean wave or data chart theme)
  - Add icon to Tauri config
  - Generate platform-specific icons (macOS .icns, Windows .ico, Linux .png)

- [ ] 8.6 Set up CI/CD for builds
  - Create GitHub Actions workflow for macOS build
  - Create GitHub Actions workflow for Windows build
  - Create GitHub Actions workflow for Linux build
  - Auto-publish releases with binaries

## 9. Performance Optimization

- [ ] 9.1 Optimize large file loading
  - Implement lazy loading for variable data (load on demand)
  - Add data pagination for tables (virtualization already in place)
  - Stream data in chunks for exports

- [ ] 9.2 Optimize chart rendering
  - Downsample data for initial display (>50k points)
  - Add progressive loading (show partial data, then full resolution)
  - Use Web Workers for data processing if needed

- [ ] 9.3 Add caching
  - Cache parsed metadata to avoid re-reading files
  - Cache calculated statistics for quick retrieval
  - Cache moving averages and trend lines

- [ ] 9.4 Profile and benchmark
  - Measure file open time for various sizes
  - Measure chart render time with different data sizes
  - Optimize bottlenecks identified

## 10. Final Review and Release

- [ ] 10.1 Run full application test suite
  - Verify all features work end-to-end
  - Test on all target platforms (macOS, Windows, Linux)

- [ ] 10.2 Prepare release artifacts
  - Build production binaries for all platforms
  - Create installers (macOS .dmg, Windows .msi, Linux .AppImage/.deb)
  - Generate checksums for binaries

- [ ] 10.3 Create GitHub Release
  - Write release notes with feature list
  - Upload binaries and installers
  - Tag release with version number (e.g., v1.0.0)

- [ ] 10.4 Update project documentation
  - Update README with release download link
  - Add changelog (CHANGELOG.md)
  - Document known issues and limitations

- [ ] 10.5 Archive OpenSpec change proposal
  - Run `openspec archive add-netcdf-viewer-app`
  - Move spec deltas to `openspec/specs/`
  - Update `openspec/project.md` with tech stack and conventions
