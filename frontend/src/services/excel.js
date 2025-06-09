import { apiService } from './api';

// Excel export service
export const excelService = {
  // Export assets to Excel
  exportAssets: async (filters = {}) => {
    try {
      const response = await apiService.download('/export/assets', {
        params: {
          format: 'excel',
          ...filters
        }
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Export operations to Excel
  exportOperations: async (filters = {}) => {
    try {
      const response = await apiService.download('/export/operations', {
        params: {
          format: 'excel',
          ...filters
        }
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Client-side CSV export utility
  exportToCSV: (data, filename = 'export.csv', headers = []) => {
    try {
      let csvContent = '';
      
      // Add headers if provided
      if (headers.length > 0) {
        csvContent += headers.join(',') + '\n';
      }
      
      // Add data rows
      data.forEach(row => {
        const values = headers.length > 0 
          ? headers.map(header => {
              const value = row[header] || '';
              // Escape CSV special characters
              return `"${String(value).replace(/"/g, '""')}"`;
            })
          : Object.values(row).map(value => {
              return `"${String(value || '').replace(/"/g, '""')}"`;
            });
        
        csvContent += values.join(',') + '\n';
      });
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
      
      return true;
    } catch (error) {
      console.error('CSV export failed:', error);
      return false;
    }
  },

  // Client-side JSON export utility
  exportToJSON: (data, filename = 'export.json') => {
    try {
      const jsonContent = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
      
      return true;
    } catch (error) {
      console.error('JSON export failed:', error);
      return false;
    }
  },

  // Format data for export
  formatAssetsForExport: (assets) => {
    return assets.map(asset => ({
      'Инвентарный номер': asset.inventory_number,
      'Название': asset.name,
      'Категория': asset.category,
      'Статус': asset.status,
      'Количество': asset.quantity,
      'Стоимость': asset.cost,
      'Общая стоимость': asset.cost * asset.quantity,
      'Склад': asset.warehouse?.name || '',
      'Серийный номер': asset.serial_number || '',
      'Поставщик': asset.supplier || '',
      'Дата покупки': asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString('ru-RU') : '',
      'Примечания': asset.notes || ''
    }));
  },

  // Format operations for export
  formatOperationsForExport: (operations) => {
    return operations.map(operation => ({
      'Дата операции': new Date(operation.operation_date).toLocaleString('ru-RU'),
      'Тип операции': operation.type,
      'Актив': operation.asset?.name || '',
      'Инвентарный номер': operation.asset?.inventory_number || '',
      'Количество': operation.quantity,
      'Откуда': operation.from_warehouse?.name || 'Внешний',
      'Куда': operation.to_warehouse?.name || 'Внешний',
      'Пользователь': operation.user?.username || '',
      'Причина': operation.reason || '',
      'Документ': operation.document_number || '',
      'Примечания': operation.notes || ''
    }));
  },

  // Get export filename with timestamp
  getTimestampedFilename: (baseName, extension = 'xlsx') => {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    return `${baseName}_${timestamp}.${extension}`;
  },

  // Validate export parameters
  validateExportParams: (filters) => {
    const errors = {};
    
    if (filters.start_date && filters.end_date) {
      const startDate = new Date(filters.start_date);
      const endDate = new Date(filters.end_date);
      
      if (startDate > endDate) {
        errors.dateRange = 'Дата начала не может быть позже даты окончания';
      }
      
      // Check if date range is too large (more than 1 year)
      const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
      if (endDate - startDate > oneYearInMs) {
        errors.dateRange = 'Период экспорта не может превышать 1 год';
      }
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
};