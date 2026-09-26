'use client';

import React from 'react';
import { Layers, CheckCircle2, ArrowRight, ShieldCheck, Database, Bell } from 'lucide-react';
import { Card } from '../ui/Card.jsx';

const SFN_STATES = [
  { id: 'ValidateReturn', label: 'ValidateReturn (Task)', icon: ShieldCheck, desc: 'Schema & eligibility check' },
  { id: 'GenerateLabel', label: 'GenerateLabel (Lambda)', icon: Layers, desc: 'pdf-lib in-memory PDF render' },
  { id: 'UploadToS3', label: 'UploadToS3 (Task)', icon: Database, desc: 'S3 Private PutObject' },
  { id: 'UpdateStatus', label: 'UpdateStatus (Task)', icon: CheckCircle2, desc: 'Persist LABEL_GENERATED' },
  { id: 'Notify', label: 'Notify (SNS)', icon: Bell, desc: 'Publish label.ready event' },
];

export function StepFunctionsVisualizer({ status }) {
  // If status has advanced past or at APPROVED/LABEL_GENERATED, show execution progression
  const isWorkflowTriggered = status !== 'PENDING_REVIEW' && status !== 'REJECTED';

  return (
    <Card style={{ marginBottom: '1.5rem', border: '1px solid rgba(139, 92, 246, 0.25)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Layers size={18} color="#a855f7" />
          <h3 className="title-display" style={{ fontSize: '0.9375rem' }}>
            AWS Step Functions Sub-Flow Execution (Amazon States Language §1.6)
          </h3>
        </div>
        <span
          style={{
            fontSize: '0.6875rem',
            padding: '0.2rem 0.5rem',
            borderRadius: '4px',
            backgroundColor: isWorkflowTriggered ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.1)',
            color: isWorkflowTriggered ? '#10b981' : 'var(--color-text-muted)',
            fontWeight: 500,
          }}
        >
          {isWorkflowTriggered ? 'EXECUTION SUCCEEDED' : 'READY TO TRIGGER ON APPROVE'}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        {SFN_STATES.map((sfnState, idx) => {
          const Icon = sfnState.icon;
          const isDone = isWorkflowTriggered;

          return (
            <React.Fragment key={sfnState.id}>
              <div
                style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  backgroundColor: isDone ? 'rgba(16, 185, 129, 0.08)' : 'var(--color-bg-muted)',
                  border: `1px solid ${isDone ? 'rgba(16, 185, 129, 0.3)' : 'var(--color-border-subtle)'}`,
                  minWidth: '150px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Icon size={14} color={isDone ? '#10b981' : 'var(--color-text-muted)'} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 500, color: isDone ? '#10b981' : 'var(--color-text-secondary)' }}>
                    {sfnState.id}
                  </span>
                </div>
                <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                  {sfnState.desc}
                </span>
              </div>

              {idx < SFN_STATES.length - 1 && (
                <ArrowRight size={14} color={isDone ? '#10b981' : 'var(--color-text-muted)'} style={{ flexShrink: 0 }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </Card>
  );
}
