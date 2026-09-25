'use client';

import React from 'react';
import { Check, X, Clock, Package, Truck, CheckCircle2, DollarSign } from 'lucide-react';

const STEPS = [
  { id: 'PENDING_REVIEW', label: 'Pending Review', icon: Clock },
  { id: 'APPROVED', label: 'Approved', icon: Check },
  { id: 'LABEL_GENERATED', label: 'Label Ready', icon: Package },
  { id: 'IN_TRANSIT', label: 'In Transit', icon: Truck },
  { id: 'RECEIVED', label: 'Received', icon: CheckCircle2 },
  { id: 'REFUNDED', label: 'Refunded', icon: DollarSign },
];

export function StateMachineVisualizer({ currentStatus, rejectionReason }) {
  const isRejected = currentStatus === 'REJECTED';
  const currentIndex = STEPS.findIndex((s) => s.id === currentStatus);

  if (isRejected) {
    return (
      <div
        className="glass-panel"
        style={{
          padding: '1.25rem 1.5rem',
          borderLeft: '4px solid var(--accent-rose)',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'rgba(244, 63, 94, 0.2)',
              color: 'var(--accent-rose)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--accent-rose)' }}>
              Return Request Rejected
            </h4>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
              {rejectionReason || 'This return request has been rejected by the merchant.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="glass-panel"
      style={{
        padding: '1.5rem 1.75rem',
        marginBottom: '1.5rem',
        overflowX: 'auto',
      }}
    >
      <div style={{ minWidth: '650px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isCompleted = currentIndex > idx;
          const isCurrent = currentIndex === idx;
          const isUpcoming = currentIndex < idx;

          let nodeBg = 'var(--bg-surface-elevated)';
          let nodeColor = 'var(--text-muted)';
          let borderColor = 'var(--border-subtle)';
          let glow = 'none';

          if (isCompleted) {
            nodeBg = 'rgba(16, 185, 129, 0.15)';
            nodeColor = '#10b981';
            borderColor = '#10b981';
          } else if (isCurrent) {
            nodeBg = 'var(--primary)';
            nodeColor = '#ffffff';
            borderColor = 'var(--primary)';
            glow = '0 0 16px var(--primary-glow)';
          }

          return (
            <React.Fragment key={step.id}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    backgroundColor: nodeBg,
                    border: `2px solid ${borderColor}`,
                    color: nodeColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: glow,
                    transition: 'all 0.3s ease',
                  }}
                >
                  {isCompleted ? <Check size={18} /> : <Icon size={16} />}
                </div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: isCurrent ? 600 : 500,
                    color: isCurrent ? 'var(--text-primary)' : isCompleted ? '#10b981' : 'var(--text-muted)',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {step.label}
                </span>
              </div>

              {idx < STEPS.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    height: '2px',
                    backgroundColor: isCompleted ? '#10b981' : 'var(--border-subtle)',
                    margin: '0 0.5rem',
                    marginBottom: '1.5rem',
                    transition: 'background-color 0.3s ease',
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
