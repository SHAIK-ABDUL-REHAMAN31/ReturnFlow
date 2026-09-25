'use client';

import React from 'react';

export function Input({
  label,
  error,
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  disabled = false,
  required = false,
  ...props
}) {
  return (
    <div className="form-group">
      {label && (
        <label htmlFor={id} className="form-label">
          {label} {required && <span style={{ color: 'var(--accent-rose)' }}>*</span>}
        </label>
      )}
      <input
        id={id}
        type={type}
        className="form-input"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        style={error ? { borderColor: 'var(--accent-rose)' } : {}}
        {...props}
      />
      {error && (
        <span style={{ fontSize: '0.75rem', color: 'var(--accent-rose)', marginTop: '0.2rem' }}>
          {error}
        </span>
      )}
    </div>
  );
}
