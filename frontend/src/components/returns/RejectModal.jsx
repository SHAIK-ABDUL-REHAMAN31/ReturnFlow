'use client';

import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { XCircle } from 'lucide-react';
import { rejectReturn } from '../../features/returns/returnsSlice.js';
import { Modal } from '../ui/Modal.jsx';
import { Button } from '../ui/Button.jsx';

export function RejectModal({ isOpen, onClose, returnId, onRejected }) {
  const dispatch = useDispatch();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleReject = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a specific rejection reason');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const resultAction = await dispatch(
        rejectReturn({ returnId, reason: reason.trim() })
      );

      if (rejectReturn.fulfilled.match(resultAction)) {
        setReason('');
        onClose();
        if (onRejected) onRejected(resultAction.payload);
      } else {
        setError(resultAction.payload?.message || 'Rejection failed');
      }
    } catch (err) {
      setError(err.message || 'Unexpected rejection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reject Return Request">
      <form onSubmit={handleReject}>
        <div className="form-group">
          <label className="form-label" htmlFor="reject-reason">
            Rejection Reason (communicated to customer)
          </label>
          <textarea
            id="reject-reason"
            className="form-textarea"
            rows={4}
            placeholder="e.g. Return window expired, item damaged by customer, missing original packaging..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={loading}
            required
          />
          {error && (
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-rose)' }}>
              {error}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" icon={XCircle} loading={loading}>
            Confirm Rejection
          </Button>
        </div>
      </form>
    </Modal>
  );
}
