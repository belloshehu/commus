import React, { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const badgeVariants = cva(
  'inline-flex items-center font-semibold rounded-md uppercase tracking-wider transition-colors',
  {
    variants: {
      variant: {
        info: 'bg-sky-950 text-sky-300 border border-sky-800',
        success: 'bg-emerald-950 text-emerald-300 border border-emerald-800',
        warning: 'bg-amber-950 text-amber-300 border border-amber-800',
        danger: 'bg-red-950 text-red-300 border border-red-800',
        neutral: 'bg-slate-800 text-slate-300 border border-slate-700',
        synthetic: 'bg-indigo-950 text-indigo-300 border border-indigo-800',
        outline: 'border border-slate-700 text-slate-300 bg-transparent',
      },
      size: {
        sm: 'px-2 py-0.5 text-[10px] gap-1',
        md: 'px-2.5 py-1 text-xs gap-1.5',
      },
    },
    defaultVariants: {
      variant: 'neutral',
      size: 'md',
    },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant,
  size,
  icon,
  children,
  ...props
}) => {
  return (
    <span className={cn(badgeVariants({ variant, size, className }))} {...props}>
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
