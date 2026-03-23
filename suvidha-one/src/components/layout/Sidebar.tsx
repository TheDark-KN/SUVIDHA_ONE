/**
 * Sidebar Component - Modern Dashboard Navigation
 * 
 * Features:
 * - Collapsible sidebar
 * - Navigation links with icons
 * - Active state highlighting
 * - Dark mode support
 * - Responsive design
 */

'use client';

import React, { useState } from 'react';
import { Icon, IconButton } from '@/components/Icon';
import { useTheme } from '@/contexts/ThemeContext';
import type { Screen } from '@/components/AppContent';

export interface NavItem {
  id: Screen;
  label: string;
  labelHindi?: string;
  icon: string;
  path: string;
  badge?: number;
}

interface SidebarProps {
  navItems: NavItem[];
  activeItem: Screen;
  onNavigate: (itemId: Screen) => void;
  collapsed?: boolean;
  onToggle?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  navItems,
  activeItem,
  onNavigate,
  collapsed = false,
  onToggle,
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <aside
      className={`
        fixed left-0 top-0 h-full bg-white dark:bg-gray-900 
        border-r border-gray-200 dark:border-gray-700
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-20' : 'w-64'}
        z-50
      `}
    >
      {/* Logo & Toggle */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        {!collapsed && (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
              <span className="text-white font-bold text-xl">स</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                SUVIDHA ONE
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Citizen Services
              </p>
            </div>
          </div>
        )}
        {onToggle && (
          <IconButton
            name={collapsed ? 'arrowForward' : 'arrowBack'}
            size={collapsed ? 'lg' : 'md'}
            onClick={onToggle}
            ariaLabel={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onNavigate(item.id)}
                className={`
                  w-full flex items-center px-3 py-3 rounded-lg
                  transition-all duration-200
                  ${
                    activeItem === item.id
                      ? 'bg-primary text-white shadow-md'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }
                  ${collapsed ? 'justify-center' : 'justify-start'}
                `}
                aria-label={item.label}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  name={item.icon}
                  size={24}
                  className="flex-shrink-0"
                  color={activeItem === item.id ? 'white' : undefined}
                />
                {!collapsed && (
                  <div className="ml-3 flex-1 text-left">
                    <span className="block font-medium text-sm">
                      {item.label}
                    </span>
                    {item.labelHindi && (
                      <span className="block text-xs opacity-75">
                        {item.labelHindi}
                      </span>
                    )}
                  </div>
                )}
                {!collapsed && item.badge && item.badge > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        {!collapsed && (
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Dark Mode
              </span>
              <IconButton
                name={theme === 'dark' ? 'sun' : 'moon'}
                size="md"
                onClick={toggleTheme}
                ariaLabel="Toggle dark mode"
              />
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center mb-4">
            <IconButton
              name={theme === 'dark' ? 'sun' : 'moon'}
              size="md"
              onClick={toggleTheme}
              ariaLabel="Toggle dark mode"
            />
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
