import { useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { FileUp, Loader2 } from 'lucide-react';
import { useTauriCommand } from '../hooks/useTauriCommand';
import type { FileMetadata } from '../types/netcdf';

interface FileLoaderProps {
  onFileLoaded: (metadata: FileMetadata) => void;
}

export function FileLoader({ onFileLoaded }: FileLoaderProps): React.JSX.Element {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const { loading, error, execute } = useTauriCommand<FileMetadata>('open_netcdf_file');

  const handleFileSelect = async (): Promise<void> => {
    try {
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: 'NetCDF Files',
            extensions: ['nc', 'nc4', 'netcdf', 'cdf'],
          },
          {
            name: 'All Files',
            extensions: ['*'],
          },
        ],
      });

      if (selected !== null && typeof selected === 'string') {
        setSelectedFile(selected);
        const metadata = await execute({ path: selected });
        if (metadata !== null) {
          onFileLoaded(metadata);
        }
      }
    } catch (err) {
      console.error('Error selecting file:', err);
    }
  };

  return (
    <div className="file-loader">
      <div className="file-loader-content">
        <div className="file-loader-icon">
          <FileUp size={48} />
        </div>
        <h2>Open NetCDF File</h2>
        <p>Select a NetCDF file to visualize and analyze</p>

        <button
          onClick={() => { void handleFileSelect(); }}
          disabled={loading}
          className="btn-primary"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Loading...
            </>
          ) : (
            <>
              <FileUp size={20} />
              Select File
            </>
          )}
        </button>

        {selectedFile !== null && (
          <div className="selected-file">
            <strong>Selected:</strong> {selectedFile}
          </div>
        )}

        {error !== null && (
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        )}

        {loading && (
          <div className="loading-status">
            <Loader2 className="animate-spin" />
            <span>Loading file metadata...</span>
          </div>
        )}
      </div>
    </div>
  );
}
