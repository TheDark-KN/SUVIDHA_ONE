/**
 * BillsScreen - Bill Payment & Management
 * 
 * Features:
 * - Fetch bills from utility service
 * - View bill details
 * - Initiate payment
 * - Payment history
 * 
 * Connected to backend utility and payment services.
 */

'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { DashboardLayout, NavItem } from '@/components/layout';
import { Icon, IconButton } from '@/components/Icon';
import { api, Bill, FetchBillsRequest } from '@/lib/api';
import { motion } from 'framer-motion';
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

interface BillsScreenProps {
  onNavigate?: (screen: Screen) => void;
  onPaymentInitiate?: (billIds: string[]) => void;
}

export const BillsScreen: React.FC<BillsScreenProps> = ({
  onNavigate = () => {},
  onPaymentInitiate,
}) => {
  const [activeNav, setActiveNav] = useState<Screen>('bills');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('electricity');
  const [consumerNumber, setConsumerNumber] = useState('');
  const [selectedBills, setSelectedBills] = useState<string[]>([]);

  // Fetch bills mutation
  const fetchBillsMutation = useMutation({
    mutationFn: async (data: FetchBillsRequest) => {
      const response = await api.utility.fetchBills(data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch bills');
      }
      return response.data;
    },
  });

  // Initiate payment mutation
  const initiatePaymentMutation = useMutation({
    mutationFn: async (billIds: string[]) => {
      const response = await api.payment.initiate({
        bill_ids: billIds,
        method: 'upi',
      });
      if (!response.success) {
        throw new Error(response.error || 'Failed to initiate payment');
      }
      return response.data;
    },
    onSuccess: (data) => {
      if (data?.payment_id) {
        onPaymentInitiate?.([data.payment_id]);
      }
    },
  });

  const handleFetchBills = () => {
    if (consumerNumber) {
      fetchBillsMutation.mutate({
        consumer_id: consumerNumber,
        department: selectedDepartment as any,
      });
    }
  };

  const handleBillSelect = (billId: string) => {
    setSelectedBills((prev) =>
      prev.includes(billId)
        ? prev.filter((id) => id !== billId)
        : [...prev, billId]
    );
  };

  const handlePaySelected = () => {
    if (selectedBills.length > 0) {
      initiatePaymentMutation.mutate(selectedBills);
    }
  };

  const bills = fetchBillsMutation.data || [];
  const totalAmount = bills.reduce((sum, bill) => sum + parseFloat(bill.amount), 0);

  const departmentIcons: Record<string, string> = {
    electricity: 'bolt',
    water: 'droplet',
    gas: 'flame',
    municipal: 'home',
  };

  const departmentColors: Record<string, string> = {
    electricity: '#F59E0B',
    water: '#3B82F6',
    gas: '#EF4444',
    municipal: '#8B5CF6',
  };

  return (
    <DashboardLayout
      navItems={navItems}
      activeItem={activeNav}
      onNavigate={(id) => {
        setActiveNav(id);
        onNavigate(id);
      }}
      title="Bill Payments"
      showSearch
    >
      {/* Fetch Bills Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-md mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Fetch Your Bills
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Department
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="electricity">Electricity</option>
              <option value="water">Water</option>
              <option value="gas">Gas</option>
              <option value="municipal">Municipal</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Consumer Number
            </label>
            <input
              type="text"
              value={consumerNumber}
              onChange={(e) => setConsumerNumber(e.target.value)}
              placeholder="Enter consumer number"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleFetchBills}
              disabled={fetchBillsMutation.isPending || !consumerNumber}
              className="w-full bg-gradient-primary text-white py-3 rounded-xl font-bold
                       hover:shadow-lg transition-all duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center space-x-2"
            >
              {fetchBillsMutation.isPending ? (
                <>
                  <Icon name="refresh" size={20} className="animate-spin" />
                  <span>Fetching...</span>
                </>
              ) : (
                <>
                  <Icon name="search" size={20} />
                  <span>Fetch Bills</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Bills List */}
      {bills.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-md">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Available Bills ({bills.length})
            </h2>
            {selectedBills.length > 0 && (
              <button
                onClick={handlePaySelected}
                disabled={initiatePaymentMutation.isPending}
                className="bg-gradient-success text-white px-6 py-3 rounded-xl font-bold
                         hover:shadow-lg transition-all duration-200
                         disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center space-x-2"
              >
                <Icon name="payment" size={20} />
                <span>Pay ₹{totalAmount.toFixed(2)}</span>
              </button>
            )}
          </div>

          <div className="space-y-4">
            {bills.map((bill) => (
              <motion.div
                key={bill.bill_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`
                  p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                  ${
                    selectedBills.includes(bill.bill_id)
                      ? 'border-primary bg-primary/5 dark:bg-primary/10'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                  }
                `}
                onClick={() => handleBillSelect(bill.bill_id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${departmentColors[bill.department]}20` }}
                    >
                      <Icon
                        name={departmentIcons[bill.department] || 'fileText'}
                        size={24}
                        color={departmentColors[bill.department]}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-gray-900 dark:text-white">
                          {bill.department.charAt(0).toUpperCase() + bill.department.slice(1)} Bill
                        </h3>
                        {bill.status === 'pending' && (
                          <span className="bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 text-xs font-bold px-2 py-1 rounded-full">
                            PENDING
                          </span>
                        )}
                        {bill.status === 'overdue' && (
                          <span className="bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold px-2 py-1 rounded-full">
                            OVERDUE
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Consumer: {bill.consumer_id}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Due Date: {new Date(bill.due_date).toLocaleDateString('en-IN')}
                      </p>
                      {bill.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                          {bill.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      ₹{parseFloat(bill.amount).toFixed(2)}
                    </p>
                    <div className="mt-2">
                      <input
                        type="checkbox"
                        checked={selectedBills.includes(bill.bill_id)}
                        onChange={() => handleBillSelect(bill.bill_id)}
                        className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!fetchBillsMutation.isPending && bills.length === 0 && consumerNumber && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 border border-gray-200 dark:border-gray-700 shadow-md text-center">
          <Icon name="bills" size={64} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            No bills found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try fetching bills with a different consumer number
          </p>
        </div>
      )}

      {/* Initial State */}
      {!consumerNumber && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 border border-gray-200 dark:border-gray-700 shadow-md text-center">
          <Icon name="search" size={64} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            Fetch Your Bills
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Enter your consumer number above to view pending bills
          </p>
        </div>
      )}
    </DashboardLayout>
  );
};

export default BillsScreen;
