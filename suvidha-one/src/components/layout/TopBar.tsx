/**
 * TopBar Component - Dashboard Header
 * 
 * Features:
 * - User menu dropdown
 * - Notifications
 * - Search
 * - Dark mode toggle
 * - Responsive design
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Icon, IconButton } from '@/components/Icon';
import { useTheme } from '@/contexts/ThemeContext';

interface TopBarProps {
  title?: string;
  showSearch?: boolean;
  onSearch?: (query: string) => void;
  userName?: string;
  userAvatar?: string;
  notificationCount?: number;
  onMenuClick?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  title = 'Dashboard',
  showSearch = true,
  onSearch,
  userName = 'User',
  userAvatar,
  notificationCount = 0,
  onMenuClick,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearch?.(value);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.reload();
  };

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          {onMenuClick && (
            <IconButton
              name="menu"
              size="lg"
              onClick={onMenuClick}
              ariaLabel="Toggle menu"
            />
          )}
          
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {title}
          </h1>
        </div>

        {/* Center Section - Search */}
        {showSearch && (
          <div className="flex-1 max-w-xl mx-8">
            <div className="relative">
              <Icon
                name="search"
                size={20}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search services, bills, documents..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                         transition-all duration-200"
              />
            </div>
          </div>
        )}

        {/* Right Section */}
        <div className="flex items-center space-x-3">
          {/* Theme Toggle */}
          <IconButton
            name={theme === 'dark' ? 'sun' : 'moon'}
            size="md"
            onClick={toggleTheme}
            ariaLabel="Toggle theme"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          />

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <IconButton
              name="bell"
              size="md"
              onClick={() => setShowNotifications(!showNotifications)}
              ariaLabel="Notifications"
              title="Notifications"
            />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {notificationCount}
              </span>
            )}

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Notifications
                  </h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    <Icon name="bell" size={48} className="mx-auto mb-2 opacity-50" />
                    <p>No new notifications</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg
                       hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="User menu"
            >
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt={userName}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
                  {userName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden md:block">
                {userName}
              </span>
              <Icon
                name="chevronRight"
                size={16}
                className={`transform transition-transform text-gray-400 ${showUserMenu ? 'rotate-90' : ''}`}
              />
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {userName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Citizen Account
                  </p>
                </div>
                <div className="py-2">
                  <button className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                    <Icon name="user" size={18} className="mr-3" />
                    Profile
                  </button>
                  <button className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                    <Icon name="settings" size={18} className="mr-3" />
                    Settings
                  </button>
                  <button className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                    <Icon name="help" size={18} className="mr-3" />
                    Help & Support
                  </button>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 py-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Icon name="logout" size={18} className="mr-3" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
