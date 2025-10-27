# NetCDF Viewer

A cross-platform desktop application for visualizing and analyzing NetCDF (Network Common Data Form) files, built with Rust (Tauri) and React + TypeScript.

## Features

### 🔍 Generic NetCDF File Loading
- Supports NetCDF-3 Classic and NetCDF-4 (HDF5) formats
- Automatic detection of variables, dimensions, and attributes
- CF-compliant coordinate detection (time, latitude, longitude)
- Display of comprehensive file metadata

### 📊 Interactive Data Visualization
- **Time-Series Charts**: Interactive line charts with Plotly.js
  - Zoom, pan, and hover tooltips
  - Configurable chart types (line, scatter, bar)
  - Customizable axis labels and grid lines
- **Data Tables**: Sortable and filterable tabular view
  - Virtual scrolling for large datasets
  - Column sorting (ascending/descending)
  - Real-time filtering
- **Statistics Panel**: Real-time statistical analysis
  - Min, max, mean, median, standard deviation
  - Percentiles (25th, 50th, 75th)
  - IQR (Interquartile Range)
  - Missing value counts
- **Map View**: Geospatial data visualization (when lat/lon coordinates are available)
  - Interactive Leaflet maps with OpenStreetMap tiles
  - Color-coded markers based on values
  - Zoom and pan controls

### 💾 Data Export
- **CSV Export**: Comma-separated values format
  - Configurable delimiter (comma, semicolon, tab)
  - Adjustable decimal precision
  - Custom missing value placeholders
  - Optional metadata comments in headers
- **JSON Export**: Structured JSON format
  - Includes variable metadata and attributes
  - Properly formatted for programmatic access

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Rust](https://www.rust-lang.org/) (latest stable)
- [pnpm](https://pnpm.io/), [npm](https://www.npmjs.com/), or [yarn](https://yarnpkg.com/)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd netcdf_viewer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run tauri dev
   ```

### Building for Production

Build the application for your platform:

```bash
npm run tauri build
```

This will create platform-specific installers in `src-tauri/target/release/bundle/`.

## Usage

1. **Open a NetCDF File**
   - Click "Select NetCDF File" on the welcome screen
   - Navigate to your `.nc` file and select it

2. **Browse File Metadata**
   - View dimensions, variables, and global attributes in the left sidebar
   - Use the search box to filter variables

3. **Visualize Data**
   - Select a variable from the sidebar
   - Switch between Chart, Table, Statistics, and Map views using tabs
   - Use Chart Controls to customize visualizations

4. **Export Data**
   - Click "Export Data" button in the variable header
   - Choose CSV or JSON format
   - Configure export settings (CSV only)
   - Save to your desired location

## Supported NetCDF Formats

- **NetCDF-3 Classic**: `.nc` files using the classic format
- **NetCDF-4 (HDF5)**: `.nc` files using HDF5 as the underlying storage

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **Backend**: Rust (Tauri 2.x)
- **Charts**: Plotly.js + react-plotly.js
- **Tables**: TanStack Table (React Table v8)
- **Maps**: Leaflet + react-leaflet
- **NetCDF Parsing**: Rust `netcdf` crate (v0.9)

## Project Structure

```
netcdf_viewer/
├── src/                    # Frontend React code
│   ├── components/         # React components
│   ├── hooks/             # Custom React hooks
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions
│   └── App.tsx            # Main application component
├── src-tauri/             # Rust backend
│   ├── src/
│   │   ├── netcdf/        # NetCDF parsing logic
│   │   ├── models.rs      # Data structures
│   │   ├── errors.rs      # Error handling
│   │   └── lib.rs         # Tauri commands
│   └── Cargo.toml         # Rust dependencies
└── package.json           # Node.js dependencies
```

## Development

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint        # Check for issues
npm run lint:fix    # Auto-fix issues
```

### Building

```bash
npm run build       # Build frontend
npm run tauri build # Build complete application
```

## Example: Loading the Sample File

The repository includes a sample NetCDF file: `fsru_mwd_2005-2009.nc`

This file contains ocean wave direction data with:
- **Variable**: `mwd` (mean wave direction in degrees)
- **Dimensions**: `time` (14,608 time points)
- **Time Range**: 2005-2009
- **Units**: Degree true

To visualize this data:
1. Open the application
2. Select `fsru_mwd_2005-2009.nc`
3. Click on the `mwd` variable in the sidebar
4. Explore different views (Chart, Table, Statistics)

## Troubleshooting

### "Failed to load NetCDF file"
- Ensure the file is a valid NetCDF format (`.nc` extension)
- Check file permissions (must have read access)
- Try opening with a NetCDF tool like `ncdump` to verify integrity

### "Map view not available"
- Map view requires latitude and longitude coordinates
- Ensure your NetCDF file follows CF conventions for coordinate naming
- Supported coordinate names: `lat`, `latitude`, `lon`, `longitude`

### Large Files Are Slow
- For files > 1 GB, loading may take time
- Consider using data subsets or filters
- The table view limits display to 1000 rows for performance

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## License

MIT License

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Acknowledgments

- Built with [Tauri](https://tauri.app/)
- Visualization powered by [Plotly.js](https://plotly.com/javascript/)
- NetCDF parsing via [netcdf-rs](https://github.com/georust/netcdf)
