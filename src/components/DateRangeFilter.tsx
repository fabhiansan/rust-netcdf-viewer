import { useState, useEffect } from 'react';
import { format } from 'date-fns';

export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

export interface DateRangeFilterProps {
  minDate: Date;
  maxDate: Date;
  onFilterChange: (range: DateRange) => void;
  initialRange?: DateRange;
}

type PresetType = 'all' | 'last30' | 'last90' | 'lastyear' | 'custom';

export function DateRangeFilter({
  minDate,
  maxDate,
  onFilterChange,
  initialRange,
}: DateRangeFilterProps): React.JSX.Element {
  const [startDate, setStartDate] = useState<string>(
    initialRange?.startDate ? format(initialRange.startDate, 'yyyy-MM-dd') : ''
  );
  const [endDate, setEndDate] = useState<string>(
    initialRange?.endDate ? format(initialRange.endDate, 'yyyy-MM-dd') : ''
  );
  const [activePreset, setActivePreset] = useState<PresetType>('all');
  const [validationError, setValidationError] = useState<string>('');

  const minDateStr = format(minDate, 'yyyy-MM-dd');
  const maxDateStr = format(maxDate, 'yyyy-MM-dd');

  // Apply filter when dates change
  useEffect(() => {
    // Validate date range
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start > end) {
        setValidationError('Start date must be before or equal to end date');
        return;
      }
    }

    setValidationError('');

    // Emit filter change
    const range: DateRange = {
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    };

    onFilterChange(range);
  }, [startDate, endDate, onFilterChange]);

  const handlePresetClick = (preset: PresetType): void => {
    setActivePreset(preset);

    const now = maxDate; // Use dataset's max date as "now"

    switch (preset) {
      case 'all':
        setStartDate('');
        setEndDate('');
        break;

      case 'last30': {
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        setStartDate(format(Math.max(thirtyDaysAgo.getTime(), minDate.getTime()), 'yyyy-MM-dd'));
        setEndDate(maxDateStr);
        break;
      }

      case 'last90': {
        const ninetyDaysAgo = new Date(now);
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        setStartDate(format(Math.max(ninetyDaysAgo.getTime(), minDate.getTime()), 'yyyy-MM-dd'));
        setEndDate(maxDateStr);
        break;
      }

      case 'lastyear': {
        const oneYearAgo = new Date(now);
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        setStartDate(format(Math.max(oneYearAgo.getTime(), minDate.getTime()), 'yyyy-MM-dd'));
        setEndDate(maxDateStr);
        break;
      }

      case 'custom':
        // Do nothing - user will set custom dates
        break;
    }
  };

  const handleStartDateChange = (value: string): void => {
    setStartDate(value);
    setActivePreset('custom');
  };

  const handleEndDateChange = (value: string): void => {
    setEndDate(value);
    setActivePreset('custom');
  };

  const handleClearFilter = (): void => {
    setStartDate('');
    setEndDate('');
    setActivePreset('all');
    setValidationError('');
  };

  return (
    <div className="date-range-filter">
      <div className="filter-header">
        <h4>Date Range Filter</h4>
        {(startDate || endDate) && (
          <button
            type="button"
            className="clear-filter-button"
            onClick={handleClearFilter}
            title="Clear date range filter"
          >
            Clear
          </button>
        )}
      </div>

      <div className="date-bounds-info">
        <small>
          Dataset range: {format(minDate, 'MMM dd, yyyy')} -{' '}
          {format(maxDate, 'MMM dd, yyyy')}
        </small>
      </div>

      <div className="preset-buttons">
        <button
          type="button"
          className={`preset-button ${activePreset === 'all' ? 'active' : ''}`}
          onClick={() => { handlePresetClick('all'); }}
        >
          All
        </button>
        <button
          type="button"
          className={`preset-button ${activePreset === 'last30' ? 'active' : ''}`}
          onClick={() => { handlePresetClick('last30'); }}
        >
          Last 30 Days
        </button>
        <button
          type="button"
          className={`preset-button ${activePreset === 'last90' ? 'active' : ''}`}
          onClick={() => { handlePresetClick('last90'); }}
        >
          Last 90 Days
        </button>
        <button
          type="button"
          className={`preset-button ${activePreset === 'lastyear' ? 'active' : ''}`}
          onClick={() => { handlePresetClick('lastyear'); }}
        >
          Last Year
        </button>
      </div>

      <div className="date-inputs">
        <div className="date-input-group">
          <label htmlFor="start-date">Start Date</label>
          <input
            type="date"
            id="start-date"
            value={startDate}
            min={minDateStr}
            max={maxDateStr}
            onChange={(e) => { handleStartDateChange(e.target.value); }}
            className="date-input"
          />
        </div>

        <div className="date-input-group">
          <label htmlFor="end-date">End Date</label>
          <input
            type="date"
            id="end-date"
            value={endDate}
            min={minDateStr}
            max={maxDateStr}
            onChange={(e) => { handleEndDateChange(e.target.value); }}
            className="date-input"
          />
        </div>
      </div>

      {validationError && (
        <div className="validation-error" role="alert">
          {validationError}
        </div>
      )}

      {(startDate || endDate) && !validationError && (
        <div className="filter-status">
          <small>
            Showing:{' '}
            {startDate ? format(new Date(startDate), 'MMM dd, yyyy') : 'Start'} -{' '}
            {endDate ? format(new Date(endDate), 'MMM dd, yyyy') : 'End'}
          </small>
        </div>
      )}
    </div>
  );
}
