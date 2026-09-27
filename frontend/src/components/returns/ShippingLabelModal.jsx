'use client';

import React, { useState } from 'react';
import {
  Printer,
  Download,
  Package,
  QrCode,
  ShieldCheck,
  Building,
  User,
  Truck,
  X,
} from 'lucide-react';
import { apiFetch } from '../../lib/api-client.js';
import { Button } from '../ui/Button.jsx';

/**
 * Barcode visual generator (Code 128 style visual representation)
 */
function VisualBarcode({ value }) {
  // Generate consistent bar widths based on char codes
  const bars = [];
  const str = String(value || 'RET-000000');
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    bars.push((code % 3) + 1);
    bars.push(1);
    bars.push(((code * 2) % 4) + 1);
    bars.push(1);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          height: '52px',
          padding: '4px 8px',
          backgroundColor: '#ffffff',
        }}
      >
        {bars.map((width, idx) => (
          <div
            key={idx}
            style={{
              width: `${width * 2}px`,
              backgroundColor: idx % 2 === 0 ? '#000000' : 'transparent',
              height: '100%',
            }}
          />
        ))}
      </div>
      <div style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, letterSpacing: '2px', color: '#000000' }}>
        {value}
      </div>
    </div>
  );
}

/**
 * Visual QR Code representation
 */
function VisualQrCode({ value }) {
  return (
    <div
      style={{
        width: '84px',
        height: '84px',
        backgroundColor: '#ffffff',
        border: '2px solid #000000',
        padding: '6px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      {/* Corner squares simulating QR code */}
      <div style={{ position: 'absolute', top: '4px', left: '4px', width: '18px', height: '18px', border: '3px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '8px', height: '8px', backgroundColor: '#000' }} />
      </div>
      <div style={{ position: 'absolute', top: '4px', right: '4px', width: '18px', height: '18px', border: '3px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '8px', height: '8px', backgroundColor: '#000' }} />
      </div>
      <div style={{ position: 'absolute', bottom: '4px', left: '4px', width: '18px', height: '18px', border: '3px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '8px', height: '8px', backgroundColor: '#000' }} />
      </div>
      <QrCode size={36} color="#000000" />
      <div style={{ fontSize: '7px', fontWeight: 800, marginTop: '2px', color: '#000000' }}>SCAN RMA</div>
    </div>
  );
}

export function ShippingLabelModal({ isOpen, onClose, returnData }) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !returnData) return null;

  const trackingNumber = `1Z${(returnData.returnNumber || 'RET').replace(/[^0-9]/g, '').padEnd(16, '9')}`;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    setDownloading(true);
    setError(null);
    try {
      const res = await apiFetch(`/returns/${returnData._id}/label-url`);
      if (res.downloadUrl) {
        window.open(res.downloadUrl, '_blank');
      }
    } catch (err) {
      setError(err.message || 'Failed to download PDF');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(10, 15, 29, 0.85)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          color: '#0f172a',
        }}
      >
        {/* Modal Toolbar (hidden on print) */}
        <div
          className="no-print"
          style={{
            padding: '14px 20px',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Truck size={18} color="#818cf8" />
            <span style={{ fontWeight: 600, fontSize: '15px' }}>
              Official Pre-Paid Return Shipping Label & Packing Slip
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button variant="secondary" size="sm" icon={Printer} onClick={handlePrint}>
              Print Label
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Download}
              loading={downloading}
              onClick={handleDownloadPdf}
            >
              Download PDF
            </Button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Printable Label Area */}
        <div
          id="printable-shipping-label"
          style={{
            padding: '28px',
            overflowY: 'auto',
            backgroundColor: '#ffffff',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          }}
        >
          {/* Main 4x6 Style Box */}
          <div
            style={{
              border: '3px solid #000000',
              borderRadius: '8px',
              padding: '20px',
              backgroundColor: '#ffffff',
              color: '#000000',
            }}
          >
            {/* Label Header */}
            <div
              style={{
                borderBottom: '2px solid #000000',
                paddingBottom: '12px',
                marginBottom: '14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >
              <div>
                <div style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '-0.02em' }}>
                  UPS GROUND RETURN
                </div>
                <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', color: '#333333' }}>
                  PRE-PAID MERCHANDISE RETURN SERVICE • NO POSTAGE NECESSARY
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', fontWeight: 700 }}>RMA NUMBER</div>
                <div style={{ fontSize: '16px', fontWeight: 900 }}>{returnData.returnNumber}</div>
              </div>
            </div>

            {/* Addresses Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px',
                borderBottom: '2px solid #000000',
                paddingBottom: '16px',
                marginBottom: '16px',
              }}
            >
              {/* Ship From (Customer) */}
              <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
                <div style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '10px', color: '#555555', marginBottom: '2px' }}>
                  SHIP FROM:
                </div>
                <div style={{ fontWeight: 700 }}>{returnData.customerName}</div>
                <div>Order Ref: {returnData.orderNumber}</div>
                <div>{returnData.customerEmail}</div>
                <div>United States</div>
              </div>

              {/* Ship To (Merchant / Warehouse Dock) */}
              <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
                <div style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '10px', color: '#555555', marginBottom: '2px' }}>
                  SHIP TO (RETURN INBOUND DOCK):
                </div>
                <div style={{ fontWeight: 800 }}>RETURNFLOW CENTRAL FULFILLMENT</div>
                <div>Dock Bay #4 - Returns Processing</div>
                <div>100 Logistics Blvd, Suite 200</div>
                <div>Louisville, KY 40202</div>
              </div>
            </div>

            {/* Barcode & QR Code Section */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '20px',
                borderBottom: '2px solid #000000',
                paddingBottom: '16px',
                marginBottom: '16px',
              }}
            >
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px', color: '#444444' }}>
                  Carrier Tracking Barcode
                </div>
                <VisualBarcode value={trackingNumber} />
              </div>
              <div>
                <VisualQrCode value={`https://returnflow.app/returns/${returnData._id}`} />
              </div>
            </div>

            {/* Itemized Manifest / Packing Slip */}
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>
                Return Packing Slip Manifest
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #000000', textAlign: 'left' }}>
                    <th style={{ padding: '4px 0' }}>Item & SKU</th>
                    <th style={{ padding: '4px 0', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '4px 0', textAlign: 'right' }}>Est. Refund</th>
                  </tr>
                </thead>
                <tbody>
                  {returnData.items?.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px dashed #cccccc' }}>
                      <td style={{ padding: '6px 0' }}>
                        <div style={{ fontWeight: 700 }}>{item.name}</div>
                        <div style={{ color: '#555555', fontSize: '10px' }}>SKU: {item.sku}</div>
                      </td>
                      <td style={{ padding: '6px 0', textAlign: 'center', fontWeight: 700 }}>
                        {item.quantity}
                      </td>
                      <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 700 }}>
                        ${(item.price * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div
                style={{
                  marginTop: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '11px',
                  borderTop: '1px solid #000000',
                  paddingTop: '8px',
                }}
              >
                <div>
                  Reason: <strong>{returnData.reason}</strong>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 900 }}>
                  Total Estimated Refund: ${returnData.refundAmount?.toFixed(2) || '0.00'}
                </div>
              </div>
            </div>

            {/* Instructions Footer */}
            <div
              style={{
                marginTop: '16px',
                paddingTop: '10px',
                borderTop: '1px dotted #888888',
                fontSize: '9px',
                color: '#555555',
                lineHeight: '1.4',
              }}
            >
              <strong>INSTRUCTIONS:</strong> 1. Pack items securely in original or equivalent packaging. 2. Affix this label to the outside of the box, covering previous barcodes. 3. Drop off at any authorized UPS location or drop box.
            </div>
          </div>
        </div>

        {error && (
          <div style={{ padding: '8px 20px', backgroundColor: '#fee2e2', color: '#dc2626', fontSize: '12px' }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
