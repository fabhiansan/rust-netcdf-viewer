import { useEffect, useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table';
import { invoke } from '@tauri-apps/api/core';
import type { VariableDataResponse, Variable } from '../types/netcdf';

interface DataTableProps {
  filePath: string;
  variable: Variable;
}

interface TableRow {
  index: number;
  value: number | string;
  [key: string]: number | string;
}

export function DataTable({ filePath, variable }: DataTableProps): React.JSX.Element {
  const [data, setData] = useState<VariableDataResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

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

  // Convert data to table rows
  const tableData = useMemo<TableRow[]>(() => {
    if (data === null) return [];

    const values = data.values.data; // Access the data array from the discriminated union
    return values.map((value, index) => ({
      index,
      value,
      ...variable.dimensions.reduce<Record<string, number>>((acc, dim) => {
        acc[dim] = index; // Simplified: just use index for now
        return acc;
      }, {}),
    }));
  }, [data, variable.dimensions]);

  // Define columns
  const columns = useMemo<ColumnDef<TableRow>[]>(() => {
    const cols: ColumnDef<TableRow>[] = [
      {
        accessorKey: 'index',
        header: 'Index',
        cell: (info) => info.getValue(),
      },
    ];

    // Add dimension columns
    variable.dimensions.forEach((dim) => {
      if (dim !== 'index') {
        cols.push({
          accessorKey: dim,
          header: dim,
          cell: (info) => info.getValue() as number,
        });
      }
    });

    // Add value column
    const units = variable.attributes['units'] ?? variable.attributes['unit'] ?? '';
    cols.push({
      accessorKey: 'value',
      header: units !== '' ? `Value (${units})` : 'Value',
      cell: (info) => {
        const value = info.getValue();
        if (typeof value === 'string') {
          return value;
        }
        const numValue = value as number;
        return isNaN(numValue) ? 'N/A' : numValue.toFixed(4);
      },
    });

    return cols;
  }, [variable]);

  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  if (loading) {
    return <div className="loading">Loading data...</div>;
  }

  if (error !== null) {
    return <div className="error">Error loading data: {error}</div>;
  }

  if (data === null) {
    return <div className="no-data">No data available</div>;
  }

  const filteredCount = table.getFilteredRowModel().rows.length;
  const totalCount = tableData.length;

  return (
    <div className="data-table">
      <div className="table-info">
        <p>
          Showing {filteredCount} of {totalCount} rows
          {data.missing_count > 0 && ` (${data.missing_count} missing values)`}
        </p>
      </div>

      <div className="table-container">
        <table>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id}>
                    {header.isPlaceholder ? null : (
                      <div>
                        <div
                          className={header.column.getCanSort() ? 'sortable' : ''}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{
                            asc: ' 🔼',
                            desc: ' 🔽',
                          }[header.column.getIsSorted() as string] ?? null}
                        </div>
                        {header.column.getCanFilter() ? (
                          <div className="filter-input">
                            <input
                              type="text"
                              value={(header.column.getFilterValue() ?? '') as string}
                              onChange={(e) => { header.column.setFilterValue(e.target.value); }}
                              placeholder="Filter..."
                            />
                          </div>
                        ) : null}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.slice(0, 1000).map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>
                    {String(flexRender(cell.column.columnDef.cell, cell.getContext()))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {table.getRowModel().rows.length > 1000 && (
          <div className="table-limit-notice">
            Showing first 1000 rows. Use filters to narrow down the data.
          </div>
        )}
      </div>
    </div>
  );
}
