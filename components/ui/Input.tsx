'use client';

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className = '', id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-[13px] font-semibold tracking-wide text-[var(--text-muted)]">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`input-field placeholder:text-[var(--text-muted)]/70 focus:border-brand-400 focus:ring-brand-400/30 ${error ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : ''} ${className}`}
        {...props}
      />
      {hint && !error && <p className="text-[11px] text-[var(--text-muted)] pl-1">{hint}</p>}
      {error && <p className="text-[11px] text-red-500 pl-1 font-medium">{error}</p>}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className = '', id, ...props }: TextareaProps) {
  const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={textareaId} className="block text-[13px] font-semibold tracking-wide text-[var(--text-muted)]">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`input-field resize-none placeholder:text-[var(--text-muted)]/70 focus:border-brand-400 focus:ring-brand-400/30 ${error ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-[11px] text-red-500 pl-1 font-medium">{error}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, options, className = '', id, ...props }: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="block text-[13px] font-semibold tracking-wide text-[var(--text-muted)]">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`input-field appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[right_12px_center] bg-no-repeat pr-10 focus:border-brand-400 focus:ring-brand-400/30 ${error ? 'border-red-300' : ''} ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-[11px] text-red-500 pl-1 font-medium">{error}</p>}
    </div>
  );
}
