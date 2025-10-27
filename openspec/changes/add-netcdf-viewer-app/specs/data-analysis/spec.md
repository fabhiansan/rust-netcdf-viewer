# Data Analysis Capability

## ADDED Requirements

### Requirement: Date Range Filtering
The application SHALL provide controls to filter time-series data by date ranges.

#### Scenario: Select date range with calendar picker
- **WHEN** the user opens the date range filter for a time-series variable
- **THEN** the application SHALL display start and end date pickers
- **AND** show the minimum and maximum dates available in the dataset

#### Scenario: Apply date range filter to visualization
- **WHEN** the user selects a start and end date and applies the filter
- **THEN** the application SHALL update the chart to display only data within the selected range
- **AND** update the statistics panel to reflect the filtered data

#### Scenario: Apply date range filter to table view
- **WHEN** a date range filter is active and the user switches to table view
- **THEN** the table SHALL display only rows within the selected date range
- **AND** show the active filter criteria above the table

#### Scenario: Quick date range presets
- **WHEN** the user clicks a preset button (e.g., "Last 30 days", "Last year", "All")
- **THEN** the application SHALL apply the corresponding date range automatically
- **AND** update the date pickers to reflect the selected range

#### Scenario: Clear date range filter
- **WHEN** the user clicks "Clear Filter" or "Reset"
- **THEN** the application SHALL remove the date range filter
- **AND** display the full dataset again

#### Scenario: Handle invalid date ranges
- **WHEN** the user selects a start date after the end date
- **THEN** the application SHALL display a validation error
- **AND** prevent applying the filter until the range is corrected

### Requirement: Value Range Filtering
The application SHALL allow filtering data by minimum and maximum variable values.

#### Scenario: Set value range filter
- **WHEN** the user enters minimum and/or maximum value thresholds
- **THEN** the application SHALL filter data to include only values within the specified range
- **AND** update visualizations and statistics accordingly

#### Scenario: Visual slider for value range
- **WHEN** the user interacts with a range slider for value filtering
- **THEN** the application SHALL dynamically update the filter as the slider moves
- **AND** show the current min/max values next to the slider

#### Scenario: Exclude outliers
- **WHEN** the user selects "Exclude Outliers" option
- **THEN** the application SHALL filter out values beyond 1.5 * IQR (interquartile range)
- **AND** display the number of excluded data points

### Requirement: Trend Analysis - Moving Average
The application SHALL compute and display moving averages for time-series data.

#### Scenario: Calculate simple moving average
- **WHEN** the user enables moving average with a window size (e.g., 7-day)
- **THEN** the application SHALL compute the simple moving average for the selected window
- **AND** overlay the moving average line on the time-series chart

#### Scenario: Adjust moving average window
- **WHEN** the user changes the moving average window size
- **THEN** the application SHALL recalculate the moving average in real-time
- **AND** update the chart without requiring a manual refresh

#### Scenario: Display moving average in table
- **WHEN** the user enables moving average and switches to table view
- **THEN** the table SHALL include an additional column for the moving average values
- **AND** label the column with the window size (e.g., "MA-7")

#### Scenario: Handle edge cases for moving average
- **WHEN** the moving average window extends beyond available data at the start or end
- **THEN** the application SHALL compute partial averages or leave those values as null
- **AND** clearly indicate which values are partial in tooltips

#### Scenario: Toggle moving average on/off
- **WHEN** the user toggles the moving average display
- **THEN** the application SHALL show or hide the moving average line on the chart
- **AND** remember the toggle state for the current session

### Requirement: Trend Analysis - Exponential Moving Average
The application SHALL support exponential moving averages (EMA) for time-series data.

#### Scenario: Calculate exponential moving average
- **WHEN** the user selects "Exponential Moving Average" with a smoothing factor (alpha)
- **THEN** the application SHALL compute the EMA using the formula: EMA_t = alpha * value_t + (1-alpha) * EMA_{t-1}
- **AND** overlay the EMA line on the chart

#### Scenario: Adjust EMA smoothing factor
- **WHEN** the user changes the smoothing factor (alpha between 0 and 1)
- **THEN** the application SHALL recalculate the EMA immediately
- **AND** update the chart to reflect the new smoothing level

#### Scenario: Compare SMA and EMA
- **WHEN** the user enables both simple and exponential moving averages
- **THEN** the application SHALL display both lines on the chart with distinct colors
- **AND** provide a legend indicating which line represents SMA and which represents EMA

### Requirement: Trend Line (Linear Regression)
The application SHALL compute and display linear trend lines for time-series data.

#### Scenario: Calculate linear trend line
- **WHEN** the user enables "Show Trend Line"
- **THEN** the application SHALL compute a linear regression (least squares fit) for the visible data
- **AND** overlay the trend line on the chart

#### Scenario: Display trend equation
- **WHEN** a trend line is active
- **THEN** the application SHALL display the equation (e.g., "y = 0.5x + 10") and R² value
- **AND** position the equation in a non-intrusive location on the chart

#### Scenario: Update trend line with filters
- **WHEN** the user applies a date range or value filter
- **THEN** the application SHALL recalculate the trend line for the filtered subset
- **AND** update the equation and R² accordingly

### Requirement: Data Aggregation
The application SHALL support temporal aggregation of time-series data.

#### Scenario: Aggregate by time period
- **WHEN** the user selects an aggregation period (hourly, daily, weekly, monthly, yearly)
- **THEN** the application SHALL group data by the selected period
- **AND** compute aggregate statistics (mean, sum, min, max, count) for each period

#### Scenario: Display aggregated data in chart
- **WHEN** data is aggregated by time period
- **THEN** the chart SHALL display one data point per period
- **AND** update axis labels to reflect the aggregation level (e.g., "Daily Mean")

#### Scenario: Display aggregated data in table
- **WHEN** aggregation is active and the user switches to table view
- **THEN** the table SHALL show one row per aggregated period
- **AND** include columns for the period start date, aggregated value, and count of original data points

#### Scenario: Choose aggregation function
- **WHEN** the user selects an aggregation function (mean, median, sum, min, max, count)
- **THEN** the application SHALL apply the selected function to each time period
- **AND** label the chart and table to indicate the function used

### Requirement: Anomaly Detection
The application SHALL identify and highlight potential anomalies in time-series data.

#### Scenario: Detect anomalies using standard deviation
- **WHEN** the user enables "Highlight Anomalies" with a threshold (e.g., 2 standard deviations)
- **THEN** the application SHALL identify data points beyond the threshold
- **AND** highlight anomalies on the chart with a distinct marker (e.g., red dot)

#### Scenario: List anomalies in sidebar
- **WHEN** anomalies are detected
- **THEN** the application SHALL display a list of anomaly timestamps and values in a sidebar or panel
- **AND** allow the user to click an anomaly to jump to that point on the chart

#### Scenario: Exclude anomalies from statistics
- **WHEN** the user selects "Exclude Anomalies from Statistics"
- **THEN** the application SHALL recalculate statistics (mean, median, etc.) without the anomalous points
- **AND** display both original and adjusted statistics for comparison

### Requirement: Filter Persistence
The application SHALL remember applied filters and analysis settings during a session.

#### Scenario: Persist filters when switching views
- **WHEN** the user applies filters (date range, value range) in chart view and switches to table view
- **THEN** the filters SHALL remain active in the new view
- **AND** the table SHALL display the same filtered subset

#### Scenario: Persist analysis settings per variable
- **WHEN** the user configures analysis settings (moving average, trend line) for a variable
- **THEN** the application SHALL remember these settings when navigating away and back to the variable
- **AND** restore the settings during the current session

#### Scenario: Reset all filters and analysis
- **WHEN** the user clicks "Reset All"
- **THEN** the application SHALL clear all filters, moving averages, trend lines, and aggregations
- **AND** return to the default view of the full dataset

### Requirement: Analysis Export
The application SHALL allow exporting analyzed/filtered data with annotations.

#### Scenario: Export data with moving average
- **WHEN** the user exports data with an active moving average
- **THEN** the exported file (CSV/JSON) SHALL include both original and moving average values
- **AND** clearly label the moving average column

#### Scenario: Export filtered data with metadata
- **WHEN** the user exports filtered data (e.g., date range applied)
- **THEN** the exported file SHALL include metadata comments describing the applied filters
- **AND** indicate the original dataset size and filtered subset size

#### Scenario: Export anomalies list
- **WHEN** anomalies are detected and the user selects "Export Anomalies"
- **THEN** the application SHALL create a separate file listing all anomaly timestamps and values
- **AND** include the detection threshold used
