import React from 'react';

export interface StatusIndicatorProps {
  status: 'connected' | 'syncing' | 'offline' | 'verified' | 'escalated';
  label?: string;
  showPulse?: boolean;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  showPulse = true,
}) => {
  const statusMap = {
    connected: {
      color: 'bg-emerald-500',
      text: 'text-emerald-300',
      defaultLabel: 'Live Synced',
    },
    syncing: {
      color: 'bg-sky-500',
      text: 'text-sky-300',
      defaultLabel: 'Synchronizing...',
    },
    offline: {
      color: 'bg-slate-500',
      text: 'text-slate-400',
      defaultLabel: 'Offline',
    },
    verified: {
      color: 'bg-emerald-400',
      text: 'text-emerald-200',
      defaultLabel: 'Verified Community Report',
    },
    escalated: {
      color: 'bg-red-500',
      text: 'text-red-300',
      defaultLabel: 'Escalated to Authorities',
    },
  };

  const selected = statusMap[status];

  return (
    <div className="inline-flex items-center gap-2 text-xs font-medium" aria-label={`System status: ${label || selected.defaultLabel}`}>
      <span className="relative flex h-2.5 w-2.5">
        {showPulse && status !== 'offline' && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${selected.color}`} />
        )}
        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${selected.color}`} />
      </span>
      <span className={selected.text}>{label || selected.defaultLabel}</span>
    </div>
  );
};
