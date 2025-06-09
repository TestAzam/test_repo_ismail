import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, 
  TrendingUp, 
  Warehouse, 
  RotateCcw, 
  ArrowUpRight, 
  ArrowDownRight, 
  Edit,
  RefreshCw,
  Download,
  Eye
} from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { reportsService } from '../services/reports';
import { formatCurrency, formatNumber, formatRelativeTime } from '../utils/formatters';
import { AssetCategoryChart, MonthlyOperationsChart } from '../components/Charts';
import DataTable from '../components/DataTable';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [refreshing, setRefreshing] = useState(false);
  
  // Fetch dashboard data
  const {
    data: dashboardData,
    loading,
    error,
    execute: refreshDashboard
  } = useApi(
    () => reportsService.getDashboardData(),
    [],
    {
      immediate: true,
      onError: (error) => {
        console.error('Dashboard data fetch failed:', error);
      }
    }
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshDashboard();
      toast.success('Данные обновлены');
    } catch (error) {
      toast.error('Ошибка обновления данных');
    } finally {
      setRefreshing(false);
    }
  };

  // Mock data for development (replace with real data from API)
  const stats = dashboardData?.stats || {
    total_assets: 2790,
    total_value: 5430000,
    operations_today: 23,
    active_warehouses: 8,
    monthly_growth: 12.5
  };

  const categoryStats = dashboardData?.category_stats || [
    { category: 'Fixed Assets', name: 'Основные средства', count: 1250, value: 3200000, percentage: 45 },
    { category: 'Materials', name: 'Материалы', count: 680, value: 1100000, percentage: 25 },
    { category: 'Goods', name: 'Товары', count: 520, value: 800000, percentage: 20 },
    { category: 'Inventory', name: 'Инвентарь', count: 340, value: 330000, percentage: 10 }
  ];

  const monthlyOperations = dashboardData?.monthly_operations || [
    { month: 'Янв', receipt: 120, transfer: 80, disposal: 20, adjustment: 15 },
    { month: 'Фев', receipt: 140, transfer: 95, disposal: 15, adjustment: 20 },
    { month: 'Мар', receipt: 160, transfer: 110, disposal: 25, adjustment: 18 },
    { month: 'Апр', receipt: 180, transfer: 120, disposal: 30, adjustment: 22 },
    { month: 'Май', receipt: 200, transfer: 140, disposal: 35, adjustment: 25 },
    { month: 'Июн', receipt: 220, transfer: 160, disposal: 28, adjustment: 30 }
  ];

  const recentOperations = dashboardData?.recent_operations || [
    {
      id: 1,
      type: 'Receipt',
      asset: { name: 'Компьютер Dell Inspiron', inventory_number: 'INV-20250609-0001' },
      user: { username: 'Иван Иванов' },
      operation_date: '2025-06-09T10:30:00Z',
      from_warehouse: null,
      to_warehouse: { name: 'Склад №1' },
      quantity: 1
    },
    {
      id: 2,
      type: 'Transfer',
      asset: { name: 'Принтер HP LaserJet', inventory_number: 'INV-20250608-0002' },
      user: { username: 'Петр Петров' },
      operation_date: '2025-06-08T15:45:00Z',
      from_warehouse: { name: 'Склад №1' },
      to_warehouse: { name: 'Склад №2' },
      quantity: 1
    },
    {
      id: 3,
      type: 'Disposal',
      asset: { name: 'Старый монитор Samsung', inventory_number: 'INV-20240515-0123' },
      user: { username: 'Анна Сидорова' },
      operation_date: '2025-06-07T09:15:00Z',
      from_warehouse: { name: 'Склад №3' },
      to_warehouse: null,
      quantity: 1
    }
  ];

  // Table columns for recent operations
  const operationColumns = [
    {
      key: 'type',
      label: 'Тип',
      sortable: false,
      render: (value) => {
        const icons = {
          'Receipt': <ArrowDownRight className="w-4 h-4 text-green-500" />,
          'Transfer': <RotateCcw className="w-4 h-4 text-blue-500" />,
          'Disposal': <ArrowUpRight className="w-4 h-4 text-red-500" />,
          'Adjustment': <Edit className="w-4 h-4 text-yellow-500" />
        };
        
        const labels = {
          'Receipt': 'Поступление',
          'Transfer': 'Перемещение',
          'Disposal': 'Списание',
          'Adjustment': 'Корректировка'
        };

        return (
          <div className="flex items-center space-x-2">
            {icons[value]}
            <span>{labels[value]}</span>
          </div>
        );
      }
    },
    {
      key: 'asset.name',
      label: 'Актив',
      sortable: false,
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">{value}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{row.asset?.inventory_number}</div>
        </div>
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
          return <span className="text-green-600 dark:text-green-400">→ {to}</span>;
        } else if (row.type === 'Disposal') {
          return <span className="text-red-600 dark:text-red-400">{from} →</span>;
        } else if (row.type === 'Transfer') {
          return <span className="text-blue-600 dark:text-blue-400">{from} → {to}</span>;
        } else {
          return <span className="text-yellow-600 dark:text-yellow-400">Корректировка</span>;
        }
      }
    },
    {
      key: 'user.username',
      label: 'Пользователь',
      sortable: false
    },
    {
      key: 'operation_date',
      label: 'Время',
      sortable: false,
      render: (value) => formatRelativeTime(value)
    },
    {
      key: 'actions',
      label: 'Действия',
      sortable: false,
      render: (value, row) => (
        <button
          className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
          title="Просмотр деталей"
        >
          <Eye className="w-4 h-4" />
        </button>
      )
    }
  ];

  if (loading && !dashboardData) {
    return (
      <div className="space-y-6">
        {/* Stats skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-6">
              <div className="skeleton skeleton-text mb-2"></div>
              <div className="skeleton skeleton-title mb-4"></div>
              <div className="skeleton skeleton-text w-1/2"></div>
            </div>
          ))}
        </div>
        
        {/* Charts skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <div className="skeleton skeleton-title mb-4"></div>
            <div className="skeleton w-full h-64"></div>
          </div>
          <div className="card p-6">
            <div className="skeleton skeleton-title mb-4"></div>
            <div className="skeleton w-full h-64"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Панель управления
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Обзор активов и операций компании
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-outline flex items-center"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Обновить
          </button>
          
          <Link to="/reports" className="btn-primary flex items-center">
            <Download className="w-4 h-4 mr-2" />
            Экспорт отчета
          </Link>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Всего активов
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(stats.total_assets)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-green-600 dark:text-green-400">
              +{stats.monthly_growth}% за месяц
            </span>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Общая стоимость
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(stats.total_value, { minimumFractionDigits: 0 })}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-green-600 dark:text-green-400">
              +8% за месяц
            </span>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Операций сегодня
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(stats.operations_today)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <RotateCcw className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-red-600 dark:text-red-400">
              -5% от вчера
            </span>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Активных складов
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(stats.active_warehouses)}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
              <Warehouse className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-green-600 dark:text-green-400">
              +1 новый
            </span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Распределение активов
            </h3>
            <Link
              to="/assets"
              className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            >
              Подробнее →
            </Link>
          </div>
          <AssetCategoryChart data={categoryStats} />
          
          {/* Legend */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            {categoryStats.map((item, index) => {
              const colors = ['#3B82F6', '#22C55E', '#F59E0B', '#EF4444'];
              return (
                <div key={item.category} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: colors[index] }}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {item.name}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white ml-auto">
                    {item.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Операции по месяцам
            </h3>
            <Link
              to="/operations"
              className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            >
              Все операции →
            </Link>
          </div>
          <MonthlyOperationsChart data={monthlyOperations} />
        </div>
      </div>

      {/* Recent operations */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Последние операции
            </h3>
            <Link
              to="/operations"
              className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            >
              Смотреть все
            </Link>
          </div>
        </div>
        
        <div className="card-body p-0">
          <DataTable
            data={recentOperations}
            columns={operationColumns}
            loading={loading}
            emptyMessage="Операции не найдены"
          />
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/assets" className="card p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">
                Управление активами
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Просмотр и редактирование активов
              </p>
            </div>
          </div>
        </Link>

        <Link to="/operations" className="card p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">
                Создать операцию
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Поступление, перемещение, списание
              </p>
            </div>
          </div>
        </Link>

        <Link to="/reports" className="card p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <Download className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">
                Отчеты и аналитика
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Экспорт данных и статистика
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;