import React, { HTMLAttributes, forwardRef } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'highlight' | 'danger' | 'warning';
  hoverable?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(({
  children,
  variant = 'default',
  hoverable = false,
  className = '',
  ...props
}, ref) => {
  const baseStyles = 'bg-slate-900/90 border rounded-xl p-5 transition-all duration-200';
  
  const variantStyles = {
    default: 'border-slate-800 text-slate-100',
    highlight: 'border-sky-800/80 bg-slate-900 text-slate-100 shadow-md shadow-sky-950/20',
    danger: 'border-red-900/80 bg-red-950/40 text-red-100 shadow-md shadow-red-950/30',
    warning: 'border-amber-900/80 bg-amber-950/40 text-amber-100 shadow-md shadow-amber-950/30',
  };

  const hoverStyle = hoverable ? 'hover:border-sky-500/70 hover:translate-y-[-1px] cursor-pointer' : '';

  return (
    <div
      ref={ref}
      className={`${baseStyles} ${variantStyles[variant]} ${hoverStyle} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

export const CardHeader = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`flex flex-col gap-1 mb-3 ${className}`}>{children}</div>
);

export const CardTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-base font-semibold tracking-tight text-slate-100 ${className}`}>{children}</h3>
);

export const CardDescription = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-xs text-slate-400 ${className}`}>{children}</p>
);

export const CardContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`py-1 ${className}`}>{children}</div>
);

export const CardFooter = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 ${className}`}>
    {children}
  </div>
);
