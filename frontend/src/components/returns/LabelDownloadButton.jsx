'use client';

import React, { useState } from 'react';
import { Download, FileText, ExternalLink } from 'lucide-react';
import { apiFetch } from '../../lib/api-client.js';
import { Button } from '../ui/Button.jsx';

export function LabelDownloadButton({ returnId, labelKey }) {
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [error, setError] = useState(null);

  const handleGetLabel = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/returns/${returnId}/label-url`);
      setDownloadUrl(res.downloadUrl);
      // Open in new tab or download
      if (res.downloadUrl) {
        window.open(res.downloadUrl, '_blank');
      }
    } catch (err) {
      setError(err.message || 'Failed to generate download URL');
    } finally {
      setLoading(false);
    }
  };

  if (!labelKey) return null;

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '0.25rem' }}>
      <Button
        variant="secondary"
        size="sm"
        icon={Download}
        loading={loading}
        onClick={handleGetLabel}
      >
        Download Shipping Label (PDF)
      </Button>
      {error && (
        <span style={{ fontSize: '0.75rem', color: 'var(--accent-rose)' }}>
          {error}
        </span>
      )}
    </div>
  );
}
