import { apiService, buildUrl } from './api';

// Assets service
export const assetsService = {
  // Get paginated assets with filters
  getAssets: async (params = {}) => {
    try {
      const {
        page = 1,
        size = 10,
        search = '',
        category = '',
        status = '',
        warehouse_id = '',
        sort_by = '',
        sort_order = 'asc'
      } = params;

      const queryParams = {
        page,
        size,
        ...(search && { search }),
        ...(category && { category }),
        ...(status && { status }),
        ...(warehouse_id && { warehouse_id }),
        ...(sort_by && { sort_by }),
        ...(sort_order && { sort_order })
      };

      const url = buildUrl('/assets', queryParams);
      const response = await apiService.get(url);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get single asset by ID
  getAsset: async (assetId) => {
    try {
      const response = await apiService.get(`/assets/${assetId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Create new asset
  createAsset: async (assetData) => {
    try {
      const response = await apiService.post('/assets', assetData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Update asset
  updateAsset: async (assetId, assetData) => {
    try {
      const response = await apiService.put(`/assets/${assetId}`, assetData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Delete asset (soft delete)
  deleteAsset: async (assetId) => {
    try {
      const response = await apiService.delete(`/assets/${assetId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Bulk update assets
  bulkUpdateAssets: async (assetIds, updates) => {
    try {
      const response = await apiService.post('/assets/bulk-update', {
        asset_ids: assetIds,
        updates
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Export assets to Excel
  exportAssets: async (filters = {}) => {
    try {
      const queryParams = {
        format: 'excel',
        ...filters
      };

      const url = buildUrl('/export/assets', queryParams);
      const response = await apiService.download(url);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get asset categories
  getCategories: () => {
    return [
      { value: 'Fixed Assets', label: 'Основные средства' },
      { value: 'Materials', label: 'Материалы' },
      { value: 'Goods', label: 'Товары' },
      { value: 'Inventory', label: 'Инвентарь' }
    ];
  },

  // Get asset statuses
  getStatuses: () => {
    return [
      { value: 'Active', label: 'Активен', color: 'success' },
      { value: 'Inactive', label: 'Неактивен', color: 'gray' },
      { value: 'Repair', label: 'Ремонт', color: 'warning' },
      { value: 'Disposed', label: 'Списан', color: 'danger' }
    ];
  },

  // Get status display info
  getStatusInfo: (status) => {
    const statuses = assetsService.getStatuses();
    return statuses.find(s => s.value === status) || { value: status, label: status, color: 'gray' };
  },

  // Get category display info
  getCategoryInfo: (category) => {
    const categories = assetsService.getCategories();
    return categories.find(c => c.value === category) || { value: category, label: category };
  },

  // Format asset display data
  formatAssetDisplay: (asset) => {
    return {
      ...asset,
      statusInfo: assetsService.getStatusInfo(asset.status),
      categoryInfo: assetsService.getCategoryInfo(asset.category),
      totalValue: asset.cost * asset.quantity,
      formattedCost: new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB'
      }).format(asset.cost),
      formattedTotalValue: new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB'
      }).format(asset.cost * asset.quantity)
    };
  },

  // Search assets with debouncing
  searchAssets: async (searchTerm, filters = {}) => {
    try {
      const params = {
        search: searchTerm,
        size: 50, // Limit search results
        ...filters
      };

      return await assetsService.getAssets(params);
    } catch (error) {
      throw error;
    }
  },

  // Get assets by warehouse
  getAssetsByWarehouse: async (warehouseId) => {
    try {
      const response = await assetsService.getAssets({
        warehouse_id: warehouseId,
        size: 1000 // Get all assets for warehouse
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Validate asset data
  validateAsset: (assetData) => {
    const errors = {};

    if (!assetData.name || assetData.name.trim().length < 2) {
      errors.name = 'Название должно содержать минимум 2 символа';
    }

    if (!assetData.category) {
      errors.category = 'Выберите категорию актива';
    }

    if (!assetData.cost || assetData.cost <= 0) {
      errors.cost = 'Стоимость должна быть больше 0';
    }

    if (!assetData.quantity || assetData.quantity <= 0) {
      errors.quantity = 'Количество должно быть больше 0';
    }

    if (!assetData.warehouse_id) {
      errors.warehouse_id = 'Выберите склад';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
};