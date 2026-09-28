'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
  Package,
  RefreshCw,
  CheckCircle2,
  Clock,
  Truck,
  Inbox,
  DollarSign,
  AlertTriangle,
  Download,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { apiFetch } from '../../../lib/api-client.js';
import { Card } from '../../../components/ui/Card.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { ReturnStatusBadge } from '../../../components/returns/ReturnStatusBadge.jsx';

const TIMELINE_STAGES = [
  { key: 'PENDING_REVIEW', label: 'Return Requested', icon: Clock, desc: 'Submitted by customer, pending merchant review' },
  { key: 'APPROVED', label: 'Return Approved', icon: ShieldCheck, desc: 'Approved by merchant console' },
  { key: 'LABEL_GENERATED', label: 'Shipping Label Ready', icon: Download, desc: 'Prepaid return label generated and ready to download' },
  { key: 'IN_TRANSIT', label: 'Package In Transit', icon: Truck, desc: 'Scanned and in transit with carrier' },
  { key: 'RECEIVED', label: 'Package Received', icon: Inbox, desc: 'Delivered to fulfillment warehouse and inspected' },
  { key: 'REFUNDED', label: 'Refund Processed', icon: DollarSign, desc: 'Refund completed to original payment method' },
];

export default function CustomerTrackPage({ params }) {
  // Support both React 19 promise params or direct object
  const unwrappedParams = typeof params?.then === 'function' ? use(params) : params;
  const token = unwrappedParams?.token;

  const [returnData, setReturnData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchStatus = async () => {
    if (!token) return;
    try {
      const data = await apiFetch(`/returns/track/${token}`);
      setReturnData(data);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      if (!returnData) {
        setError(err.message || 'We could not find this return. Please verify your tracking link.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [token]);

  // Real-time polling every 5s until terminal state (§1.4 Fix B)
  useEffect(() => {
    if (!returnData) return;
    if (['REFUNDED', 'REJECTED'].includes(returnData.status)) return;

    const intervalId = setInterval(() => {
      fetchStatus();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [returnData?.status, token]);

  if (loading && !returnData) {
    return (
      <div
        style={{
          minHeight: '100vh',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--color-bg-subtle)',
        }}
      >
        <header
          style={{
            height: '64px',
            borderBottom: '1px solid var(--color-border-subtle)',
            backgroundColor: 'var(--color-bg)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 32px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-text-on-dark)',
              }}
            >
              <RefreshCw size={18} />
            </div>
            <span style={{ fontSize: '18px', fontWeight: 500 }}>
              Return<span style={{ color: 'var(--color-primary)' }}>Flow</span>
            </span>
          </div>
        </header>

        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ color: 'var(--color-text-secondary)', textAlign: 'center' }}>
            <div className="animate-spin" style={{ display: 'inline-block', marginBottom: '12px' }}>
              <RefreshCw size={24} color="var(--color-primary)" />
            </div>
            <div>Loading return tracking information...</div>
          </div>
        </main>
      </div>
    );
  }

  if (error && !returnData) {
    return (
      <div
        style={{
          minHeight: '100vh',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--color-bg-subtle)',
        }}
      >
        <header
          style={{
            height: '64px',
            borderBottom: '1px solid var(--color-border-subtle)',
            backgroundColor: 'var(--color-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 32px',
          }}
        >
          <Link href="/returns/new" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-text-on-dark)',
                }}
              >
                <RefreshCw size={18} />
              </div>
              <span style={{ fontSize: '18px', fontWeight: 500 }}>
                Return<span style={{ color: 'var(--color-primary)' }}>Flow</span>
              </span>
            </div>
          </Link>
          <Link href="/track">
            <Button variant="secondary" size="sm" icon={Search}>
              Look Up Return
            </Button>
          </Link>
        </header>

        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <Card style={{ maxWidth: '480px', width: '100%', textAlign: 'center', padding: '40px 24px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                color: 'var(--color-error)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <AlertTriangle size={24} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 500, marginBottom: '8px' }}>
              Return Not Found
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', lineHeight: 1.5, marginBottom: '24px' }}>
              {error}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <Link href="/track">
                <Button variant="primary">Look Up With Order #</Button>
              </Link>
              <Link href="/returns/new">
                <Button variant="secondary">Start a Return</Button>
              </Link>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  const ret = returnData;
  const isRejected = ret.status === 'REJECTED';

  // Find index of current status in timeline
  const statusOrder = ['PENDING_REVIEW', 'APPROVED', 'LABEL_GENERATED', 'IN_TRANSIT', 'RECEIVED', 'REFUNDED'];
  const currentStageIndex = statusOrder.indexOf(ret.status);

  // Map timeline events by status for easy timestamp lookup
  const timelineMap = {};
  for (const ev of ret.timeline || []) {
    timelineMap[ev.status] = ev.timestamp;
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--color-bg-subtle)',
      }}
    >
      {/* Customer Header */}
      <header
        style={{
          height: '64px',
          borderBottom: '1px solid var(--color-border-subtle)',
          backgroundColor: 'var(--color-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/returns/new" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-text-on-dark)',
                }}
              >
                <RefreshCw size={18} strokeWidth={1.75} />
              </div>
              <span style={{ fontSize: '18px', fontWeight: 500, letterSpacing: '-0.01em' }}>
                Return<span style={{ color: 'var(--color-primary)' }}>Flow</span>
              </span>
            </div>
          </Link>

          <span
            style={{
              fontSize: '11px',
              padding: '3px 8px',
              borderRadius: '4px',
              backgroundColor: 'var(--color-accent-soft)',
              color: 'var(--color-text-on-accent)',
              border: '1px solid var(--color-accent-border)',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Customer Tracking Portal
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/track">
            <Button variant="secondary" size="sm" icon={Search}>
              Look Up Another Return
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Tracking Content */}
      <main
        style={{
          flex: 1,
          padding: '36px 20px',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div style={{ width: '100%', maxWidth: '780px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Header Summary Card */}
          <Card padding="24px">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '16px',
                borderBottom: '1px solid var(--color-border-subtle)',
                paddingBottom: '20px',
                marginBottom: '20px',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h1 style={{ fontSize: '24px', fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>
                    {ret.returnNumber}
                  </h1>
                  <ReturnStatusBadge status={ret.status} />
                </div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                  Order: <strong>{ret.orderNumber}</strong> • Requested by {ret.customerName}
                </div>
              </div>

              {/* Download Shipping Label Button (available when label generated) */}
              {ret.labelUrl && (
                <a
                  href={ret.labelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none' }}
                >
                  <Button variant="primary" icon={Download}>
                    Download Return Label
                  </Button>
                </a>
              )}
            </div>

            {/* Refund & Item Summary Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '16px',
                fontSize: '13px',
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>
                  Estimated Refund
                </div>
                <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-success)' }}>
                  ${ret.refundAmount ? ret.refundAmount.toFixed(2) : '0.00'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>
                  Return Reason
                </div>
                <div style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
                  {ret.reason?.replace(/_/g, ' ') || 'Defective'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>
                  Live Status Polling
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-secondary)' }}>
                  {!['REFUNDED', 'REJECTED'].includes(ret.status) && (
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#10b981',
                        display: 'inline-block',
                      }}
                    />
                  )}
                  <span>{['REFUNDED', 'REJECTED'].includes(ret.status) ? 'Terminal state reached' : 'Auto-refreshing (every 5s)'}</span>
                </div>
              </div>
            </div>

            {/* Items Claimed */}
            {ret.items && ret.items.length > 0 && (
              <div
                style={{
                  marginTop: '20px',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--color-border-subtle)',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '10px' }}>
                  Returned Items:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {ret.items.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '13px',
                        padding: '8px 12px',
                        backgroundColor: 'var(--color-bg-subtle)',
                        borderRadius: '6px',
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{item.name}</span>
                        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginLeft: '8px' }}>
                          SKU: {item.sku} • Qty: {item.quantity}
                        </span>
                      </div>
                      <div style={{ fontWeight: 500 }}>
                        ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Rejection Alert if Rejected */}
          {isRejected && (
            <Card
              padding="24px"
              style={{
                borderColor: 'var(--color-error)',
                backgroundColor: 'rgba(239, 68, 68, 0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    color: 'var(--color-error)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-error)', margin: '0 0 6px 0' }}>
                    Return Request Rejected
                  </h3>
                  <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', margin: '0 0 10px 0', lineHeight: 1.5 }}>
                    {ret.rejectionReason || 'This return request has been rejected by the merchant.'}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: 0 }}>
                    If you believe this was in error, please contact merchant customer support.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Visual Lifecycle Timeline */}
          {!isRejected && (
            <Card padding="28px">
              <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', letterSpacing: '-0.01em' }}>
                Lifecycle Timeline
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
                {TIMELINE_STAGES.map((stage, idx) => {
                  const isCompleted = currentStageIndex > idx || ret.status === stage.key;
                  const isCurrent = ret.status === stage.key;
                  const stageTimestamp = timelineMap[stage.key];
                  const Icon = stage.icon;

                  return (
                    <div
                      key={stage.key}
                      style={{
                        display: 'flex',
                        gap: '20px',
                        position: 'relative',
                        paddingBottom: idx === TIMELINE_STAGES.length - 1 ? '0' : '28px',
                      }}
                    >
                      {/* Vertical line connecting stages */}
                      {idx < TIMELINE_STAGES.length - 1 && (
                        <div
                          style={{
                            position: 'absolute',
                            left: '19px',
                            top: '40px',
                            bottom: '0',
                            width: '2px',
                            backgroundColor: isCompleted && currentStageIndex > idx
                              ? 'var(--color-primary)'
                              : 'var(--color-border-subtle)',
                          }}
                        />
                      )}

                      {/* Stage Circle Node */}
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          backgroundColor: isCurrent
                            ? 'var(--color-primary)'
                            : isCompleted
                            ? 'var(--color-accent-soft)'
                            : 'var(--color-bg-muted)',
                          border: `2px solid ${
                            isCurrent
                              ? 'var(--color-primary)'
                              : isCompleted
                              ? 'var(--color-primary)'
                              : 'var(--color-border-subtle)'
                          }`,
                          color: isCurrent
                            ? '#ffffff'
                            : isCompleted
                            ? 'var(--color-primary)'
                            : 'var(--color-text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          zIndex: 1,
                        }}
                      >
                        {isCompleted && !isCurrent ? (
                          <CheckCircle2 size={20} />
                        ) : (
                          <Icon size={18} />
                        )}
                      </div>

                      {/* Stage Details */}
                      <div style={{ flex: 1, paddingTop: '6px' }}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '8px',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '15px',
                              fontWeight: isCurrent ? 600 : isCompleted ? 500 : 400,
                              color: isCurrent
                                ? 'var(--color-primary)'
                                : isCompleted
                                ? 'var(--color-text-primary)'
                                : 'var(--color-text-muted)',
                            }}
                          >
                            {stage.label}
                          </span>

                          {stageTimestamp && (
                            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                              {new Date(stageTimestamp).toLocaleString()}
                            </span>
                          )}
                        </div>

                        <div
                          style={{
                            fontSize: '13px',
                            color: 'var(--color-text-secondary)',
                            marginTop: '4px',
                            lineHeight: 1.4,
                          }}
                        >
                          {stage.desc}
                        </div>

                        {/* Inline download action button at label stage */}
                        {stage.key === 'LABEL_GENERATED' && ret.labelUrl && isCompleted && (
                          <div style={{ marginTop: '10px' }}>
                            <a
                              href={ret.labelUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ textDecoration: 'none' }}
                            >
                              <Button size="sm" variant="primary" icon={Download}>
                                Download Printable Label (PDF)
                              </Button>
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Quick Help Footer */}
          <div
            style={{
              padding: '16px',
              textAlign: 'center',
              fontSize: '12px',
              color: 'var(--color-text-muted)',
            }}
          >
            Have questions about this return? Contact merchant support with reference number{' '}
            <strong style={{ color: 'var(--color-text-primary)' }}>{ret.returnNumber}</strong>.
          </div>
        </div>
      </main>
    </div>
  );
}
