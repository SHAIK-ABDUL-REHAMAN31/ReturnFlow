'use client';

import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { PackageCheck } from 'lucide-react';
import { markReceived } from '../../features/returns/returnsSlice.js';
import { Button } from '../ui/Button.jsx';

export function ReceiveButton({ returnId, onReceived }) {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleReceive = async () => {
    setLoading(true);
    setError(null);

    try {
      const resultAction = await dispatch(
        markReceived({ returnId, note: 'Package inspected and accepted at dock' })
      );

      if (markReceived.fulfilled.match(resultAction)) {
        if (onReceived) onReceived(resultAction.payload);
      } else {
        setError(resultAction.payload?.message || 'Action failed');
        setLoading(false);
      }
    } catch (err) {
      setError(err.message || 'Unexpected error');
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '0.35rem' }}>
      <Button
        variant="success"
        icon={PackageCheck}
        loading={loading}
        disabled={loading}
        onClick={handleReceive}
      >
        Mark Items Received
      </Button>
      {error && (
        <span style={{ fontSize: '0.75rem', color: 'var(--color-error)' }}>
          {error}
        </span>
      )}
    </div>
  );
}
