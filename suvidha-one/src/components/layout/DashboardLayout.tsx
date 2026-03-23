/**
 * DashboardLayout Component
 *
 * Main layout wrapper for the dashboard with sidebar and topbar.
 */

'use client';

import React, { useState } from 'react';
import { Sidebar, NavItem } from './Sidebar';
import { TopBar } from './TopBar';
import type { Screen } from '@/components/AppContent';

interface DashboardLayoutProps {
  children: React.ReactNode;
  navItems: NavItem[];
  activeItem: Screen;
  onNavigate: (itemId: Screen) => void;
  title?: string;
  showSearch?: boolean;
  onSearch?: (query: string) => void;
  userName?: string;
  notificationCount?: number;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  navItems,
  activeItem,
  onNavigate,
  title = 'Dashboard',
  showSearch = true,
  onSearch,
  userName = 'User',
  notificationCount = 0,
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar */}
      <Sidebar
        navItems={navItems}
        activeItem={activeItem}
        onNavigate={onNavigate}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div
        className={`transition-all duration-300 ${
          sidebarCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        {/* Top Bar */}
        <TopBar
          title={title}
          showSearch={showSearch}
          onSearch={onSearch}
          userName={userName}
          notificationCount={notificationCount}
          onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
