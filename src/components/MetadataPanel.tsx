import { useState } from 'react';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';
import type { FileMetadata, Variable } from '../types/netcdf';

interface MetadataPanelProps {
  metadata: FileMetadata;
  onVariableSelect: (variable: Variable) => void;
  selectedVariable: string | null;
}

export function MetadataPanel({
  metadata,
  onVariableSelect,
  selectedVariable,
}: MetadataPanelProps): React.JSX.Element {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    dimensions: true,
    variables: true,
    attributes: false,
  });

  const toggleSection = (section: keyof typeof expandedSections): void => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const filteredVariables = metadata.variables.filter((v) =>
    v.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="metadata-panel">
      <div className="metadata-header">
        <h3>File Metadata</h3>
      </div>

      {/* Search */}
      <div className="search-box">
        <Search size={16} />
        <input
          type="text"
          placeholder="Search variables..."
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); }}
        />
      </div>

      {/* Dimensions Section */}
      <div className="metadata-section">
        <button
          className="section-header"
          onClick={() => { toggleSection('dimensions'); }}
        >
          {expandedSections.dimensions ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <span>Dimensions ({metadata.dimensions.length})</span>
        </button>
        {expandedSections.dimensions && (
          <div className="section-content">
            {metadata.dimensions.map((dim) => (
              <div key={dim.name} className="dimension-item">
                <span className="dim-name">{dim.name}</span>
                <span className="dim-size">
                  {dim.size}{dim.is_unlimited ? ' (unlimited)' : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Variables Section */}
      <div className="metadata-section">
        <button
          className="section-header"
          onClick={() => { toggleSection('variables'); }}
        >
          {expandedSections.variables ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <span>Variables ({filteredVariables.length})</span>
        </button>
        {expandedSections.variables && (
          <div className="section-content">
            {filteredVariables.map((variable) => (
              <div
                key={variable.name}
                className={`variable-item ${selectedVariable === variable.name ? 'selected' : ''}`}
                onClick={() => { onVariableSelect(variable); }}
              >
                <div className="var-name">{variable.name}</div>
                <div className="var-info">
                  <span className="var-type">{variable.data_type}</span>
                  <span className="var-dims">({variable.dimensions.join(', ')})</span>
                </div>
                {(variable.attributes['units'] ?? '') !== '' && (
                  <div className="var-units">{variable.attributes['units']}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Global Attributes Section */}
      <div className="metadata-section">
        <button
          className="section-header"
          onClick={() => { toggleSection('attributes'); }}
        >
          {expandedSections.attributes ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <span>Global Attributes ({Object.keys(metadata.global_attrs).length})</span>
        </button>
        {expandedSections.attributes && (
          <div className="section-content">
            {Object.entries(metadata.global_attrs).map(([key, value]) => (
              <div key={key} className="attr-item">
                <div className="attr-key">{key}:</div>
                <div className="attr-value">{value}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
