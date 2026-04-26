import React from 'react';

interface BrandLogoProps {
  size?: number;
  className?: string;
  withLabel?: boolean;
}

export function BrandLogo({ size = 34, className = '', withLabel = false }: BrandLogoProps) {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`.trim()}>
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="kin-root-grad" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1D9E75" />
            <stop offset="0.55" stopColor="#185FA5" />
            <stop offset="1" stopColor="#7F77DD" />
          </linearGradient>
        </defs>
        <rect x="4" y="4" width="56" height="56" rx="18" fill="url(#kin-root-grad)" opacity="0.12" />
        <path d="M32 14V26" stroke="url(#kin-root-grad)" strokeWidth="3" strokeLinecap="round" />
        <path d="M20 26L32 36L44 26" stroke="url(#kin-root-grad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M20 26V44" stroke="url(#kin-root-grad)" strokeWidth="3" strokeLinecap="round" />
        <path d="M44 26V44" stroke="url(#kin-root-grad)" strokeWidth="3" strokeLinecap="round" />
        <circle cx="32" cy="12" r="5" fill="#185FA5" />
        <circle cx="20" cy="48" r="5" fill="#1D9E75" />
        <circle cx="44" cy="48" r="5" fill="#7F77DD" />
      </svg>
      {withLabel && (
        <div className="leading-tight">
          <p className="font-display text-xl tracking-tight text-[var(--text-primary)]">KinRoot</p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Family Atlas</p>
        </div>
      )}
    </div>
  );
}
