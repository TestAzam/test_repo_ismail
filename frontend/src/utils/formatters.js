import { CURRENCY, DATE_FORMATS } from './constants';

// Currency formatter
export const formatCurrency = (amount, options = {}) => {
  const {
    currency = CURRENCY.CODE,
    locale = CURRENCY.LOCALE,
    minimumFractionDigits = 0,
    maximumFractionDigits = 2
  } = options;

  if (amount === null || amount === undefined || isNaN(amount)) {
    return '—';
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits
  }).format(amount);
};

// Number formatter
export const formatNumber = (number, options = {}) => {
  const {
    locale = CURRENCY.LOCALE,
    minimumFractionDigits = 0,
    maximumFractionDigits = 2
  } = options;

  if (number === null || number === undefined || isNaN(number)) {
    return '—';
  }

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits
  }).format(number);
};

// Percentage formatter
export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '—';
  }

  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
};

// Date formatters
export const formatDate = (date, format = DATE_FORMATS.DISPLAY) => {
  if (!date) return '—';

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return '—';
  }

  // Simple format mapping
  switch (format) {
    case DATE_FORMATS.DISPLAY:
      return dateObj.toLocaleDateString('ru-RU');
    
    case DATE_FORMATS.DISPLAY_WITH_TIME:
      return dateObj.toLocaleString('ru-RU');
    
    case DATE_FORMATS.API:
      return dateObj.toISOString().split('T')[0];
    
    case DATE_FORMATS.API_WITH_TIME:
      return dateObj.toISOString();
    
    default:
      return dateObj.toLocaleDateString('ru-RU');
  }
};

// Relative time formatter
export const formatRelativeTime = (date) => {
  if (!date) return '—';

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now - dateObj) / 1000);

  if (diffInSeconds < 60) {
    return 'только что';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} мин назад`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ч назад`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} дн назад`;
  } else {
    return formatDate(dateObj);
  }
};

// File size formatter
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  if (!bytes) return '—';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Phone number formatter
export const formatPhoneNumber = (phone) => {
  if (!phone) return '—';

  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');

  // Format Russian phone numbers
  if (cleaned.length === 11 && cleaned.startsWith('7')) {
    return `+7 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 9)}-${cleaned.slice(9)}`;
  }

  // Format other phone numbers
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 8)}-${cleaned.slice(8)}`;
  }

  return phone;
};

// Text truncation
export const truncateText = (text, maxLength = 50, suffix = '...') => {
  if (!text) return '—';
  if (text.length <= maxLength) return text;
  
  return text.slice(0, maxLength - suffix.length) + suffix;
};

// Capitalize first letter
export const capitalize = (text) => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

// Format user initials
export const formatInitials = (name) => {
  if (!name) return '??';
  
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Format inventory number
export const formatInventoryNumber = (number) => {
  if (!number) return '—';
  
  // If it's already formatted, return as is
  if (number.includes('-')) return number;
  
  // If it's just digits, format it
  if (/^\d+$/.test(number)) {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    return `INV-${dateStr}-${number.padStart(4, '0')}`;
  }
  
  return number;
};

// Status formatter with translation
export const formatStatus = (status, type = 'asset') => {
  const statusMaps = {
    asset: {
      'Active': 'Активен',
      'Inactive': 'Неактивен',
      'Repair': 'Ремонт',
      'Disposed': 'Списан'
    },
    operation: {
      'Receipt': 'Поступление',
      'Transfer': 'Перемещение',
      'Disposal': 'Списание',
      'Adjustment': 'Корректировка'
    },
    user: {
      'Admin': 'Администратор',
      'Accountant': 'Бухгалтер',
      'Warehouse_keeper': 'Кладовщик',
      'Observer': 'Наблюдатель'
    }
  };

  return statusMaps[type]?.[status] || status;
};

// Category formatter with translation
export const formatCategory = (category) => {
  const categoryMap = {
    'Fixed Assets': 'Основные средства',
    'Materials': 'Материалы',
    'Goods': 'Товары',
    'Inventory': 'Инвентарь'
  };

  return categoryMap[category] || category;
};

// Address formatter
export const formatAddress = (address) => {
  if (!address) return '—';
  
  // If it's an object, combine fields
  if (typeof address === 'object') {
    const parts = [
      address.country,
      address.city,
      address.street,
      address.building
    ].filter(Boolean);
    
    return parts.join(', ');
  }
  
  return address;
};

// Array formatter
export const formatArray = (array, separator = ', ') => {
  if (!Array.isArray(array) || array.length === 0) return '—';
  return array.join(separator);
};

// Boolean formatter
export const formatBoolean = (value, trueText = 'Да', falseText = 'Нет') => {
  if (value === null || value === undefined) return '—';
  return value ? trueText : falseText;
};

// Object key formatter (camelCase to readable)
export const formatObjectKey = (key) => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
};

// Search highlight formatter
export const highlightSearchTerm = (text, searchTerm) => {
  if (!text || !searchTerm) return text;
  
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>');
};

// Duration formatter
export const formatDuration = (seconds) => {
  if (!seconds || seconds < 0) return '0 сек';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours} ч ${minutes} мин`;
  } else if (minutes > 0) {
    return `${minutes} мин ${remainingSeconds} сек`;
  } else {
    return `${remainingSeconds} сек`;
  }
};

// Color formatter for charts
export const getChartColor = (index, theme = 'light') => {
  const colors = {
    light: ['#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316'],
    dark: ['#60A5FA', '#4ADE80', '#FBBF24', '#F87171', '#A78BFA', '#22D3EE', '#FB923C']
  };
  
  return colors[theme][index % colors[theme].length];
};

// Export all formatters as default object
export default {
  formatCurrency,
  formatNumber,
  formatPercentage,
  formatDate,
  formatRelativeTime,
  formatFileSize,
  formatPhoneNumber,
  truncateText,
  capitalize,
  formatInitials,
  formatInventoryNumber,
  formatStatus,
  formatCategory,
  formatAddress,
  formatArray,
  formatBoolean,
  formatObjectKey,
  highlightSearchTerm,
  formatDuration,
  getChartColor
};