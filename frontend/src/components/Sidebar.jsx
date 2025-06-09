import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NAVIGATION_ITEMS, USER_ROLE_LABELS } from '../utils/constants';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const location = useLocation();

  // Filter navigation items based on user role
  const allowedNavItems = NAVIGATION_ITEMS.filter(item => 
    item.roles.includes(user?.role)
  );

  const getLinkClass = (path) => {
    const isActive = path === '/' 
      ? location.pathname === '/' 
      : location.pathname.startsWith(path);
    
    return `flex items-center px-6 py-3 text-sm font-medium transition-colors group ${
      isActive
        ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-700 dark:bg-primary-900 dark:text-primary-200'
        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
    }`;
  };

  const getIconClass = (path) => {
    const isActive = path === '/' 
      ? location.pathname === '/' 
      : location.pathname.startsWith(path);
    
    return `mr-3 h-5 w-5 transition-colors ${
      isActive
        ? 'text-primary-500 dark:text-primary-300'
        : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
    }`;
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            {/* Logo */}
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                Asset Manager
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                v1.0.0
              </p>
            </div>
          </div>

          {/* Close button (mobile only) */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-8 flex-1">
          <div className="space-y-1">
            {allowedNavItems.map((item) => {
              const IconComponent = Icons[item.icon] || Icons.FileText;
              
              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  className={getLinkClass(item.path)}
                  onClick={() => {
                    // Close sidebar on mobile after navigation
                    if (window.innerWidth < 1024) {
                      onClose();
                    }
                  }}
                >
                  <IconComponent className={getIconClass(item.path)} />
                  {item.name}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* User info */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
              {user?.username
                ?.split(' ')
                .map(word => word.charAt(0))
                .join('')
                .toUpperCase()
                .slice(0, 2) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user?.username || 'Пользователь'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {USER_ROLE_LABELS[user?.role] || user?.role}
              </p>
            </div>
          </div>
          
          {/* Company info */}
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Компания
            </p>
            <p className="text-sm text-gray-900 dark:text-white">
              Result Education
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              © 2025 Result Education
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Asset Management Platform
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;