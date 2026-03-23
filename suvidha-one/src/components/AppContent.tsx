/**
 * AppContent - Main Application Router
 * 
 * Manages screen navigation and authentication state.
 * Routes between different screens based on user state.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthScreen } from '@/screens/AuthScreen';
import { DashboardScreen } from '@/screens/DashboardScreen';
import { BillsScreen } from '@/screens/BillsScreen';
import { GrievanceScreen } from '@/screens/GrievanceScreen';
import { DocumentsScreen } from '@/screens/DocumentsScreen';

export type Screen =
  | 'auth'
  | 'dashboard'
  | 'bills'
  | 'grievances'
  | 'documents'
  | 'payments'
  | 'history'
  | 'settings';

export function AppContent() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('auth');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userMobile, setUserMobile] = useState<string>('');

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      setIsAuthenticated(true);
      setCurrentScreen('dashboard');
    }
  }, []);

  const handleAuthSuccess = (mobile: string, token: string) => {
    setUserMobile(mobile);
    setIsAuthenticated(true);
    setCurrentScreen('dashboard');
  };

  const handleNavigate = (screen: Screen) => {
    if (!isAuthenticated && screen !== 'auth') {
      setCurrentScreen('auth');
      return;
    }
    setCurrentScreen(screen);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setIsAuthenticated(false);
    setUserMobile('');
    setCurrentScreen('auth');
  };

  // Render current screen
  const renderScreen = () => {
    switch (currentScreen) {
      case 'auth':
        return (
          <AuthScreen
            onSuccess={handleAuthSuccess}
          />
        );

      case 'dashboard':
        return (
          <DashboardScreen
            onNavigate={handleNavigate}
          />
        );

      case 'bills':
        return (
          <BillsScreen
            onNavigate={handleNavigate}
            onPaymentInitiate={(billIds) => {
              console.log('Initiating payment for bills:', billIds);
              // Navigate to payment screen or show payment modal
            }}
          />
        );

      case 'grievances':
        return (
          <GrievanceScreen
            onNavigate={handleNavigate}
          />
        );

      case 'documents':
        return (
          <DocumentsScreen
            onNavigate={handleNavigate}
          />
        );

      case 'payments':
      case 'history':
      case 'settings':
        // Placeholder for future screens
        return null;

      default:
        return (
          <DashboardScreen
            onNavigate={handleNavigate}
          />
        );
    }
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
        {renderScreen()}
      </div>
    </ThemeProvider>
  );
}
