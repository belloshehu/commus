import React, { InputHTMLAttributes, forwardRef, useId } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  helperText,
  error,
  icon,
  className = '',
  id: customId,
  ...props
}, ref) => {
  const generatedId = useId();
  const inputId = customId || generatedId;
  const helperId = `${inputId}-helper`;
  const errorId = `${inputId}-error`;

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold uppercase tracking-wider text-slate-300">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-3 text-slate-400 pointer-events-none flex items-center justify-center">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={`w-full bg-slate-900 border text-slate-100 text-sm rounded-lg px-3.5 py-2.5 transition-colors placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed ${
            icon ? 'pl-10' : ''
          } ${
            error ? 'border-red-500 focus:ring-red-400' : 'border-slate-700 hover:border-slate-600 focus:border-sky-500'
          } ${className}`}
          {...props}
        />
      </div>
      {error ? (
        <p id={errorId} className="text-xs text-red-400 font-medium">
          {error}
        </p>
      ) : helperText ? (
        <p id={helperId} className="text-xs text-slate-400">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';
