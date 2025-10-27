import { useState, useEffect } from 'react';

export interface CSVExportSettings {
  delimiter: 'comma' | 'semicolon' | 'tab';
  decimalPlaces: number;
  missingValuePlaceholder: string;
  includeMetadataComments: boolean;
}

export interface JSONExportSettings {
  prettyPrint: boolean;
  includeFullMetadata: boolean;
}

export interface ExportSettingsProps {
  format: 'csv' | 'json';
  onSettingsChange: (settings: CSVExportSettings | JSONExportSettings) => void;
}

const DEFAULT_CSV_SETTINGS: CSVExportSettings = {
  delimiter: 'comma',
  decimalPlaces: 2,
  missingValuePlaceholder: 'NA',
  includeMetadataComments: true,
};

const DEFAULT_JSON_SETTINGS: JSONExportSettings = {
  prettyPrint: true,
  includeFullMetadata: true,
};

const STORAGE_KEY_CSV = 'netcdf-viewer-export-csv-settings';
const STORAGE_KEY_JSON = 'netcdf-viewer-export-json-settings';

export function ExportSettings({
  format,
  onSettingsChange,
}: ExportSettingsProps): React.JSX.Element {
  // CSV Settings
  const [delimiter, setDelimiter] = useState<'comma' | 'semicolon' | 'tab'>(
    DEFAULT_CSV_SETTINGS.delimiter
  );
  const [decimalPlaces, setDecimalPlaces] = useState<number>(
    DEFAULT_CSV_SETTINGS.decimalPlaces
  );
  const [missingValuePlaceholder, setMissingValuePlaceholder] = useState<string>(
    DEFAULT_CSV_SETTINGS.missingValuePlaceholder
  );
  const [includeMetadataComments, setIncludeMetadataComments] = useState<boolean>(
    DEFAULT_CSV_SETTINGS.includeMetadataComments
  );

  // JSON Settings
  const [prettyPrint, setPrettyPrint] = useState<boolean>(
    DEFAULT_JSON_SETTINGS.prettyPrint
  );
  const [includeFullMetadata, setIncludeFullMetadata] = useState<boolean>(
    DEFAULT_JSON_SETTINGS.includeFullMetadata
  );

  // Load settings from localStorage on mount
  useEffect(() => {
    if (format === 'csv') {
      const savedSettings = localStorage.getItem(STORAGE_KEY_CSV);
      if (savedSettings) {
        try {
          const parsed: CSVExportSettings = JSON.parse(savedSettings);
          setDelimiter(parsed.delimiter);
          setDecimalPlaces(parsed.decimalPlaces);
          setMissingValuePlaceholder(parsed.missingValuePlaceholder);
          setIncludeMetadataComments(parsed.includeMetadataComments);
        } catch (error) {
          console.error('Failed to parse saved CSV settings:', error);
        }
      }
    } else {
      const savedSettings = localStorage.getItem(STORAGE_KEY_JSON);
      if (savedSettings) {
        try {
          const parsed: JSONExportSettings = JSON.parse(savedSettings);
          setPrettyPrint(parsed.prettyPrint);
          setIncludeFullMetadata(parsed.includeFullMetadata);
        } catch (error) {
          console.error('Failed to parse saved JSON settings:', error);
        }
      }
    }
  }, [format]);

  // Emit settings changes
  useEffect(() => {
    if (format === 'csv') {
      const settings: CSVExportSettings = {
        delimiter,
        decimalPlaces,
        missingValuePlaceholder,
        includeMetadataComments,
      };
      onSettingsChange(settings);
      // Save to localStorage
      localStorage.setItem(STORAGE_KEY_CSV, JSON.stringify(settings));
    } else {
      const settings: JSONExportSettings = {
        prettyPrint,
        includeFullMetadata,
      };
      onSettingsChange(settings);
      // Save to localStorage
      localStorage.setItem(STORAGE_KEY_JSON, JSON.stringify(settings));
    }
  }, [
    format,
    delimiter,
    decimalPlaces,
    missingValuePlaceholder,
    includeMetadataComments,
    prettyPrint,
    includeFullMetadata,
    onSettingsChange,
  ]);

  const handleDelimiterChange = (value: 'comma' | 'semicolon' | 'tab'): void => {
    setDelimiter(value);
  };

  const handleDecimalPlacesChange = (value: string): void => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 0 && num <= 10) {
      setDecimalPlaces(num);
    }
  };

  const handleResetCSV = (): void => {
    setDelimiter(DEFAULT_CSV_SETTINGS.delimiter);
    setDecimalPlaces(DEFAULT_CSV_SETTINGS.decimalPlaces);
    setMissingValuePlaceholder(DEFAULT_CSV_SETTINGS.missingValuePlaceholder);
    setIncludeMetadataComments(DEFAULT_CSV_SETTINGS.includeMetadataComments);
  };

  const handleResetJSON = (): void => {
    setPrettyPrint(DEFAULT_JSON_SETTINGS.prettyPrint);
    setIncludeFullMetadata(DEFAULT_JSON_SETTINGS.includeFullMetadata);
  };

  const getDelimiterChar = (delim: 'comma' | 'semicolon' | 'tab'): string => {
    return delim === 'comma' ? ',' : delim === 'semicolon' ? ';' : '\\t';
  };

  return (
    <div className="export-settings">
      <div className="settings-header">
        <h4>Export Settings ({format.toUpperCase()})</h4>
        <button
          type="button"
          className="reset-button-small"
          onClick={format === 'csv' ? handleResetCSV : handleResetJSON}
          title="Reset to default settings"
        >
          Reset
        </button>
      </div>

      {format === 'csv' ? (
        /* CSV Settings */
        <div className="csv-settings">
          {/* Delimiter */}
          <div className="setting-group">
            <label>Delimiter Character</label>
            <div className="radio-group-horizontal">
              <label className="radio-label">
                <input
                  type="radio"
                  name="delimiter"
                  value="comma"
                  checked={delimiter === 'comma'}
                  onChange={() => { handleDelimiterChange('comma'); }}
                />
                <span>Comma (,)</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="delimiter"
                  value="semicolon"
                  checked={delimiter === 'semicolon'}
                  onChange={() => { handleDelimiterChange('semicolon'); }}
                />
                <span>Semicolon (;)</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="delimiter"
                  value="tab"
                  checked={delimiter === 'tab'}
                  onChange={() => { handleDelimiterChange('tab'); }}
                />
                <span>Tab (\t)</span>
              </label>
            </div>
            <small className="setting-hint">
              Current delimiter: <code>{getDelimiterChar(delimiter)}</code>
            </small>
          </div>

          {/* Decimal Places */}
          <div className="setting-group">
            <label htmlFor="decimal-places">Decimal Places</label>
            <input
              type="number"
              id="decimal-places"
              value={decimalPlaces}
              min={0}
              max={10}
              onChange={(e) => { handleDecimalPlacesChange(e.target.value); }}
              className="number-input"
            />
            <small className="setting-hint">
              Number of digits after decimal point (0-10)
            </small>
          </div>

          {/* Missing Value Placeholder */}
          <div className="setting-group">
            <label htmlFor="missing-placeholder">Missing Value Placeholder</label>
            <input
              type="text"
              id="missing-placeholder"
              value={missingValuePlaceholder}
              onChange={(e) => { setMissingValuePlaceholder(e.target.value); }}
              className="text-input"
              placeholder="NA"
            />
            <small className="setting-hint">
              Text to use for missing or NaN values. Common choices: NA, NULL, -, (empty)
            </small>
          </div>

          {/* Include Metadata Comments */}
          <div className="setting-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={includeMetadataComments}
                onChange={(e) => { setIncludeMetadataComments(e.target.checked); }}
              />
              <span>Include metadata as comments in header</span>
            </label>
            <small className="setting-hint setting-hint-indented">
              Add variable attributes and export info as CSV comments (lines starting with #)
            </small>
          </div>

          {/* Preview */}
          <div className="export-preview">
            <strong>Example CSV Header:</strong>
            <pre className="preview-code">
              {includeMetadataComments && `# Variable: sample_variable\n# Units: degrees\n# Export Date: ${new Date().toISOString()}\n`}
              time{getDelimiterChar(delimiter)}value\n
              2005-01-01T00:00:00Z{getDelimiterChar(delimiter)}{(123.456).toFixed(decimalPlaces)}\n
              2005-01-01T06:00:00Z{getDelimiterChar(delimiter)}{missingValuePlaceholder}
            </pre>
          </div>
        </div>
      ) : (
        /* JSON Settings */
        <div className="json-settings">
          {/* Pretty Print */}
          <div className="setting-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={prettyPrint}
                onChange={(e) => { setPrettyPrint(e.target.checked); }}
              />
              <span>Pretty Print (formatted with indentation)</span>
            </label>
            <small className="setting-hint setting-hint-indented">
              Format JSON with indentation and newlines for better readability.
              Disable for smaller file size.
            </small>
          </div>

          {/* Include Full Metadata */}
          <div className="setting-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={includeFullMetadata}
                onChange={(e) => { setIncludeFullMetadata(e.target.checked); }}
              />
              <span>Include full metadata (attributes, dimensions, etc.)</span>
            </label>
            <small className="setting-hint setting-hint-indented">
              Include comprehensive metadata about the variable, dimensions, and attributes.
              Disable to export data values only.
            </small>
          </div>

          {/* Preview */}
          <div className="export-preview">
            <strong>Example JSON Structure:</strong>
            <pre className="preview-code">
              {prettyPrint
                ? JSON.stringify(
                    {
                      metadata: includeFullMetadata
                        ? {
                            variable: 'sample_variable',
                            units: 'degrees',
                            dimensions: ['time'],
                          }
                        : undefined,
                      data: [
                        { time: '2005-01-01T00:00:00Z', value: 123.45 },
                        { time: '2005-01-01T06:00:00Z', value: 130.12 },
                      ],
                    },
                    null,
                    2
                  )
                : JSON.stringify({
                    data: [
                      { time: '2005-01-01T00:00:00Z', value: 123.45 },
                      { time: '2005-01-01T06:00:00Z', value: 130.12 },
                    ],
                  })}
            </pre>
          </div>
        </div>
      )}

      <div className="settings-info">
        <small>
          <strong>Note:</strong> Settings are automatically saved and will be used for future exports.
        </small>
      </div>
    </div>
  );
}
