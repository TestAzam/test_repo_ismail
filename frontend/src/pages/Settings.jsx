import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Building, 
  Users, 
  Database, 
  Shield, 
  Bell, 
  Palette, 
  Globe,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  Check,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useApi } from '../hooks/useApi';
import { reportsService } from '../services/reports';
import { formatFileSize, formatDate } from '../utils/formatters';
import Modal, { ConfirmModal } from '../components/Modal';
import toast from 'react-hot-toast';

const Settings = () => {
  const { user } = useAuth();
  const { theme, setTheme, THEMES } = useTheme();
  const [activeTab, setActiveTab] = useState('company');
  const [isSaving, setSaving] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  // Company settings
  const [companyData, setCompanyData] = useState({
    name: 'Result Education',
    inn: '7743013902',
    email: 'info@result-education.ru',
    address: 'г. Ташкент, ул. Шота Руставели, д. 10',
    phone: '+998 71 123-45-67',
    website: 'https://result-education.ru',
    logo: null
  });

  // System settings
  const [systemSettings, setSystemSettings] = useState({
    auto_backup: true,
    backup_frequency: 'daily',
    inventory_prefix: 'INV',
    enable_notifications: true,
    enable_audit_logs: true,
    session_timeout: 30,
    max_file_size: 10,
    allowed_file_types: ['pdf', 'doc', 'docx', 'jpg', 'png']
  });

  // Security settings
  const [securitySettings, setSecuritySettings] = useState({
    password_min_length: 6,
    password_require_uppercase: false,
    password_require_numbers: false,
    password_require_symbols: false,
    login_attempts_limit: 5,
    two_factor_auth: false,
    ip_whitelist_enabled: false,
    ip_whitelist: []
  });

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    operation_alerts: true,
    system_alerts: true,
    weekly_reports: true,
    asset_expiry_alerts: true,
    low_stock_alerts: false,
    notification_email: user?.email || ''
  });

  // Get system statistics
  const { data: systemStats } = useApi(
    () => Promise.resolve({
      total_users: 12,
      total_assets: 2790,
      total_operations: 15420,
      database_size: '245.7 MB',
      last_backup: '2025-06-09T02:00:00Z',
      uptime: '15 дней, 6 часов',
      version: '1.0.0'
    }),
    [],
    { immediate: true }
  );

  const tabs = [
    { id: 'company', name: 'Компания', icon: Building },
    { id: 'system', name: 'Система', icon: Database },
    { id: 'security', name: 'Безопасность', icon: Shield },
    { id: 'notifications', name: 'Уведомления', icon: Bell },
    { id: 'appearance', name: 'Интерфейс', icon: Palette },
    { id: 'backup', name: 'Резервные копии', icon: Download }
  ];

  const handleSave = async (settingsType) => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Настройки сохранены успешно');
    } catch (error) {
      toast.error('Ошибка при сохранении настроек');
    } finally {
      setSaving(false);
    }
  };

  const handleBackup = async () => {
    try {
      // Simulate backup creation
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Резервная копия создана успешно');
      setShowBackupModal(false);
    } catch (error) {
      toast.error('Ошибка при создании резервной копии');
    }
  };

  const handleReset = async () => {
    try {
      // Simulate settings reset
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reset to defaults
      setSystemSettings({
        auto_backup: true,
        backup_frequency: 'daily',
        inventory_prefix: 'INV',
        enable_notifications: true,
        enable_audit_logs: true,
        session_timeout: 30,
        max_file_size: 10,
        allowed_file_types: ['pdf', 'doc', 'docx', 'jpg', 'png']
      });
      
      toast.success('Настройки сброшены к значениям по умолчанию');
      setShowResetModal(false);
    } catch (error) {
      toast.error('Ошибка при сбросе настроек');
    }
  };

  const renderCompanyTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Информация о компании
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="form-label">Название компании</label>
            <input
              type="text"
              value={companyData.name}
              onChange={(e) => setCompanyData({...companyData, name: e.target.value})}
              className="form-input"
            />
          </div>
          
          <div>
            <label className="form-label">ИНН</label>
            <input
              type="text"
              value={companyData.inn}
              onChange={(e) => setCompanyData({...companyData, inn: e.target.value})}
              className="form-input"
            />
          </div>
          
          <div>
            <label className="form-label">Email</label>
            <input
              type="email"
              value={companyData.email}
              onChange={(e) => setCompanyData({...companyData, email: e.target.value})}
              className="form-input"
            />
          </div>
          
          <div>
            <label className="form-label">Телефон</label>
            <input
              type="tel"
              value={companyData.phone}
              onChange={(e) => setCompanyData({...companyData, phone: e.target.value})}
              className="form-input"
            />
          </div>
          
          <div>
            <label className="form-label">Веб-сайт</label>
            <input
              type="url"
              value={companyData.website}
              onChange={(e) => setCompanyData({...companyData, website: e.target.value})}
              className="form-input"
            />
          </div>
        </div>
        
        <div className="mt-6">
          <label className="form-label">Адрес</label>
          <textarea
            value={companyData.address}
            onChange={(e) => setCompanyData({...companyData, address: e.target.value})}
            className="form-textarea"
            rows={3}
          />
        </div>
        
        <div className="mt-6">
          <label className="form-label">Логотип компании</label>
          <div className="mt-2 flex items-center space-x-6">
            <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <Building className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <button className="btn-outline">
                <Upload className="w-4 h-4 mr-2" />
                Загрузить логотип
              </button>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                PNG или JPG до 2MB
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          onClick={() => handleSave('company')}
          disabled={isSaving}
          className="btn-primary flex items-center"
        >
          {isSaving ? (
            <div className="spinner mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Сохранить изменения
        </button>
      </div>
    </div>
  );

  const renderSystemTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Системные настройки
        </h3>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="form-label">Префикс инвентарных номеров</label>
              <input
                type="text"
                value={systemSettings.inventory_prefix}
                onChange={(e) => setSystemSettings({...systemSettings, inventory_prefix: e.target.value})}
                className="form-input"
              />
            </div>
            
            <div>
              <label className="form-label">Время сессии (минуты)</label>
              <input
                type="number"
                min="5"
                max="480"
                value={systemSettings.session_timeout}
                onChange={(e) => setSystemSettings({...systemSettings, session_timeout: parseInt(e.target.value)})}
                className="form-input"
              />
            </div>
            
            <div>
              <label className="form-label">Максимальный размер файла (MB)</label>
              <input
                type="number"
                min="1"
                max="100"
                value={systemSettings.max_file_size}
                onChange={(e) => setSystemSettings({...systemSettings, max_file_size: parseInt(e.target.value)})}
                className="form-input"
              />
            </div>
            
            <div>
              <label className="form-label">Частота резервного копирования</label>
              <select
                value={systemSettings.backup_frequency}
                onChange={(e) => setSystemSettings({...systemSettings, backup_frequency: e.target.value})}
                className="form-select"
              >
                <option value="hourly">Каждый час</option>
                <option value="daily">Ежедневно</option>
                <option value="weekly">Еженедельно</option>
                <option value="monthly">Ежемесячно</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">
                  Автоматическое резервное копирование
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Создавать резервные копии автоматически
                </p>
              </div>
              <input
                type="checkbox"
                checked={systemSettings.auto_backup}
                onChange={(e) => setSystemSettings({...systemSettings, auto_backup: e.target.checked})}
                className="form-checkbox"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">
                  Логи аудита
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Записывать все действия пользователей
                </p>
              </div>
              <input
                type="checkbox"
                checked={systemSettings.enable_audit_logs}
                onChange={(e) => setSystemSettings({...systemSettings, enable_audit_logs: e.target.checked})}
                className="form-checkbox"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">
                  Системные уведомления
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Показывать уведомления о системных событиях
                </p>
              </div>
              <input
                type="checkbox"
                checked={systemSettings.enable_notifications}
                onChange={(e) => setSystemSettings({...systemSettings, enable_notifications: e.target.checked})}
                className="form-checkbox"
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between">
        <button
          onClick={() => setShowResetModal(true)}
          className="btn-outline text-red-600 border-red-300 hover:bg-red-50"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Сбросить к умолчанию
        </button>
        
        <button
          onClick={() => handleSave('system')}
          disabled={isSaving}
          className="btn-primary flex items-center"
        >
          {isSaving ? (
            <div className="spinner mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Сохранить изменения
        </button>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Настройки безопасности
        </h3>
        
        <div className="space-y-6">
          <div>
            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
              Политика паролей
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="form-label">Минимальная длина пароля</label>
                <input
                  type="number"
                  min="4"
                  max="32"
                  value={securitySettings.password_min_length}
                  onChange={(e) => setSecuritySettings({...securitySettings, password_min_length: parseInt(e.target.value)})}
                  className="form-input"
                />
              </div>
              
              <div>
                <label className="form-label">Лимит попыток входа</label>
                <input
                  type="number"
                  min="3"
                  max="10"
                  value={securitySettings.login_attempts_limit}
                  onChange={(e) => setSecuritySettings({...securitySettings, login_attempts_limit: parseInt(e.target.value)})}
                  className="form-input"
                />
              </div>
            </div>
            
            <div className="space-y-4 mt-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-white">
                    Требовать заглавные буквы
                  </label>
                </div>
                <input
                  type="checkbox"
                  checked={securitySettings.password_require_uppercase}
                  onChange={(e) => setSecuritySettings({...securitySettings, password_require_uppercase: e.target.checked})}
                  className="form-checkbox"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-white">
                    Требовать цифры
                  </label>
                </div>
                <input
                  type="checkbox"
                  checked={securitySettings.password_require_numbers}
                  onChange={(e) => setSecuritySettings({...securitySettings, password_require_numbers: e.target.checked})}
                  className="form-checkbox"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-white">
                    Требовать специальные символы
                  </label>
                </div>
                <input
                  type="checkbox"
                  checked={securitySettings.password_require_symbols}
                  onChange={(e) => setSecuritySettings({...securitySettings, password_require_symbols: e.target.checked})}
                  className="form-checkbox"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-white">
                    Двухфакторная аутентификация
                  </label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Требовать подтверждение входа через SMS или приложение
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={securitySettings.two_factor_auth}
                  onChange={(e) => setSecuritySettings({...securitySettings, two_factor_auth: e.target.checked})}
                  className="form-checkbox"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-white">
                    Белый список IP адресов
                  </label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Разрешить доступ только с указанных IP адресов
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={securitySettings.ip_whitelist_enabled}
                  onChange={(e) => setSecuritySettings({...securitySettings, ip_whitelist_enabled: e.target.checked})}
                  className="form-checkbox"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          onClick={() => handleSave('security')}
          disabled={isSaving}
          className="btn-primary flex items-center"
        >
          {isSaving ? (
            <div className="spinner mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Сохранить изменения
        </button>
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Настройки уведомлений
        </h3>
        
        <div className="space-y-6">
          <div>
            <label className="form-label">Email для уведомлений</label>
            <input
              type="email"
              value={notificationSettings.notification_email}
              onChange={(e) => setNotificationSettings({...notificationSettings, notification_email: e.target.value})}
              className="form-input"
            />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">
                  Email уведомления
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Получать уведомления по электронной почте
                </p>
              </div>
              <input
                type="checkbox"
                checked={notificationSettings.email_notifications}
                onChange={(e) => setNotificationSettings({...notificationSettings, email_notifications: e.target.checked})}
                className="form-checkbox"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">
                  Уведомления об операциях
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Уведомления о новых операциях с активами
                </p>
              </div>
              <input
                type="checkbox"
                checked={notificationSettings.operation_alerts}
                onChange={(e) => setNotificationSettings({...notificationSettings, operation_alerts: e.target.checked})}
                className="form-checkbox"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">
                  Системные уведомления
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Уведомления о системных событиях и ошибках
                </p>
              </div>
              <input
                type="checkbox"
                checked={notificationSettings.system_alerts}
                onChange={(e) => setNotificationSettings({...notificationSettings, system_alerts: e.target.checked})}
                className="form-checkbox"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">
                  Еженедельные отчеты
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Автоматические отчеты о состоянии активов
                </p>
              </div>
              <input
                type="checkbox"
                checked={notificationSettings.weekly_reports}
                onChange={(e) => setNotificationSettings({...notificationSettings, weekly_reports: e.target.checked})}
                className="form-checkbox"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">
                  Уведомления об истечении сроков
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Предупреждения об истечении гарантии активов
                </p>
              </div>
              <input
                type="checkbox"
                checked={notificationSettings.asset_expiry_alerts}
                onChange={(e) => setNotificationSettings({...notificationSettings, asset_expiry_alerts: e.target.checked})}
                className="form-checkbox"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">
                  Уведомления о низких остатках
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Предупреждения о малом количестве активов на складе
                </p>
              </div>
              <input
                type="checkbox"
                checked={notificationSettings.low_stock_alerts}
                onChange={(e) => setNotificationSettings({...notificationSettings, low_stock_alerts: e.target.checked})}
                className="form-checkbox"
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          onClick={() => handleSave('notifications')}
          disabled={isSaving}
          className="btn-primary flex items-center"
        >
          {isSaving ? (
            <div className="spinner mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Сохранить изменения
        </button>
      </div>
    </div>
  );

  const renderAppearanceTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Настройки интерфейса
        </h3>
        
        <div className="space-y-6">
          <div>
            <label className="form-label">Тема интерфейса</label>
            <div className="grid grid-cols-3 gap-4 mt-2">
              <button
                onClick={() => setTheme(THEMES.LIGHT)}
                className={`p-4 border-2 rounded-lg transition-colors ${
                  theme === THEMES.LIGHT 
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900' 
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="w-full h-16 bg-white border border-gray-200 rounded mb-2"></div>
                <div className="text-sm font-medium">Светлая</div>
              </button>
              
              <button
                onClick={() => setTheme(THEMES.DARK)}
                className={`p-4 border-2 rounded-lg transition-colors ${
                  theme === THEMES.DARK 
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900' 
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="w-full h-16 bg-gray-800 border border-gray-600 rounded mb-2"></div>
                <div className="text-sm font-medium">Темная</div>
              </button>
              
              <button
                onClick={() => setTheme(THEMES.AUTO)}
                className={`p-4 border-2 rounded-lg transition-colors ${
                  theme === THEMES.AUTO 
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900' 
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="w-full h-16 bg-gradient-to-r from-white to-gray-800 border border-gray-200 rounded mb-2"></div>
                <div className="text-sm font-medium">Авто</div>
              </button>
            </div>
          </div>
          
          <div>
            <label className="form-label">Язык интерфейса</label>
            <select className="form-select">
              <option value="ru">Русский</option>
              <option value="en">English</option>
              <option value="uz">O'zbek</option>
            </select>
          </div>
          
          <div>
            <label className="form-label">Часовой пояс</label>
            <select className="form-select">
              <option value="Asia/Tashkent">Ташкент (UTC+5)</option>
              <option value="Europe/Moscow">Москва (UTC+3)</option>
              <option value="Europe/London">Лондон (UTC+0)</option>
            </select>
          </div>
          
          <div>
            <label className="form-label">Формат даты</label>
            <select className="form-select">
              <option value="dd.mm.yyyy">ДД.ММ.ГГГГ</option>
              <option value="mm/dd/yyyy">ММ/ДД/ГГГГ</option>
              <option value="yyyy-mm-dd">ГГГГ-ММ-ДД</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBackupTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Резервное копирование
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
              Информация о системе
            </h4>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Версия системы:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{systemStats?.version}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Пользователей:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{systemStats?.total_users}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Активов:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{systemStats?.total_assets}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Операций:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{systemStats?.total_operations}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Размер БД:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{systemStats?.database_size}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Время работы:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{systemStats?.uptime}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Последний бэкап:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatDate(systemStats?.last_backup)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="card p-6">
            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
              Управление резервными копиями
            </h4>
            
            <div className="space-y-4">
              <button
                onClick={() => setShowBackupModal(true)}
                className="w-full btn-primary flex items-center justify-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Создать резервную копию
              </button>
              
              <button className="w-full btn-outline flex items-center justify-center">
                <Upload className="w-4 h-4 mr-2" />
                Восстановить из копии
              </button>
              
              <div className="border-t pt-4">
                <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Автоматические копии
                </h5>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">backup_2025-06-09.sql</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">245.7 MB</span>
                      <button className="text-primary-600 hover:text-primary-700">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">backup_2025-06-08.sql</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">243.1 MB</span>
                      <button className="text-primary-600 hover:text-primary-700">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">backup_2025-06-07.sql</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">241.8 MB</span>
                      <button className="text-primary-600 hover:text-primary-700">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Важная информация о резервном копировании
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Регулярно создавайте резервные копии данных. Рекомендуется хранить копии в безопасном месте, 
                отдельно от основного сервера. Автоматическое резервное копирование настроено на {systemSettings.backup_frequency === 'daily' ? 'ежедневное' : 'еженедельное'} создание копий.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Настройки системы</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Конфигурация системы и параметры безопасности
        </p>
      </div>

      {/* Tabs navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab content */}
      <div className="card p-6">
        {activeTab === 'company' && renderCompanyTab()}
        {activeTab === 'system' && renderSystemTab()}
        {activeTab === 'security' && renderSecurityTab()}
        {activeTab === 'notifications' && renderNotificationsTab()}
        {activeTab === 'appearance' && renderAppearanceTab()}
        {activeTab === 'backup' && renderBackupTab()}
      </div>

      {/* Backup confirmation modal */}
      <ConfirmModal
        isOpen={showBackupModal}
        onClose={() => setShowBackupModal(false)}
        onConfirm={handleBackup}
        title="Создание резервной копии"
        message="Вы хотите создать резервную копию базы данных? Это может занять несколько минут."
        confirmText="Создать копию"
        cancelText="Отмена"
        variant="primary"
      />

      {/* Reset confirmation modal */}
      <ConfirmModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={handleReset}
        title="Сброс настроек"
        message="Вы уверены, что хотите сбросить все настройки к значениям по умолчанию? Это действие нельзя отменить."
        confirmText="Сбросить"
        cancelText="Отмена"
        variant="warning"
      />
    </div>
  );
};

export default Settings;