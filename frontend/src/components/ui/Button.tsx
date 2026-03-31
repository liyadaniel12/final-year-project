import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 disabled:pointer-events-none ring-offset-background',
          {
            'bg-indigo-600 text-white hover:bg-indigo-700': variant === 'primary',
            'bg-slate-100 text-slate-900 hover:bg-slate-200': variant === 'secondary',
            'bg-red-600 text-white hover:bg-red-700': variant === 'danger',
            'hover:bg-slate-100 hover:text-slate-900 text-slate-700': variant === 'ghost',
            'h-9 px-3': size === 'sm',
            'h-10 py-2 px-4': size === 'md',
            'h-11 px-8': size === 'lg',
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
