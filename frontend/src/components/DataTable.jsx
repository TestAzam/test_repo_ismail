import React, { useState } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Search, Filter } from 'lucide-react';

const DataTable = ({
  data = [],
  columns = [],
  loading = false,
  pagination = null,
  onSort = null,
  onPageChange = null,
  onPageSizeChange = null,
  searchable = false,
  searchValue = '',
  onSearchChange = null,
  filterable = false,
  onFilterClick = null,
  selectable = false,
  selectedRows = [],
  onRowSelect = null,
  onSelectAll = null,
  emptyMessage = 'Нет данных для отображения',
  className = ''
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Handle local sorting if onSort is not provided
  const handleSort = (key) => {
    if (onSort) {
      onSort(key, sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc');
    } else {
      let direction = 'asc';
      if (sortConfig.key === key && sortConfig.direction === 'asc') {
        direction = 'desc';
      }
      setSortConfig({ key, direction });
    }
  };

  // Get sorted data for local sorting
  const getSortedData = () => {
    if (!sortConfig.key || onSort) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue, 'ru')
          : bValue.localeCompare(aValue, 'ru');
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const sortedData = getSortedData();

  const renderSortIcon = (columnKey) => {
    const currentKey = onSort ? null : sortConfig.key;
    if (currentKey !== columnKey) {
      return <ChevronUp className="w-4 h-4 text-gray-300" />;
    }
    
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-300" />
      : <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-300" />;
  };

  const handleRowSelect = (rowIndex, checked) => {
    if (onRowSelect) {
      onRowSelect(rowIndex, checked);
    }
  };

  const handleSelectAll = (checked) => {
    if (onSelectAll) {
      onSelectAll(checked);
    }
  };

  const isAllSelected = selectedRows.length === data.length && data.length > 0;
  const isIndeterminate = selectedRows.length > 0 && selectedRows.length < data.length;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Table controls */}
      {(searchable || filterable) && (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {searchable && (
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder="Поиск..."
                className="form-input pl-10"
              />
            </div>
          )}
          
          {filterable && (
            <button
              onClick={onFilterClick}
              className="btn-outline flex items-center"
            >
              <Filter className="w-4 h-4 mr-2" />
              Фильтры
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead className="table-header">
            <tr>
              {selectable && (
                <th className="table-header-cell w-4">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = isIndeterminate;
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="form-checkbox"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`table-header-cell ${column.sortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600' : ''}`}
                  onClick={column.sortable ? () => handleSort(column.key) : undefined}
                  style={column.width ? { width: column.width } : {}}
                >
                  <div className="flex items-center justify-between">
                    <span>{column.label}</span>
                    {column.sortable && renderSortIcon(column.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="table-body">
            {loading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index} className="table-row">
                  {selectable && (
                    <td className="table-cell">
                      <div className="skeleton w-4 h-4"></div>
                    </td>
                  )}
                  {columns.map((column) => (
                    <td key={column.key} className="table-cell">
                      <div className="skeleton skeleton-text"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : sortedData.length > 0 ? (
              sortedData.map((row, rowIndex) => (
                <tr key={row.id || rowIndex} className="table-row">
                  {selectable && (
                    <td className="table-cell">
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(rowIndex)}
                        onChange={(e) => handleRowSelect(rowIndex, e.target.checked)}
                        className="form-checkbox"
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td key={column.key} className="table-cell">
                      {column.render 
                        ? column.render(row[column.key], row, rowIndex)
                        : row[column.key] || '—'
                      }
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              // Empty state
              <tr>
                <td 
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="table-cell text-center py-12"
                >
                  <div className="empty-state">
                    <div className="empty-state-icon">
                      <Search className="w-12 h-12" />
                    </div>
                    <div className="empty-state-title">
                      {emptyMessage}
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
          {/* Results info */}
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Показано {((pagination.page - 1) * pagination.size) + 1}-{Math.min(pagination.page * pagination.size, pagination.total)} из {pagination.total} записей
          </div>

          {/* Page size selector */}
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-700 dark:text-gray-300">
              Показывать:
            </label>
            <select
              value={pagination.size}
              onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
              className="form-select text-sm"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          {/* Pagination controls */}
          <div className="pagination">
            <button
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={!pagination.has_prev}
              className="pagination-button"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="sr-only">Предыдущая страница</span>
            </button>

            {/* Page numbers */}
            {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
              let pageNumber;
              if (pagination.pages <= 5) {
                pageNumber = i + 1;
              } else if (pagination.page <= 3) {
                pageNumber = i + 1;
              } else if (pagination.page >= pagination.pages - 2) {
                pageNumber = pagination.pages - 4 + i;
              } else {
                pageNumber = pagination.page - 2 + i;
              }

              return (
                <button
                  key={pageNumber}
                  onClick={() => onPageChange?.(pageNumber)}
                  className={
                    pageNumber === pagination.page
                      ? 'pagination-button-active'
                      : 'pagination-button'
                  }
                >
                  {pageNumber}
                </button>
              );
            })}

            <button
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={!pagination.has_next}
              className="pagination-button"
            >
              <ChevronRight className="w-4 h-4" />
              <span className="sr-only">Следующая страница</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;