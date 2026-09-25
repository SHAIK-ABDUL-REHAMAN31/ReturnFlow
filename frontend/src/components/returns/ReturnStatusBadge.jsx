'use client';

import React from 'react';
import { Badge } from '../ui/Badge.jsx';

const STATUS_CONFIG = {
  PENDING_REVIEW: {
    label: 'Pending Review',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.12)',
  },
  APPROVED: {
    label: 'Approved',
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.12)',
  },
  LABEL_GENERATED: {
    label: 'Label Generated',
    color: '#8b5cf6',
    bgColor: 'rgba(139, 92, 246, 0.12)',
  },
  IN_TRANSIT: {
    label: 'In Transit',
    color: '#06b6d4',
    bgColor: 'rgba(6, 182, 212, 0.12)',
  },
  RECEIVED: {
    label: 'Received',
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.12)',
  },
  REFUNDED: {
    label: 'Refunded',
    color: '#059669',
    bgColor: 'rgba(5, 150, 105, 0.16)',
  },
  REJECTED: {
    label: 'Rejected',
    color: '#f43f5e',
    bgColor: 'rgba(244, 63, 94, 0.12)',
  },
};

export function ReturnStatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || {
    label: status,
    color: '#94a3b8',
    bgColor: 'rgba(148, 163, 184, 0.12)',
  };

  return (
    <Badge color={config.color} bgColor={config.bgColor}>
      {config.label}
    </Badge>
  );
}
