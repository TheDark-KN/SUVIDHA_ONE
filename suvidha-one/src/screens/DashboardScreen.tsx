/**
 * Dashboard Screen - Main Service Hub
 * 
 * Displays all available services fetched from the backend.
 * Users can click on services to navigate to specific screens.
 */

'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout, NavItem } from '@/components/layout';
import { ServiceCard, ServiceCardSkeleton } from '@/components/services';
import { Icon } from '@/components/Icon';
import { api, Service } from '@/lib/api';
import { useTheme } from '@/contexts/ThemeContext';
import type { Screen } from '@/components/AppContent';

// Navigation items for sidebar
const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', labelHindi: 'डैशबोर्ड', icon: 'dashboard', path: '/' },
  { id: 'bills', label: 'Bills', labelHindi: 'बिल', icon: 'bills', path: '/bills' },
  { id: 'grievance', label: 'Grievances', labelHindi: 'शिकायतें', icon: 'alertCircle', path: '/grievances' },
  { id: 'documents', label: 'Documents', labelHindi: 'दस्तावेज़', icon: 'fileText', path: '/documents' },
  { id: 'payment', label: 'Payments', labelHindi: 'भुगतान', icon: 'payment', path: '/payments' },
  { id: 'history', label: 'History', labelHindi: 'इतिहास', icon: 'clock', path: '/history' },
  { id: 'settings', label: 'Settings', labelHindi: 'सेटिंग्स', icon: 'settings', path: '/settings' },
];

// Default services as fallback
const defaultServices: Service[] = [
  { id: 'electricity', name: 'Electricity Bill', department: 'DISCOM', description: 'Pay electricity bills', icon: 'bolt' },
  { id: 'water', name: 'Water Bill', department: 'Municipal', description: 'Pay water bills', icon: 'droplet' },
  { id: 'gas', name: 'Gas Bill', department: 'PNGRB', description: 'Pay gas bills', icon: 'flame' },
  { id: 'property_tax', name: 'Property Tax', department: 'Municipal', description: 'Pay property tax', icon: 'home' },
  { id: 'birth_certificate', name: 'Birth Certificate', department: 'Civil Registry', description: 'Apply for birth certificate', icon: 'fileText' },
  { id: 'caste_certificate', name: 'Caste Certificate', department: 'Tehsil', description: 'Apply for caste certificate', icon: 'fileText' },
  { id: 'income_certificate', name: 'Income Certificate', department: 'Tehsil', description: 'Apply for income certificate', icon: 'fileText' },
  { id: 'grievance', name: 'File Grievance', department: 'Public', description: 'Submit complaints & grievances', icon: 'alertCircle' },
];

// Map service IDs to colors
const serviceColors: Record<string, string> = {
  electricity: '#F59E0B',
  water: '#3B82F6',
  gas: '#EF4444',
  property_tax: '#8B5CF6',
  birth_certificate: '#10B981',
  caste_certificate: '#EC4899',
  income_certificate: '#6366F1',
  residence_certificate: '#14B8A6',
  aadhaar_card: '#F97316',
  voter_id: '#06B6D4',
  grievance: '#DC2626',
  payment: '#22C55E',
  pan_card: '#A855F7',
  driving_license: '#EAB308',
  vehicle_registration: '#64748B',
  passport: '#3B82F6',
  health: '#EF4444',
  education: '#8B5CF6',
  agriculture: '#22C55E',
  women_child: '#EC4899',
  senior_citizen: '#6366F1',
  disability: '#14B8A6',
  unemployment: '#F59E0B',
  scholarship: '#06B6D4',
  pension: '#8B5CF6',
  ration_card: '#F97316',
  lpg_connection: '#EF4444',
  job_card: '#22C55E',
};

interface DashboardScreenProps {
  initialMobile?: string;
  onNavigate?: (screen: Screen) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onNavigate = () => {},
}) => {
  const [activeNav, setActiveNav] = useState<Screen>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  useTheme();

  // Fetch services from API
  const {
    data: services,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const response = await api.utility.listServices();
      if (response.success && response.data) {
        return response.data as Service[];
      }
      // Fallback to default services
      return defaultServices;
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Filter services based on search
  const filteredServices = services?.filter((service) =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleServiceClick = (serviceId: string) => {
    // Navigate based on service type
    if (['electricity', 'water', 'gas', 'property_tax'].includes(serviceId)) {
      onNavigate('bills');
    } else if (['grievance'].includes(serviceId)) {
      onNavigate('grievance');
    } else if (serviceId.includes('certificate') || serviceId.includes('card') || serviceId.includes('license')) {
      onNavigate('documents');
    } else {
      onNavigate('bills');
    }
  };

  const handleNavNavigate = (itemId: Screen) => {
    setActiveNav(itemId);
    if (itemId === 'dashboard') {
      onNavigate('dashboard');
    } else {
      onNavigate(itemId);
    }
  };

  return (
    <DashboardLayout
      navItems={navItems}
      activeItem={activeNav}
      onNavigate={handleNavNavigate}
      title="Dashboard"
      showSearch
      onSearch={setSearchQuery}
      userName="Citizen"
      notificationCount={0}
    >
      {/* Welcome Banner */}
      <div className="mb-8 bg-gradient-primary rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">
              नमस्ते! Namaste!
            </h2>
            <p className="text-lg opacity-90">
              Welcome to SUVIDHA ONE - Your One-Stop Citizen Service Portal
            </p>
          </div>
          <Icon name="dashboard" size={64} className="opacity-50" color="white" />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Pending Bills</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">₹0</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <Icon name="bills" size={24} color="#DC2626" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Active Grievances</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
              <Icon name="alertCircle" size={24} color="#F97316" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Documents</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Icon name="fileText" size={24} color="#3B82F6" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Payments</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">₹0</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <Icon name="payment" size={24} color="#22C55E" />
            </div>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Available Services
          </h2>
          <button
            onClick={() => refetch()}
            className="flex items-center space-x-2 text-primary hover:text-primary-dark transition-colors"
          >
            <Icon name="refresh" size={20} />
            <span className="text-sm font-medium">Refresh</span>
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <ServiceCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
            <Icon name="error" size={48} className="mx-auto mb-4 text-red-600 dark:text-red-400" />
            <h3 className="text-lg font-bold text-red-800 dark:text-red-200 mb-2">
              Failed to load services
            </h3>
            <p className="text-red-600 dark:text-red-400 mb-4">
              {error instanceof Error ? error.message : 'Please try again'}
            </p>
            <button
              onClick={() => refetch()}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : filteredServices && filteredServices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredServices.map((service) => (
              <ServiceCard
                key={service.id}
                id={service.id}
                name={service.name}
                description={service.description}
                icon={service.icon}
                color={serviceColors[service.id] || '#1A3C8F'}
                department={service.department}
                onClick={() => handleServiceClick(service.id)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-12 text-center">
            <Icon name="search" size={64} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              No services found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your search query
            </p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>सुविधा वन - सेवा सदन, सुविधा सदन</p>
        <p className="mt-1">SUVIDHA ONE - One Kiosk, All Services</p>
      </div>
    </DashboardLayout>
  );
};

export default DashboardScreen;
