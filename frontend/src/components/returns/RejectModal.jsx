'use client';

import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  XCircle,
  AlertTriangle,
  Camera,
  Upload,
  X,
  Loader2,
  Check,
} from 'lucide-react';
import { rejectReturn } from '../../features/returns/returnsSlice.js';
import { apiFetch } from '../../lib/api-client.js';
import { Modal } from '../ui/Modal.jsx';
import { Button } from '../ui/Button.jsx';

export const REJECTION_CATEGORIES = [
  { value: 'WINDOW_EXCEEDED', label: 'Return Window Period Exceeded' },
  { value: 'DAMAGED_BY_CUSTOMER', label: 'Item Damaged by Customer' },
  { value: 'POLICY_VIOLATION', label: 'Policy Violation / False Allegation' },
  { value: 'INCORRECT_ITEM', label: 'Incorrect or Counterfeit Item Returned' },
  { value: 'MISSING_PARTS', label: 'Missing Original Parts, Accessories or Tags' },
  { value: 'OTHER', label: 'Other Specific Merchant Justification' },
];

export function RejectModal({ isOpen, onClose, returnId, onRejected }) {
  const dispatch = useDispatch();
  const [category, setCategory] = useState('WINDOW_EXCEEDED');
  const [message, setMessage] = useState('');
  const [merchantPhotos, setMerchantPhotos] = useState([]); // array of { file, previewUrl, key, uploaded }
  const [loading, setLoading] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [error, setError] = useState(null);

  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const valid = [];
    for (const f of files) {
      if (f.size > 5 * 1024 * 1024) {
        setError(`File "${f.name}" exceeds 5MB limit.`);
        continue;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) {
        setError(`File "${f.name}" must be a JPG, PNG, or WebP.`);
        continue;
      }
      valid.push({
        file: f,
        previewUrl: URL.createObjectURL(f),
        key: null,
      });
    }
    setMerchantPhotos((prev) => [...prev, ...valid]);
  };

  const handleRemovePhoto = (index) => {
    setMerchantPhotos((prev) => {
      const target = prev[index];
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleReject = async (e) => {
    e.preventDefault();

    // Compulsory field validation
    if (!category) {
      setError('Please select a rejection category (compulsory).');
      return;
    }

    if (!message.trim() || message.trim().length < 10) {
      setError('Please provide a detailed explanation message (compulsory, minimum 10 characters).');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Upload any merchant photos first
      const uploadedKeys = [];
      if (merchantPhotos.length > 0) {
        setUploadingPhotos(true);
        for (const item of merchantPhotos) {
          if (item.key) {
            uploadedKeys.push(item.key);
          } else if (item.file) {
            const formData = new FormData();
            formData.append('file', item.file);
            const res = await apiFetch(`/returns/${returnId}/photos?isMerchant=true`, {
              method: 'POST',
              body: formData,
            });
            if (res.key) uploadedKeys.push(res.key);
          }
        }
      }

      // 2. Dispatch reject return
      const categoryLabel = REJECTION_CATEGORIES.find((c) => c.value === category)?.label || category;
      const formattedReason = `[${categoryLabel}] ${message.trim()}`;

      const resultAction = await dispatch(
        rejectReturn({
          returnId,
          category,
          message: message.trim(),
          reason: formattedReason,
          merchantPhotos: uploadedKeys,
        })
      );

      if (rejectReturn.fulfilled.match(resultAction)) {
        setMessage('');
        setMerchantPhotos([]);
        onClose();
        if (onRejected) onRejected(resultAction.payload);
      } else {
        setError(resultAction.payload?.message || 'Rejection failed. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Unexpected rejection error.');
    } finally {
      setLoading(false);
      setUploadingPhotos(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reject Return Request">
      <form onSubmit={handleReject} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Warning Callout */}
        <div
          style={{
            padding: '12px 14px',
            borderRadius: '8px',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            fontSize: '13px',
            color: 'var(--color-error)',
          }}
        >
          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Rejection is an audited state transition.</strong>
            <div style={{ marginTop: '2px', color: 'var(--color-text-secondary)', fontSize: '12px' }}>
              The customer will be notified via email/SNS, and the rejection reason with merchant evidence will be displayed on their tracking portal.
            </div>
          </div>
        </div>

        {/* 1. Category Dropdown (Compulsory) */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label
            className="form-label"
            htmlFor="reject-category"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <span>Primary Rejection Category</span>
            <span style={{ fontSize: '11px', color: 'var(--color-error)', fontWeight: 600 }}>
              Required (Compulsory)
            </span>
          </label>
          <select
            id="reject-category"
            className="form-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={loading}
            required
            style={{ width: '100%', height: '40px' }}
          >
            {REJECTION_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Detailed Message (Compulsory) */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label
            className="form-label"
            htmlFor="reject-message"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <span>Detailed Rejection Message & Justification</span>
            <span style={{ fontSize: '11px', color: 'var(--color-error)', fontWeight: 600 }}>
              Required (Compulsory)
            </span>
          </label>
          <textarea
            id="reject-message"
            className="form-textarea"
            rows={4}
            placeholder="e.g. Return request is 45 days past delivery (30-day policy exceeded). Customer images show wear-and-tear not covered by warranty..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={loading}
            required
            style={{ width: '100%', resize: 'vertical' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            <span>Communicated directly to the customer</span>
            <span>{message.length} characters (min 10)</span>
          </div>
        </div>

        {/* 3. Merchant Evidence Photos (Optional) */}
        <div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Camera size={16} color="var(--color-primary)" />
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                Merchant Evidence Photos (Optional)
              </span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              Attach dock / inspection proof
            </span>
          </div>

          {/* Previews */}
          {merchantPhotos.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '8px', marginBottom: '10px' }}>
              {merchantPhotos.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '1',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    border: '1px solid var(--color-border-subtle)',
                    backgroundColor: 'var(--color-bg-muted)',
                  }}
                >
                  <img
                    src={item.previewUrl}
                    alt={`Merchant proof ${idx + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(idx)}
                    style={{
                      position: 'absolute',
                      top: '3px',
                      right: '3px',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(0,0,0,0.65)',
                      color: '#ffffff',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                    title="Remove photo"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <label
            style={{
              border: '1.5px dashed var(--color-border-subtle)',
              borderRadius: '6px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              backgroundColor: 'var(--color-bg-muted)',
              fontSize: '12px',
              color: 'var(--color-text-secondary)',
            }}
          >
            <Upload size={14} color="var(--color-primary)" />
            <span>{merchantPhotos.length > 0 ? 'Add Another Photo' : 'Upload Merchant Proof Photos (JPG, PNG)'}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handlePhotoSelect}
              style={{ display: 'none' }}
              disabled={loading}
            />
          </label>
        </div>

        {error && (
          <div
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              backgroundColor: 'var(--color-error-soft)',
              color: 'var(--color-error)',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <AlertTriangle size={14} />
            <span>{error}</span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="danger"
            icon={loading ? Loader2 : XCircle}
            loading={loading}
          >
            {uploadingPhotos ? 'Uploading Proof...' : 'Confirm Rejection'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
