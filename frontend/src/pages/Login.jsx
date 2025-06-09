import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, LogIn, Building } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { validateForm, required, email, minLength } from '../utils/validators';
import toast from 'react-hot-toast';

const Login = () => {
  const { login, register, isAuthenticated, loading } = useAuth();
  const { resolvedTheme } = useTheme();
  const location = useLocation();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    // Registration fields
    company_name: '',
    inn: '',
    company_email: '',
    company_address: '',
    admin_username: '',
    admin_email: '',
    admin_password: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated
  if (isAuthenticated) {
    const from = location.state?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }

  // Validation schemas
  const loginValidation = {
    email: [required(), email()],
    password: [required(), minLength(6)]
  };

  const registerValidation = {
    company_name: [required(), minLength(2)],
    inn: [required(), minLength(10)],
    company_email: [required(), email()],
    admin_username: [required(), minLength(2)],
    admin_email: [required(), email()],
    admin_password: [required(), minLength(6)]
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    const { isValid, errors: validationErrors } = validateForm(
      { email: formData.email, password: formData.password },
      loginValidation
    );

    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await login({
        email: formData.email,
        password: formData.password
      });
    } catch (error) {
      // Error is handled by auth context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    const registerData = {
      name: formData.company_name,
      inn: formData.inn,
      email: formData.company_email,
      address: formData.company_address,
      admin_email: formData.admin_email,
      admin_username: formData.admin_username,
      admin_password: formData.admin_password
    };

    const { isValid, errors: validationErrors } = validateForm(registerData, registerValidation);

    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await register(registerData);
      if (result.success) {
        setIsRegisterMode(false);
        setFormData({
          email: formData.admin_email,
          password: '',
          company_name: '',
          inn: '',
          company_email: '',
          company_address: '',
          admin_username: '',
          admin_email: '',
          admin_password: ''
        });
      }
    } catch (error) {
      // Error is handled by auth context
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    setErrors({});
    setFormData({
      email: '',
      password: '',
      company_name: '',
      inn: '',
      company_email: '',
      company_address: '',
      admin_username: '',
      admin_email: '',
      admin_password: ''
    });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="flex flex-col justify-center px-12">
          <div className="mb-8">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-xl flex items-center justify-center mb-6">
              <Building className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-bold mb-4">
              Asset Management Platform
            </h1>
            <p className="text-xl text-primary-100">
              Профессиональная система управления активами для современных компаний
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-sm font-bold">1</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Полный контроль</h3>
                <p className="text-primary-100">Отслеживайте все активы компании в режиме реального времени</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-sm font-bold">2</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Мультитенантность</h3>
                <p className="text-primary-100">Безопасное разделение данных между компаниями</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-sm font-bold">3</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Детальная аналитика</h3>
                <p className="text-primary-100">Отчеты и графики для принятия решений</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="text-center mb-8">
            <div className="lg:hidden w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Building className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              {isRegisterMode ? 'Регистрация компании' : 'Вход в систему'}
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {isRegisterMode 
                ? 'Создайте аккаунт для вашей компании' 
                : 'Войдите в свой аккаунт для продолжения'
              }
            </p>
          </div>

          {!isRegisterMode ? (
            // Login Form
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="email" className="form-label">
                  Email адрес
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`form-input ${errors.email ? 'border-red-500' : ''}`}
                  placeholder="admin@result-education.ru"
                />
                {errors.email && (
                  <p className="form-error">{errors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="form-label">
                  Пароль
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`form-input pr-10 ${errors.password ? 'border-red-500' : ''}`}
                    placeholder="Введите пароль"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="form-error">{errors.password}</p>
                )}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn-primary flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <div className="spinner mr-2" />
                  ) : (
                    <LogIn className="w-4 h-4 mr-2" />
                  )}
                  {isSubmitting ? 'Вход...' : 'Войти в систему'}
                </button>
              </div>

              {/* Demo accounts */}
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
                  Демо аккаунты для тестирования:
                </h4>
                <div className="space-y-1 text-xs text-blue-800 dark:text-blue-300">
                  <div>👑 <strong>Администратор:</strong> admin@result-education.ru / admin123</div>
                  <div>💼 <strong>Бухгалтер:</strong> accountant@result-education.ru / accountant123</div>
                  <div>📦 <strong>Кладовщик:</strong> warehouse@result-education.ru / warehouse123</div>
                  <div>👁️ <strong>Наблюдатель:</strong> observer@result-education.ru / observer123</div>
                </div>
              </div>
            </form>
          ) : (
            // Registration Form
            <form onSubmit={handleRegister} className="space-y-6">
              {/* Company Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Информация о компании
                </h3>
                
                <div>
                  <label htmlFor="company_name" className="form-label">
                    Название компании
                  </label>
                  <input
                    id="company_name"
                    name="company_name"
                    type="text"
                    value={formData.company_name}
                    onChange={handleInputChange}
                    className={`form-input ${errors.company_name ? 'border-red-500' : ''}`}
                    placeholder="ООО Моя Компания"
                  />
                  {errors.company_name && (
                    <p className="form-error">{errors.company_name}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="inn" className="form-label">
                    ИНН
                  </label>
                  <input
                    id="inn"
                    name="inn"
                    type="text"
                    value={formData.inn}
                    onChange={handleInputChange}
                    className={`form-input ${errors.inn ? 'border-red-500' : ''}`}
                    placeholder="1234567890"
                  />
                  {errors.inn && (
                    <p className="form-error">{errors.inn}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="company_email" className="form-label">
                    Email компании
                  </label>
                  <input
                    id="company_email"
                    name="company_email"
                    type="email"
                    value={formData.company_email}
                    onChange={handleInputChange}
                    className={`form-input ${errors.company_email ? 'border-red-500' : ''}`}
                    placeholder="info@company.com"
                  />
                  {errors.company_email && (
                    <p className="form-error">{errors.company_email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="company_address" className="form-label">
                    Адрес (необязательно)
                  </label>
                  <textarea
                    id="company_address"
                    name="company_address"
                    value={formData.company_address}
                    onChange={handleInputChange}
                    className="form-textarea"
                    placeholder="г. Москва, ул. Примерная, д. 1"
                    rows={2}
                  />
                </div>
              </div>

              {/* Admin User Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Администратор системы
                </h3>
                
                <div>
                  <label htmlFor="admin_username" className="form-label">
                    Имя администратора
                  </label>
                  <input
                    id="admin_username"
                    name="admin_username"
                    type="text"
                    value={formData.admin_username}
                    onChange={handleInputChange}
                    className={`form-input ${errors.admin_username ? 'border-red-500' : ''}`}
                    placeholder="Иван Иванов"
                  />
                  {errors.admin_username && (
                    <p className="form-error">{errors.admin_username}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="admin_email" className="form-label">
                    Email администратора
                  </label>
                  <input
                    id="admin_email"
                    name="admin_email"
                    type="email"
                    value={formData.admin_email}
                    onChange={handleInputChange}
                    className={`form-input ${errors.admin_email ? 'border-red-500' : ''}`}
                    placeholder="admin@company.com"
                  />
                  {errors.admin_email && (
                    <p className="form-error">{errors.admin_email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="admin_password" className="form-label">
                    Пароль администратора
                  </label>
                  <div className="relative">
                    <input
                      id="admin_password"
                      name="admin_password"
                      type={showPassword ? "text" : "password"}
                      value={formData.admin_password}
                      onChange={handleInputChange}
                      className={`form-input pr-10 ${errors.admin_password ? 'border-red-500' : ''}`}
                      placeholder="Минимум 6 символов"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.admin_password && (
                    <p className="form-error">{errors.admin_password}</p>
                  )}
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn-primary flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <div className="spinner mr-2" />
                  ) : (
                    <Building className="w-4 h-4 mr-2" />
                  )}
                  {isSubmitting ? 'Регистрация...' : 'Зарегистрировать компанию'}
                </button>
              </div>
            </form>
          )}

          {/* Toggle between login and register */}
          <div className="mt-6 text-center">
            <button
              onClick={toggleMode}
              className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium"
            >
              {isRegisterMode 
                ? 'Уже есть аккаунт? Войти в систему' 
                : 'Нет аккаунта? Зарегистрировать компанию'
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;