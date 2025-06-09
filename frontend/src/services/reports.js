import { apiService } from './api';

// Reports service
export const reportsService = {
  // Get dashboard data
  getDashboardData: async () => {
    try {
      const response = await apiService.get('/dashboard');
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Generate asset report
  generateAssetReport: async (filters = {}) => {
    try {
      const response = await apiService.post('/reports/assets', filters);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Generate operation report
  generateOperationReport: async (filters = {}) => {
    try {
      const response = await apiService.post('/reports/operations', filters);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get warehouses list
  getWarehouses: async () => {
    try {
      const response = await apiService.get('/warehouses');
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get branches list
  getBranches: async () => {
    try {
      const response = await apiService.get('/branches');
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Get users list (Admin only)
  getUsers: async () => {
    try {
      const response = await apiService.get('/users');
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Create warehouse
  createWarehouse: async (warehouseData) => {
    try {
      const response = await apiService.post('/warehouses', warehouseData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Create branch (Admin only)
  createBranch: async (branchData) => {
    try {
      const response = await apiService.post('/branches', branchData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Create user (Admin only)
  createUser: async (userData) => {
    try {
      const response = await apiService.post('/users', userData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Update user (Admin only)
  updateUser: async (userId, userData) => {
    try {
      const response = await apiService.put(`/users/${userId}`, userData);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Format dashboard statistics
  formatDashboardStats: (stats) => {
    return {
      ...stats,
      formattedTotalValue: new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 0
      }).format(stats.total_value),
      formattedMonthlyGrowth: `${stats.monthly_growth >= 0 ? '+' : ''}${stats.monthly_growth.toFixed(1)}%`
    };
  },

  // Format category statistics for charts
  formatCategoryStats: (categoryStats) => {
    return categoryStats.map(stat => ({
      ...stat,
      name: reportsService.getCategoryLabel(stat.category),
      formattedValue: new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 0
      }).format(stat.value)
    }));
  },

  // Get category label in Russian
  getCategoryLabel: (category) => {
    const labels = {
      'Fixed Assets': 'Основные средства',
      'Materials': 'Материалы',
      'Goods': 'Товары',
      'Inventory': 'Инвентарь'
    };
    return labels[category] || category;
  },

  // Get month label in Russian
  getMonthLabel: (month) => {
    const labels = {
      'Jan': 'Янв', 'Feb': 'Фев', 'Mar': 'Мар', 'Apr': 'Апр',
      'May': 'Май', 'Jun': 'Июн', 'Jul': 'Июл', 'Aug': 'Авг',
      'Sep': 'Сен', 'Oct': 'Окт', 'Nov': 'Ноя', 'Dec': 'Дек'
    };
    return labels[month] || month;
  },

  // Calculate period comparison
  calculatePeriodComparison: (currentValue, previousValue) => {
    if (!previousValue || previousValue === 0) return 0;
    return ((currentValue - previousValue) / previousValue) * 100;
  },

  // Generate summary statistics
  generateSummaryStats: (data) => {
    const totalItems = data.length;
    const totalValue = data.reduce((sum, item) => sum + (item.cost * item.quantity), 0);
    const averageValue = totalItems > 0 ? totalValue / totalItems : 0;
    
    const categoryBreakdown = data.reduce((acc, item) => {
      const category = item.category;
      if (!acc[category]) {
        acc[category] = { count: 0, value: 0 };
      }
      acc[category].count += 1;
      acc[category].value += item.cost * item.quantity;
      return acc;
    }, {});

    return {
      totalItems,
      totalValue,
      averageValue,
      categoryBreakdown,
      formattedTotalValue: new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB'
      }).format(totalValue),
      formattedAverageValue: new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB'
      }).format(averageValue)
    };
  },

  // Get date range presets
  getDateRangePresets: () => {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfQuarter = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const last30Days = new Date(startOfToday);
    last30Days.setDate(startOfToday.getDate() - 30);
    
    return [
      {
        label: 'Сегодня',
        start_date: startOfToday.toISOString(),
        end_date: today.toISOString()
      },
      {
        label: 'Эта неделя',
        start_date: startOfWeek.toISOString(),
        end_date: today.toISOString()
      },
      {
        label: 'Этот месяц',
        start_date: startOfMonth.toISOString(),
        end_date: today.toISOString()
      },
      {
        label: 'Этот квартал',
        start_date: startOfQuarter.toISOString(),
        end_date: today.toISOString()
      },
      {
        label: 'Этот год',
        start_date: startOfYear.toISOString(),
        end_date: today.toISOString()
      },
      {
        label: 'Последние 30 дней',
        start_date: last30Days.toISOString(),
        end_date: today.toISOString()
      }
    ];
  },

  // Validate report filters
  validateReportFilters: (filters) => {
    const errors = {};

    if (filters.start_date && filters.end_date) {
      const startDate = new Date(filters.start_date);
      const endDate = new Date(filters.end_date);
      
      if (startDate > endDate) {
        errors.date_range = 'Дата начала не может быть позже даты окончания';
      }
      
      if (startDate > new Date()) {
        errors.start_date = 'Дата начала не может быть в будущем';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
};