'use client';

import React, { useState } from 'react';
import { Download, Printer, FileText } from 'lucide-react';
import { apiFetch } from '../../lib/api-client.js';
import { Button } from '../ui/Button.jsx';
import { ShippingLabelModal } from './ShippingLabelModal.jsx';

export function LabelDownloadButton({ returnId, labelKey, returnData }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);

  const handleDownloadDirect = async () => {
    setDownloading(true);
    setError(null);
    try {
      const res = await apiFetch(`/returns/${returnId}/label-url`);
      if (res.downloadUrl) {
        window.open(res.downloadUrl, '_blank');
      }
    } catch (err) {
      setError(err.message || 'Failed to download PDF');
    } finally {
      setDownloading(false);
    }
  };

  if (!labelKey) return null;

  return (
    <>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <Button
          variant="primary"
          size="sm"
          icon={Printer}
          onClick={() => setModalOpen(true)}
        >
          Print Shipping Label
        </Button>
        <Button
          variant="secondary"
          size="sm"
          icon={Download}
          loading={downloading}
          onClick={handleDownloadDirect}
        >
          Download PDF
        </Button>
        {error && (
          <span style={{ fontSize: '0.75rem', color: 'var(--color-error)' }}>
            {error}
          </span>
        )}
      </div>

      {returnData && (
        <ShippingLabelModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          returnData={returnData}
        />
      )}
    </>
  );
}
