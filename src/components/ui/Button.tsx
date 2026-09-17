import React, { ButtonHTMLAttributes, forwardRef } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  icon,
  className = '',
  disabled,
  ...props
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5',
  };

  const variantStyles = {
    primary: 'bg-sky-600 hover:bg-sky-500 text-white shadow-sm border border-sky-500',
    secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700',
    danger: 'bg-red-700 hover:bg-red-600 text-white shadow-sm border border-red-600',
    outline: 'bg-transparent border border-slate-700 hover:bg-slate-800 text-slate-200',
    ghost: 'bg-transparent hover:bg-slate-800 text-slate-300 hover:text-white',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${widthStyle} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" aria-label="Loading..." />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      <span>{children}</span>
    </button>
  );
});

Button.displayName = 'Button';
