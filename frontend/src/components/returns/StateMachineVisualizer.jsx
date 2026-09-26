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
        className="card"
        style={{
          padding: '1.25rem 1.5rem',
          borderLeft: '4px solid var(--color-error)',
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
              color: 'var(--color-error)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 500, color: 'var(--color-error)' }}>
              Return Request Rejected
            </h4>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '0.15rem' }}>
              {rejectionReason || 'This return request has been rejected by the merchant.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="card"
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

          let nodeBg = 'var(--color-bg-muted)';
          let nodeColor = 'var(--color-text-muted)';
          let borderColor = 'var(--color-border-subtle)';
          let glow = 'none';

          if (isCompleted) {
            nodeBg = 'rgba(16, 185, 129, 0.15)';
            nodeColor = '#10b981';
            borderColor = '#10b981';
          } else if (isCurrent) {
            nodeBg = 'var(--color-primary)';
            nodeColor = '#ffffff';
            borderColor = 'var(--color-primary)';
            glow = '0 0 16px rgba(25, 52, 56, 0.10)';
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
                    color: isCurrent ? 'var(--color-text-primary)' : isCompleted ? '#10b981' : 'var(--color-text-muted)',
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
                    backgroundColor: isCompleted ? '#10b981' : 'var(--color-border-subtle)',
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
