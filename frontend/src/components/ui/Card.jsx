'use client';

import React from 'react';

export function Card({
  children,
  className = '',
  elevated = false,
  padding = '24px',
  style = {},
  ...props
}) {
  const baseClass = elevated ? 'card-elevated' : 'card';

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
