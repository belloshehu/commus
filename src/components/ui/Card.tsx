import React, { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'highlight' | 'danger' | 'warning';
  hoverable?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(({
  className,
  variant = 'default',
  hoverable = false,
  children,
  ...props
}, ref) => {
  const variantStyles = {
    default: 'border-slate-800 bg-slate-900/90 text-slate-100',
    highlight: 'border-sky-800/80 bg-slate-900 text-slate-100 shadow-md shadow-sky-950/20',
    danger: 'border-red-900/80 bg-red-950/40 text-red-100 shadow-md shadow-red-950/30',
    warning: 'border-amber-900/80 bg-amber-950/40 text-amber-100 shadow-md shadow-amber-950/30',
  };

  return (
    <div
      ref={ref}
      className={cn(
        'rounded-xl border p-5 shadow-sm transition-all duration-200',
        variantStyles[variant],
        hoverable && 'hover:border-sky-500/70 hover:translate-y-[-1px] cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({
  className,
  ...props
}, ref) => (
  <div ref={ref} className={cn('flex flex-col gap-1 mb-3', className)} {...props} />
));
CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(({
  className,
  ...props
}, ref) => (
  <h3 ref={ref} className={cn('text-base font-semibold tracking-tight text-slate-100', className)} {...props} />
));
CardTitle.displayName = 'CardTitle';

export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(({
  className,
  ...props
}, ref) => (
  <p ref={ref} className={cn('text-xs text-slate-400', className)} {...props} />
));
CardDescription.displayName = 'CardDescription';

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({
  className,
  ...props
}, ref) => (
  <div ref={ref} className={cn('py-1', className)} {...props} />
));
CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({
  className,
  ...props
}, ref) => (
  <div ref={ref} className={cn('mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400', className)} {...props} />
));
CardFooter.displayName = 'CardFooter';
