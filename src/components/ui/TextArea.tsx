import React, { TextareaHTMLAttributes, forwardRef, useId } from 'react';

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  maxLength?: number;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(({
  label,
  helperText,
  error,
  maxLength,
  value,
  className = '',
  id: customId,
  ...props
}, ref) => {
  const generatedId = useId();
  const inputId = customId || generatedId;
  const helperId = `${inputId}-helper`;
  const errorId = `${inputId}-error`;

  const currentLength = typeof value === 'string' ? value.length : 0;

  return (
    <div className="w-full flex flex-col gap-1.5">
      <div className="flex justify-between items-center">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            {label}
          </label>
        )}
        {maxLength && (
          <span className="text-xs text-slate-400">
            {currentLength}/{maxLength}
          </span>
        )}
      </div>
      <textarea
        ref={ref}
        id={inputId}
        maxLength={maxLength}
        value={value}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : helperText ? helperId : undefined}
        rows={4}
        className={`w-full bg-slate-900 border text-slate-100 text-sm rounded-lg p-3 transition-colors placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed ${
          error ? 'border-red-500 focus:ring-red-400' : 'border-slate-700 hover:border-slate-600 focus:border-sky-500'
        } ${className}`}
        {...props}
      />
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

TextArea.displayName = 'TextArea';
