'use client';

import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { DollarSign } from 'lucide-react';
import { refundReturn } from '../../features/returns/returnsSlice.js';
import { Button } from '../ui/Button.jsx';

export function RefundButton({ returnId, amount, onRefunded }) {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRefund = async () => {
    setLoading(true);
    setError(null);

    try {
      const resultAction = await dispatch(
        refundReturn({
          returnId,
          refundAmount: amount,
          note: `Merchant issued refund of $${amount?.toFixed(2) || '0.00'}`,
        })
      );

      if (refundReturn.fulfilled.match(resultAction)) {
        if (onRefunded) onRefunded(resultAction.payload);
      } else {
        setError(resultAction.payload?.message || 'Refund failed');
        setLoading(false);
      }
    } catch (err) {
      setError(err.message || 'Unexpected refund error');
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '0.35rem' }}>
      <Button
        variant="success"
        icon={DollarSign}
        loading={loading}
        disabled={loading}
        onClick={handleRefund}
      >
        Issue Refund (${amount?.toFixed(2) || '0.00'})
      </Button>
      {error && (
        <span style={{ fontSize: '0.75rem', color: 'var(--color-error)' }}>
          {error}
        </span>
      )}
    </div>
  );
}
