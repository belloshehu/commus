import React from 'react';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { Alert } from './Alert';
import { useTranslation } from '@/lib/i18n/context';

export type DangerLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'CRITICAL';

export interface DangerLevelIndicatorProps {
  level: DangerLevel;
  showSafetyBanner?: boolean;
  compact?: boolean;
}

export const DangerLevelIndicator: React.FC<DangerLevelIndicatorProps> = ({
  level,
  showSafetyBanner = false,
  compact = false,
}) => {
  const { t } = useTranslation();
  const isHigh = level === 'HIGH' || level === 'CRITICAL';

  const config = {
    CRITICAL: {
      bg: 'bg-red-950/90 border-red-700 text-red-100',
      badgeBg: 'bg-red-600 text-white',
      icon: <AlertTriangle className="w-4 h-4 text-red-200 shrink-0" aria-hidden="true" />,
      label: t('dangerLevels.critical'),
      ariaLabel: 'Critical Danger Level - High Priority Incident',
      description: t('dangerLevels.criticalDesc'),
    },
    HIGH: {
      bg: 'bg-red-950/80 border-red-800 text-red-200',
      badgeBg: 'bg-red-700 text-white',
      icon: <AlertTriangle className="w-4 h-4 text-red-300 shrink-0" aria-hidden="true" />,
      label: t('dangerLevels.high'),
      ariaLabel: 'High Danger Level - Urgent Priority Incident',
      description: t('dangerLevels.highDesc'),
    },
    MEDIUM: {
      bg: 'bg-amber-950/80 border-amber-800 text-amber-200',
      badgeBg: 'bg-amber-600 text-white',
      icon: <AlertCircle className="w-4 h-4 text-amber-300 shrink-0" aria-hidden="true" />,
      label: t('dangerLevels.medium'),
      ariaLabel: 'Medium Danger Level - Attention Required',
      description: t('dangerLevels.mediumDesc'),
    },
    LOW: {
      bg: 'bg-sky-950/80 border-sky-800 text-sky-200',
      badgeBg: 'bg-sky-600 text-white',
      icon: <Info className="w-4 h-4 text-sky-300 shrink-0" aria-hidden="true" />,
      label: t('dangerLevels.low'),
      ariaLabel: 'Low Danger Level - Early Warning Information',
      description: t('dangerLevels.lowDesc'),
    },
  };

  const selected = config[level];

  if (compact) {
    return (
      <span
        aria-label={selected.ariaLabel}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-bold uppercase tracking-wider ${selected.bg}`}
      >
        {selected.icon}
        <span>{selected.label}</span>
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-2.5 w-full">
      <div
        role="region"
        aria-label={selected.ariaLabel}
        className={`flex items-center justify-between p-3 rounded-xl border ${selected.bg}`}
      >
        <div className="flex items-center gap-2.5">
          <span className={`p-1.5 rounded-lg ${selected.badgeBg}`}>
            {selected.icon}
          </span>
          <div>
            <div className="font-extrabold text-xs tracking-wider uppercase">
              {selected.label}
            </div>
            <p className="text-[11px] opacity-90">{selected.description}</p>
          </div>
        </div>
      </div>

      {(showSafetyBanner || isHigh) && (
        <Alert type="safety">
          SAFETY FIRST: Do NOT approach violent crowds or active conflict areas. Seek immediate shelter or safety.
        </Alert>
      )}
    </div>
  );
};
