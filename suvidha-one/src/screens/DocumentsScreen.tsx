/**
 * DocumentsScreen - Certificate & Document Applications
 * 
 * Features:
 * - Apply for certificates
 * - List all documents
 * - Track application status
 * - Download issued documents
 * 
 * Connected to backend document service.
 */

'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout, NavItem } from '@/components/layout';
import { Icon, IconButton } from '@/components/Icon';
import { api, Document, ApplyDocumentRequest } from '@/lib/api';
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

interface DocumentsScreenProps {
  onNavigate?: (screen: Screen) => void;
}

export const DocumentsScreen: React.FC<DocumentsScreenProps> = ({
  onNavigate = () => {},
}) => {
  const [activeNav, setActiveNav] = useState<Screen>('documents');
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState('birth_certificate');
  const [formData, setFormData] = useState<ApplyDocumentRequest>({
    doc_type: 'birth_certificate',
    name: '',
  });

  const queryClient = useQueryClient();

  // Fetch documents
  const {
    data: documents,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const response = await api.document.list();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch documents');
      }
      return response.data || [];
    },
  });

  // Apply for document mutation
  const applyDocumentMutation = useMutation({
    mutationFn: async (data: ApplyDocumentRequest) => {
      const response = await api.document.apply(data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to apply for document');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setShowApplyForm(false);
      setFormData({ doc_type: 'birth_certificate', name: '' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      return;
    }
    applyDocumentMutation.mutate({
      doc_type: selectedDocType,
      name: formData.name,
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: '#F59E0B',
      applied: '#3B82F6',
      issued: '#22C55E',
      rejected: '#EF4444',
    };
    return colors[status] || '#6B7280';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pending',
      applied: 'Applied',
      issued: 'Issued',
      rejected: 'Rejected',
    };
    return labels[status] || status;
  };

  const getDocTypeLabel = (docType: string) => {
    const labels: Record<string, string> = {
      birth_certificate: 'Birth Certificate',
      caste_certificate: 'Caste Certificate',
      income_certificate: 'Income Certificate',
      residence_certificate: 'Residence Certificate',
      aadhaar_card: 'Aadhaar Card',
      voter_id: 'Voter ID',
      pan_card: 'PAN Card',
      driving_license: 'Driving License',
    };
    return labels[docType] || docType;
  };

  const getDocTypeIcon = (docType: string) => {
    const icons: Record<string, string> = {
      birth_certificate: 'fileText',
      caste_certificate: 'fileText',
      income_certificate: 'fileText',
      residence_certificate: 'home',
      aadhaar_card: 'user',
      voter_id: 'shield',
      pan_card: 'creditCard',
      driving_license: 'monitor',
    };
    return icons[docType] || 'fileText';
  };

  // Available document types
  const documentTypes = [
    { value: 'birth_certificate', label: 'Birth Certificate', department: 'Civil Registry' },
    { value: 'caste_certificate', label: 'Caste Certificate', department: 'Tehsil' },
    { value: 'income_certificate', label: 'Income Certificate', department: 'Tehsil' },
    { value: 'residence_certificate', label: 'Residence Certificate', department: 'Tehsil' },
    { value: 'aadhaar_card', label: 'Aadhaar Card', department: 'UIDAI' },
    { value: 'voter_id', label: 'Voter ID', department: 'Election Commission' },
    { value: 'pan_card', label: 'PAN Card', department: 'Income Tax' },
    { value: 'driving_license', label: 'Driving License', department: 'RTO' },
  ];

  return (
    <DashboardLayout
      navItems={navItems}
      activeItem={activeNav}
      onNavigate={(id) => {
        setActiveNav(id);
        onNavigate(id);
      }}
      title="Documents & Certificates"
      showSearch
    >
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Apply & Track Documents
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Apply for certificates and track their status
          </p>
        </div>
        <button
          onClick={() => setShowApplyForm(!showApplyForm)}
          className="bg-gradient-primary text-white px-6 py-3 rounded-xl font-bold
                   hover:shadow-lg transition-all duration-200
                   flex items-center space-x-2"
        >
          <Icon name={showApplyForm ? 'close' : 'add'} size={20} />
          <span>{showApplyForm ? 'Cancel' : 'Apply for Document'}</span>
        </button>
      </div>

      {/* Apply Form */}
      <AnimatePresence>
        {showApplyForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-md">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Apply for New Document
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Document Type
                  </label>
                  <select
                    value={selectedDocType}
                    onChange={(e) => {
                      setSelectedDocType(e.target.value);
                      setFormData({ ...formData, doc_type: e.target.value });
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {documentTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label} - {type.department}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Applicant Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter applicant name"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowApplyForm(false)}
                    className="px-6 py-3 rounded-xl font-bold border border-gray-300 dark:border-gray-600
                             text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700
                             transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      applyDocumentMutation.isPending ||
                      !formData.name
                    }
                    className="bg-gradient-primary text-white px-6 py-3 rounded-xl font-bold
                             hover:shadow-lg transition-all duration-200
                             disabled:opacity-50 disabled:cursor-not-allowed
                             flex items-center space-x-2"
                  >
                    {applyDocumentMutation.isPending ? (
                      <>
                        <Icon name="refresh" size={20} className="animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Icon name="check" size={20} />
                        <span>Submit Application</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Documents List */}
      {isLoading ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 border border-gray-200 dark:border-gray-700 shadow-md text-center">
          <Icon name="refresh" size={48} className="mx-auto mb-4 animate-spin text-primary" />
          <p className="text-gray-600 dark:text-gray-400">Loading documents...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-12 text-center">
          <Icon name="error" size={48} className="mx-auto mb-4 text-red-600 dark:text-red-400" />
          <h3 className="text-lg font-bold text-red-800 dark:text-red-200 mb-2">
            Failed to load documents
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
      ) : documents && documents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map((doc) => (
            <motion.div
              key={doc.document_id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-all"
            >
              {/* Icon */}
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                style={{
                  backgroundColor: `${getStatusColor(doc.status)}20`,
                }}
              >
                <Icon
                  name={getDocTypeIcon(doc.doc_type)}
                  size={28}
                  color={getStatusColor(doc.status)}
                />
              </div>

              {/* Content */}
              <div className="space-y-3">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">
                    {getDocTypeLabel(doc.doc_type)}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {doc.name}
                  </p>
                </div>

                {/* Status Badge */}
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs font-bold px-3 py-1 rounded-full text-white"
                    style={{ backgroundColor: getStatusColor(doc.status) }}
                  >
                    {getStatusLabel(doc.status)}
                  </span>
                  {doc.status === 'issued' && (
                    <IconButton
                      name="download"
                      size="sm"
                      ariaLabel="Download document"
                      className="text-primary hover:bg-primary/10"
                    />
                  )}
                </div>

                {/* Date */}
                <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-500">
                  <Icon name="calendar" size={14} />
                  <span>
                    Applied: {new Date(doc.created_at).toLocaleDateString('en-IN')}
                  </span>
                </div>

                {/* Document ID */}
                <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                  ID: {doc.document_id.slice(0, 8)}...
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 border border-gray-200 dark:border-gray-700 shadow-md text-center">
          <Icon name="fileText" size={64} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            No documents applied
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Click "Apply for Document" to submit a new application
          </p>
          <button
            onClick={() => setShowApplyForm(true)}
            className="bg-gradient-primary text-white px-6 py-3 rounded-xl font-bold
                     hover:shadow-lg transition-all duration-200"
          >
            Apply for Your First Document
          </button>
        </div>
      )}

      {/* Info Banner */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
        <div className="flex items-start space-x-4">
          <Icon name="info" size={32} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <div>
            <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-2">
              Important Information
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Processing times vary by document type (7-30 days)</li>
              <li>• You will be notified when your document is ready</li>
              <li>• Issued documents can be downloaded directly</li>
              <li>• For rejected applications, please reapply with correct information</li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DocumentsScreen;
