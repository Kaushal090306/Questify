import React from 'react';
import { twMerge } from 'tailwind-merge';

const Input = ({ 
  label, 
  error, 
  className = '', 
  containerClassName = '',
  ...props 
}) => {
  const inputClasses = twMerge(
    'input',
    error ? 'border-red-500 focus:ring-red-500' : '',
    className
  );

  return (
    <div className={twMerge('space-y-1', containerClassName)}>
      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <input
        className={inputClasses}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default Input;
