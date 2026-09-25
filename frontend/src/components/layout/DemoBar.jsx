'use client';

import React, { useState } from 'react';
import { Sparkles, Truck, ShieldAlert, Check, RefreshCw } from 'lucide-react';
import { apiFetch } from '../../lib/api-client.js';

export function DemoBar() {
  const [loadingAction, setLoadingAction] = useState(null);
  const [alertInfo, setAlertInfo] = useState(null);

  const handleReseed = async () => {
    setLoadingAction('reseed');
    try {
      await apiFetch('/demo/reseed', { method: 'POST' });
      setAlertInfo({ type: 'success', text: 'Demo database re-seeded across all 7 lifecycle states!' });
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (err) {
      setAlertInfo({ type: 'error', text: err.message || 'Reseed failed' });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSimulateCarrier = async () => {
    setLoadingAction('carrier');
    try {
      const res = await apiFetch('/demo/simulate-carrier', {
        method: 'POST',
        body: JSON.stringify({ returnNumber: 'RET-80102', event: 'CARRIER_PICKUP' }),
      });
      setAlertInfo({
        type: 'success',
        text: `Simulated Carrier Scan on RET-80102 ➔ New Status: ${res.newStatus || 'IN_TRANSIT'}`,
      });
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      setAlertInfo({ type: 'error', text: err.message || 'Carrier simulation failed' });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleTestGuardrail = async () => {
    setLoadingAction('guardrail');
    try {
      await apiFetch('/demo/test-illegal-transition', {
        method: 'POST',
        body: JSON.stringify({ from: 'PENDING_REVIEW', to: 'REFUNDED' }),
      });
      setAlertInfo({ type: 'error', text: 'Unexpected: illegal transition was permitted!' });
    } catch (err) {
      // Expected operational rejection!
      setAlertInfo({
        type: 'guardrail',
        text: `[409 Guardrail Verified] State Machine blocked transition: ${err.message}`,
      });
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div
      style={{
        background: 'linear-gradient(90deg, #1e1b4b 0%, #0f172a 50%, #022c22 100%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '0.45rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.8125rem',
        zIndex: 60,
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontWeight: 700,
            color: '#a5b4fc',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontSize: '0.75rem',
          }}
        >
          <Sparkles size={14} color="#a5b4fc" />
          Interactive Demo Controls:
        </span>

        {alertInfo && (
          <span
            style={{
              padding: '0.2rem 0.6rem',
              borderRadius: '4px',
              backgroundColor:
                alertInfo.type === 'guardrail'
                  ? 'rgba(244, 63, 94, 0.2)'
                  : alertInfo.type === 'success'
                  ? 'rgba(16, 185, 129, 0.2)'
                  : 'rgba(239, 68, 68, 0.2)',
              color:
                alertInfo.type === 'guardrail'
                  ? '#fda4af'
                  : alertInfo.type === 'success'
                  ? '#6ee7b7'
                  : '#fca5a5',
              fontWeight: 600,
              fontSize: '0.75rem',
            }}
          >
            {alertInfo.text}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <button
          onClick={handleReseed}
          disabled={!!loadingAction}
          style={{
            background: 'rgba(99, 102, 241, 0.2)',
            border: '1px solid rgba(99, 102, 241, 0.4)',
            color: '#c7d2fe',
            padding: '0.25rem 0.65rem',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontSize: '0.75rem',
            fontWeight: 600,
          }}
        >
          <RefreshCw size={12} className={loadingAction === 'reseed' ? 'animate-pulse' : ''} />
          <span>Reset / Seed 7 States</span>
        </button>

        <button
          onClick={handleSimulateCarrier}
          disabled={!!loadingAction}
          style={{
            background: 'rgba(6, 182, 212, 0.2)',
            border: '1px solid rgba(6, 182, 212, 0.4)',
            color: '#a5f3fc',
            padding: '0.25rem 0.65rem',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontSize: '0.75rem',
            fontWeight: 600,
          }}
        >
          <Truck size={12} />
          <span>Simulate Carrier Scan</span>
        </button>

        <button
          onClick={handleTestGuardrail}
          disabled={!!loadingAction}
          style={{
            background: 'rgba(244, 63, 94, 0.2)',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            color: '#fecdd3',
            padding: '0.25rem 0.65rem',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontSize: '0.75rem',
            fontWeight: 600,
          }}
        >
          <ShieldAlert size={12} />
          <span>Test 409 Guardrail</span>
        </button>
      </div>
    </div>
  );
}
