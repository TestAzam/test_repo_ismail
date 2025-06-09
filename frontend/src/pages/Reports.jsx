import React, { useState } from 'react';
import { Download, FileText, BarChart3, PieChart, Calendar, Filter, RefreshCw } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { reportsService } from '../services/reports';
import { excelService } from '../services/excel';
import { formatCurrency, formatNumber, formatDate } from '../utils/formatters';
import { AssetCategoryChart, MonthlyOperationsChart, WarehouseComparisonChart } from '../components/Charts';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

const Reports = () => {
  const { hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState('');

  // Filter state
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    warehouse_ids: [],
    category: '',
    status: ''
  });

  // Fetch dashboard data
  const {
    data: dashboardData,
    loading: dashboardLoading,
    execute: refreshDashboard
  } = useApi(
    () => reportsService.getDashboardData(),
    [],
    { immediate: true }
  );

  // Fetch warehouses for filters
  const { data: warehouses = [] } = useApi(
    () => reportsService.getWarehouses(),
    [],
    { immediate: true }
  );

  // Generate asset report
  const {
    data: assetReport,
    loading: assetReportLoading,
    execute: generateAssetReport
  } = useApi(
    () => reportsService.generateAssetReport(filters),
    [],
    { immediate: false }
  );

  // Generate operation report
  const {
    data: operationReport,
    loading: operationReportLoading,
    execute: generateOperationReport
  } = useApi(
    () => reportsService.generateOperationReport(filters),
    [],
    { immediate: false }
  );

  // Mock data for demonstration
  const stats = dashboardData?.stats || {
    total_assets: 2790,
    total_value: 5430000,
    operations_today: 23,
    active_warehouses: 8
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

  const warehouseData = warehouses.map(warehouse => ({
    name: warehouse.name,
    value: Math.random() * 2000000 + 500000 // Mock data
  }));

  // Predefined date ranges
  const dateRanges = [
    { label: 'Сегодня', value: 'today' },
    { label: 'Вчера', value: 'yesterday' },
    { label: 'Эта неделя', value: 'this_week' },
    { label: 'Прошлая неделя', value: 'last_week' },
    { label: 'Этот месяц', value: 'this_month' },
    { label: 'Прошлый месяц', value: 'last_month' },
    { label: 'Этот квартал', value: 'this_quarter' },
    { label: 'Этот год', value: 'this_year' },
    { label: 'Произвольный период', value: 'custom' }
  ];

  // Export handlers
  const handleExport = async (type, reportType = 'dashboard') => {
    setIsExporting(true);
    setExportType(type);
    
    try {
      if (reportType === 'assets') {
        await excelService.exportAssets(filters);
      } else if (reportType === 'operations') {
        await excelService.exportOperations(filters);
      } else {
        // Export dashboard summary
        const data = {
          stats: stats,
          categoryStats: categoryStats,
          warehouseData: warehouseData
        };
        
        if (type === 'excel') {
          // Create Excel summary report
          toast.success('Функция экспорта в Excel в разработке');
        } else if (type === 'csv') {
          // Export as CSV
          excelService.exportToCSV(categoryStats, 'category_stats.csv', ['name', 'count', 'value']);
        }
      }
      
      toast.success('Экспорт завершен успешно');
    } catch (error) {
      toast.error('Ошибка при экспорте данных');
    } finally {
      setIsExporting(false);
      setExportType('');
    }
  };

  const handleFilterApply = () => {
    if (activeTab === 'assets') {
      generateAssetReport();
    } else if (activeTab === 'operations') {
      generateOperationReport();
    }
    setShowFilterModal(false);
  };

  const handleDateRangeSelect = (range) => {
    const today = new Date();
    let startDate, endDate;

    switch (range) {
      case 'today':
        startDate = endDate = today.toISOString().split('T')[0];
        break;
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        startDate = endDate = yesterday.toISOString().split('T')[0];
        break;
      case 'this_week':
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startDate = startOfWeek.toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
      case 'this_month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
      case 'this_year':
        startDate = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
      default:
        return;
    }

    setFilters({ ...filters, start_date: startDate, end_date: endDate });
  };

  // Tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            {/* Summary stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                  <BarChart3 className="w-8 h-8 text-blue-500" />
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
                  <PieChart className="w-8 h-8 text-green-500" />
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
                  <Calendar className="w-8 h-8 text-purple-500" />
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
                  <FileText className="w-8 h-8 text-orange-500" />
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                  Распределение активов по категориям
                </h3>
                <AssetCategoryChart data={categoryStats} />
              </div>

              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                  Операции по месяцам
                </h3>
                <MonthlyOperationsChart data={monthlyOperations} />
              </div>
            </div>

            {/* Warehouse comparison */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Стоимость активов по складам
              </h3>
              <WarehouseComparisonChart data={warehouseData} />
            </div>
          </div>
        );

      case 'assets':
        return (
          <div className="space-y-6">
            {assetReport ? (
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Отчет по активам
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Всего активов: {assetReport.total_count} | 
                    Общая стоимость: {formatCurrency(assetReport.total_value)}
                  </p>
                </div>
                <DataTable
                  data={assetReport.assets || []}
                  columns={[
                    { key: 'inventory_number', label: 'Инвентарный номер', sortable: true },
                    { key: 'name', label: 'Название', sortable: true },
                    { key: 'category', label: 'Категория', sortable: true },
                    { key: 'cost', label: 'Стоимость', sortable: true, render: (value) => formatCurrency(value) },
                    { key: 'quantity', label: 'Количество', sortable: true },
                    { 
                      key: 'total_value', 
                      label: 'Общая стоимость', 
                      sortable: false, 
                      render: (value, row) => formatCurrency(row.cost * row.quantity) 
                    }
                  ]}
                  loading={assetReportLoading}
                  emptyMessage="Активы не найдены"
                />
              </div>
            ) : (
              <div className="card p-12 text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Отчет по активам
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Настройте фильтры и сгенерируйте детальный отчет по активам
                </p>
                <button
                  onClick={() => setShowFilterModal(true)}
                  className="btn-primary"
                >
                  Настроить фильтры
                </button>
              </div>
            )}
          </div>
        );

      case 'operations':
        return (
          <div className="space-y-6">
            {operationReport ? (
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Отчет по операциям
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Всего операций: {operationReport.total_count}
                  </p>
                </div>
                <DataTable
                  data={operationReport.operations || []}
                  columns={[
                    { 
                      key: 'operation_date', 
                      label: 'Дата', 
                      sortable: true, 
                      render: (value) => formatDate(new Date(value))
                    },
                    { key: 'type', label: 'Тип', sortable: true },
                    { 
                      key: 'asset', 
                      label: 'Актив', 
                      sortable: false, 
                      render: (value, row) => row.asset?.name || '—'
                    },
                    { key: 'quantity', label: 'Количество', sortable: true },
                    { 
                      key: 'user', 
                      label: 'Пользователь', 
                      sortable: false, 
                      render: (value, row) => row.user?.username || '—'
                    }
                  ]}
                  loading={operationReportLoading}
                  emptyMessage="Операции не найдены"
                />
              </div>
            ) : (
              <div className="card p-12 text-center">
                <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Отчет по операциям
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Настройте фильтры и сгенерируйте детальный отчет по операциям
                </p>
                <button
                  onClick={() => setShowFilterModal(true)}
                  className="btn-primary"
                >
                  Настроить фильтры
                </button>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Отчеты и аналитика
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Детальная аналитика и экспорт данных
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFilterModal(true)}
            className="btn-outline flex items-center"
          >
            <Filter className="w-4 h-4 mr-2" />
            Фильтры
          </button>
          
          <button
            onClick={refreshDashboard}
            className="btn-outline flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Обновить
          </button>
          
          <div className="relative">
            <button
              onClick={() => handleExport('excel', activeTab)}
              disabled={isExporting}
              className="btn-primary flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? 'Экспорт...' : 'Экспорт Excel'}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'dashboard', name: 'Общий обзор', icon: BarChart3 },
            { id: 'assets', name: 'Отчет по активам', icon: FileText },
            { id: 'operations', name: 'Отчет по операциям', icon: Calendar }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {renderTabContent()}

      {/* Filter Modal */}
      <Modal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        title="Настройка фильтров отчета"
        size="lg"
      >
        <div className="space-y-6">
          {/* Date range presets */}
          <div>
            <label className="form-label">Период</label>
            <div className="grid grid-cols-3 gap-2">
              {dateRanges.map((range) => (
                <button
                  key={range.value}
                  onClick={() => handleDateRangeSelect(range.value)}
                  className="btn-outline text-sm"
                  disabled={range.value === 'custom'}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom date range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Дата с</label>
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Дата по</label>
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          {/* Category filter */}
          <div>
            <label className="form-label">Категория</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="form-select"
            >
              <option value="">Все категории</option>
              <option value="Fixed Assets">Основные средства</option>
              <option value="Materials">Материалы</option>
              <option value="Goods">Товары</option>
              <option value="Inventory">Инвентарь</option>
            </select>
          </div>

          {/* Warehouse filter */}
          <div>
            <label className="form-label">Склады</label>
            <select
              multiple
              value={filters.warehouse_ids}
              onChange={(e) => {
                const values = Array.from(e.target.selectedOptions, option => option.value);
                setFilters({ ...filters, warehouse_ids: values });
              }}
              className="form-select"
              size={4}
            >
              {warehouses.map(warehouse => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-1">
              Удерживайте Ctrl (Cmd) для выбора нескольких складов
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowFilterModal(false)}
              className="btn-outline"
            >
              Отмена
            </button>
            <button
              onClick={handleFilterApply}
              className="btn-primary"
            >
              Применить фильтры
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Reports;