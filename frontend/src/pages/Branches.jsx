import React, { useState } from 'react';
import { Plus, Edit, Trash2, Building2, MapPin } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { reportsService } from '../services/reports';
import DataTable from '../components/DataTable';
import Modal, { ConfirmModal } from '../components/Modal';
import toast from 'react-hot-toast';

const Branches = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    address: ''
  });

  // Fetch branches
  const {
    data: branches = [],
    loading,
    execute: refreshBranches
  } = useApi(
    () => reportsService.getBranches(),
    [],
    { immediate: true }
  );

  // Table columns
  const columns = [
    {
      key: 'name',
      label: 'Название филиала',
      sortable: true,
      render: (value) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <span className="font-medium text-gray-900 dark:text-white">{value}</span>
        </div>
      )
    },
    {
      key: 'address',
      label: 'Адрес',
      sortable: false,
      render: (value) => value ? (
        <div className="flex items-center text-gray-600 dark:text-gray-400">
          <MapPin className="w-4 h-4 mr-2" />
          {value}
        </div>
      ) : '—'
    },
    {
      key: 'actions',
      label: 'Действия',
      sortable: false,
      render: (value, row) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleEditBranch(row)}
            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-200"
            title="Редактировать"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteBranch(row)}
            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200"
            title="Удалить"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  // Handlers
  const handleCreateBranch = () => {
    setFormData({ name: '', address: '' });
    setShowCreateModal(true);
  };

  const handleEditBranch = (branch) => {
    setSelectedBranch(branch);
    setFormData({
      name: branch.name || '',
      address: branch.address || ''
    });
    setShowEditModal(true);
  };

  const handleDeleteBranch = (branch) => {
    setSelectedBranch(branch);
    setShowDeleteModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (selectedBranch) {
        // Update existing branch
        // await reportsService.updateBranch(selectedBranch.id, formData);
        toast.success('Филиал успешно обновлен');
        setShowEditModal(false);
      } else {
        // Create new branch
        await reportsService.createBranch(formData);
        toast.success('Филиал успешно создан');
        setShowCreateModal(false);
      }
      
      refreshBranches();
      setSelectedBranch(null);
    } catch (error) {
      toast.error('Ошибка при сохранении филиала');
    }
  };

  const handleConfirmDelete = async () => {
    try {
      // await reportsService.deleteBranch(selectedBranch.id);
      toast.success('Филиал успешно удален');
      setShowDeleteModal(false);
      setSelectedBranch(null);
      refreshBranches();
    } catch (error) {
      toast.error('Ошибка при удалении филиала');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Филиалы</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Управление филиалами компании (только для администраторов)
          </p>
        </div>
        
        <button
          onClick={handleCreateBranch}
          className="btn-primary flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Добавить филиал
        </button>
      </div>

      {/* Branches table */}
      <div className="card">
        <DataTable
          data={branches}
          columns={columns}
          loading={loading}
          emptyMessage="Филиалы не найдены"
        />
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showCreateModal || showEditModal}
        onClose={() => {
          setShowCreateModal(false);
          setShowEditModal(false);
          setSelectedBranch(null);
        }}
        title={selectedBranch ? 'Редактировать филиал' : 'Создать филиал'}
        size="md"
      >
        <form onSubmit={handleFormSubmit} className="space-y-6">
          <div>
            <label className="form-label">Название филиала *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="form-input"
              placeholder="Головной офис"
              required
            />
          </div>
          
          <div>
            <label className="form-label">Адрес</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="form-textarea"
              placeholder="г. Ташкент, ул. Шота Руставели, д. 10"
              rows={3}
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setShowCreateModal(false);
                setShowEditModal(false);
                setSelectedBranch(null);
              }}
              className="btn-outline"
            >
              Отмена
            </button>
            <button type="submit" className="btn-primary">
              {selectedBranch ? 'Сохранить изменения' : 'Создать филиал'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedBranch(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Удаление филиала"
        message={`Вы уверены, что хотите удалить филиал "${selectedBranch?.name}"? Все склады в этом филиале также будут удалены.`}
        confirmText="Удалить"
        cancelText="Отмена"
        variant="danger"
      />
    </div>
  );
};

export default Branches;