# Data Export Capability

## ADDED Requirements

### Requirement: CSV Export
The application SHALL export variable data to CSV (Comma-Separated Values) format.

#### Scenario: Export full variable to CSV
- **WHEN** the user selects "Export to CSV" for a variable
- **THEN** the application SHALL generate a CSV file with dimension columns followed by the variable value column
- **AND** include a header row with column names

#### Scenario: Export filtered data to CSV
- **WHEN** the user has applied filters (e.g., date range, value range) and selects "Export to CSV"
- **THEN** the application SHALL export only the filtered subset of data
- **AND** include a comment or header indicating the applied filters

#### Scenario: Handle multi-dimensional data in CSV
- **WHEN** exporting a 2D or 3D variable to CSV
- **THEN** the application SHALL flatten the data with one row per unique combination of dimension values
- **AND** include all dimension values as separate columns (e.g., time, latitude, longitude, value)

#### Scenario: CSV file naming
- **WHEN** the export is initiated
- **THEN** the application SHALL suggest a filename based on the variable name and current date (e.g., "mwd_2025-10-27.csv")
- **AND** allow the user to customize the filename via a save dialog

#### Scenario: Handle missing values in CSV
- **WHEN** the variable data contains missing values (NaN or _FillValue)
- **THEN** the application SHALL represent missing values as empty cells or a specified placeholder (e.g., "NA")
- **AND** provide an option to choose the missing value representation

### Requirement: JSON Export
The application SHALL export variable data to JSON format with metadata.

#### Scenario: Export variable to JSON
- **WHEN** the user selects "Export to JSON" for a variable
- **THEN** the application SHALL generate a JSON file containing variable data, dimensions, and attributes
- **AND** structure the JSON with a root object containing "metadata" and "data" keys

#### Scenario: Include metadata in JSON export
- **WHEN** exporting to JSON
- **THEN** the application SHALL include variable attributes (units, long_name, standard_name) in the "metadata" object
- **AND** include dimension information (names, sizes, values)

#### Scenario: JSON data structure for 1D data
- **WHEN** exporting a 1D variable (e.g., time-series)
- **THEN** the JSON SHALL structure data as an array of objects with dimension and value keys
- **EXAMPLE**:
  ```json
  {
    "metadata": {"variable": "mwd", "units": "Degree true"},
    "data": [
      {"time": "2005-01-01T00:00:00Z", "value": 123.45},
      {"time": "2005-01-01T06:00:00Z", "value": 130.12}
    ]
  }
  ```

#### Scenario: JSON data structure for multi-dimensional data
- **WHEN** exporting a multi-dimensional variable
- **THEN** the JSON SHALL structure data as nested objects or arrays matching the dimension hierarchy
- **AND** provide a flattened array representation as an alternative

#### Scenario: Handle large datasets in JSON
- **WHEN** exporting a variable with more than 100,000 data points
- **THEN** the application SHALL warn the user about potential file size and memory usage
- **AND** offer to export only the currently visible or filtered subset

### Requirement: Export Progress Indication
The application SHALL provide feedback during export operations.

#### Scenario: Show progress for large exports
- **WHEN** an export operation is estimated to take more than 2 seconds
- **THEN** the application SHALL display a progress bar or spinner
- **AND** show the percentage completed or data rows processed

#### Scenario: Cancel ongoing export
- **WHEN** an export is in progress
- **THEN** the application SHALL provide a cancel button
- **AND** stop the export and clean up partial files if cancel is clicked

#### Scenario: Export completion notification
- **WHEN** an export completes successfully
- **THEN** the application SHALL display a notification with the saved file path
- **AND** provide an option to open the file location in the system file browser

### Requirement: Export Settings and Preferences
The application SHALL allow users to configure export behavior.

#### Scenario: Configure CSV delimiter
- **WHEN** the user opens export settings
- **THEN** the application SHALL allow choosing the CSV delimiter (comma, semicolon, tab)
- **AND** remember the preference for future exports

#### Scenario: Configure decimal precision
- **WHEN** the user opens export settings
- **THEN** the application SHALL allow setting the number of decimal places for floating-point values
- **AND** apply the setting to CSV and JSON exports

#### Scenario: Configure missing value placeholder
- **WHEN** the user opens export settings
- **THEN** the application SHALL allow specifying a custom placeholder for missing values (e.g., "NA", "NULL", "NaN")
- **AND** use the placeholder in CSV exports

#### Scenario: Include or exclude metadata
- **WHEN** exporting to CSV
- **THEN** the application SHALL provide an option to include metadata as header comments (e.g., "#units: Degree true")
- **AND** allow toggling this option on or off

### Requirement: Batch Export
The application SHALL support exporting multiple variables at once.

#### Scenario: Export all variables
- **WHEN** the user selects "Export All Variables"
- **THEN** the application SHALL export each variable to a separate file in the chosen format
- **AND** use a folder picker to select the output directory

#### Scenario: Export selected variables
- **WHEN** the user selects multiple variables and chooses "Export Selected"
- **THEN** the application SHALL export only the selected variables
- **AND** generate one file per variable with the variable name in the filename

#### Scenario: Batch export progress
- **WHEN** a batch export is in progress
- **THEN** the application SHALL display overall progress (e.g., "Exporting variable 3 of 10")
- **AND** show individual file export progress for each variable

### Requirement: Export Error Handling
The application SHALL handle export errors gracefully.

#### Scenario: Insufficient disk space
- **WHEN** an export fails due to insufficient disk space
- **THEN** the application SHALL display an error message indicating the disk space issue
- **AND** suggest freeing disk space or choosing a different location

#### Scenario: File write permission error
- **WHEN** an export fails due to write permission issues
- **THEN** the application SHALL display an error message with the file path
- **AND** suggest choosing a different save location with write permissions

#### Scenario: Invalid characters in filename
- **WHEN** the user enters a filename with invalid characters
- **THEN** the application SHALL replace or remove invalid characters automatically
- **AND** show a warning about the filename modification
