// Application constants

// User roles
export const USER_ROLES = {
  ADMIN: 'Admin',
  ACCOUNTANT: 'Accountant',
  WAREHOUSE_KEEPER: 'Warehouse_keeper',
  OBSERVER: 'Observer'
};

// User role labels
export const USER_ROLE_LABELS = {
  [USER_ROLES.ADMIN]: 'Администратор',
  [USER_ROLES.ACCOUNTANT]: 'Бухгалтер',
  [USER_ROLES.WAREHOUSE_KEEPER]: 'Кладовщик',
  [USER_ROLES.OBSERVER]: 'Наблюдатель'
};

// Asset categories
export const ASSET_CATEGORIES = {
  FIXED_ASSETS: 'Fixed Assets',
  MATERIALS: 'Materials',
  GOODS: 'Goods',
  INVENTORY: 'Inventory'
};

// Asset category labels
export const ASSET_CATEGORY_LABELS = {
  [ASSET_CATEGORIES.FIXED_ASSETS]: 'Основные средства',
  [ASSET_CATEGORIES.MATERIALS]: 'Материалы',
  [ASSET_CATEGORIES.GOODS]: 'Товары',
  [ASSET_CATEGORIES.INVENTORY]: 'Инвентарь'
};

// Asset statuses
export const ASSET_STATUSES = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  REPAIR: 'Repair',
  DISPOSED: 'Disposed'
};

// Asset status labels and colors
export const ASSET_STATUS_CONFIG = {
  [ASSET_STATUSES.ACTIVE]: {
    label: 'Активен',
    color: 'success',
    bgColor: 'bg-success-100',
    textColor: 'text-success-800',
    darkBgColor: 'dark:bg-success-900',
    darkTextColor: 'dark:text-success-200'
  },
  [ASSET_STATUSES.INACTIVE]: {
    label: 'Неактивен',
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    darkBgColor: 'dark:bg-gray-700',
    darkTextColor: 'dark:text-gray-300'
  },
  [ASSET_STATUSES.REPAIR]: {
    label: 'Ремонт',
    color: 'warning',
    bgColor: 'bg-warning-100',
    textColor: 'text-warning-800',
    darkBgColor: 'dark:bg-warning-900',
    darkTextColor: 'dark:text-warning-200'
  },
  [ASSET_STATUSES.DISPOSED]: {
    label: 'Списан',
    color: 'danger',
    bgColor: 'bg-danger-100',
    textColor: 'text-danger-800',
    darkBgColor: 'dark:bg-danger-900',
    darkTextColor: 'dark:text-danger-200'
  }
};

// Operation types
export const OPERATION_TYPES = {
  RECEIPT: 'Receipt',
  TRANSFER: 'Transfer',
  DISPOSAL: 'Disposal',
  ADJUSTMENT: 'Adjustment'
};

// Operation type configuration
export const OPERATION_TYPE_CONFIG = {
  [OPERATION_TYPES.RECEIPT]: {
    label: 'Поступление',
    icon: 'ArrowDownRight',
    color: 'success',
    bgColor: 'bg-success-100',
    textColor: 'text-success-800',
    darkBgColor: 'dark:bg-success-900',
    darkTextColor: 'dark:text-success-200'
  },
  [OPERATION_TYPES.TRANSFER]: {
    label: 'Перемещение',
    icon: 'RotateCcw',
    color: 'primary',
    bgColor: 'bg-primary-100',
    textColor: 'text-primary-800',
    darkBgColor: 'dark:bg-primary-900',
    darkTextColor: 'dark:text-primary-200'
  },
  [OPERATION_TYPES.DISPOSAL]: {
    label: 'Списание',
    icon: 'ArrowUpRight',
    color: 'danger',
    bgColor: 'bg-danger-100',
    textColor: 'text-danger-800',
    darkBgColor: 'dark:bg-danger-900',
    darkTextColor: 'dark:text-danger-200'
  },
  [OPERATION_TYPES.ADJUSTMENT]: {
    label: 'Корректировка',
    icon: 'Edit',
    color: 'warning',
    bgColor: 'bg-warning-100',
    textColor: 'text-warning-800',
    darkBgColor: 'dark:bg-warning-900',
    darkTextColor: 'dark:text-warning-200'
  }
};

// Navigation items with role-based access
export const NAVIGATION_ITEMS = [
  {
    id: 'dashboard',
    name: 'Панель управления',
    path: '/',
    icon: 'Home',
    roles: [USER_ROLES.ADMIN, USER_ROLES.ACCOUNTANT, USER_ROLES.WAREHOUSE_KEEPER, USER_ROLES.OBSERVER]
  },
  {
    id: 'assets',
    name: 'Активы',
    path: '/assets',
    icon: 'Package',
    roles: [USER_ROLES.ADMIN, USER_ROLES.ACCOUNTANT, USER_ROLES.WAREHOUSE_KEEPER, USER_ROLES.OBSERVER]
  },
  {
    id: 'operations',
    name: 'Операции',
    path: '/operations',
    icon: 'TrendingUp',
    roles: [USER_ROLES.ADMIN, USER_ROLES.ACCOUNTANT, USER_ROLES.WAREHOUSE_KEEPER]
  },
  {
    id: 'warehouses',
    name: 'Склады',
    path: '/warehouses',
    icon: 'Warehouse',
    roles: [USER_ROLES.ADMIN, USER_ROLES.ACCOUNTANT, USER_ROLES.WAREHOUSE_KEEPER]
  },
  {
    id: 'branches',
    name: 'Филиалы',
    path: '/branches',
    icon: 'Building2',
    roles: [USER_ROLES.ADMIN]
  },
  {
    id: 'users',
    name: 'Пользователи',
    path: '/users',
    icon: 'Users',
    roles: [USER_ROLES.ADMIN]
  },
  {
    id: 'reports',
    name: 'Отчеты',
    path: '/reports',
    icon: 'FileText',
    roles: [USER_ROLES.ADMIN, USER_ROLES.ACCOUNTANT, USER_ROLES.OBSERVER]
  },
  {
    id: 'settings',
    name: 'Настройки',
    path: '/settings',
    icon: 'Settings',
    roles: [USER_ROLES.ADMIN]
  }
];

// Pagination settings
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 25, 50, 100],
  MAX_PAGE_SIZE: 100
};

// API settings
export const API_CONFIG = {
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000
};

// Date formats
export const DATE_FORMATS = {
  DISPLAY: 'dd.MM.yyyy',
  DISPLAY_WITH_TIME: 'dd.MM.yyyy HH:mm',
  API: 'yyyy-MM-dd',
  API_WITH_TIME: "yyyy-MM-dd'T'HH:mm:ss"
};

// Currency settings
export const CURRENCY = {
  CODE: 'RUB',
  SYMBOL: '₽',
  LOCALE: 'ru-RU'
};

// File upload settings
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx']
};

// Theme settings
export const THEME_COLORS = {
  primary: '#3B82F6',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  gray: '#6B7280'
};

// Chart colors for different themes
export const CHART_COLORS = {
  light: ['#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316'],
  dark: ['#60A5FA', '#4ADE80', '#FBBF24', '#F87171', '#A78BFA', '#22D3EE', '#FB923C']
};

// Validation rules
export const VALIDATION_RULES = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  password: {
    minLength: 6,
    requireUppercase: false,
    requireLowercase: false,
    requireNumbers: false,
    requireSpecialChars: false
  },
  phone: /^[\+]?[1-9][\d]{0,15}$/,
  inn: /^\d{10}$|^\d{12}$/,
  inventoryNumber: /^INV-\d{8}-\d{4}$/
};

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Ошибка сети. Проверьте подключение к интернету',
  SERVER_ERROR: 'Ошибка сервера. Попробуйте позже',
  UNAUTHORIZED: 'Доступ запрещен. Войдите в систему',
  FORBIDDEN: 'У вас нет прав для выполнения этого действия',
  NOT_FOUND: 'Запрашиваемый ресурс не найден',
  VALIDATION_ERROR: 'Ошибка валидации данных',
  TIMEOUT: 'Превышено время ожидания запроса'
};

// Success messages
export const SUCCESS_MESSAGES = {
  LOGIN: 'Вход выполнен успешно',
  LOGOUT: 'Выход выполнен успешно',
  CREATED: 'Запись создана успешно',
  UPDATED: 'Запись обновлена успешно',
  DELETED: 'Запись удалена успешно',
  EXPORTED: 'Данные экспортированы успешно'
};

// Local storage keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  THEME: 'theme',
  SIDEBAR_COLLAPSED: 'sidebar_collapsed',
  LAST_VISIT: 'last_visit'
};

// App metadata
export const APP_INFO = {
  NAME: 'Asset Management Platform',
  VERSION: '1.0.0',
  DESCRIPTION: 'Система управления активами компании',
  AUTHOR: 'Result Education',
  COPYRIGHT: '© 2025 Result Education. Все права защищены.'
};

// Feature flags
export const FEATURES = {
  DARK_MODE: true,
  EXPORT_EXCEL: true,
  EXPORT_CSV: true,
  BULK_OPERATIONS: true,
  ADVANCED_SEARCH: true,
  NOTIFICATIONS: true,
  AUDIT_LOGS: true,
  REAL_TIME_UPDATES: false, // Future feature
  MOBILE_APP: false, // Future feature
  BARCODE_SCANNING: false // Future feature
};

// Performance settings
export const PERFORMANCE = {
  DEBOUNCE_DELAY: 300,
  THROTTLE_DELAY: 1000,
  VIRTUAL_SCROLL_THRESHOLD: 100,
  IMAGE_LAZY_LOADING: true,
  ENABLE_CACHING: true,
  CACHE_TTL: 5 * 60 * 1000 // 5 minutes
};

// Export default object with all constants
export default {
  USER_ROLES,
  USER_ROLE_LABELS,
  ASSET_CATEGORIES,
  ASSET_CATEGORY_LABELS,
  ASSET_STATUSES,
  ASSET_STATUS_CONFIG,
  OPERATION_TYPES,
  OPERATION_TYPE_CONFIG,
  NAVIGATION_ITEMS,
  PAGINATION,
  API_CONFIG,
  DATE_FORMATS,
  CURRENCY,
  FILE_UPLOAD,
  THEME_COLORS,
  CHART_COLORS,
  VALIDATION_RULES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  STORAGE_KEYS,
  APP_INFO,
  FEATURES,
  PERFORMANCE
};