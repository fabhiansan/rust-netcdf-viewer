# File Loading Capability

## ADDED Requirements

### Requirement: NetCDF File Opening
The application SHALL provide a mechanism to open and parse NetCDF files in both NetCDF-3 and NetCDF-4 (HDF5) formats.

#### Scenario: Open valid NetCDF file
- **WHEN** the user selects a valid NetCDF file via file picker or drag-and-drop
- **THEN** the application SHALL parse the file and extract metadata (dimensions, variables, attributes)
- **AND** display the metadata in the UI within 2 seconds for files under 100 MB

#### Scenario: Open invalid file
- **WHEN** the user selects a file that is not a valid NetCDF file
- **THEN** the application SHALL display an error message indicating the file format is unsupported
- **AND** provide guidance on expected file formats (NetCDF-3, NetCDF-4/HDF5)

#### Scenario: Open corrupted NetCDF file
- **WHEN** the user selects a corrupted NetCDF file
- **THEN** the application SHALL display an error message with details from the parser
- **AND** allow the user to attempt opening a different file without restarting the application

### Requirement: Metadata Extraction
The application SHALL extract and display comprehensive metadata from opened NetCDF files.

#### Scenario: Display dimensions
- **WHEN** a NetCDF file is successfully opened
- **THEN** the application SHALL display all dimensions with their names and sizes
- **AND** indicate which dimension is unlimited (if any)

#### Scenario: Display variables
- **WHEN** a NetCDF file is successfully opened
- **THEN** the application SHALL list all variables with their names, data types, dimensions, and shapes
- **AND** display variable-specific attributes (units, long_name, standard_name, etc.)

#### Scenario: Display global attributes
- **WHEN** a NetCDF file is successfully opened
- **THEN** the application SHALL display all global attributes as key-value pairs
- **AND** handle common metadata conventions (CF, COARDS)

### Requirement: Variable Data Access
The application SHALL provide efficient access to variable data without loading entire datasets into memory.

#### Scenario: Fetch full variable data for small variables
- **WHEN** the user selects a variable with fewer than 10,000 data points
- **THEN** the application SHALL load the entire variable data into memory
- **AND** provide the data to visualization components

#### Scenario: Fetch subset of large variable
- **WHEN** the user selects a variable with more than 10,000 data points
- **THEN** the application SHALL support fetching data subsets by dimension ranges (e.g., time slices)
- **AND** avoid loading the entire variable into memory

#### Scenario: Handle missing values
- **WHEN** variable data contains missing/fill values (NaN, _FillValue attribute)
- **THEN** the application SHALL correctly identify and represent missing values
- **AND** exclude them from statistical calculations and visualizations

### Requirement: File Handle Management
The application SHALL manage file handles efficiently to support large files and prevent resource leaks.

#### Scenario: Close file on new file open
- **WHEN** the user opens a new NetCDF file while another file is already open
- **THEN** the application SHALL close the previous file handle
- **AND** release associated memory before opening the new file

#### Scenario: Persist file handle during exploration
- **WHEN** the user navigates between different variables in the same file
- **THEN** the application SHALL keep the file handle open
- **AND** avoid re-parsing metadata

#### Scenario: Application exit cleanup
- **WHEN** the application is closed
- **THEN** all open NetCDF file handles SHALL be properly closed
- **AND** temporary resources SHALL be released

### Requirement: Coordinate Variable Detection
The application SHALL automatically detect coordinate variables following CF conventions.

#### Scenario: Detect time coordinate
- **WHEN** a variable has a dimension named "time" or an attribute `standard_name="time"`
- **THEN** the application SHALL mark it as a time coordinate
- **AND** parse the time units (e.g., "seconds since 1970-01-01") for conversion to human-readable dates

#### Scenario: Detect spatial coordinates
- **WHEN** variables have standard_name "latitude" or "longitude" (or similar naming)
- **THEN** the application SHALL mark them as spatial coordinates
- **AND** enable map-based visualization if both lat and lon are present

#### Scenario: Handle non-standard coordinate naming
- **WHEN** coordinate variables do not follow CF conventions
- **THEN** the application SHALL attempt heuristic detection based on variable names and units
- **AND** allow manual coordinate selection by the user if auto-detection fails

### Requirement: Error Reporting
The application SHALL provide clear, actionable error messages for file loading failures.

#### Scenario: File not found
- **WHEN** the user attempts to open a file path that does not exist
- **THEN** the application SHALL display "File not found: [path]"
- **AND** suggest checking the file path or permissions

#### Scenario: Permission denied
- **WHEN** the user attempts to open a file without read permissions
- **THEN** the application SHALL display "Permission denied: Cannot read [filename]"
- **AND** suggest checking file permissions

#### Scenario: Unsupported NetCDF version
- **WHEN** the file uses a NetCDF format not supported by the parser
- **THEN** the application SHALL display "Unsupported NetCDF format: [version details]"
- **AND** provide information on supported formats (NetCDF-3, NetCDF-4)
