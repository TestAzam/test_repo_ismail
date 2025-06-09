import React, { useState, useEffect } from 'react';
import { Plus, Download, Filter, Edit, Trash2, Eye, Search } from 'lucide-react';
import { usePaginatedApi, useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { assetsService } from '../services/assets';
import { reportsService } from '../services/reports';
import { formatCurrency, formatDate } from '../utils/formatters';
import { ASSET_CATEGORIES, ASSET_STATUSES, ASSET_STATUS_CONFIG } from '../utils/constants';
import DataTable from '../components/DataTable';
import Modal, { ConfirmModal } from '../components/Modal';
import toast from 'react-hot-toast';

const Assets = () => {
  const { hasPermission } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [isExporting, setIsExporting] = useState(false);

  // Asset form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    cost: '',
    quantity: 1,
    status: 'Active',
    warehouse_id: '',
    serial_number: '',
    supplier: '',
    notes: ''
  });
  const [formErrors, setFormErrors] = useState({});

  // Fetch warehouses for dropdown
  const { data: warehouses = [] } = useApi(
    () => reportsService.getWarehouses(),
    [],
    { immediate: true }
  );

  // Paginated assets with filters
  const {
    data: assets,
    pagination,
    loading,
    updateParams,
    execute: refreshAssets
  } = usePaginatedApi(
    (params) => assetsService.getAssets({
      ...params,
      search: searchQuery,
      category: selectedCategory,
      status: selectedStatus,
      warehouse_id: selectedWarehouse
    }),
    { page: 1, size: 10 }
  );

  // Update API call when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateParams({
        page: 1,
        search: searchQuery,
        category: selectedCategory,
        status: selectedStatus,
        warehouse_id: selectedWarehouse
      });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedCategory, selectedStatus, selectedWarehouse, updateParams]);

  // Table columns
  const columns = [
    {
      key: 'inventory_number',
      label: 'Инвентарный номер',
      sortable: true,
      render: (value) => (
        <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">
          {value}
        </span>
      )
    },
    {
      key: 'name',
      label: 'Название',
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">{value}</div>
          {row.description && (
            <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
              {row.description}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'category',
      label: 'Категория',
      sortable: true,
      render: (value) => {
        const categoryLabels = {
          'Fixed Assets': 'Основные средства',
          'Materials': 'Материалы',
          'Goods': 'Товары',
          'Inventory': 'Инвентарь'
        };
        return categoryLabels[value] || value;
      }
    },
    {
      key: 'cost',
      label: 'Стоимость',
      sortable: true,
      render: (value) => formatCurrency(value)
    },
    {
      key: 'quantity',
      label: 'Количество',
      sortable: true,
      render: (value) => (
        <span className="font-medium">{value}</span>
      )
    },
    {
      key: 'total_value',
      label: 'Общая стоимость',
      sortable: false,
      render: (value, row) => formatCurrency(row.cost * row.quantity)
    },
    {
      key: 'warehouse',
      label: 'Склад',
      sortable: false,
      render: (value, row) => row.warehouse?.name || '—'
    },
    {
      key: 'status',
      label: 'Статус',
      sortable: true,
      render: (value) => {
        const config = ASSET_STATUS_CONFIG[value];
        if (!config) return value;
        
        return (
          <span className={`badge ${config.bgColor} ${config.textColor} ${config.darkBgColor} ${config.darkTextColor}`}>
            {config.label}
          </span>
        );
      }
    },
    {
      key: 'actions',
      label: 'Действия',
      sortable: false,
      render: (value, row) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleViewAsset(row)}
            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200"
            title="Просмотр"
          >
            <Eye className="w-4 h-4" />
          </button>
          
          {hasPermission('write_assets') && (
            <button
              onClick={() => handleEditAsset(row)}
              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-200"
              title="Редактировать"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
          
          {hasPermission('delete_all') && (
            <button
              onClick={() => handleDeleteAsset(row)}
              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200"
              title="Удалить"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )
    }
  ];

  // Handlers
  const handleCreateAsset = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      cost: '',
      quantity: 1,
      status: 'Active',
      warehouse_id: '',
      serial_number: '',
      supplier: '',
      notes: ''
    });
    setFormErrors({});
    setShowCreateModal(true);
  };

  const handleEditAsset = (asset) => {
    setSelectedAsset(asset);
    setFormData({
      name: asset.name || '',
      description: asset.description || '',
      category: asset.category || '',
      cost: asset.cost?.toString() || '',
      quantity: asset.quantity || 1,
      status: asset.status || 'Active',
      warehouse_id: asset.warehouse_id?.toString() || '',
      serial_number: asset.serial_number || '',
      supplier: asset.supplier || '',
      notes: asset.notes || ''
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const handleViewAsset = (asset) => {
    // TODO: Implement asset view modal or navigate to detail page
    toast.info('Просмотр актива - функция в разработке');
  };

  const handleDeleteAsset = (asset) => {
    setSelectedAsset(asset);
    setShowDeleteModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const assetData = {
        ...formData,
        cost: parseFloat(formData.cost),
        quantity: parseInt(formData.quantity),
        warehouse_id: parseInt(formData.warehouse_id)
      };

      if (selectedAsset) {
        // Update existing asset
        await assetsService.updateAsset(selectedAsset.id, assetData);
        toast.success('Актив успешно обновлен');
        setShowEditModal(false);
      } else {
        // Create new asset
        await assetsService.createAsset(assetData);
        toast.success('Актив успешно создан');
        setShowCreateModal(false);
      }
      
      refreshAssets();
      setSelectedAsset(null);
    } catch (error) {
      toast.error('Ошибка при сохранении актива');
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await assetsService.deleteAsset(selectedAsset.id);
      toast.success('Актив успешно удален');
      setShowDeleteModal(false);
      setSelectedAsset(null);
      refreshAssets();
    } catch (error) {
      toast.error('Ошибка при удалении актива');
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await assetsService.exportAssets({
        search: searchQuery,
        category: selectedCategory,
        status: selectedStatus,
        warehouse_id: selectedWarehouse
      });
      toast.success('Экспорт завершен');
    } catch (error) {
      toast.error('Ошибка при экспорте');
    } finally {
      setIsExporting(false);
    }
  };

  const handleRowSelect = (rowIndex, checked) => {
    setSelectedRows(prev => {
      if (checked) {
        return [...prev, rowIndex];
      } else {
        return prev.filter(index => index !== rowIndex);
      }
    });
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedRows(Array.from({ length: assets.length }, (_, i) => i));
    } else {
      setSelectedRows([]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Активы</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Управление активами компании
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-outline flex items-center"
          >
            <Filter className="w-4 h-4 mr-2" />
            Фильтры
          </button>
          
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="btn-outline flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? 'Экспорт...' : 'Экспорт Excel'}
          </button>
          
          {hasPermission('write_assets') && (
            <button
              onClick={handleCreateAsset}
              className="btn-primary flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Добавить актив
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="form-label">Поиск</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Название, номер..."
                  className="form-input pl-10"
                />
              </div>
            </div>
            
            <div>
              <label className="form-label">Категория</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="form-select"
              >
                <option value="">Все категории</option>
                {Object.entries(ASSET_CATEGORIES).map(([key, value]) => (
                  <option key={key} value={value}>
                    {key === 'FIXED_ASSETS' ? 'Основные средства' : 
                     key === 'MATERIALS' ? 'Материалы' :
                     key === 'GOODS' ? 'Товары' : 'Инвентарь'}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="form-label">Статус</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="form-select"
              >
                <option value="">Все статусы</option>
                {Object.entries(ASSET_STATUSES).map(([key, value]) => {
                  const config = ASSET_STATUS_CONFIG[value];
                  return (
                    <option key={key} value={value}>
                      {config?.label || value}
                    </option>
                  );
                })}
              </select>
            </div>
            
            <div>
              <label className="form-label">Склад</label>
              <select
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
                className="form-select"
              >
                <option value="">Все склады</option>
                {warehouses.map(warehouse => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Assets table */}
      <div className="card">
        <DataTable
          data={assets}
          columns={columns}
          loading={loading}
          pagination={pagination}
          onPageChange={(page) => updateParams({ page })}
          onPageSizeChange={(size) => updateParams({ page: 1, size })}
          selectable={hasPermission('write_assets')}
          selectedRows={selectedRows}
          onRowSelect={handleRowSelect}
          onSelectAll={handleSelectAll}
          emptyMessage="Активы не найдены"
        />
      </div>

      {/* Bulk actions */}
      {selectedRows.length > 0 && hasPermission('write_assets') && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Выбрано активов: {selectedRows.length}
            </span>
            <button className="btn-outline btn-sm">
              Массовое изменение
            </button>
            <button className="btn-outline btn-sm">
              Экспорт выбранных
            </button>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showCreateModal || showEditModal}
        onClose={() => {
          setShowCreateModal(false);
          setShowEditModal(false);
          setSelectedAsset(null);
        }}
        title={selectedAsset ? 'Редактировать актив' : 'Создать актив'}
        size="lg"
      >
        <form onSubmit={handleFormSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="form-label">Название *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="form-input"
                required
              />
            </div>
            
            <div>
              <label className="form-label">Категория *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="form-select"
                required
              >
                <option value="">Выберите категорию</option>
                {Object.entries(ASSET_CATEGORIES).map(([key, value]) => (
                  <option key={key} value={value}>
                    {key === 'FIXED_ASSETS' ? 'Основные средства' : 
                     key === 'MATERIALS' ? 'Материалы' :
                     key === 'GOODS' ? 'Товары' : 'Инвентарь'}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="form-label">Стоимость *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                className="form-input"
                required
              />
            </div>
            
            <div>
              <label className="form-label">Количество *</label>
              <input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                className="form-input"
                required
              />
            </div>
            
            <div>
              <label className="form-label">Склад *</label>
              <select
                value={formData.warehouse_id}
                onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })}
                className="form-select"
                required
              >
                <option value="">Выберите склад</option>
                {warehouses.map(warehouse => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="form-label">Статус</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="form-select"
              >
                {Object.entries(ASSET_STATUSES).map(([key, value]) => {
                  const config = ASSET_STATUS_CONFIG[value];
                  return (
                    <option key={key} value={value}>
                      {config?.label || value}
                    </option>
                  );
                })}
              </select>
            </div>
            
            <div>
              <label className="form-label">Серийный номер</label>
              <input
                type="text"
                value={formData.serial_number}
                onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                className="form-input"
              />
            </div>
            
            <div>
              <label className="form-label">Поставщик</label>
              <input
                type="text"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="form-input"
              />
            </div>
          </div>
          
          <div>
            <label className="form-label">Описание</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="form-textarea"
              rows={3}
            />
          </div>
          
          <div>
            <label className="form-label">Примечания</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="form-textarea"
              rows={2}
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setShowCreateModal(false);
                setShowEditModal(false);
                setSelectedAsset(null);
              }}
              className="btn-outline"
            >
              Отмена
            </button>
            <button type="submit" className="btn-primary">
              {selectedAsset ? 'Сохранить изменения' : 'Создать актив'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedAsset(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Удаление актива"
        message={`Вы уверены, что хотите удалить актив "${selectedAsset?.name}"? Это действие нельзя отменить.`}
        confirmText="Удалить"
        cancelText="Отмена"
        variant="danger"
      />
    </div>
  );
};

export default Assets;