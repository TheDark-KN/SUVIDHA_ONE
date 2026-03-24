/**
 * ServiceCard Component
 * 
 * Displays a service with icon, name, description, and status.
 * Used in the dashboard service grid.
 */

'use client';

import React from 'react';
import { Icon } from '@/components/Icon';
import { motion } from 'framer-motion';

export interface ServiceCardProps {
  id: string;
  name: string;
  nameHindi?: string;
  description: string;
  icon: string;
  color?: string;
  department?: string;
  hasPending?: boolean;
  pendingCount?: number;
  pendingAmount?: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  name,
  nameHindi,
  description,
  icon,
  color = '#1A3C8F',
  department,
  hasPending = false,
  pendingCount,
  pendingAmount,
  onClick,
  disabled = false,
  loading = false,
}) => {
  return (
    <motion.div
      whileHover={{ scale: disabled ? 1 : 1.02, y: disabled ? 0 : -4 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={!disabled && !loading ? onClick : undefined}
      className={`
        relative bg-white dark:bg-gray-800 rounded-2xl p-6
        border border-gray-200 dark:border-gray-700
        shadow-md hover:shadow-xl
        transition-all duration-300 cursor-pointer
        ${disabled || loading ? 'opacity-60 cursor-not-allowed' : ''}
      `}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={`${name} - ${description}`}
      onKeyDown={(e) => {
        if (!disabled && !loading && (e.key === 'Enter' || e.key === ' ')) {
          onClick();
        }
      }}
    >
      {/* Status Badge */}
      {hasPending && pendingCount && pendingCount > 0 && (
        <div className="absolute top-4 right-4">
          <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            {pendingCount}
          </span>
        </div>
      )}

      {/* Icon */}
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon name={icon} size={32} color={color} />
      </div>

      {/* Content */}
      <div className="space-y-2">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {name}
          </h3>
          {nameHindi && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {nameHindi}
            </p>
          )}
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
          {description}
        </p>

        {department && (
          <p className="text-xs text-gray-500 dark:text-gray-500">
            {department}
          </p>
        )}

        {/* Pending Info */}
        {hasPending && pendingAmount && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Pending Amount
              </span>
              <span className="text-sm font-bold text-red-600 dark:text-red-400">
                ₹{pendingAmount}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 rounded-2xl flex items-center justify-center">
          <div className="animate-spin">
            <Icon name="refresh" size={32} color={color} />
          </div>
        </div>
      )}
    </motion.div>
  );
};

/**
 * ServiceCard Skeleton - Loading State
 */
export const ServiceCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-md animate-pulse">
      <div className="w-16 h-16 rounded-2xl bg-gray-200 dark:bg-gray-700 mb-4" />
      <div className="space-y-2">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
      </div>
    </div>
  );
};

export default ServiceCard;
