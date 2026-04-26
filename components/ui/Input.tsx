'use client';

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({
  label,
  error,
  hint,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-card text-sm text-gray-900 placeholder:text-gray-400 
          focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand 
          transition-all duration-200
          disabled:bg-gray-50 disabled:text-gray-500
          ${error ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : ''} 
          ${className}`}
        {...props}
      />
      {hint && !error && (
        <p className="text-xs text-gray-500">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({
  label,
  error,
  className = '',
  id,
  ...props
}: TextareaProps) {
  const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-card text-sm text-gray-900 placeholder:text-gray-400 
          focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand 
          transition-all duration-200 resize-none
          ${error ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : ''} 
          ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({
  label,
  error,
  options,
  className = '',
  id,
  ...props
}: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-card text-sm text-gray-900 
          focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand 
          transition-all duration-200
          ${error ? 'border-red-300' : ''} 
          ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
