import React, { forwardRef } from 'react';
import { cn } from '@/utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        {icon && (
          <span className="absolute left-3 text-[#748598] pointer-events-none shrink-0 flex items-center justify-center">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full bg-white border border-[#C6D2D0] rounded-lg text-sm text-[#0F273D]',
            'placeholder:text-[#748598] focus:outline-none focus:border-[#0F273D] focus:ring-1 focus:ring-[#0F273D]',
            'transition-colors py-2 px-3',
            icon ? 'pl-9' : 'pl-3',
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = 'Input';
