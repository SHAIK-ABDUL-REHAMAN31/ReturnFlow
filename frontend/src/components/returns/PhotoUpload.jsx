'use client';

import React, { useState } from 'react';
import { Camera, Upload, Check, AlertCircle, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { apiFetch } from '../../lib/api-client.js';

export function PhotoUpload({ returnId, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadedKey, setUploadedKey] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const processFile = (selected) => {
    if (!selected) return;

    // Validate size (< 5MB)
    if (selected.size > 5 * 1024 * 1024) {
      setError('File size exceeds 5MB limit. Please choose a smaller image.');
      return;
    }

    // Validate mime type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(selected.type)) {
      setError('Only JPG, PNG, and WebP images are supported.');
      return;
    }

    setError(null);
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setUploadedKey(null);
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    processFile(selected);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files?.[0];
    processFile(droppedFile);
  };

  const handleUpload = async () => {
    if (!file || !returnId) return;
    setUploading(true);
    setError(null);

    try {
      // 1. Direct proxy upload to backend via FormData (avoids browser S3 CORS issues)
      const formData = new FormData();
      formData.append('file', file);

      const res = await apiFetch(`/returns/${returnId}/photos`, {
        method: 'POST',
        body: formData,
      });

      const key = res.key || 'uploaded';
      setUploadedKey(key);
      if (onUploadSuccess) {
        onUploadSuccess(key);
      }
    } catch (primaryErr) {
      // 2. Resilient fallback: Try presigned PUT if backend route is transitioning
      try {
        const ext = file.name.split('.').pop() || 'jpg';
        const { uploadUrl, key } = await apiFetch(`/returns/${returnId}/upload-url`, {
          method: 'POST',
          body: JSON.stringify({
            fileExtension: ext,
            contentType: file.type,
          }),
        });

        const s3Res = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type,
          },
          body: file,
        });

        if (!s3Res.ok && !uploadUrl.includes('mock=true')) {
          throw new Error('S3 upload rejected');
        }

        setUploadedKey(key);
        if (onUploadSuccess) {
          onUploadSuccess(key);
        }
      } catch (fallbackErr) {
        setError(primaryErr.message || 'Photo upload failed. Please try again.');
      }
    } finally {
      setUploading(false);
    }
  };

  const clearSelection = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setFile(null);
    setPreview(null);
    setError(null);
    setUploadedKey(null);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div style={{ marginTop: '1.25rem', width: '100%' }}>
      {/* Header section with friendly user-facing copy */}
      <div style={{ marginBottom: '0.625rem' }}>
        <div
          style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
          }}
        >
          <Camera size={16} color="var(--color-primary)" />
          <span>Condition Photo & Evidence</span>
          <span
            style={{
              fontSize: '0.6875rem',
              fontWeight: 500,
              padding: '0.125rem 0.375rem',
              borderRadius: '4px',
              backgroundColor: 'var(--color-bg-muted)',
              color: 'var(--color-text-muted)',
              marginLeft: '0.25rem',
            }}
          >
            Optional
          </span>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
          Upload a clear image of item condition or packaging to expedite review (JPG, PNG, WebP · Max 5MB)
        </p>
      </div>

      {!preview ? (
        /* Empty Dropzone State */
        <label
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${isDragOver ? 'var(--color-primary)' : 'var(--color-border-subtle)'}`,
            borderRadius: '10px',
            padding: '1.75rem 1.25rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            backgroundColor: isDragOver ? 'rgba(79, 70, 229, 0.04)' : 'var(--color-bg-muted)',
            transition: 'all 0.2s ease',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}
          >
            <ImageIcon size={22} color="var(--color-primary)" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>
              Click to browse
            </span>{' '}
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
              or drag & drop your photo
            </span>
          </div>
          <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
            High-resolution JPG, PNG, or WebP up to 5MB
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </label>
      ) : (
        /* Preview & Upload Action State */
        <div
          style={{
            padding: '1rem',
            borderRadius: '10px',
            backgroundColor: 'var(--color-bg-muted)',
            border: uploadedKey ? '1px solid #10b981' : '1px solid var(--color-border-subtle)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            transition: 'border-color 0.2s ease',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            {/* Thumbnail + Metadata */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', minWidth: 0 }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  flexShrink: 0,
                  border: '1px solid var(--color-border-subtle)',
                  backgroundColor: 'var(--color-surface)',
                }}
              >
                <img
                  src={preview}
                  alt="Evidence preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: 'var(--color-text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '220px',
                  }}
                  title={file?.name}
                >
                  {file?.name}
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: '0.125rem' }}>
                  {formatFileSize(file?.size)}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              {uploadedKey ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.375rem 0.75rem',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    color: '#059669',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}
                >
                  <Check size={14} />
                  <span>Photo Attached</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={uploading}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    backgroundColor: uploading ? 'var(--color-border)' : 'var(--color-primary)',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    transition: 'all 0.15s ease',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                  }}
                >
                  {uploading ? (
                    <>
                      <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={13} />
                      <span>Upload Photo</span>
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={clearSelection}
                title={uploadedKey ? 'Replace Photo' : 'Cancel'}
                style={{
                  padding: '0.4rem',
                  borderRadius: '6px',
                  background: 'none',
                  border: '1px solid var(--color-border-subtle)',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.15s ease',
                }}
              >
                <X size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 0.75rem',
            borderRadius: '6px',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: 'var(--color-error)',
            fontSize: '0.75rem',
            marginTop: '0.5rem',
          }}
        >
          <AlertCircle size={15} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1 }}>{error}</span>
          <button
            type="button"
            onClick={handleUpload}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-error)',
              fontSize: '0.75rem',
              fontWeight: 600,
              textDecoration: 'underline',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
