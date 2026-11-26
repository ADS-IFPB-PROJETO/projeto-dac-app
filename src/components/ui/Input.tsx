import React, { forwardRef } from 'react';
import { cn } from '@/utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, label, id, ...props }, ref) => {
    const inputEl = (
      <div className="relative flex items-center w-full">
        {icon && (
          <span className="absolute left-3 text-[#748598] pointer-events-none shrink-0 flex items-center justify-center">
            {icon}
          </span>
        )}
        <input
          id={id}
          ref={ref}
          className={cn(
            'w-full bg-white border border-[#C6D2D0] rounded-lg text-sm text-[#0F273D]',
            'placeholder:text-[#748598] focus:outline-none focus:border-[#0F273D] focus:ring-1 focus:ring-[#0F273D]',
            'transition-colors py-2 px-3 disabled:bg-gray-50 disabled:text-[#748598]',
            icon ? 'pl-9' : 'pl-3',
            className
          )}
          {...props}
        />
      </div>
    );

    if (!label) return inputEl;

    return (
      <div className="w-full">
        <label htmlFor={id} className="block text-xs font-medium text-[#748598] mb-1">
          {label}
        </label>
        {inputEl}
      </div>
    );
  }
);

Input.displayName = 'Input';
