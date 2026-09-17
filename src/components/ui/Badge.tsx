import React, { HTMLAttributes } from 'react';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'info' | 'success' | 'warning' | 'danger' | 'neutral' | 'synthetic';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  icon,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center font-semibold rounded-md uppercase tracking-wider transition-colors';

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
  };

  const variantStyles = {
    info: 'bg-sky-950 text-sky-300 border border-sky-800',
    success: 'bg-emerald-950 text-emerald-300 border border-emerald-800',
    warning: 'bg-amber-950 text-amber-300 border border-amber-800',
    danger: 'bg-red-950 text-red-300 border border-red-800',
    neutral: 'bg-slate-800 text-slate-300 border border-slate-700',
    synthetic: 'bg-indigo-950 text-indigo-300 border border-indigo-800',
  };

  return (
    <span
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
