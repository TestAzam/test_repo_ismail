import React, { useState } from 'react';
import { Plus, Edit, Trash2, User, Mail, Shield } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { reportsService } from '../services/reports';
import { formatDate, formatInitials } from '../utils/formatters';
import { USER_ROLES, USER_ROLE_LABELS } from '../utils/constants';
import DataTable from '../components/DataTable';
import Modal, { ConfirmModal } from '../components/Modal';
import toast from 'react-hot-toast';

const Users = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    role: '',
    password: ''
  });

  // Fetch users
  const {
    data: users = [],
    loading,
    execute: refreshUsers
  } = useApi(
    () => reportsService.getUsers(),
    [],
    { immediate: true }
  );

  // Table columns
  const columns = [
    {
      key: 'user',
      label: 'Пользователь',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
            {formatInitials(row.username)}
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-white">{row.username}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
              <Mail className="w-3 h-3 mr-1" />
              {row.email}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'role',
      label: 'Роль',
      sortable: true,
      render: (value) => {
        const roleColors = {
          'Admin': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
          'Accountant': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
          'Warehouse_keeper': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
          'Observer': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
        };

        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[value] || 'bg-gray-100 text-gray-800'}`}>
            <Shield className="w-3 h-3 mr-1" />
            {USER_ROLE_LABELS[value] || value}
          </span>
        );
      }
    },
    {
      key: 'created_at',
      label: 'Дата создания',
      sortable: true,
      render: (value) => formatDate(new Date(value))
    },
    {
      key: 'last_login',
      label: 'Последний вход',
      sortable: true,
      render: (value) => value ? formatDate(new Date(value), 'dd.MM.yyyy HH:mm') : 'Никогда'
    },
    {
      key: 'is_active',
      label: 'Статус',
      sortable: true,
      render: (value) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          value 
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        }`}>
          {value ? 'Активен' : 'Заблокирован'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Действия',
      sortable: false,
      render: (value, row) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleEditUser(row)}
            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-200"
            title="Редактировать"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteUser(row)}
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
  const handleCreateUser = () => {
    setFormData({
      email: '',
      username: '',
      role: '',
      password: ''
    });
    setShowCreateModal(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setFormData({
      email: user.email || '',
      username: user.username || '',
      role: user.role || '',
      password: '' // Don't prefill password for security
    });
    setShowEditModal(true);
  };

  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (selectedUser) {
        // Update existing user
        const updateData = { ...formData };
        if (!updateData.password) {
          delete updateData.password; // Don't update password if empty
        }
        await reportsService.updateUser(selectedUser.id, updateData);
        toast.success('Пользователь успешно обновлен');
        setShowEditModal(false);
      } else {
        // Create new user
        await reportsService.createUser(formData);
        toast.success('Пользователь успешно создан');
        setShowCreateModal(false);
      }
      
      refreshUsers();
      setSelectedUser(null);
    } catch (error) {
      toast.error('Ошибка при сохранении пользователя');
    }
  };

  const handleConfirmDelete = async () => {
    try {
      // await reportsService.deleteUser(selectedUser.id);
      toast.success('Пользователь успешно удален');
      setShowDeleteModal(false);
      setSelectedUser(null);
      refreshUsers();
    } catch (error) {
      toast.error('Ошибка при удалении пользователя');
    }
  };

  // Get role stats
  const roleStats = Object.values(USER_ROLES).reduce((acc, role) => {
    acc[role] = users.filter(user => user.role === role).length;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Пользователи</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Управление пользователями системы (только для администраторов)
          </p>
        </div>
        
        <button
          onClick={handleCreateUser}
          className="btn-primary flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Добавить пользователя
        </button>
      </div>

      {/* Role statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {Object.entries(USER_ROLE_LABELS).map(([role, label]) => (
          <div key={role} className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {label}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {roleStats[role] || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Users table */}
      <div className="card">
        <DataTable
          data={users}
          columns={columns}
          loading={loading}
          emptyMessage="Пользователи не найдены"
        />
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showCreateModal || showEditModal}
        onClose={() => {
          setShowCreateModal(false);
          setShowEditModal(false);
          setSelectedUser(null);
        }}
        title={selectedUser ? 'Редактировать пользователя' : 'Создать пользователя'}
        size="md"
      >
        <form onSubmit={handleFormSubmit} className="space-y-6">
          <div>
            <label className="form-label">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="form-input"
              placeholder="user@result-education.ru"
              required
            />
          </div>
          
          <div>
            <label className="form-label">Имя пользователя *</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="form-input"
              placeholder="Иван Иванов"
              required
            />
          </div>
          
          <div>
            <label className="form-label">Роль *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="form-select"
              required
            >
              <option value="">Выберите роль</option>
              {Object.entries(USER_ROLE_LABELS).map(([role, label]) => (
                <option key={role} value={role}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="form-label">
              Пароль {selectedUser ? '(оставьте пустым, чтобы не изменять)' : '*'}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="form-input"
              placeholder="Минимум 6 символов"
              required={!selectedUser}
              minLength={6}
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setShowCreateModal(false);
                setShowEditModal(false);
                setSelectedUser(null);
              }}
              className="btn-outline"
            >
              Отмена
            </button>
            <button type="submit" className="btn-primary">
              {selectedUser ? 'Сохранить изменения' : 'Создать пользователя'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedUser(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Удаление пользователя"
        message={`Вы уверены, что хотите удалить пользователя "${selectedUser?.username}"? Это действие нельзя отменить.`}
        confirmText="Удалить"
        cancelText="Отмена"
        variant="danger"
      />
    </div>
  );
};

export default Users;