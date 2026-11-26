import React from 'react';
import { cn } from '@/utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'neutral';
}

export function Badge({ children, className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-[#ECF6F4] text-[#0F273D]',
    success: 'bg-[#2CE078]/15 text-[#0F273D]',
    warning: 'bg-[#DDA64B]/15 text-[#0F273D]',
    danger: 'bg-[#DF4F52]/15 text-[#DF4F52]',
    neutral: 'bg-gray-100 text-[#748598]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
