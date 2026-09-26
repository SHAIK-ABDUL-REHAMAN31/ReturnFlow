'use client';

import React from 'react';
import { Badge } from '../ui/Badge.jsx';

/* §6 — Return status mapping to semantic colors per Design System */
const STATUS_CONFIG = {
  PENDING_REVIEW: {
    label: 'Pending Review',
    color: 'var(--color-warning)',
    bgColor: 'var(--color-warning-soft)',
  },
  APPROVED: {
    label: 'Approved',
    color: 'var(--color-success)',
    bgColor: 'var(--color-success-soft)',
  },
  LABEL_GENERATED: {
    label: 'Label Generated',
    color: 'var(--color-info)',
    bgColor: 'var(--color-info-soft)',
  },
  IN_TRANSIT: {
    label: 'In Transit',
    color: 'var(--color-info)',
    bgColor: 'var(--color-info-soft)',
  },
  RECEIVED: {
    label: 'Received',
    color: 'var(--color-success)',
    bgColor: 'var(--color-success-soft)',
  },
  REFUNDED: {
    label: 'Refunded',
    color: 'var(--color-success)',
    bgColor: 'var(--color-success-soft)',
  },
  REJECTED: {
    label: 'Rejected',
    color: 'var(--color-error)',
    bgColor: 'var(--color-error-soft)',
  },
};

export function ReturnStatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || {
    label: status,
    color: 'var(--color-neutral)',
    bgColor: 'var(--color-neutral-soft)',
  };

  return (
    <Badge color={config.color} bgColor={config.bgColor}>
      {config.label}
    </Badge>
  );
}
