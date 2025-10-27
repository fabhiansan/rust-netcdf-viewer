# Design: NetCDF Viewer Desktop Application

## Context

NetCDF (Network Common Data Form) is a binary format widely used in scientific computing for storing multi-dimensional array data. The HDF5 format is the underlying container for NetCDF-4 files. Users need a cross-platform desktop application to visualize and analyze NetCDF data without command-line tools or programming.

### Constraints
- Must support generic NetCDF files (not just wave data)
- Cross-platform: macOS, Windows, Linux
- Desktop application (not web-based)
- Minimal installation footprint
- Interactive visualization with modern UX

### Stakeholders
- Scientists and researchers working with NetCDF data
- Data analysts exploring oceanographic, meteorological, or climate data
- Students learning about scientific data formats

## Goals / Non-Goals

### Goals
- Generic NetCDF file parser supporting NetCDF-3 and NetCDF-4 (HDF5)
- Interactive time-series visualization with zoom, pan, tooltips
- Data table with sorting and filtering
- Statistics dashboard showing key metrics
- Map view for geospatial data (lat/lon)
- Export to CSV and JSON
- Date range filtering
- Trend analysis (moving averages)

### Non-Goals
- Real-time data streaming or live updates
- Multi-file comparison or overlay
- Advanced statistical analysis (regression, correlation)
- 3D visualization or volumetric rendering
- Cloud storage integration
- Collaborative features or sharing

## Decisions

### Decision 1: Tauri Framework
**Choice**: Use Tauri 1.x for desktop application framework

**Why**:
- Small binary size (~5-10 MB vs Electron's 100+ MB)
- Rust backend provides memory safety and performance for NetCDF parsing
- Native OS webview (no bundled Chromium)
- Built-in IPC between Rust and frontend
- Active community and good documentation

**Alternatives Considered**:
- **Electron**: Rejected due to large bundle size and memory overhead
- **Native Qt/GTK**: Rejected due to complexity of cross-platform UI development
- **Web-only (PWA)**: Rejected - requires server, cannot access local filesystem securely

### Decision 2: Rust netcdf Crate
**Choice**: Use the `netcdf` crate for parsing NetCDF files

**Why**:
- Pure Rust implementation with HDF5 support via `hdf5-rust`
- Type-safe API with compile-time guarantees
- Zero-copy access to array data
- Automatic detection of dimensions, variables, and attributes

**Alternatives Considered**:
- **hdf5-rust directly**: Rejected - lower-level, requires manual NetCDF convention handling
- **FFI to C libnetcdf**: Rejected - harder to cross-compile, unsafe FFI boundary
- **Python bridge (PyO3)**: Rejected - adds Python runtime dependency

### Decision 3: Frontend Stack
**Choice**: React + TypeScript + Plotly.js

**Why**:
- **React**: Component model fits modular UI design
- **TypeScript**: Type safety for data structures and Tauri IPC
- **Plotly.js**: Interactive charts with built-in zoom, pan, tooltips; good for scientific data

**Alternatives Considered**:
- **Svelte**: Rejected - smaller ecosystem, less familiar to contributors
- **Vue**: Rejected - similar tradeoffs to React, chose React for larger community
- **Chart.js**: Rejected - less feature-rich for scientific visualization
- **D3.js**: Rejected - lower-level, steeper learning curve

### Decision 4: Data Flow Architecture
**Choice**: Rust backend owns data, frontend requests slices via Tauri commands

**Why**:
- NetCDF files can be large (100s of MB to GBs); avoid loading entire dataset into frontend memory
- Rust backend caches opened file handles and metadata
- Frontend requests specific variable slices (e.g., time range, single variable)
- Keeps UI responsive during large data operations

**Data Flow**:
```
User selects file
    ↓
Tauri command: open_netcdf(path) → Rust
    ↓
Rust parses metadata (dimensions, variables, attrs)
    ↓
Returns metadata JSON to frontend
    ↓
Frontend displays variable list, dimensions
    ↓
User selects variable + time range
    ↓
Tauri command: get_variable_data(var, range) → Rust
    ↓
Rust reads subset, converts to JSON-serializable format
    ↓
Frontend renders chart/table
```

### Decision 5: Map Visualization Strategy
**Choice**: Use Leaflet.js for lat/lon map overlay

**Why**:
- Lightweight, mobile-friendly
- Easy integration with Plotly or standalone
- Tile layer support for geographic context
- Heatmap plugin for scalar fields

**Approach**:
- Detect if dataset has `latitude` and `longitude` dimensions
- If present, enable map view tab
- Plot scalar values as markers or heatmap overlay

## Architecture

### Directory Structure
```
netcdf_viewer/
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── main.rs         # Tauri app entry point
│   │   ├── netcdf_loader.rs # NetCDF parsing logic
│   │   ├── commands.rs     # Tauri command handlers
│   │   └── models.rs       # Data structures (metadata, variable info)
│   ├── Cargo.toml
│   └── tauri.conf.json
├── src/                    # Frontend (React + TypeScript)
│   ├── components/
│   │   ├── FileLoader.tsx   # File picker UI
│   │   ├── MetadataPanel.tsx # Display dimensions, variables, attributes
│   │   ├── TimeSeriesChart.tsx # Plotly time-series chart
│   │   ├── DataTable.tsx    # Sortable/filterable table
│   │   ├── StatsPanel.tsx   # Min/max/mean/median display
│   │   ├── MapView.tsx      # Leaflet map for geospatial data
│   │   └── ExportDialog.tsx # CSV/JSON export UI
│   ├── App.tsx
│   └── main.tsx
├── package.json
└── tsconfig.json
```

### Key Components

#### Rust Backend (`netcdf_loader.rs`)
```rust
pub struct NetCDFFile {
    path: PathBuf,
    file: netcdf::File,
    metadata: FileMetadata,
}

#[derive(Serialize)]
pub struct FileMetadata {
    dimensions: Vec<Dimension>,
    variables: Vec<Variable>,
    global_attrs: HashMap<String, String>,
}

pub fn open_file(path: &str) -> Result<FileMetadata, Error>;
pub fn get_variable_data(path: &str, var: &str, range: Option<Range>) -> Result<Vec<f64>, Error>;
```

#### Frontend Components
- **FileLoader**: Drag-drop or file picker, calls `open_netcdf` command
- **MetadataPanel**: Displays file structure (left sidebar)
- **TimeSeriesChart**: Plotly.js line chart with interactivity
- **DataTable**: React Table with virtualization for large datasets
- **StatsPanel**: Real-time statistics on filtered data
- **MapView**: Leaflet map with heatmap overlay
- **ExportDialog**: Download CSV/JSON via Tauri save dialog

## Risks / Trade-offs

### Risk 1: Large File Performance
**Risk**: Loading multi-GB NetCDF files may be slow or exhaust memory

**Mitigation**:
- Stream data in chunks, never load entire variable into memory
- Use lazy loading: only fetch data for current view (time range, variable)
- Add progress indicators for long operations
- Consider memory-mapped file access if needed

**Trade-off**: More complex data fetching logic, but better UX for large files

### Risk 2: NetCDF Format Variations
**Risk**: NetCDF files have many conventions (CF, COARDS, custom); may not parse all correctly

**Mitigation**:
- Start with CF-compliant files (most common in climate science)
- Fallback to raw variable display if conventions not recognized
- Display warnings for unknown attributes/conventions
- Allow manual dimension/coordinate selection

**Trade-off**: May not perfectly handle all edge cases initially, but extensible

### Risk 3: Tauri Learning Curve
**Risk**: Team may be unfamiliar with Tauri/Rust

**Mitigation**:
- Follow official Tauri guides and templates
- Keep Rust backend logic simple (mostly NetCDF I/O)
- Most development work in familiar React/TypeScript
- Incremental implementation: start with basic file loading, add features progressively

**Trade-off**: Slower initial development, but long-term maintainability gains

### Risk 4: Cross-platform Build Complexity
**Risk**: Different OS require different build setups (especially for HDF5/NetCDF libraries)

**Mitigation**:
- Use `netcdf` crate with `static` feature to avoid runtime dependencies
- Set up CI/CD with GitHub Actions for all platforms
- Provide pre-built binaries via GitHub Releases
- Document build process for each OS

**Trade-off**: CI/CD setup effort, but ensures consistent user experience

## Migration Plan

Not applicable - this is a new application with no existing users.

### Deployment Strategy
1. Build binaries for macOS (Apple Silicon + Intel), Windows (x64), Linux (x64)
2. Create GitHub Release with downloadable installers
3. Provide installation instructions in README
4. Optional: Submit to package managers (Homebrew, Chocolatey, apt/flatpak)

### Rollback
If critical bugs discovered post-release:
1. Mark GitHub Release as "pre-release"
2. Fix issues in new PR
3. Release patched version
4. No data migration concerns (application is stateless)

## Open Questions

1. **Should we support NetCDF-3 Classic format?**
   - **Decision needed**: The `netcdf` crate supports both, but NetCDF-4 (HDF5) is more common. Start with NetCDF-4, add NetCDF-3 if requested.

2. **What level of CF Convention compliance do we enforce?**
   - **Decision needed**: Display warnings for non-compliant files but still allow viewing. Document which conventions we support.

3. **Should map view support projections other than WGS84?**
   - **Decision needed**: Start with WGS84 (lat/lon), add projection support if needed. Most scientific data uses geographic coordinates.

4. **Export format for multi-dimensional data?**
   - **Decision needed**: For 1D/2D data, CSV is fine. For higher dimensions, default to JSON or NetCDF export. Document limitations.

5. **Should we cache parsed data to avoid re-reading files?**
   - **Decision needed**: Implement simple in-memory cache for current file, clear on file close. Add disk cache later if needed.

## Future Enhancements (Out of Scope)

- Multi-file comparison/overlay
- 3D visualization for volumetric data
- Animation/playback for time-series
- Plugin system for custom data loaders
- Cloud storage integration (S3, Google Drive)
- Collaborative annotations/sharing
