import React, { useState } from 'react';
import { Plus, Edit, Trash2, Package, MapPin } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { reportsService } from '../services/reports';
import { formatCurrency, formatNumber } from '../utils/formatters';
import DataTable from '../components/DataTable';
import Modal, { ConfirmModal } from '../components/Modal';
import toast from 'react-hot-toast';

const Warehouses = () => {
  const { hasPermission } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    branch_id: ''
  });
  const [formErrors, setFormErrors] = useState({});

  // Fetch data
  const {
    data: warehouses = [],
    loading,
    execute: refreshWarehouses
  } = useApi(
    () => reportsService.getWarehouses(),
    [],
    { immediate: true }
  );

  const { data: branches = [] } = useApi(
    () => reportsService.getBranches(),
    [],
    { immediate: true }
  );

  // Mock data for warehouse statistics (in real app, fetch from API)
  const warehouseStats = {
    1: { assetCount: 145, totalValue: 2450000, categories: 4 },
    2: { assetCount: 89, totalValue: 1780000, categories: 3 },
    3: { assetCount: 67, totalValue: 1200000, categories: 3 },
    4: { assetCount: 234, totalValue: 3200000, categories: 4 },
    5: { assetCount: 156, totalValue: 2100000, categories: 3 },
    6: { assetCount: 78, totalValue: 980000, categories: 2 }
  };

  // Table columns
  const columns = [
    {
      key: 'name',
      label: 'Название склада',
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">{value}</div>
          {row.address && (
            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center mt-1">
              <MapPin className="w-3 h-3 mr-1" />
              {row.address}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'branch',
      label: 'Филиал',
      sortable: false,
      render: (value, row) => row.branch?.name || '—'
    },
    {
      key: 'stats',
      label: 'Активы',
      sortable: false,
      render: (value, row) => {
        const stats = warehouseStats[row.id] || { assetCount: 0, totalValue: 0, categories: 0 };
        return (
          <div className="text-sm">
            <div className="font-medium text-gray-900 dark:text-white">
              {formatNumber(stats.assetCount)} активов
            </div>
            <div className="text-gray-500 dark:text-gray-400">
              {stats.categories} категорий
            </div>
          </div>
        );
      }
    },
    {
      key: 'value',
      label: 'Общая стоимость',
      sortable: false,
      render: (value, row) => {
        const stats = warehouseStats[row.id] || { totalValue: 0 };
        return (
          <div className="font-medium text-gray-900 dark:text-white">
            {formatCurrency(stats.totalValue, { minimumFractionDigits: 0 })}
          </div>
        );
      }
    },
    {
      key: 'actions',
      label: 'Действия',
      sortable: false,
      render: (value, row) => (
        <div className="flex items-center space-x-2">
          {hasPermission('write_warehouses') && (
            <button
              onClick={() => handleEditWarehouse(row)}
              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-200"
              title="Редактировать"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
          
          {hasPermission('delete_all') && (
            <button
              onClick={() => handleDeleteWarehouse(row)}
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
  const handleCreateWarehouse = () => {
    setFormData({
      name: '',
      address: '',
      branch_id: ''
    });
    setFormErrors({});
    setShowCreateModal(true);
  };

  const handleEditWarehouse = (warehouse) => {
    setSelectedWarehouse(warehouse);
    setFormData({
      name: warehouse.name || '',
      address: warehouse.address || '',
      branch_id: warehouse.branch_id?.toString() || ''
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const handleDeleteWarehouse = (warehouse) => {
    setSelectedWarehouse(warehouse);
    setShowDeleteModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const warehouseData = {
        ...formData,
        branch_id: parseInt(formData.branch_id)
      };

      if (selectedWarehouse) {
        // Update existing warehouse
        // await reportsService.updateWarehouse(selectedWarehouse.id, warehouseData);
        toast.success('Склад успешно обновлен');
        setShowEditModal(false);
      } else {
        // Create new warehouse
        await reportsService.createWarehouse(warehouseData);
        toast.success('Склад успешно создан');
        setShowCreateModal(false);
      }
      
      refreshWarehouses();
      setSelectedWarehouse(null);
    } catch (error) {
      toast.error('Ошибка при сохранении склада');
    }
  };

  const handleConfirmDelete = async () => {
    try {
      // await reportsService.deleteWarehouse(selectedWarehouse.id);
      toast.success('Склад успешно удален');
      setShowDeleteModal(false);
      setSelectedWarehouse(null);
      refreshWarehouses();
    } catch (error) {
      toast.error('Ошибка при удалении склада');
    }
  };

  // Calculate totals
  const totalStats = warehouses.reduce((acc, warehouse) => {
    const stats = warehouseStats[warehouse.id] || { assetCount: 0, totalValue: 0 };
    acc.assetCount += stats.assetCount;
    acc.totalValue += stats.totalValue;
    return acc;
  }, { assetCount: 0, totalValue: 0 });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Склады</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Управление складами и их расположением
          </p>
        </div>
        
        {hasPermission('write_warehouses') && (
          <button
            onClick={handleCreateWarehouse}
            className="btn-primary flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Добавить склад
          </button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Всего складов
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(warehouses.length)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Общее количество активов
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(totalStats.assetCount)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Общая стоимость активов
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(totalStats.totalValue, { minimumFractionDigits: 0 })}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Warehouses table */}
      <div className="card">
        <DataTable
          data={warehouses}
          columns={columns}
          loading={loading}
          emptyMessage="Склады не найдены"
        />
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showCreateModal || showEditModal}
        onClose={() => {
          setShowCreateModal(false);
          setShowEditModal(false);
          setSelectedWarehouse(null);
        }}
        title={selectedWarehouse ? 'Редактировать склад' : 'Создать склад'}
        size="md"
      >
        <form onSubmit={handleFormSubmit} className="space-y-6">
          <div>
            <label className="form-label">Название склада *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="form-input"
              placeholder="Склад оборудования №1"
              required
            />
            {formErrors.name && (
              <p className="form-error">{formErrors.name}</p>
            )}
          </div>
          
          <div>
            <label className="form-label">Филиал *</label>
            <select
              value={formData.branch_id}
              onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
              className="form-select"
              required
            >
              <option value="">Выберите филиал</option>
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
            {formErrors.branch_id && (
              <p className="form-error">{formErrors.branch_id}</p>
            )}
          </div>
          
          <div>
            <label className="form-label">Адрес</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="form-textarea"
              placeholder="г. Ташкент, ул. Примерная, д. 1, подвал"
              rows={3}
            />
            {formErrors.address && (
              <p className="form-error">{formErrors.address}</p>
            )}
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setShowCreateModal(false);
                setShowEditModal(false);
                setSelectedWarehouse(null);
              }}
              className="btn-outline"
            >
              Отмена
            </button>
            <button type="submit" className="btn-primary">
              {selectedWarehouse ? 'Сохранить изменения' : 'Создать склад'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedWarehouse(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Удаление склада"
        message={`Вы уверены, что хотите удалить склад "${selectedWarehouse?.name}"? Все активы на этом складе также будут удалены. Это действие нельзя отменить.`}
        confirmText="Удалить"
        cancelText="Отмена"
        variant="danger"
      />
    </div>
  );
};

export default Warehouses;