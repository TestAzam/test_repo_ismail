import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';

// Layout components
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Page components
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Assets from './pages/Assets';
import Operations from './pages/Operations';
import Warehouses from './pages/Warehouses';
import Branches from './pages/Branches';
import Users from './pages/Users';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

// Loading component
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="text-center">
      <div className="spinner-lg"></div>
      <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        Загрузка приложения...
      </p>
    </div>
  </div>
);

// 404 Page component
const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="max-w-md w-full text-center">
      <div className="text-6xl font-bold text-gray-400 dark:text-gray-600 mb-4">
        404
      </div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Страница не найдена
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Запрашиваемая страница не существует или была перемещена.
      </p>
      <button
        onClick={() => window.history.back()}
        className="btn-primary"
      >
        Вернуться назад
      </button>
    </div>
  </div>
);

function App() {
  const { user, loading, checkAuth } = useAuth();
  const { theme } = useTheme();

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Check authentication on app load
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Show loading screen while checking authentication
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="App theme-transition">
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            user ? <Navigate to="/" replace /> : <Login />
          }
        />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard - all roles */}
          <Route index element={<Dashboard />} />
          
          {/* Assets - all roles can view, warehouse+ can edit */}
          <Route path="assets" element={<Assets />} />
          
          {/* Operations - warehouse+ roles */}
          <Route
            path="operations"
            element={
              <ProtectedRoute requiredRoles={['Admin', 'Accountant', 'Warehouse_keeper']}>
                <Operations />
              </ProtectedRoute>
            }
          />
          
          {/* Warehouses - warehouse+ roles */}
          <Route
            path="warehouses"
            element={
              <ProtectedRoute requiredRoles={['Admin', 'Accountant', 'Warehouse_keeper']}>
                <Warehouses />
              </ProtectedRoute>
            }
          />
          
          {/* Branches - Admin only */}
          <Route
            path="branches"
            element={
              <ProtectedRoute requiredRoles={['Admin']}>
                <Branches />
              </ProtectedRoute>
            }
          />
          
          {/* Users - Admin only */}
          <Route
            path="users"
            element={
              <ProtectedRoute requiredRoles={['Admin']}>
                <Users />
              </ProtectedRoute>
            }
          />
          
          {/* Reports - Admin, Accountant, Observer */}
          <Route
            path="reports"
            element={
              <ProtectedRoute requiredRoles={['Admin', 'Accountant', 'Observer']}>
                <Reports />
              </ProtectedRoute>
            }
          />
          
          {/* Settings - Admin only */}
          <Route
            path="settings"
            element={
              <ProtectedRoute requiredRoles={['Admin']}>
                <Settings />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* 404 route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;