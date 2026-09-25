'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import {
  ArrowLeft,
  Calendar,
  Mail,
  User,
  ShoppingBag,
  FileText,
  DollarSign,
  Camera,
  History,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { fetchReturnById } from '../../../features/returns/returnsSlice.js';
import { Navbar } from '../../../components/layout/Navbar.jsx';
import { Sidebar } from '../../../components/layout/Sidebar.jsx';
import { Card } from '../../../components/ui/Card.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { ReturnStatusBadge } from '../../../components/returns/ReturnStatusBadge.jsx';
import { StateMachineVisualizer } from '../../../components/returns/StateMachineVisualizer.jsx';
import { ApproveButton } from '../../../components/returns/ApproveButton.jsx';
import { RejectModal } from '../../../components/returns/RejectModal.jsx';
import { ReceiveButton } from '../../../components/returns/ReceiveButton.jsx';
import { RefundButton } from '../../../components/returns/RefundButton.jsx';

export default function ReturnDetailPage() {
  const { returnId } = useParams();
  const dispatch = useDispatch();
  const { selectedReturn, loading, error } = useSelector((state) => state.returns);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);

  useEffect(() => {
    if (returnId) {
      dispatch(fetchReturnById(returnId));
    }
  }, [dispatch, returnId]);

  if (loading && !selectedReturn) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', minHeight: '100vh' }}>
        <Navbar />
        <div style={{ display: 'flex', flex: 1 }}>
          <Sidebar />
          <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ color: 'var(--text-muted)' }}>Loading return request details...</div>
          </main>
        </div>
      </div>
    );
  }

  if (error || !selectedReturn) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', minHeight: '100vh' }}>
        <Navbar />
        <div style={{ display: 'flex', flex: 1 }}>
          <Sidebar />
          <main className="main-content">
            <div className="page-wrapper">
              <Card style={{ textAlign: 'center', padding: '3rem' }}>
                <h3 style={{ color: 'var(--accent-rose)', marginBottom: '0.5rem' }}>Error Loading Return</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  {error || 'Return request not found'}
                </p>
                <Link href="/returns">
                  <Button variant="secondary" icon={ArrowLeft}>
                    Back to Queue
                  </Button>
                </Link>
              </Card>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const ret = selectedReturn;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <Navbar />
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar />
        <main className="main-content">
          <div className="page-wrapper animate-fade-in">
            {/* Top Navigation & Actions Bar */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Link href="/returns">
                  <button
                    style={{
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-secondary)',
                      padding: '0.5rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ArrowLeft size={18} />
                  </button>
                </Link>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <h1 className="title-display" style={{ fontSize: '1.75rem' }}>
                      {ret.returnNumber}
                    </h1>
                    <ReturnStatusBadge status={ret.status} />
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Order Ref: <strong>{ret.orderNumber}</strong> • Created{' '}
                    {new Date(ret.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* State Machine Transition Actions */}
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                {ret.status === 'PENDING_REVIEW' && (
                  <>
                    <Button
                      variant="danger"
                      icon={XCircle}
                      onClick={() => setRejectModalOpen(true)}
                    >
                      Reject
                    </Button>
                    <ApproveButton returnId={ret._id} />
                  </>
                )}

                {(ret.status === 'LABEL_GENERATED' || ret.status === 'IN_TRANSIT') && (
                  <ReceiveButton returnId={ret._id} />
                )}

                {ret.status === 'RECEIVED' && (
                  <RefundButton returnId={ret._id} amount={ret.refundAmount} />
                )}

                {ret.status === 'REFUNDED' && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: '#10b981',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                    }}
                  >
                    <CheckCircle size={18} />
                    <span>Refund Completed</span>
                  </div>
                )}
              </div>
            </div>

            {/* State Machine Visualizer */}
            <StateMachineVisualizer
              currentStatus={ret.status}
              rejectionReason={ret.rejectionReason}
            />

            {/* Main Content Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
              {/* Left Column: Items, Customer Note, Evidence */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Returned Items Card */}
                <Card padding="0">
                  <div
                    style={{
                      padding: '1.25rem 1.5rem',
                      borderBottom: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <ShoppingBag size={18} color="var(--primary)" />
                    <h3 className="title-display" style={{ fontSize: '1rem' }}>
                      Items Claimed for Return ({ret.items?.length || 0})
                    </h3>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left' }}>Item & SKU</th>
                        <th style={{ padding: '0.75rem 1.5rem', textAlign: 'center' }}>Qty</th>
                        <th style={{ padding: '0.75rem 1.5rem', textAlign: 'right' }}>Price</th>
                        <th style={{ padding: '0.75rem 1.5rem', textAlign: 'right' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ret.items?.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '1rem 1.5rem' }}>
                            <div style={{ fontWeight: 600 }}>{item.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              SKU: {item.sku}
                            </div>
                          </td>
                          <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                            {item.quantity}
                          </td>
                          <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                            ${item.price?.toFixed(2)}
                          </td>
                          <td style={{ padding: '1rem 1.5rem', textAlign: 'right', fontWeight: 600 }}>
                            ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={3} style={{ padding: '1rem 1.5rem', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          Total Estimated Refund:
                        </td>
                        <td style={{ padding: '1rem 1.5rem', textAlign: 'right', fontWeight: 800, fontSize: '1.125rem', color: 'var(--accent-emerald)' }}>
                          ${ret.refundAmount?.toFixed(2) || '0.00'}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </Card>

                {/* Customer Reason & Notes */}
                <Card>
                  <h3 className="title-display" style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={18} color="var(--primary)" />
                    Return Reason & Customer Comments
                  </h3>
                  <div style={{ backgroundColor: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                      Primary Reason Category
                    </div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#818cf8' }}>
                      {ret.reason}
                    </div>
                  </div>
                  {ret.customerNote && (
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                        Customer Statement:
                      </div>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                        "{ret.customerNote}"
                      </p>
                    </div>
                  )}
                </Card>

                {/* Return Evidence Photos */}
                {ret.evidencePhotos && ret.evidencePhotos.length > 0 && (
                  <Card>
                    <h3 className="title-display" style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Camera size={18} color="var(--primary)" />
                      Uploaded Return Evidence (S3 Private Objects)
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem' }}>
                      {ret.evidencePhotos.map((photoKey, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '1rem',
                            backgroundColor: 'var(--bg-surface-elevated)',
                            borderRadius: '8px',
                            border: '1px solid var(--border-subtle)',
                            textAlign: 'center',
                          }}
                        >
                          <Camera size={24} color="var(--text-muted)" style={{ margin: '0 auto 0.5rem' }} />
                          <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', wordBreak: 'break-all' }}>
                            {photoKey}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>

              {/* Right Column: Customer Details & Timeline */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Customer Details */}
                <Card>
                  <h3 className="title-display" style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <User size={18} color="var(--primary)" />
                    Customer Details
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Name</span>
                      <span style={{ fontWeight: 600 }}>{ret.customerName}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Email</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{ret.customerEmail}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Order Number</span>
                      <span style={{ color: '#818cf8', fontWeight: 600 }}>{ret.orderNumber}</span>
                    </div>
                    {ret.labelKey && (
                      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Shipping Label</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', wordBreak: 'break-all' }}>
                          {ret.labelKey}
                        </span>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Audit Timeline */}
                <Card>
                  <h3 className="title-display" style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <History size={18} color="var(--primary)" />
                    State Machine Audit Log
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {ret.timeline?.map((event, idx) => (
                      <div
                        key={idx}
                        style={{
                          position: 'relative',
                          paddingLeft: '1.25rem',
                          borderLeft: '2px solid var(--border-subtle)',
                        }}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            left: '-5px',
                            top: '4px',
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--primary)',
                          }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {event.status}
                          </span>
                          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                            {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {event.note && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                            {event.note}
                          </div>
                        )}
                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                          By: {event.actor}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>

            {/* Rejection Modal Dialog */}
            <RejectModal
              isOpen={rejectModalOpen}
              onClose={() => setRejectModalOpen(false)}
              returnId={ret._id}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
