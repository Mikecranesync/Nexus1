import { useState } from 'react';

export interface FilterField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'number';
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export interface FilterValue {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between' | 'in';
  value: string | string[];
  label?: string;
}

export interface FilterBarProps {
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters: FilterValue[];
  onFiltersChange: (filters: FilterValue[]) => void;
  availableFields: FilterField[];
  showAddFilter?: boolean;
}

const OPERATORS = [
  { value: 'equals', label: 'Equals', types: ['text', 'select', 'date', 'number'] },
  { value: 'contains', label: 'Contains', types: ['text'] },
  { value: 'greater_than', label: 'Greater than', types: ['date', 'number'] },
  { value: 'less_than', label: 'Less than', types: ['date', 'number'] },
  { value: 'in', label: 'Is one of', types: ['select'] }
];

export function FilterBar({
  searchPlaceholder = 'Search...',
  searchValue,
  onSearchChange,
  filters,
  onFiltersChange,
  availableFields,
  showAddFilter = true
}: FilterBarProps) {
  const [showAddFilterModal, setShowAddFilterModal] = useState(false);
  const [newFilter, setNewFilter] = useState<Partial<FilterValue>>({
    field: '',
    operator: 'equals',
    value: ''
  });

  const handleAddFilter = () => {
    if (!newFilter.field || !newFilter.value) return;
    
    const field = availableFields.find(f => f.key === newFilter.field);
    const operator = OPERATORS.find(o => o.value === newFilter.operator);
    
    const filter: FilterValue = {
      field: newFilter.field,
      operator: newFilter.operator as FilterValue['operator'],
      value: newFilter.value as string,
      label: `${field?.label} ${operator?.label} ${newFilter.value}`
    };

    onFiltersChange([...filters, filter]);
    setNewFilter({ field: '', operator: 'equals', value: '' });
    setShowAddFilterModal(false);
  };

  const handleRemoveFilter = (index: number) => {
    const newFilters = filters.filter((_, i) => i !== index);
    onFiltersChange(newFilters);
  };

  const handleClearAllFilters = () => {
    onFiltersChange([]);
    onSearchChange('');
  };

  const getAvailableOperators = (fieldType: string) => {
    return OPERATORS.filter(op => op.types.includes(fieldType));
  };

  const selectedField = availableFields.find(f => f.key === newFilter.field);
  const availableOperators = selectedField ? getAvailableOperators(selectedField.type) : [];

  const renderFilterValue = (field: FilterField) => {
    if (field.type === 'select') {
      return (
        <select
          value={newFilter.value as string}
          onChange={(e) => setNewFilter(prev => ({ ...prev, value: e.target.value }))}
          className="filter-input"
        >
          <option value="">Select {field.label}</option>
          {field.options?.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
        value={newFilter.value as string}
        onChange={(e) => setNewFilter(prev => ({ ...prev, value: e.target.value }))}
        placeholder={field.placeholder || `Enter ${field.label}`}
        className="filter-input"
      />
    );
  };

  return (
    <div className="filter-bar">
      <div className="filter-bar-main">
        {/* Search Input */}
        <div className="search-container">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="search-input"
            />
            {searchValue && (
              <button
                className="clear-search-btn"
                onClick={() => onSearchChange('')}
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Quick Filters */}
        <div className="quick-filters">
          {availableFields.slice(0, 3).map(field => {
            if (field.type === 'select' && field.options) {
              return (
                <select
                  key={field.key}
                  className="quick-filter-select"
                  onChange={(e) => {
                    if (e.target.value) {
                      const existingIndex = filters.findIndex(f => f.field === field.key);
                      const newFilter: FilterValue = {
                        field: field.key,
                        operator: 'equals',
                        value: e.target.value,
                        label: `${field.label}: ${field.options?.find(o => o.value === e.target.value)?.label}`
                      };
                      
                      if (existingIndex >= 0) {
                        const newFilters = [...filters];
                        newFilters[existingIndex] = newFilter;
                        onFiltersChange(newFilters);
                      } else {
                        onFiltersChange([...filters, newFilter]);
                      }
                    } else {
                      // Remove filter if "All" is selected
                      const newFilters = filters.filter(f => f.field !== field.key);
                      onFiltersChange(newFilters);
                    }
                  }}
                  value={filters.find(f => f.field === field.key)?.value || ''}
                >
                  <option value="">All {field.label}</option>
                  {field.options.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              );
            }
            return null;
          })}
        </div>

        {/* Add Filter Button */}
        {showAddFilter && (
          <button
            className="add-filter-btn"
            onClick={() => setShowAddFilterModal(true)}
          >
            + Add Filter
          </button>
        )}
      </div>

      {/* Active Filters */}
      {(filters.length > 0 || searchValue) && (
        <div className="active-filters">
          <div className="active-filters-header">
            <span className="filters-count">{filters.length + (searchValue ? 1 : 0)} filter{filters.length + (searchValue ? 1 : 0) !== 1 ? 's' : ''} active</span>
            <button className="clear-all-btn" onClick={handleClearAllFilters}>
              Clear All
            </button>
          </div>
          <div className="filter-tags">
            {searchValue && (
              <div className="filter-tag search-tag">
                <span className="filter-tag-label">Search: "{searchValue}"</span>
                <button
                  className="filter-tag-remove"
                  onClick={() => onSearchChange('')}
                >
                  ×
                </button>
              </div>
            )}
            {filters.map((filter, index) => (
              <div key={index} className="filter-tag">
                <span className="filter-tag-label">{filter.label}</span>
                <button
                  className="filter-tag-remove"
                  onClick={() => handleRemoveFilter(index)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Filter Modal */}
      {showAddFilterModal && (
        <div className="modal-overlay" onClick={() => setShowAddFilterModal(false)}>
          <div className="modal-content add-filter-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Add Filter</h2>
            
            <div className="add-filter-form">
              <div className="form-row">
                <div className="form-field">
                  <label>Field</label>
                  <select
                    value={newFilter.field}
                    onChange={(e) => setNewFilter(prev => ({ 
                      ...prev, 
                      field: e.target.value, 
                      value: '',
                      operator: 'equals' 
                    }))}
                    className="filter-input"
                  >
                    <option value="">Select field</option>
                    {availableFields.map(field => (
                      <option key={field.key} value={field.key}>
                        {field.label}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedField && (
                  <div className="form-field">
                    <label>Condition</label>
                    <select
                      value={newFilter.operator}
                      onChange={(e) => setNewFilter(prev => ({ 
                        ...prev, 
                        operator: e.target.value as FilterValue['operator']
                      }))}
                      className="filter-input"
                    >
                      {availableOperators.map(op => (
                        <option key={op.value} value={op.value}>
                          {op.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {selectedField && (
                  <div className="form-field">
                    <label>Value</label>
                    {renderFilterValue(selectedField)}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-actions">
              <button 
                className="cancel-btn" 
                onClick={() => setShowAddFilterModal(false)}
              >
                Cancel
              </button>
              <button 
                className="confirm-btn" 
                onClick={handleAddFilter}
                disabled={!newFilter.field || !newFilter.value}
              >
                Add Filter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}