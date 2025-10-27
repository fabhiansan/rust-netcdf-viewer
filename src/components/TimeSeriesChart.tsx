import { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import { invoke } from '@tauri-apps/api/core';
import type { VariableDataResponse, Variable, FileMetadata } from '../types/netcdf';
import { isNumericData } from '../types/netcdf';

interface TimeSeriesChartProps {
  filePath: string;
  variable: Variable;
  metadata: FileMetadata;
}

export function TimeSeriesChart({ filePath, variable, metadata }: TimeSeriesChartProps): React.JSX.Element {
  const [data, setData] = useState<VariableDataResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async (): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        const response = await invoke<VariableDataResponse>('get_variable_data', {
          path: filePath,
          varName: variable.name,
        });
        setData(response);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [filePath, variable.name]);

  if (loading) {
    return <div className="loading">Loading data...</div>;
  }

  if (error !== null) {
    return <div className="error">Error loading data: {error}</div>;
  }

  if (data === null) {
    return <div className="no-data">No data available</div>;
  }

  // Check if data is numeric - charts only work with numeric data
  if (!isNumericData(data.values)) {
    return <div className="error">Charts are only available for numeric variables. This variable contains text data.</div>;
  }

  // Determine if this is time-series data
  const timeVar = metadata.coordinates?.time_var;
  const isTimeSeries = timeVar !== null && timeVar !== undefined && variable.dimensions.includes(timeVar);

  // Get dimension for x-axis
  const xDimension = variable.dimensions[0] ?? 'index';

  // Create x-axis values
  const xValues = Array.from({ length: data.values.data.length }, (_, i) => i);

  // Get units for axis labels
  const units = variable.attributes['units'] ?? variable.attributes['unit'] ?? '';
  const longName = variable.attributes['long_name'] ?? variable.name;

  return (
    <div className="time-series-chart">
      <Plot
        data={[
          {
            x: xValues,
            y: data.values.data,
            type: 'scatter',
            mode: 'lines+markers',
            marker: { size: 4 },
            name: variable.name,
            hovertemplate:
              `<b>${longName}</b><br>` +
              `Index: %{x}<br>` +
              `Value: %{y}${units !== '' ? ' ' + units : ''}<br>` +
              '<extra></extra>',
          },
        ]}
        layout={{
          title: longName,
          xaxis: {
            title: isTimeSeries ? 'Time' : xDimension,
            showgrid: true,
          },
          yaxis: {
            title: units !== '' ? `${variable.name} (${units})` : variable.name,
            showgrid: true,
          },
          hovermode: 'closest',
          autosize: true,
          margin: { l: 60, r: 40, t: 60, b: 60 },
        }}
        style={{ width: '100%', height: '500px' }}
        config={{
          responsive: true,
          displayModeBar: true,
          modeBarButtonsToRemove: ['select2d', 'lasso2d'],
          toImageButtonOptions: {
            format: 'png',
            filename: `${variable.name}_chart`,
            height: 800,
            width: 1200,
            scale: 2,
          },
        }}
      />
      {data.missing_count > 0 && (
        <div className="data-info">
          <p>Missing values: {data.missing_count} / {data.values.data.length}</p>
        </div>
      )}
    </div>
  );
}
