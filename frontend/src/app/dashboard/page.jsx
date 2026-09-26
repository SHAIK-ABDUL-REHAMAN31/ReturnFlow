'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import {
  Clock,
  CheckCircle2,
  DollarSign,
  Package,
  ArrowRight,
  TrendingUp,
  Inbox,
  AlertCircle,
} from 'lucide-react';
import { fetchReturns, fetchReturnMetrics } from '../../features/returns/returnsSlice.js';
import { Navbar } from '../../components/layout/Navbar.jsx';
import { Sidebar } from '../../components/layout/Sidebar.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { ReturnStatusBadge } from '../../components/returns/ReturnStatusBadge.jsx';

export default function DashboardPage() {
  const dispatch = useDispatch();
  const { items, metrics, loading } = useSelector((state) => state.returns);

  useEffect(() => {
    dispatch(fetchReturns({ limit: 6 }));
    dispatch(fetchReturnMetrics());
  }, [dispatch]);

  const activeInTransit =
    (metrics.APPROVED || 0) + (metrics.LABEL_GENERATED || 0) + (metrics.IN_TRANSIT || 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <Navbar />
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar />
        <main className="main-content">
          <div className="page-wrapper animate-fade-in">
            {/* Header Section */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '32px',
              }}
            >
              <div>
                <h1 className="title-display" style={{ fontSize: '28px', lineHeight: 1.2 }}>
                  Reverse Logistics Dashboard
                </h1>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginTop: '4px' }}>
                  Real-time return requests, lifecycle state transitions, and refund management
                </p>
              </div>

              <Link href="/returns">
                <Button variant="secondary" icon={Inbox}>
                  View All Returns ({metrics.total || 0})
                </Button>
              </Link>
            </div>

            {/* Metric KPI Cards — §19 */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                gap: '24px',
                marginBottom: '32px',
              }}
            >
              <Card className="metric-card" padding="20px 24px">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 400 }}>
                    Needs Review
                  </span>
                  <div
                    style={{
                      padding: '8px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--color-warning-soft)',
                      color: 'var(--color-warning)',
                    }}
                  >
                    <Clock size={18} strokeWidth={1.75} />
                  </div>
                </div>
                <div style={{ fontSize: '32px', fontWeight: 500, lineHeight: 1.15, color: 'var(--color-text-primary)' }}>
                  {metrics.PENDING_REVIEW || 0}
                </div>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  Awaiting merchant approval
                </span>
              </Card>

              <Card className="metric-card" padding="20px 24px">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 400 }}>
                    Active In Transit
                  </span>
                  <div
                    style={{
                      padding: '8px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--color-info-soft)',
                      color: 'var(--color-info)',
                    }}
                  >
                    <Package size={18} strokeWidth={1.75} />
                  </div>
                </div>
                <div style={{ fontSize: '32px', fontWeight: 500, lineHeight: 1.15, color: 'var(--color-text-primary)' }}>
                  {activeInTransit}
                </div>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  Labels printed &amp; carrier transit
                </span>
              </Card>

              <Card className="metric-card" padding="20px 24px">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 400 }}>
                    Warehouse Received
                  </span>
                  <div
                    style={{
                      padding: '8px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--color-success-soft)',
                      color: 'var(--color-success)',
                    }}
                  >
                    <CheckCircle2 size={18} strokeWidth={1.75} />
                  </div>
                </div>
                <div style={{ fontSize: '32px', fontWeight: 500, lineHeight: 1.15, color: 'var(--color-text-primary)' }}>
                  {metrics.RECEIVED || 0}
                </div>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  Items inspected, ready for refund
                </span>
              </Card>

              <Card className="metric-card" padding="20px 24px">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 400 }}>
                    Total Refunded
                  </span>
                  <div
                    style={{
                      padding: '8px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--color-accent-soft)',
                      color: 'var(--color-text-on-accent)',
                    }}
                  >
                    <DollarSign size={18} strokeWidth={1.75} />
                  </div>
                </div>
                <div style={{ fontSize: '32px', fontWeight: 500, lineHeight: 1.15, color: 'var(--color-text-primary)' }}>
                  ${(metrics.totalRefundedAmount || 0).toFixed(2)}
                </div>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  {metrics.REFUNDED || 0} completed return cycles
                </span>
              </Card>
            </div>

            {/* State Machine Pipeline — §23 */}
            <Card
              style={{
                marginBottom: '32px',
                backgroundColor: 'var(--color-bg-subtle)',
                border: '1px solid var(--color-border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <TrendingUp size={18} color="var(--color-primary)" strokeWidth={1.75} />
                <h3 style={{ fontSize: '16px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                  Reverse Logistics State Machine Pipeline
                </h3>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  overflowX: 'auto',
                  paddingBottom: '4px',
                  fontSize: '13px',
                }}
              >
                <span style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: 'var(--color-warning-soft)', color: 'var(--color-warning)', fontWeight: 500 }}>
                  PENDING_REVIEW ({metrics.PENDING_REVIEW || 0})
                </span>
                <span style={{ color: 'var(--color-text-muted)' }}>→</span>
                <span style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: 'var(--color-info-soft)', color: 'var(--color-info)', fontWeight: 500 }}>
                  APPROVED ({metrics.APPROVED || 0})
                </span>
                <span style={{ color: 'var(--color-text-muted)' }}>→</span>
                <span style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: 'var(--color-info-soft)', color: 'var(--color-info)', fontWeight: 500 }}>
                  LABEL_GENERATED ({metrics.LABEL_GENERATED || 0})
                </span>
                <span style={{ color: 'var(--color-text-muted)' }}>→</span>
                <span style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: 'var(--color-info-soft)', color: 'var(--color-info)', fontWeight: 500 }}>
                  IN_TRANSIT ({metrics.IN_TRANSIT || 0})
                </span>
                <span style={{ color: 'var(--color-text-muted)' }}>→</span>
                <span style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: 'var(--color-success-soft)', color: 'var(--color-success)', fontWeight: 500 }}>
                  RECEIVED ({metrics.RECEIVED || 0})
                </span>
                <span style={{ color: 'var(--color-text-muted)' }}>→</span>
                <span style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: 'var(--color-success-soft)', color: 'var(--color-success)', fontWeight: 500 }}>
                  REFUNDED ({metrics.REFUNDED || 0})
                </span>
              </div>
            </Card>

            {/* Recent Returns Table — §21 */}
            <Card padding="0">
              <div
                style={{
                  padding: '20px 24px',
                  borderBottom: '1px solid var(--color-border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                    Recent Return Requests
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>
                    Incoming customer requests awaiting processing
                  </p>
                </div>
                <Link href="/returns">
                  <Button variant="secondary" size="sm" icon={ArrowRight}>
                    View All
                  </Button>
                </Link>
              </div>

              {loading && items.length === 0 ? (
                <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  Loading returns data...
                </div>
              ) : items.length === 0 ? (
                <div style={{ padding: '48px', textAlign: 'center' }}>
                  <AlertCircle size={32} color="var(--color-text-muted)" style={{ margin: '0 auto 12px' }} />
                  <p style={{ color: 'var(--color-text-secondary)' }}>No return requests found.</p>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    Run seed script or submit a return through the customer portal.
                  </p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                    <thead>
                      <tr
                        style={{
                          backgroundColor: 'var(--color-bg-subtle)',
                          borderBottom: '1px solid var(--color-border-subtle)',
                          color: 'var(--color-text-tertiary)',
                          fontSize: '12px',
                          fontWeight: 500,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        <th style={{ padding: '12px 24px', fontWeight: 500 }}>Return ID</th>
                        <th style={{ padding: '12px 24px', fontWeight: 500 }}>Order Number</th>
                        <th style={{ padding: '12px 24px', fontWeight: 500 }}>Customer</th>
                        <th style={{ padding: '12px 24px', fontWeight: 500 }}>Items / Reason</th>
                        <th style={{ padding: '12px 24px', fontWeight: 500 }}>Refund Est.</th>
                        <th style={{ padding: '12px 24px', fontWeight: 500 }}>Status</th>
                        <th style={{ padding: '12px 24px', textAlign: 'right', fontWeight: 500 }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((ret) => (
                        <tr
                          key={ret._id}
                          style={{
                            borderBottom: '1px solid var(--color-border-subtle)',
                            transition: 'background-color 120ms ease',
                          }}
                        >
                          <td style={{ padding: '16px 24px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                            {ret.returnNumber}
                          </td>
                          <td style={{ padding: '16px 24px', color: 'var(--color-text-secondary)' }}>
                            {ret.orderNumber}
                          </td>
                          <td style={{ padding: '16px 24px' }}>
                            <div style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{ret.customerName}</div>
                            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                              {ret.customerEmail}
                            </div>
                          </td>
                          <td style={{ padding: '16px 24px' }}>
                            <div style={{ color: 'var(--color-text-primary)' }}>
                              {ret.items?.length || 1} item(s)
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                              {ret.reason}
                            </div>
                          </td>
                          <td style={{ padding: '16px 24px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                            ${ret.refundAmount?.toFixed(2) || '0.00'}
                          </td>
                          <td style={{ padding: '16px 24px' }}>
                            <ReturnStatusBadge status={ret.status} />
                          </td>
                          <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                            <Link href={`/returns/${ret._id}`}>
                              <Button variant="secondary" size="sm">
                                Review
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
