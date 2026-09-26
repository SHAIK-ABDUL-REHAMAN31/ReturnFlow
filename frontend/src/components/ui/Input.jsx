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
          {label} {required && <span style={{ color: 'var(--color-error)' }}>*</span>}
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
        style={error ? { borderColor: 'var(--color-error)' } : {}}
        {...props}
      />
      {error && (
        <span style={{ fontSize: '12px', color: 'var(--color-error)', marginTop: '2px' }}>
          {error}
        </span>
      )}
    </div>
  );
}
