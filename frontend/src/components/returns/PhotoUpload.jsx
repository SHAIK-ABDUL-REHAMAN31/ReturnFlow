'use client';

import React, { useState } from 'react';
import { Camera, Upload, Check, AlertCircle, X } from 'lucide-react';
import { apiFetch } from '../../lib/api-client.js';

export function PhotoUpload({ returnId, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadedKey, setUploadedKey] = useState(null);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    // Validate size (< 5MB)
    if (selected.size > 5 * 1024 * 1024) {
      setError('File size exceeds 5MB limit');
      return;
    }

    // Validate mime type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(selected.type)) {
      setError('Only JPG, PNG, and WebP images are allowed');
      return;
    }

    setError(null);
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const handleUpload = async () => {
    if (!file || !returnId) return;
    setUploading(true);
    setError(null);

    try {
      const ext = file.name.split('.').pop() || 'jpg';

      // 1. Get presigned PUT URL from backend (§1.1)
      const { uploadUrl, key } = await apiFetch(`/returns/${returnId}/upload-url`, {
        method: 'POST',
        body: JSON.stringify({
          fileExtension: ext,
          contentType: file.type,
        }),
      });

      // 2. Direct PUT to S3 using signed URL — file NEVER transits through backend (§1.1)
      const s3Res = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      });

      if (!s3Res.ok && !uploadUrl.includes('mock=true')) {
        throw new Error('S3 direct upload rejected');
      }

      setUploadedKey(key);
      if (onUploadSuccess) {
        onUploadSuccess(key);
      }
    } catch (err) {
      setError(err.message || 'Direct upload to S3 failed');
    } finally {
      setUploading(false);
    }
  };

  const clearSelection = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    setUploadedKey(null);
  };

  return (
    <div style={{ marginTop: '1rem' }}>
      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
        Attach Proof / Condition Photo (Direct to S3 via Presigned URL §1.1)
      </div>

      {!preview ? (
        <label
          style={{
            border: '2px dashed var(--border-subtle)',
            borderRadius: '8px',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            backgroundColor: 'var(--bg-surface-elevated)',
            transition: 'border-color 0.2s ease',
          }}
        >
          <Camera size={24} color="var(--text-muted)" />
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            Click to upload damage photo or evidence (Max 5MB)
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </label>
      ) : (
        <div
          style={{
            padding: '1rem',
            borderRadius: '8px',
            backgroundColor: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img
              src={preview}
              alt="Evidence preview"
              style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px' }}
            />
            <div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{file?.name}</div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                {(file?.size / (1024 * 1024)).toFixed(2)} MB
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {uploadedKey ? (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.75rem',
                  color: '#10b981',
                  fontWeight: 600,
                }}
              >
                <Check size={14} />
                <span>Uploaded to S3</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: '6px',
                  backgroundColor: 'var(--primary)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <Upload size={12} />
                <span>{uploading ? 'Transferring...' : 'Send to S3'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={clearSelection}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '0.25rem',
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--accent-rose)', fontSize: '0.75rem', marginTop: '0.4rem' }}>
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
