import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No active incidents in your area',
  description = 'Your community zone is currently clear and quiet. Stay vigilant and report any safety concerns promptly.',
  icon = <ShieldCheck className="w-12 h-12 text-emerald-400" />,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border border-slate-800 rounded-2xl bg-slate-900/40 my-4 max-w-md mx-auto">
      <div className="mb-4 p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60">
        {icon}
      </div>
      <h3 className="text-base font-bold text-slate-100 mb-1">{title}</h3>
      <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
