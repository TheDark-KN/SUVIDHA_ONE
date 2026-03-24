/**
 * AppContent - Main Application Router (New Kiosk Version)
 * 
 * Orchestrates screen navigation based on Wireframe_Specification.md
 * Supports flow: Welcome → Language → Auth → Dashboard → Services
 */

'use client';

import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { useAppStore } from '@/store';

// New kiosk screens
import { 
  WelcomeScreen, 
  LanguageScreen, 
  AuthScreen,
  DashboardScreen,
  BillsScreen,
  PaymentScreen,
  GrievanceScreen,
  SettingsScreen,
} from '@/components/screens';

// Legacy screens for backward compatibility
import { DashboardScreen as LegacyDashboard } from '@/screens/DashboardScreen';
import { DocumentsScreen } from '@/screens/DocumentsScreen';

export type Screen =
  | 'welcome'
  | 'language'
  | 'auth'
  | 'dashboard'
  | 'bills'
  | 'payment'
  | 'grievance'
  | 'documents'
  | 'history'
  | 'settings';

// Use URL param to toggle between new and legacy UI
const USE_NEW_UI = true;

export function AppContent() {
  const { 
    currentScreen, 
    setCurrentScreen,
    setUser,
    setBills,
    clearSelectedBills,
    setSelectedService,
  } = useAppStore();

  // Initialize with some demo data
  useEffect(() => {
    // Set demo bills for testing
    setBills([
      {
        id: 'bill-1',
        provider: 'MSEB - Maharashtra Electricity',
        consumerNumber: 'CA-1234567890',
        amount: 2450,
        dueDate: '2026-03-20',
        period: 'Feb 2026',
        status: 'pending',
        utilityType: 'electricity',
      },
      {
        id: 'bill-2',
        provider: 'Mumbai Municipal Water',
        consumerNumber: 'WC-9876543210',
        amount: 850,
        dueDate: '2026-03-25',
        period: 'Feb 2026',
        status: 'pending',
        utilityType: 'water',
      },
      {
        id: 'bill-3',
        provider: 'Mahanagar Gas',
        consumerNumber: 'MG-5551234567',
        amount: 1200,
        dueDate: '2026-03-15',
        period: 'Feb 2026',
        status: 'pending',
        utilityType: 'gas',
      },
    ]);
  }, [setBills]);

  // Screen navigation handlers
  const handleWelcomeTouch = () => setCurrentScreen('language');
  
  const handleLanguageSelect = () => {
    // Skip auth for now (OTP bypass mode)
    setUser({ id: "guest-" + Date.now(), name: 'Guest User' });
    setCurrentScreen('dashboard');
  };
  
  const handleAuthComplete = () => {
    setCurrentScreen('dashboard');
  };

  const handleServiceSelect = (service: string) => {
    switch (service) {
      case 'bills':
        setSelectedService(null); // Show all bills
        setCurrentScreen('bills');
        break;
      case 'electricity':
      case 'water':
      case 'gas':
        setSelectedService(service); // Filter by service type
        setCurrentScreen('bills');
        break;
      case 'grievance':
        setCurrentScreen('grievance');
        break;
      case 'certificates':
        setCurrentScreen('documents');
        break;
      default:
        console.log('Service selected:', service);
    }
  };

  const handleNavChange = (nav: 'home' | 'history' | 'help' | 'settings') => {
    switch (nav) {
      case 'home':
        setCurrentScreen('dashboard');
        break;
      case 'settings':
        setCurrentScreen('settings');
        break;
      default:
        console.log('Nav:', nav);
    }
  };

  const handleBackToDashboard = () => {
    clearSelectedBills();
    setCurrentScreen('dashboard');
  };

  // Render current screen with animation
  const renderScreen = () => {
    // New kiosk UI
    if (USE_NEW_UI) {
      switch (currentScreen) {
        case 'welcome':
          return <WelcomeScreen onTouch={handleWelcomeTouch} />;
        
        case 'language':
          return <LanguageScreen onSelect={handleLanguageSelect} />;
        
        case 'auth':
          return <AuthScreen onSuccess={handleAuthComplete} />;
        
        case 'dashboard':
          return (
            <DashboardScreen 
              onServiceSelect={handleServiceSelect}
              onNavChange={handleNavChange}
            />
          );
        
        case 'bills':
          return (
            <BillsScreen 
              onBack={handleBackToDashboard}
              onProceed={() => setCurrentScreen('payment')}
            />
          );
        
        case 'payment':
          return (
            <PaymentScreen 
              onBack={() => setCurrentScreen('bills')}
              onComplete={handleBackToDashboard}
            />
          );
        
        case 'grievance':
          return (
            <GrievanceScreen 
              onBack={handleBackToDashboard}
              onComplete={handleBackToDashboard}
            />
          );
        
        case 'settings':
          return (
            <SettingsScreen 
              onBack={handleBackToDashboard}
              onLanguageChange={() => setCurrentScreen('language')}
              onLogout={() => setCurrentScreen('welcome')}
            />
          );
        
        case 'documents':
          return (
            <DocumentsScreen 
              onNavigate={(screen) => setCurrentScreen(screen as Screen)}
            />
          );
        
        default:
          return <WelcomeScreen onTouch={handleWelcomeTouch} />;
      }
    }

    // Legacy UI fallback
    return (
      <LegacyDashboard 
        onNavigate={(screen) => setCurrentScreen(screen as Screen)}
      />
    );
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScreen}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.2 }}
            className="min-h-screen"
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </div>
    </ThemeProvider>
  );
}
