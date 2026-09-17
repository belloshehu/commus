import React, { HTMLAttributes } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  type?: 'info' | 'success' | 'warning' | 'danger' | 'safety';
  title?: string;
  onDismiss?: () => void;
}

export const Alert: React.FC<AlertProps> = ({
  children,
  type = 'info',
  title,
  onDismiss,
  className,
  ...props
}) => {
  const styles = {
    info: {
      bg: 'bg-sky-950/60 border-sky-800 text-sky-200',
      icon: <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" aria-hidden="true" />,
    },
    success: {
      bg: 'bg-emerald-950/60 border-emerald-800 text-emerald-200',
      icon: <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />,
    },
    warning: {
      bg: 'bg-amber-950/60 border-amber-800 text-amber-200',
      icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />,
    },
    danger: {
      bg: 'bg-red-950/60 border-red-800 text-red-200',
      icon: <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" aria-hidden="true" />,
    },
    safety: {
      bg: 'bg-gradient-to-r from-amber-950/90 to-red-950/90 border-amber-600 text-amber-100 shadow-lg shadow-amber-950/40',
      icon: <ShieldAlert className="w-6 h-6 text-amber-400 shrink-0 mt-0.5 animate-pulse" aria-hidden="true" />,
    },
  };

  const selected = styles[type];

  return (
    <div
      role="alert"
      className={cn(
        'relative w-full rounded-xl border p-4 text-sm transition-all flex items-start gap-3',
        selected.bg,
        className
      )}
      {...props}
    >
      {selected.icon}
      <div className="flex-1 space-y-1">
        {type === 'safety' && (
          <div className="font-bold uppercase tracking-wider text-xs text-amber-400 flex items-center gap-1.5 mb-1">
            <span>SAFETY FIRST</span>
          </div>
        )}
        {title && <h4 className="font-semibold leading-tight text-slate-100">{title}</h4>}
        <div className="text-slate-200 text-xs leading-relaxed">
          {children || (type === 'safety' && 'Do NOT approach violent crowds or active conflict areas. Seek immediate shelter or safety.')}
        </div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-slate-200 text-xs px-2 py-1 rounded hover:bg-slate-800 transition-colors"
          aria-label="Dismiss alert"
        >
          ✕
        </button>
      )}
    </div>
  );
};
