/**
 * Reusable Icon Component for SUVIDHA ONE
 * 
 * Wraps react-icons with theme support, scaling, and accessibility.
 * Supports Lucide React and Material Symbols via react-icons.
 */

import React from 'react';
import { IconType } from 'react-icons';
// Feather Icons (Fi) - Only importing icons used in the registry
import { 
  FiHome, FiUser, FiSettings, FiBarChart2, FiTrash2,
  FiBell, FiLogOut, FiMenu, FiX, FiChevronRight, FiChevronLeft,
  FiCheck, FiAlertCircle, FiInfo, FiHelpCircle, FiSearch,
  FiFilter, FiDownload, FiUpload, FiEdit, FiPlus, FiMinus,
  FiCalendar, FiClock, FiMapPin, FiPhone, FiMail, FiShield,
  FiCreditCard, FiDollarSign, FiFileText, FiFolder, FiArchive,
  FiActivity, FiTrendingUp, FiTrendingDown, FiRefreshCw, FiSun,
  FiMoon, FiMonitor, FiSmartphone, FiTablet, FiWifi, FiBattery,
  FiLock, FiUnlock, FiCamera, FiImage, FiVideo,
  FiMic, FiVolume2, FiHeadphones, FiMusic, FiPlay, FiPause,
  FiHeart, FiStar, FiThumbsUp, FiThumbsDown, FiShare2, FiLink, 
  FiExternalLink, FiCopy, FiPrinter
} from 'react-icons/fi';
// Material Design Icons (Md) - Only importing icons used in the registry
import { 
  MdDashboard, MdPeople, MdPayments, MdReceipt, MdNotificationImportant,
  MdSecurity, MdVerified, MdWarning, MdError, MdCheckCircle,
  MdPerson, MdArrowForward, MdArrowBack, MdDelete,
  MdFilePresent, MdAttachFile, MdCloudUpload, MdCloudDownload,
  MdPayment, MdAccountBalance, MdMonetizationOn,
  MdAnalytics, MdAssessment, MdBrightnessHigh, MdBrightnessLow, 
  MdDesktopWindows, MdScanner
} from 'react-icons/md';
// Heroicons Outline (Hi) - Only importing icons used in the registry
import {
  HiOutlineCog, HiOutlinePencil, HiOutlineCurrencyDollar,
  HiOutlineDocument, HiOutlineDuplicate
} from 'react-icons/hi';

// Icon registry - map icon names to actual components
const iconRegistry: Record<string, IconType> = {
  // Navigation & Layout
  home: FiHome,
  dashboard: MdDashboard,
  menu: FiMenu,
  close: FiX,
  chevronRight: FiChevronRight,
  chevronLeft: FiChevronLeft,
  arrowForward: MdArrowForward,
  arrowBack: MdArrowBack,
  
  // User & Authentication
  user: FiUser,
  person: MdPerson,
  users: MdPeople,
  lock: FiLock,
  unlock: FiUnlock,
  logout: FiLogOut,
  login: MdSecurity,
  verified: MdVerified,
  
  // Settings & Configuration
  settings: FiSettings,
  cog: HiOutlineCog,
  
  // Data & Analytics
  chart: FiBarChart2,
  analytics: MdAnalytics,
  assessment: MdAssessment,
  trendingUp: FiTrendingUp,
  trendingDown: FiTrendingDown,
  activity: FiActivity,
  
  // Actions
  trash: FiTrash2,
  delete: MdDelete,
  edit: FiEdit,
  pencil: HiOutlinePencil,
  add: FiPlus,
  remove: FiMinus,
  refresh: FiRefreshCw,
  search: FiSearch,
  filter: FiFilter,
  
  // Notifications & Alerts
  bell: FiBell,
  notification: MdNotificationImportant,
  alertCircle: FiAlertCircle,
  warning: MdWarning,
  error: MdError,
  info: FiInfo,
  help: FiHelpCircle,
  check: FiCheck,
  checkCircle: MdCheckCircle,
  
  // Files & Documents
  fileText: FiFileText,
  file: MdFilePresent,
  folder: FiFolder,
  archive: FiArchive,
  attachFile: MdAttachFile,
  document: HiOutlineDocument,
  
  // Upload & Download
  upload: FiUpload,
  download: FiDownload,
  cloudUpload: MdCloudUpload,
  cloudDownload: MdCloudDownload,
  
  // Payment & Finance
  payment: MdPayment,
  creditCard: FiCreditCard,
  dollar: FiDollarSign,
  currency: HiOutlineCurrencyDollar,
  monetization: MdMonetizationOn,
  bank: MdAccountBalance,
  receipt: MdReceipt,
  bills: MdPayments,
  
  // Communication
  phone: FiPhone,
  email: FiMail,
  location: FiMapPin,
  calendar: FiCalendar,
  clock: FiClock,
  
  // Devices & Connectivity
  monitor: FiMonitor,
  desktop: MdDesktopWindows,
  smartphone: FiSmartphone,
  tablet: FiTablet,
  wifi: FiWifi,
  battery: FiBattery,
  
  // Media
  camera: FiCamera,
  image: FiImage,
  video: FiVideo,
  mic: FiMic,
  volume: FiVolume2,
  headphones: FiHeadphones,
  music: FiMusic,
  play: FiPlay,
  pause: FiPause,

  // Security
  shield: FiShield,
  security: MdSecurity,
  
  // Theme & Display
  sun: FiSun,
  moon: FiMoon,
  brightnessHigh: MdBrightnessHigh,
  brightnessLow: MdBrightnessLow,
  
  // QR & Scanning
  scan: MdScanner,
  
  // Social & Sharing
  heart: FiHeart,
  star: FiStar,
  thumbsUp: FiThumbsUp,
  thumbsDown: FiThumbsDown,
  share: FiShare2,
  link: FiLink,
  externalLink: FiExternalLink,
  copy: FiCopy,
  
  // Utilities
  printer: FiPrinter,
  duplicate: HiOutlineDuplicate,
};

export interface IconProps {
  /** Name of the icon from the registry */
  name: string;
  /** Size in pixels or Tailwind class */
  size?: number | string;
  /** Color - can be hex, rgb, or Tailwind color class */
  color?: string;
  /** Additional CSS classes */
  className?: string;
  /** Aria label for accessibility */
  ariaLabel?: string;
  /** Title for tooltip */
  title?: string;
  /** onClick handler */
  onClick?: () => void;
  /** Disabled state */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Icon variant: 'solid' | 'outline' (future enhancement) */
  variant?: 'default' | 'solid' | 'outline';
}

/**
 * Reusable Icon Component
 * 
 * Features:
 * - Centralized icon registry
 * - Theme-aware colors (dark mode support)
 * - Responsive sizing
 * - Accessibility support (ARIA labels)
 * - Loading state
 * - Click handlers
 */
export const Icon: React.FC<IconProps> = ({
  name,
  size = 24,
  color,
  className = '',
  ariaLabel,
  title,
  onClick,
  disabled = false,
  loading = false,
}) => {
  const IconComponent = iconRegistry[name];

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in registry. Using default.`);
    // Fallback to a default icon
    return (
      <span
        className={`inline-flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
        aria-label={ariaLabel || name}
      >
        ?
      </span>
    );
  }

  // Handle size - can be number (pixels) or string (Tailwind class)
  const sizeStyle = typeof size === 'number' ? { width: size, height: size } : {};
  const sizeClass = typeof size === 'string' ? size : '';

  // Handle color with dark mode support
  const colorClass = color || 'currentColor';

  // Loading animation
  const loadingClass = loading ? 'animate-spin' : '';

  // Disabled state
  const disabledClass = disabled ? 'opacity-50 cursor-not-allowed' : '';

  // Clickable state
  const clickableClass = onClick && !disabled && !loading ? 'cursor-pointer hover:opacity-80 transition-opacity' : '';

  return (
    <span
      className={`inline-flex items-center justify-center ${loadingClass} ${disabledClass} ${clickableClass} ${className} ${sizeClass}`}
      style={sizeStyle}
      onClick={onClick}
      role={onClick ? 'button' : 'img'}
      aria-label={ariaLabel || title || name}
      aria-disabled={disabled}
      title={title}
      tabIndex={onClick && !disabled ? 0 : -1}
      onKeyDown={(e) => {
        if (onClick && !disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <IconComponent
        style={{ color: colorClass }}
        className="w-full h-full"
      />
    </span>
  );
};

/**
 * Icon Button Component - Combines Icon with button styling
 */
export interface IconButtonProps extends Omit<IconProps, 'onClick' | 'variant'> {
  onClick?: () => void;
  buttonVariant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const IconButton: React.FC<IconButtonProps> = ({
  name,
  color,
  className = '',
  ariaLabel,
  title,
  onClick,
  disabled = false,
  loading = false,
  buttonVariant = 'ghost',
  size = 'md',
}) => {
  const sizeMap = {
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48,
  };

  const variantClasses = {
    primary: 'bg-primary text-white rounded-lg hover:bg-primary-dark',
    secondary: 'bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600',
    ghost: 'text-gray-600 rounded-lg hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800',
    danger: 'text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel || title || name}
      title={title}
      className={`p-2 transition-all duration-200 ${variantClasses[buttonVariant]} ${className} ${
        disabled || loading ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      <Icon
        name={name}
        size={sizeMap[size]}
        color={color}
        loading={loading}
      />
    </button>
  );
};

export default Icon;
