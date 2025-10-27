import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import { invoke } from '@tauri-apps/api/core';
import type { VariableDataResponse, Variable, FileMetadata } from '../types/netcdf';
import 'leaflet/dist/leaflet.css';

interface MapViewProps {
  filePath: string;
  variable: Variable;
  metadata: FileMetadata;
}

interface MapPoint {
  lat: number;
  lon: number;
  value: number;
  index: number;
}

export function MapView({ filePath, variable, metadata }: MapViewProps): React.JSX.Element {
  const [data, setData] = useState<VariableDataResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [mapPoints, setMapPoints] = useState<MapPoint[]>([]);

  // Check if coordinates are available
  const coords = metadata.coordinates;
  const hasLatLon = coords?.lat_var !== null && coords?.lon_var !== null;

  useEffect(() => {
    if (!hasLatLon) return;

    const loadData = async (): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        // Load variable data
        const varResponse = await invoke<VariableDataResponse>('get_variable_data', {
          path: filePath,
          varName: variable.name,
        });

        // Load latitude data
        const latResponse =
          coords?.lat_var !== null && coords?.lat_var !== undefined
            ? await invoke<VariableDataResponse>('get_variable_data', {
                path: filePath,
                varName: coords.lat_var,
              })
            : null;

        // Load longitude data
        const lonResponse =
          coords?.lon_var !== null && coords?.lon_var !== undefined
            ? await invoke<VariableDataResponse>('get_variable_data', {
                path: filePath,
                varName: coords.lon_var,
              })
            : null;

        setData(varResponse);

        // Create map points
        if (latResponse !== null && lonResponse !== null) {
          const points: MapPoint[] = [];
          const maxPoints = 1000; // Limit for performance

          for (let i = 0; i < Math.min(varResponse.values.length, maxPoints); i++) {
            const value = varResponse.values[i];
            const lat = latResponse.values[i];
            const lon = lonResponse.values[i];

            if (
              value !== undefined &&
              lat !== undefined &&
              lon !== undefined &&
              !isNaN(value) &&
              !isNaN(lat) &&
              !isNaN(lon)
            ) {
              points.push({ lat, lon, value, index: i });
            }
          }

          setMapPoints(points);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [filePath, variable.name, coords, hasLatLon]);

  if (!hasLatLon) {
    return (
      <div className="map-unavailable">
        <p>Map view is not available for this variable.</p>
        <p>Latitude and longitude coordinates were not detected in this dataset.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="loading">Loading map data...</div>;
  }

  if (error !== null) {
    return <div className="error">Error loading map data: {error}</div>;
  }

  if (mapPoints.length === 0) {
    return <div className="no-data">No valid geographic data points found</div>;
  }

  // Calculate bounds and center
  const lats = mapPoints.map((p) => p.lat);
  const lons = mapPoints.map((p) => p.lon);
  const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
  const centerLon = (Math.min(...lons) + Math.max(...lons)) / 2;

  const units = variable.attributes['units'] ?? variable.attributes['unit'] ?? '';

  // Determine color based on value (simple heatmap coloring)
  const values = mapPoints.map((p) => p.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);

  const getColor = (value: number): string => {
    if (maxVal === minVal) return '#3388ff';

    const normalized = (value - minVal) / (maxVal - minVal);

    // Blue to red gradient
    const r = Math.floor(255 * normalized);
    const b = Math.floor(255 * (1 - normalized));
    return `rgb(${r}, 0, ${b})`;
  };

  return (
    <div className="map-view">
      <div className="map-info">
        <p>
          Showing {mapPoints.length} points
          {data !== null && data.values.length > mapPoints.length && ` (limited from ${data.values.length})`}
        </p>
      </div>

      <MapContainer
        center={[centerLat, centerLon]}
        zoom={4}
        style={{ height: '500px', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {mapPoints.length === 1 ? (
          // Single point - use marker
          <Marker position={[mapPoints[0]?.lat ?? 0, mapPoints[0]?.lon ?? 0]}>
            <Popup>
              <strong>{variable.name}</strong>
              <br />
              Value: {String(mapPoints[0]?.value.toFixed(4))}
              {units !== '' && ` ${units}`}
              <br />
              Lat: {String(mapPoints[0]?.lat.toFixed(4))}, Lon:{' '}
              {String(mapPoints[0]?.lon.toFixed(4))}
            </Popup>
          </Marker>
        ) : (
          // Multiple points - use circle markers with color coding
          mapPoints.map((point) => (
            <CircleMarker
              key={point.index}
              center={[point.lat, point.lon]}
              radius={6}
              fillColor={getColor(point.value)}
              color="#fff"
              weight={1}
              opacity={1}
              fillOpacity={0.7}
            >
              <Popup>
                <strong>{variable.name}</strong>
                <br />
                Value: {point.value.toFixed(4)}
                {units !== '' && ` ${units}`}
                <br />
                Lat: {point.lat.toFixed(4)}, Lon: {point.lon.toFixed(4)}
                <br />
                Index: {point.index}
              </Popup>
            </CircleMarker>
          ))
        )}
      </MapContainer>

      <div className="map-legend">
        <div className="legend-title">Color Scale</div>
        <div className="legend-gradient">
          <span>Low: {String(minVal.toFixed(2))}</span>
          <div
            style={{
              background: 'linear-gradient(to right, rgb(0,0,255), rgb(255,0,0))',
              height: '20px',
              width: '200px',
              marginLeft: '10px',
              marginRight: '10px',
            }}
          />
          <span>High: {String(maxVal.toFixed(2))}</span>
        </div>
      </div>
    </div>
  );
}
