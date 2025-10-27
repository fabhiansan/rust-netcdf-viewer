import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { exportToCSV, exportToJSON, type ExportSettings, defaultExportSettings } from '../utils/export';
import type { Variable, VariableDataResponse } from '../types/netcdf';

interface ExportDialogProps {
  filePath: string;
  variable: Variable;
  onClose: () => void;
}

export function ExportDialog({ filePath, variable, onClose }: ExportDialogProps): React.JSX.Element {
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [settings, setSettings] = useState<ExportSettings>(defaultExportSettings);
  const [exporting, setExporting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const handleExport = async (): Promise<void> => {
    setExporting(true);
    setError(null);
    setSuccess(false);

    try {
      // Fetch variable data
      const data = await invoke<VariableDataResponse>('get_variable_data', {
        path: filePath,
        varName: variable.name,
      });

      // Export based on format
      if (format === 'csv') {
        await exportToCSV(data, variable, settings);
      } else {
        await exportToJSON(data, variable);
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => { e.stopPropagation(); }}>
        <div className="modal-header">
          <h3>Export Variable Data</h3>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="export-info">
            <p>
              <strong>Variable:</strong> {variable.name}
            </p>
            <p>
              <strong>Dimensions:</strong> {variable.dimensions.join(' × ')}
            </p>
            <p>
              <strong>Shape:</strong> {variable.shape.join(' × ')}
            </p>
          </div>

          <div className="form-group">
            <label>Export Format:</label>
            <div className="format-selector">
              <button
                className={format === 'csv' ? 'format-button active' : 'format-button'}
                onClick={() => { setFormat('csv'); }}
              >
                CSV
              </button>
              <button
                className={format === 'json' ? 'format-button active' : 'format-button'}
                onClick={() => { setFormat('json'); }}
                >
                JSON
              </button>
            </div>
          </div>

          {format === 'csv' && (
            <div className="csv-settings">
              <div className="form-group">
                <label>CSV Delimiter:</label>
                <select
                  value={settings.csvDelimiter}
                  onChange={(e) =>
                    { setSettings({ ...settings, csvDelimiter: e.target.value as ',' | ';' | '\t' }); }
                  }
                >
                  <option value=",">Comma (,)</option>
                  <option value=";">Semicolon (;)</option>
                  <option value="\t">Tab</option>
                </select>
              </div>

              <div className="form-group">
                <label>Decimal Precision:</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={settings.decimalPrecision}
                  onChange={(e) =>
                    { setSettings({ ...settings, decimalPrecision: parseInt(e.target.value) }); }
                  }
                />
              </div>

              <div className="form-group">
                <label>Missing Value Placeholder:</label>
                <input
                  type="text"
                  value={settings.missingValuePlaceholder}
                  onChange={(e) =>
                    { setSettings({ ...settings, missingValuePlaceholder: e.target.value }); }
                  }
                />
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.includeMetadataComments}
                    onChange={(e) =>
                      { setSettings({ ...settings, includeMetadataComments: e.target.checked }); }
                    }
                  />
                  Include Metadata Comments
                </label>
              </div>
            </div>
          )}

          {error !== null && <div className="error-message">{error}</div>}
          {success && <div className="success-message">Export completed successfully!</div>}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose} disabled={exporting}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={() => {
              void handleExport();
            }}
            disabled={exporting}
          >
            {exporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  );
}
