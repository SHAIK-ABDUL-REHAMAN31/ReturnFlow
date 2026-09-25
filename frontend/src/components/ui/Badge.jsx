'use client';

import React from 'react';

export function Badge({
  children,
  color = '#6366f1',
  bgColor = 'rgba(99, 102, 241, 0.12)',
  showDot = true,
  className = '',
}) {
  return (
    <span
      className={`badge ${className}`}
      style={{
        backgroundColor: bgColor,
        color: color,
        border: `1px solid ${color}33`,
      }}
    >
      {showDot && (
        <span
          className="badge-dot"
          style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
        />
      )}
      {children}
    </span>
  );
}
