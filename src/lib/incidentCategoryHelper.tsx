import React from 'react';
import {
  Users,
  Car,
  Zap,
  Megaphone,
  ShieldAlert,
  HelpCircle,
  LucideIcon,
} from 'lucide-react';
import { IncidentCategory } from './firebase/rtdb';

export interface CategoryConfig {
  key: IncidentCategory;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
  colorClass: {
    bg: string;
    border: string;
    text: string;
    glow: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    iconBg: string;
  };
}

export const CATEGORY_CONFIG_MAP: Record<IncidentCategory, CategoryConfig> = {
  CROWD_SAFETY_ALERT: {
    key: 'CROWD_SAFETY_ALERT',
    label: 'Crowd Safety Alert',
    shortLabel: 'Crowd Safety',
    description: 'Congestion, bottleneck, mass gathering, or crowd risk',
    icon: Users,
    colorClass: {
      bg: 'bg-purple-950/30',
      border: 'border-purple-500/40',
      text: 'text-purple-300',
      glow: 'shadow-purple-900/20 ring-purple-500',
      badgeBg: 'bg-purple-950/70',
      badgeText: 'text-purple-300',
      badgeBorder: 'border-purple-800',
      iconBg: 'bg-purple-900/50 text-purple-300 border-purple-700/50',
    },
  },
  TRAFFIC_HAZARD: {
    key: 'TRAFFIC_HAZARD',
    label: 'Traffic Hazard',
    shortLabel: 'Traffic',
    description: 'Debris, road blockage, vehicle collision, or spill',
    icon: Car,
    colorClass: {
      bg: 'bg-amber-950/30',
      border: 'border-amber-500/40',
      text: 'text-amber-300',
      glow: 'shadow-amber-900/20 ring-amber-500',
      badgeBg: 'bg-amber-950/70',
      badgeText: 'text-amber-300',
      badgeBorder: 'border-amber-800',
      iconBg: 'bg-amber-900/50 text-amber-300 border-amber-700/50',
    },
  },
  INFRASTRUCTURE_FAILURE: {
    key: 'INFRASTRUCTURE_FAILURE',
    label: 'Infrastructure Failure',
    shortLabel: 'Infrastructure',
    description: 'Power outage, water main leak, damaged utility, or streetlights',
    icon: Zap,
    colorClass: {
      bg: 'bg-sky-950/30',
      border: 'border-sky-500/40',
      text: 'text-sky-300',
      glow: 'shadow-sky-900/20 ring-sky-500',
      badgeBg: 'bg-sky-950/70',
      badgeText: 'text-sky-300',
      badgeBorder: 'border-sky-800',
      iconBg: 'bg-sky-900/50 text-sky-300 border-sky-700/50',
    },
  },
  DISTURBANCE: {
    key: 'DISTURBANCE',
    label: 'Disturbance',
    shortLabel: 'Disturbance',
    description: 'Dispute, loud gathering, public alteration, or safety concern',
    icon: Megaphone,
    colorClass: {
      bg: 'bg-rose-950/30',
      border: 'border-rose-500/40',
      text: 'text-rose-300',
      glow: 'shadow-rose-900/20 ring-rose-500',
      badgeBg: 'bg-rose-950/70',
      badgeText: 'text-rose-300',
      badgeBorder: 'border-rose-800',
      iconBg: 'bg-rose-900/50 text-rose-300 border-rose-700/50',
    },
  },
  EMERGENCY_OTHER: {
    key: 'EMERGENCY_OTHER',
    label: 'Emergency Other',
    shortLabel: 'Emergency',
    description: 'Other urgent safety event requiring immediate awareness',
    icon: ShieldAlert,
    colorClass: {
      bg: 'bg-emerald-950/30',
      border: 'border-emerald-500/40',
      text: 'text-emerald-300',
      glow: 'shadow-emerald-900/20 ring-emerald-500',
      badgeBg: 'bg-emerald-950/70',
      badgeText: 'text-emerald-300',
      badgeBorder: 'border-emerald-800',
      iconBg: 'bg-emerald-900/50 text-emerald-300 border-emerald-700/50',
    },
  },
};

const DEFAULT_CONFIG: CategoryConfig = {
  key: 'EMERGENCY_OTHER',
  label: 'Emergency Alert',
  shortLabel: 'Alert',
  description: 'Public safety event requiring attention',
  icon: HelpCircle,
  colorClass: {
    bg: 'bg-slate-900/40',
    border: 'border-slate-700',
    text: 'text-slate-200',
    glow: 'ring-slate-500',
    badgeBg: 'bg-slate-900',
    badgeText: 'text-slate-300',
    badgeBorder: 'border-slate-700',
    iconBg: 'bg-slate-800 text-slate-300 border-slate-700',
  },
};

export function getCategoryConfig(category?: string | null): CategoryConfig {
  if (!category) return DEFAULT_CONFIG;
  const uppercaseCategory = category.toUpperCase() as IncidentCategory;
  return CATEGORY_CONFIG_MAP[uppercaseCategory] || DEFAULT_CONFIG;
}

export interface CategoryBadgeProps {
  category: string;
  showDescription?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  category,
  showDescription = false,
  size = 'md',
  className = '',
}) => {
  const config = getCategoryConfig(category);
  const IconComponent = config.icon;

  const sizeClasses = {
    sm: {
      badge: 'px-2 py-0.5 text-[10px] gap-1',
      icon: 'w-3 h-3',
    },
    md: {
      badge: 'px-2.5 py-1 text-xs gap-1.5',
      icon: 'w-3.5 h-3.5',
    },
    lg: {
      badge: 'px-3 py-1.5 text-sm gap-2',
      icon: 'w-4 h-4',
    },
  }[size];

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-lg border ${config.colorClass.badgeBg} ${config.colorClass.badgeText} ${config.colorClass.badgeBorder} ${sizeClasses.badge} ${className}`}
      aria-label={`Category: ${config.label}`}
    >
      <IconComponent className={`${sizeClasses.icon} shrink-0`} aria-hidden="true" />
      <span>{config.label}</span>
      {showDescription && (
        <span className="text-[11px] opacity-75 font-normal border-l border-slate-700 pl-1.5 ml-0.5">
          {config.description}
        </span>
      )}
    </span>
  );
};
