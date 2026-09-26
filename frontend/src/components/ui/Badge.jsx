'use client';

import React from 'react';

export function Badge({
  children,
  color = 'var(--color-neutral)',
  bgColor = 'var(--color-neutral-soft)',
  showDot = true,
  className = '',
}) {
  return (
    <span
      className={`badge ${className}`}
      style={{
        backgroundColor: bgColor,
        color: color,
      }}
    >
      {showDot && (
        <span
          className="badge-dot"
          style={{ backgroundColor: color }}
        />
      )}
      {children}
    </span>
  );
}
