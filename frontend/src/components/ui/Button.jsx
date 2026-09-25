'use client';

import React from 'react';

export function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'success' | 'danger'
  size = 'md', // 'sm' | 'md' | 'lg'
  loading = false,
  disabled = false,
  className = '',
  onClick,
  type = 'button',
  icon: Icon,
  ...props
}) {
  const variantClass = `btn-${variant}`;
  const sizeStyles = {
    sm: { padding: '0.4rem 0.75rem', fontSize: '0.8125rem' },
    md: { padding: '0.65rem 1.25rem', fontSize: '0.875rem' },
    lg: { padding: '0.85rem 1.75rem', fontSize: '1rem' },
  }[size];

  return (
    <button
      type={type}
      className={`btn ${variantClass} ${className}`}
      style={sizeStyles}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <>
          <span
            style={{
              width: '14px',
              height: '14px',
              border: '2px solid rgba(255,255,255,0.3)',
              borderTopColor: '#ffffff',
              borderRadius: '50%',
              display: 'inline-block',
              animation: 'spin 0.6s linear infinite',
            }}
          />
          <span>Processing...</span>
        </>
      ) : (
        <>
          {Icon && <Icon size={16} />}
          {children}
        </>
      )}
      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </button>
  );
}
