/**
 * GrievanceScreen - Complaint Management
 * 
 * Features:
 * - Create new grievance
 * - List all grievances
 * - View grievance details
 * - Track status
 * 
 * Connected to backend grievance service.
 */

'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout, NavItem } from '@/components/layout';
import { Icon } from '@/components/Icon';
import { api, Grievance, CreateGrievanceRequest } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import type { Screen } from '@/components/AppContent';

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', labelHindi: 'डैशबोर्ड', icon: 'dashboard', path: '/' },
  { id: 'bills', label: 'Bills', labelHindi: 'बिल', icon: 'bills', path: '/bills' },
  { id: 'grievances', label: 'Grievances', labelHindi: 'शिकायतें', icon: 'alertCircle', path: '/grievances' },
  { id: 'documents', label: 'Documents', labelHindi: 'दस्तावेज़', icon: 'fileText', path: '/documents' },
  { id: 'payments', label: 'Payments', labelHindi: 'भुगतान', icon: 'payment', path: '/payments' },
  { id: 'history', label: 'History', labelHindi: 'इतिहास', icon: 'clock', path: '/history' },
  { id: 'settings', label: 'Settings', labelHindi: 'सेटिंग्स', icon: 'settings', path: '/settings' },
];

interface GrievanceScreenProps {
  onNavigate?: (screen: Screen) => void;
}

export const GrievanceScreen: React.FC<GrievanceScreenProps> = ({
  onNavigate = () => {},
}) => {
  const [activeNav, setActiveNav] = useState<Screen>('grievances');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedGrievance, setSelectedGrievance] = useState<Grievance | null>(null);
  const [formData, setFormData] = useState<CreateGrievanceRequest>({
    category: 'other',
    department: '',
    subject: '',
    description: '',
  });

  const queryClient = useQueryClient();

  // Fetch grievances
  const {
    data: grievances,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['grievances'],
    queryFn: async () => {
      const response = await api.grievance.list();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch grievances');
      }
      return response.data || [];
    },
  });

  // Create grievance mutation
  const createGrievanceMutation = useMutation({
    mutationFn: async (data: CreateGrievanceRequest) => {
      const response = await api.grievance.create(data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to create grievance');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grievances'] });
      setShowCreateForm(false);
      setFormData({ category: 'other', department: '', subject: '', description: '' });
    },
  });

  // Update grievance mutation
  const updateGrievanceMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await api.grievance.update(id, { status: status as any });
      if (!response.success) {
        throw new Error(response.error || 'Failed to update grievance');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grievances'] });
      if (selectedGrievance) {
        refetch();
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.department || !formData.subject || !formData.description) {
      return;
    }
    createGrievanceMutation.mutate(formData);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: '#F59E0B',
      in_progress: '#3B82F6',
      resolved: '#22C55E',
      closed: '#6B7280',
    };
    return colors[status] || '#6B7280';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      open: 'Open',
      in_progress: 'In Progress',
      resolved: 'Resolved',
      closed: 'Closed',
    };
    return labels[status] || status;
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: '#22C55E',
      medium: '#F59E0B',
      high: '#EF4444',
      critical: '#DC2626',
    };
    return colors[priority] || '#6B7280';
  };

  return (
    <DashboardLayout
      navItems={navItems}
      activeItem={activeNav}
      onNavigate={(id) => {
        setActiveNav(id);
        onNavigate(id);
      }}
      title="Grievances"
      showSearch
    >
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            File & Track Grievances
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Submit complaints and track their resolution
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-gradient-primary text-white px-6 py-3 rounded-xl font-bold
                   hover:shadow-lg transition-all duration-200
                   flex items-center space-x-2"
        >
          <Icon name={showCreateForm ? 'close' : 'add'} size={20} />
          <span>{showCreateForm ? 'Cancel' : 'File Grievance'}</span>
        </button>
      </div>

      {/* Create Grievance Form */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-md">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                File New Grievance
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value as any })
                      }
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                               focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="billing">Billing</option>
                      <option value="service">Service</option>
                      <option value="infrastructure">Infrastructure</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Department
                    </label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) =>
                        setFormData({ ...formData, department: e.target.value })
                      }
                      placeholder="e.g., Electricity, Water"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                               focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                    placeholder="Brief description of your grievance"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Provide detailed information about your grievance"
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-6 py-3 rounded-xl font-bold border border-gray-300 dark:border-gray-600
                             text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700
                             transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      createGrievanceMutation.isPending ||
                      !formData.department ||
                      !formData.subject ||
                      !formData.description
                    }
                    className="bg-gradient-primary text-white px-6 py-3 rounded-xl font-bold
                             hover:shadow-lg transition-all duration-200
                             disabled:opacity-50 disabled:cursor-not-allowed
                             flex items-center space-x-2"
                  >
                    {createGrievanceMutation.isPending ? (
                      <>
                        <Icon name="refresh" size={20} className="animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Icon name="check" size={20} />
                        <span>Submit Grievance</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grievances List */}
      {isLoading ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 border border-gray-200 dark:border-gray-700 shadow-md text-center">
          <Icon name="refresh" size={48} className="mx-auto mb-4 animate-spin text-primary" />
          <p className="text-gray-600 dark:text-gray-400">Loading grievances...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-12 text-center">
          <Icon name="error" size={48} className="mx-auto mb-4 text-red-600 dark:text-red-400" />
          <h3 className="text-lg font-bold text-red-800 dark:text-red-200 mb-2">
            Failed to load grievances
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
      ) : grievances && grievances.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {grievances.map((grievance) => (
            <motion.div
              key={grievance.grievance_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() =>
                setSelectedGrievance(
                  selectedGrievance?.grievance_id === grievance.grievance_id
                    ? null
                    : grievance
                )
              }
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-md cursor-pointer hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-bold text-gray-900 dark:text-white">
                      {grievance.subject}
                    </h3>
                    <span
                      className="text-xs font-bold px-2 py-1 rounded-full text-white"
                      style={{ backgroundColor: getStatusColor(grievance.status) }}
                    >
                      {getStatusLabel(grievance.status)}
                    </span>
                    <span
                      className="text-xs font-bold px-2 py-1 rounded-full text-white"
                      style={{ backgroundColor: getPriorityColor(grievance.priority) }}
                    >
                      {grievance.priority.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Department: {grievance.department} | Category: {grievance.category}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    {grievance.description}
                  </p>
                  <div className="flex items-center space-x-4 mt-4 text-xs text-gray-500 dark:text-gray-500">
                    <span className="flex items-center space-x-1">
                      <Icon name="calendar" size={14} />
                      <span>
                        Filed: {new Date(grievance.created_at).toLocaleDateString('en-IN')}
                      </span>
                    </span>
                    {grievance.updated_at && (
                      <span className="flex items-center space-x-1">
                        <Icon name="clock" size={14} />
                        <span>
                          Updated: {new Date(grievance.updated_at).toLocaleDateString('en-IN')}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
                <Icon
                  name="chevronRight"
                  size={24}
                  className={`text-gray-400 transform transition-transform ${
                    selectedGrievance?.grievance_id === grievance.grievance_id
                      ? 'rotate-90'
                      : ''
                  }`}
                />
              </div>

              {/* Expanded Details */}
              {selectedGrievance?.grievance_id === grievance.grievance_id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
                >
                  <h4 className="font-bold text-gray-900 dark:text-white mb-3">
                    Grievance Details
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Grievance ID:</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {grievance.grievance_id}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">User ID:</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {grievance.user_id}
                      </p>
                    </div>
                  </div>
                  {grievance.resolved_at && (
                    <div className="mt-3">
                      <span className="text-gray-500 dark:text-gray-400">Resolved:</span>
                      <p className="font-medium text-green-600 dark:text-green-400">
                        {new Date(grievance.resolved_at).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 border border-gray-200 dark:border-gray-700 shadow-md text-center">
          <Icon name="alertCircle" size={64} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            No grievances filed
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Click "File Grievance" to submit a new complaint
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-gradient-primary text-white px-6 py-3 rounded-xl font-bold
                     hover:shadow-lg transition-all duration-200"
          >
            File Your First Grievance
          </button>
        </div>
      )}
    </DashboardLayout>
  );
};

export default GrievanceScreen;
