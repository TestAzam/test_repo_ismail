import React, { useState, useEffect } from 'react';
import { Plus, Download, Filter, ArrowDownRight, RotateCcw, ArrowUpRight, Edit } from 'lucide-react';
import { usePaginatedApi, useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { operationsService } from '../services/operations';
import { assetsService } from '../services/assets';
import { reportsService } from '../services/reports';
import { formatDate, formatCurrency } from '../utils/formatters';
import { OPERATION_TYPES, OPERATION_TYPE_CONFIG } from '../utils/constants';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

const Operations = () => {
  const { hasPermission } = useAuth();
  const [selectedType, setSelectedType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Operation form data
  const [formData, setFormData] = useState({
    type: '',
    asset_id: '',
    quantity: 1,
    from_warehouse_id: '',
    to_warehouse_id: '',
    reason: '',
    notes: '',
    document_number: '',
    cost_before: '',
    cost_after: ''
  });
  const [formErrors, setFormErrors] = useState({});

  // Fetch data for dropdowns
  const { data: assets = [] } = useApi(
    () => assetsService.getAssets({ size: 1000 }),
    [],
    { immediate: true }
  );

  const { data: warehouses = [] } = useApi(
    () => reportsService.getWarehouses(),
    [],
    { immediate: true }
  );

  // Paginated operations with filters
  const {
    data: operations,
    pagination,
    loading,
    updateParams,
    execute: refreshOperations
  } = usePaginatedApi(
    (params) => operationsService.getOperations({
      ...params,
      operation_type: selectedType,
      start_date: dateFrom,
      end_date: dateTo
    }),
    { page: 1, size: 15 }
  );

  // Update API call when filters change
  useEffect(() => {
    updateParams({
      page: 1,
      operation_type: selectedType,
      start_date: dateFrom,
      end_date: dateTo
    });
  }, [selectedType, dateFrom, dateTo, updateParams]);

  // Get operation icon and color
  const getOperationDisplay = (type) => {
    const config = OPERATION_TYPE_CONFIG[type];
    if (!config) return { icon: Edit, label: type, color: 'text-gray-500' };

    const iconComponents = {
      'ArrowDownRight': ArrowDownRight,
      'RotateCcw': RotateCcw,
      'ArrowUpRight': ArrowUpRight,
      'Edit': Edit
    };

    const IconComponent = iconComponents[config.icon] || Edit;
    
    const colorClasses = {
      'success': 'text-green-500',
      'primary': 'text-blue-500',
      'danger': 'text-red-500',
      'warning': 'text-yellow-500'
    };

    return {
      icon: IconComponent,
      label: config.label,
      color: colorClasses[config.color] || 'text-gray-500'
    };
  };

  // Table columns
  const columns = [
    {
      key: 'operation_date',
      label: 'Дата',
      sortable: true,
      render: (value) => formatDate(new Date(value), 'dd.MM.yyyy HH:mm')
    },
    {
      key: 'type',
      label: 'Тип операции',
      sortable: true,
      render: (value) => {
        const display = getOperationDisplay(value);
        const IconComponent = display.icon;
        return (
          <div className="flex items-center space-x-2">
            <IconComponent className={`w-4 h-4 ${display.color}`} />
            <span>{display.label}</span>
          </div>
        );
      }
    },
    {
      key: 'asset',
      label: 'Актив',
      sortable: false,
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">
            {row.asset?.name || '—'}
          </div>
          {row.asset?.inventory_number && (
            <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">
              {row.asset.inventory_number}
            </div>
          )}
        </div>
      )
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
      key: 'movement',
      label: 'Движение',
      sortable: false,
      render: (value, row) => {
        const from = row.from_warehouse?.name || 'Внешний';
        const to = row.to_warehouse?.name || 'Внешний';
        
        if (row.type === 'Receipt') {
          return (
            <span className="text-green-600 dark:text-green-400">
              → {to}
            </span>
          );
        } else if (row.type === 'Disposal') {
          return (
            <span className="text-red-600 dark:text-red-400">
              {from} →
            </span>
          );
        } else if (row.type === 'Transfer') {
          return (
            <span className="text-blue-600 dark:text-blue-400">
              {from} → {to}
            </span>
          );
        } else {
          return (
            <span className="text-yellow-600 dark:text-yellow-400">
              Корректировка
            </span>
          );
        }
      }
    },
    {
      key: 'cost_change',
      label: 'Изменение стоимости',
      sortable: false,
      render: (value, row) => {
        if (row.cost_before && row.cost_after) {
          const difference = row.cost_after - row.cost_before;
          const isPositive = difference > 0;
          return (
            <div className="text-sm">
              <div className={isPositive ? 'text-green-600' : 'text-red-600'}>
                {isPositive ? '+' : ''}{formatCurrency(difference)}
              </div>
              <div className="text-gray-500 dark:text-gray-400">
                {formatCurrency(row.cost_before)} → {formatCurrency(row.cost_after)}
              </div>
            </div>
          );
        }
        return '—';
      }
    },
    {
      key: 'user',
      label: 'Пользователь',
      sortable: false,
      render: (value, row) => row.user?.username || '—'
    },
    {
      key: 'reason',
      label: 'Причина',
      sortable: false,
      render: (value) => value || '—'
    }
  ];

  // Handlers
  const handleCreateOperation = () => {
    setFormData({
      type: '',
      asset_id: '',
      quantity: 1,
      from_warehouse_id: '',
      to_warehouse_id: '',
      reason: '',
      notes: '',
      document_number: '',
      cost_before: '',
      cost_after: ''
    });
    setFormErrors({});
    setShowCreateModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const operationData = {
        ...formData,
        asset_id: parseInt(formData.asset_id),
        quantity: parseInt(formData.quantity),
        from_warehouse_id: formData.from_warehouse_id ? parseInt(formData.from_warehouse_id) : null,
        to_warehouse_id: formData.to_warehouse_id ? parseInt(formData.to_warehouse_id) : null,
        cost_before: formData.cost_before ? parseFloat(formData.cost_before) : null,
        cost_after: formData.cost_after ? parseFloat(formData.cost_after) : null
      };

      await operationsService.createOperation(operationData);
      toast.success('Операция успешно создана');
      setShowCreateModal(false);
      refreshOperations();
    } catch (error) {
      toast.error('Ошибка при создании операции');
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await operationsService.exportOperations({
        operation_type: selectedType,
        start_date: dateFrom,
        end_date: dateTo
      });
      toast.success('Экспорт завершен');
    } catch (error) {
      toast.error('Ошибка при экспорте');
    } finally {
      setIsExporting(false);
    }
  };

  const getSelectedAsset = () => {
    return assets.find(asset => asset.id === parseInt(formData.asset_id));
  };

  const getAvailableWarehouses = () => {
    const selectedAsset = getSelectedAsset();
    if (formData.type === 'Transfer' && selectedAsset) {
      // For transfers, exclude the current warehouse from destination options
      return warehouses.filter(w => w.id !== selectedAsset.warehouse_id);
    }
    return warehouses;
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Операции с активами
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            История операций и создание новых
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
          
          {hasPermission('write_operations') && (
            <button
              onClick={handleCreateOperation}
              className="btn-primary flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Создать операцию
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="form-label">Тип операции</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="form-select"
              >
                <option value="">Все операции</option>
                {Object.entries(OPERATION_TYPES).map(([key, value]) => {
                  const config = OPERATION_TYPE_CONFIG[value];
                  return (
                    <option key={key} value={value}>
                      {config?.label || value}
                    </option>
                  );
                })}
              </select>
            </div>
            
            <div>
              <label className="form-label">Дата от</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="form-input"
              />
            </div>
            
            <div>
              <label className="form-label">Дата до</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="form-input"
              />
            </div>
            
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSelectedType('');
                  setDateFrom('');
                  setDateTo('');
                }}
                className="btn-outline w-full"
              >
                Сбросить фильтры
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Operations table */}
      <div className="card">
        <DataTable
          data={operations}
          columns={columns}
          loading={loading}
          pagination={pagination}
          onPageChange={(page) => updateParams({ page })}
          onPageSizeChange={(size) => updateParams({ page: 1, size })}
          emptyMessage="Операции не найдены"
        />
      </div>

      {/* Create Operation Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Создать операцию"
        size="lg"
      >
        <form onSubmit={handleFormSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="form-label">Тип операции *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="form-select"
                required
              >
                <option value="">Выберите тип</option>
                {Object.entries(OPERATION_TYPES).map(([key, value]) => {
                  const config = OPERATION_TYPE_CONFIG[value];
                  return (
                    <option key={key} value={value}>
                      {config?.label || value}
                    </option>
                  );
                })}
              </select>
            </div>
            
            <div>
              <label className="form-label">Актив *</label>
              <select
                value={formData.asset_id}
                onChange={(e) => setFormData({ ...formData, asset_id: e.target.value })}
                className="form-select"
                required
              >
                <option value="">Выберите актив</option>
                {assets.map(asset => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name} ({asset.inventory_number})
                  </option>
                ))}
              </select>
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
            
            {(formData.type === 'Transfer' || formData.type === 'Disposal') && (
              <div>
                <label className="form-label">
                  {formData.type === 'Transfer' ? 'Откуда' : 'Склад отправления'}
                </label>
                <select
                  value={formData.from_warehouse_id}
                  onChange={(e) => setFormData({ ...formData, from_warehouse_id: e.target.value })}
                  className="form-select"
                >
                  <option value="">Текущий склад актива</option>
                  {warehouses.map(warehouse => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {(formData.type === 'Receipt' || formData.type === 'Transfer') && (
              <div>
                <label className="form-label">
                  {formData.type === 'Receipt' ? 'Склад назначения *' : 'Куда *'}
                </label>
                <select
                  value={formData.to_warehouse_id}
                  onChange={(e) => setFormData({ ...formData, to_warehouse_id: e.target.value })}
                  className="form-select"
                  required={formData.type === 'Transfer'}
                >
                  <option value="">Выберите склад</option>
                  {getAvailableWarehouses().map(warehouse => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {formData.type === 'Adjustment' && (
              <>
                <div>
                  <label className="form-label">Стоимость до</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cost_before}
                    onChange={(e) => setFormData({ ...formData, cost_before: e.target.value })}
                    className="form-input"
                  />
                </div>
                
                <div>
                  <label className="form-label">Стоимость после</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cost_after}
                    onChange={(e) => setFormData({ ...formData, cost_after: e.target.value })}
                    className="form-input"
                  />
                </div>
              </>
            )}
            
            <div>
              <label className="form-label">Номер документа</label>
              <input
                type="text"
                value={formData.document_number}
                onChange={(e) => setFormData({ ...formData, document_number: e.target.value })}
                className="form-input"
                placeholder="ПО-2025-001"
              />
            </div>
            
            <div>
              <label className="form-label">Причина</label>
              <input
                type="text"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="form-input"
                placeholder="Причина операции"
              />
            </div>
          </div>
          
          <div>
            <label className="form-label">Примечания</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="form-textarea"
              rows={3}
              placeholder="Дополнительная информация об операции"
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="btn-outline"
            >
              Отмена
            </button>
            <button type="submit" className="btn-primary">
              Создать операцию
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Operations;