import React from 'react';

interface BrandLogoProps {
  size?: number;
  className?: string;
  withLabel?: boolean;
}

export function BrandLogo({ size = 34, className = '', withLabel = false }: BrandLogoProps) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`.trim()}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/icons/logo.png"
        alt="VamshaVrksha"
        width={size}
        height={size}
        className="rounded-lg object-contain"
        style={{ width: size, height: size }}
      />
      {withLabel && (
        <div className="leading-tight">
          <p className="font-display text-xl tracking-tight text-[var(--text-primary)]">VamshaVrksha</p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">वंशवृक्ष</p>
        </div>
      )}
    </div>
  );
}
