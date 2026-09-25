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
                marginBottom: '2rem',
              }}
            >
              <div>
                <h1 className="title-display gradient-text" style={{ fontSize: '2rem' }}>
                  Reverse Logistics Dashboard
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginTop: '0.25rem' }}>
                  Real-time return requests, lifecycle state transitions, and refund management
                </p>
              </div>

              <Link href="/returns">
                <Button variant="secondary" icon={Inbox}>
                  View All Returns ({metrics.total || 0})
                </Button>
              </Link>
            </div>

            {/* Metric KPI Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1.25rem',
                marginBottom: '2rem',
              }}
            >
              <Card className="metric-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    Needs Review
                  </span>
                  <div
                    style={{
                      padding: '0.5rem',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(245, 158, 11, 0.15)',
                      color: 'var(--accent-amber)',
                    }}
                  >
                    <Clock size={18} />
                  </div>
                </div>
                <div className="title-display" style={{ fontSize: '2rem', fontWeight: 800 }}>
                  {metrics.PENDING_REVIEW || 0}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-amber)' }}>
                  Awaiting merchant approval
                </span>
              </Card>

              <Card className="metric-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    Active In Transit
                  </span>
                  <div
                    style={{
                      padding: '0.5rem',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(6, 182, 212, 0.15)',
                      color: 'var(--accent-cyan)',
                    }}
                  >
                    <Package size={18} />
                  </div>
                </div>
                <div className="title-display" style={{ fontSize: '2rem', fontWeight: 800 }}>
                  {activeInTransit}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Labels printed & carrier transit
                </span>
              </Card>

              <Card className="metric-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    Warehouse Received
                  </span>
                  <div
                    style={{
                      padding: '0.5rem',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      color: 'var(--accent-emerald)',
                    }}
                  >
                    <CheckCircle2 size={18} />
                  </div>
                </div>
                <div className="title-display" style={{ fontSize: '2rem', fontWeight: 800 }}>
                  {metrics.RECEIVED || 0}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)' }}>
                  Items inspected, ready for refund
                </span>
              </Card>

              <Card className="metric-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    Total Refunded
                  </span>
                  <div
                    style={{
                      padding: '0.5rem',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(99, 102, 241, 0.15)',
                      color: '#818cf8',
                    }}
                  >
                    <DollarSign size={18} />
                  </div>
                </div>
                <div className="title-display" style={{ fontSize: '2rem', fontWeight: 800 }}>
                  ${(metrics.totalRefundedAmount || 0).toFixed(2)}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {metrics.REFUNDED || 0} completed return cycles
                </span>
              </Card>
            </div>

            {/* State Machine Overview Banner */}
            <Card
              style={{
                marginBottom: '2rem',
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <TrendingUp size={20} color="#818cf8" />
                <h3 className="title-display" style={{ fontSize: '1.125rem' }}>
                  Reverse Logistics State Machine Pipeline
                </h3>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  overflowX: 'auto',
                  paddingBottom: '0.5rem',
                  fontSize: '0.8125rem',
                }}
              >
                <span style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontWeight: 600 }}>
                  PENDING_REVIEW ({metrics.PENDING_REVIEW || 0})
                </span>
                <span style={{ color: 'var(--text-muted)' }}>→</span>
                <span style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', fontWeight: 600 }}>
                  APPROVED ({metrics.APPROVED || 0})
                </span>
                <span style={{ color: 'var(--text-muted)' }}>→</span>
                <span style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6', fontWeight: 600 }}>
                  LABEL_GENERATED ({metrics.LABEL_GENERATED || 0})
                </span>
                <span style={{ color: 'var(--text-muted)' }}>→</span>
                <span style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4', fontWeight: 600 }}>
                  IN_TRANSIT ({metrics.IN_TRANSIT || 0})
                </span>
                <span style={{ color: 'var(--text-muted)' }}>→</span>
                <span style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: 600 }}>
                  RECEIVED ({metrics.RECEIVED || 0})
                </span>
                <span style={{ color: 'var(--text-muted)' }}>→</span>
                <span style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', background: 'rgba(5, 150, 105, 0.2)', color: '#10b981', fontWeight: 700 }}>
                  REFUNDED ({metrics.REFUNDED || 0})
                </span>
              </div>
            </Card>

            {/* Recent Returns Table */}
            <Card padding="0">
              <div
                style={{
                  padding: '1.25rem 1.5rem',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <h3 className="title-display" style={{ fontSize: '1.125rem' }}>
                    Recent Return Requests
                  </h3>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
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
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading returns data...
                </div>
              ) : items.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center' }}>
                  <AlertCircle size={32} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem' }} />
                  <p style={{ color: 'var(--text-secondary)' }}>No return requests found.</p>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Run seed script or submit a return through the customer portal.
                  </p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                    <thead>
                      <tr
                        style={{
                          borderBottom: '1px solid var(--border-subtle)',
                          color: 'var(--text-muted)',
                          fontSize: '0.75rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        <th style={{ padding: '0.85rem 1.5rem' }}>Return ID</th>
                        <th style={{ padding: '0.85rem 1.5rem' }}>Order Number</th>
                        <th style={{ padding: '0.85rem 1.5rem' }}>Customer</th>
                        <th style={{ padding: '0.85rem 1.5rem' }}>Items / Reason</th>
                        <th style={{ padding: '0.85rem 1.5rem' }}>Refund Est.</th>
                        <th style={{ padding: '0.85rem 1.5rem' }}>Status</th>
                        <th style={{ padding: '0.85rem 1.5rem', textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((ret) => (
                        <tr
                          key={ret._id}
                          style={{
                            borderBottom: '1px solid var(--border-subtle)',
                            transition: 'background-color 0.15s ease',
                          }}
                        >
                          <td style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {ret.returnNumber}
                          </td>
                          <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)' }}>
                            {ret.orderNumber}
                          </td>
                          <td style={{ padding: '1rem 1.5rem' }}>
                            <div style={{ fontWeight: 500 }}>{ret.customerName}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {ret.customerEmail}
                            </div>
                          </td>
                          <td style={{ padding: '1rem 1.5rem' }}>
                            <div style={{ color: 'var(--text-primary)' }}>
                              {ret.items?.length || 1} item(s)
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {ret.reason}
                            </div>
                          </td>
                          <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>
                            ${ret.refundAmount?.toFixed(2) || '0.00'}
                          </td>
                          <td style={{ padding: '1rem 1.5rem' }}>
                            <ReturnStatusBadge status={ret.status} />
                          </td>
                          <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
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
