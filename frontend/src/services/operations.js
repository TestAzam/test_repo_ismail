import { apiService, buildUrl } from './api';

// Operations service
export const operationsService = {
  // Get operations list
  getOperations: async (params = {}) => {
    try {
      const {
        skip = 0,
        limit = 100,
        operation_type = '',
        start_date = '',
        end_date = ''
      } = params;

      const queryParams = {
        skip,
        limit,
        ...(operation_type && { operation_type }),
        ...(start_date && { start_date }),
        ...(end_date && { end_date })
      };

      const url = buildUrl('/operations', queryParams);
      const response = await apiService.get(url);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Create new operation
  createOperation: async (operationData) => {
    try {
      const response = await apiService.post('/operations', operationData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Export operations to Excel
  exportOperations: async (filters = {}) => {
    try {
      const queryParams = {
        format: 'excel',
        ...filters
      };

      const url = buildUrl('/export/operations', queryParams);
      const response = await apiService.download(url);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get operation types
  getOperationTypes: () => {
    return [
      { value: 'Receipt', label: 'Поступление', icon: 'ArrowDownRight', color: 'success' },
      { value: 'Transfer', label: 'Перемещение', icon: 'RotateCcw', color: 'primary' },
      { value: 'Disposal', label: 'Списание', icon: 'ArrowUpRight', color: 'danger' },
      { value: 'Adjustment', label: 'Корректировка', icon: 'Edit', color: 'warning' }
    ];
  },

  // Get operation type info
  getOperationTypeInfo: (type) => {
    const types = operationsService.getOperationTypes();
    return types.find(t => t.value === type) || { value: type, label: type, icon: 'FileText', color: 'gray' };
  },

  // Format operation display data
  formatOperationDisplay: (operation) => {
    return {
      ...operation,
      typeInfo: operationsService.getOperationTypeInfo(operation.type),
      formattedDate: new Date(operation.operation_date).toLocaleString('ru-RU'),
      formattedCostBefore: operation.cost_before ? new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB'
      }).format(operation.cost_before) : null,
      formattedCostAfter: operation.cost_after ? new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB'
      }).format(operation.cost_after) : null
    };
  },

  // Validate operation data
  validateOperation: (operationData) => {
    const errors = {};

    if (!operationData.type) {
      errors.type = 'Выберите тип операции';
    }

    if (!operationData.asset_id) {
      errors.asset_id = 'Выберите актив';
    }

    if (!operationData.quantity || operationData.quantity <= 0) {
      errors.quantity = 'Количество должно быть больше 0';
    }

    // Specific validations for different operation types
    if (operationData.type === 'Transfer') {
      if (!operationData.to_warehouse_id) {
        errors.to_warehouse_id = 'Для перемещения требуется склад назначения';
      }

      if (operationData.from_warehouse_id === operationData.to_warehouse_id) {
        errors.to_warehouse_id = 'Склад отправления и назначения не могут совпадать';
      }
    }

    if (operationData.type === 'Adjustment') {
      if (operationData.cost_after !== undefined && operationData.cost_after <= 0) {
        errors.cost_after = 'Новая стоимость должна быть больше 0';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  // Get operations by asset
  getOperationsByAsset: async (assetId) => {
    try {
      const response = await operationsService.getOperations({
        limit: 1000 // Get all operations for asset
      });
      
      // Filter by asset_id on client side (backend filter would be better)
      return response.filter(op => op.asset_id === assetId);
    } catch (error) {
      throw error;
    }
  },

  // Get recent operations
  getRecentOperations: async (limit = 10) => {
    try {
      const response = await operationsService.getOperations({
        limit,
        skip: 0
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Create receipt operation
  createReceipt: async (assetId, quantity, toWarehouseId, details = {}) => {
    try {
      const operationData = {
        type: 'Receipt',
        asset_id: assetId,
        quantity,
        to_warehouse_id: toWarehouseId,
        ...details
      };

      return await operationsService.createOperation(operationData);
    } catch (error) {
      throw error;
    }
  },

  // Create transfer operation
  createTransfer: async (assetId, quantity, fromWarehouseId, toWarehouseId, details = {}) => {
    try {
      const operationData = {
        type: 'Transfer',
        asset_id: assetId,
        quantity,
        from_warehouse_id: fromWarehouseId,
        to_warehouse_id: toWarehouseId,
        ...details
      };

      return await operationsService.createOperation(operationData);
    } catch (error) {
      throw error;
    }
  },

  // Create disposal operation
  createDisposal: async (assetId, quantity, fromWarehouseId, details = {}) => {
    try {
      const operationData = {
        type: 'Disposal',
        asset_id: assetId,
        quantity,
        from_warehouse_id: fromWarehouseId,
        ...details
      };

      return await operationsService.createOperation(operationData);
    } catch (error) {
      throw error;
    }
  },

  // Create adjustment operation
  createAdjustment: async (assetId, quantity, costBefore, costAfter, details = {}) => {
    try {
      const operationData = {
        type: 'Adjustment',
        asset_id: assetId,
        quantity,
        cost_before: costBefore,
        cost_after: costAfter,
        ...details
      };

      return await operationsService.createOperation(operationData);
    } catch (error) {
      throw error;
    }
  }
};