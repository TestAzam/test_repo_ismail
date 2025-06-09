import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="spinner-lg"></div>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Проверка доступа...
          </p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (requiredRoles.length > 0 && user) {
    const hasRequiredRole = requiredRoles.includes(user.role);
    
    if (!hasRequiredRole) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="max-w-md w-full text-center">
            <div className="mx-auto h-12 w-12 text-red-500 mb-4">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Доступ запрещен
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              У вас нет прав для просмотра этой страницы
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-8">
              Требуемые роли: {requiredRoles.join(', ')}
              <br />
              Ваша роль: {user.role}
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
    }
  }

  return children;
};

export default ProtectedRoute;