'use client';

import React, { useState } from 'react';
import { Sparkles, Truck, ShieldAlert, RefreshCw } from 'lucide-react';
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

  const demoBtnStyle = {
    background: 'var(--color-bg-dark-soft)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    color: 'var(--color-text-on-dark)',
    padding: '4px 10px',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    fontWeight: 500,
    whiteSpace: 'nowrap',
  };

  return (
    <div
      style={{
        background: 'var(--color-bg-dark)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '6px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '13px',
        zIndex: 'var(--z-drawer)',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: 500,
            color: 'var(--color-accent)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            fontSize: '11px',
          }}
        >
          <Sparkles size={13} />
          Interactive Demo Controls:
        </span>

        {alertInfo && (
          <span
            style={{
              padding: '3px 10px',
              borderRadius: '4px',
              backgroundColor:
                alertInfo.type === 'guardrail'
                  ? 'rgba(184, 58, 58, 0.25)'
                  : alertInfo.type === 'success'
                  ? 'rgba(36, 122, 82, 0.25)'
                  : 'rgba(184, 58, 58, 0.25)',
              color: '#ffffff',
              fontWeight: 500,
              fontSize: '11px',
            }}
          >
            {alertInfo.text}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button
          onClick={handleReseed}
          disabled={!!loadingAction}
          style={demoBtnStyle}
        >
          <RefreshCw size={12} className={loadingAction === 'reseed' ? 'animate-pulse' : ''} />
          <span>Reset / Seed 7 States</span>
        </button>

        <button
          onClick={handleSimulateCarrier}
          disabled={!!loadingAction}
          style={demoBtnStyle}
        >
          <Truck size={12} />
          <span>Simulate Carrier Scan</span>
        </button>

        <button
          onClick={handleTestGuardrail}
          disabled={!!loadingAction}
          style={demoBtnStyle}
        >
          <ShieldAlert size={12} />
          <span>Test 409 Guardrail</span>
        </button>
      </div>
    </div>
  );
}
