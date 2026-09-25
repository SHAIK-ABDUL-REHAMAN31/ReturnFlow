'use client';

import React from 'react';

export function Card({
  children,
  className = '',
  elevated = false,
  padding = '1.5rem',
  style = {},
  ...props
}) {
  const baseClass = elevated ? 'glass-panel-elevated' : 'glass-panel';

  return (
    <div
      className={`${baseClass} ${className}`}
      style={{ padding, ...style }}
      {...props}
    >
      {children}
    </div>
  );
}
