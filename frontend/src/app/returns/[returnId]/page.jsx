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
import { StepFunctionsVisualizer } from '../../../components/returns/StepFunctionsVisualizer.jsx';
import { ApproveButton } from '../../../components/returns/ApproveButton.jsx';
import { RejectModal } from '../../../components/returns/RejectModal.jsx';
import { ReceiveButton } from '../../../components/returns/ReceiveButton.jsx';
import { RefundButton } from '../../../components/returns/RefundButton.jsx';
import { LabelDownloadButton } from '../../../components/returns/LabelDownloadButton.jsx';
import { PhotoUpload } from '../../../components/returns/PhotoUpload.jsx';

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
            <div style={{ color: 'var(--color-text-muted)' }}>Loading return request details...</div>
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
                <h3 style={{ color: 'var(--color-error)', marginBottom: '0.5rem' }}>Error Loading Return</h3>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
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
                      background: 'var(--color-bg-muted)',
                      border: '1px solid var(--color-border-subtle)',
                      color: 'var(--color-text-secondary)',
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
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                    Order Ref: <strong>{ret.orderNumber}</strong> • Created{' '}
                    {new Date(ret.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* State Machine Transition Actions */}
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                {['PENDING_REVIEW', 'APPROVED', 'LABEL_GENERATED', 'RECEIVED'].includes(ret.status) && (
                  <>
                    <Button
                      variant="danger"
                      icon={XCircle}
                      onClick={() => setRejectModalOpen(true)}
                    >
                      Reject
                    </Button>
                    {ret.status === 'PENDING_REVIEW' && (
                      <ApproveButton returnId={ret._id} />
                    )}
                  </>
                )}

                {(ret.status === 'LABEL_GENERATED' || ret.status === 'IN_TRANSIT') && (
                  <ReceiveButton returnId={ret._id} />
                )}

                {ret.status === 'RECEIVED' && (
                  <RefundButton returnId={ret._id} amount={ret.refundAmount} />
                )}

                {ret.labelKey && (
                  <LabelDownloadButton returnId={ret._id} labelKey={ret.labelKey} />
                )}

                {ret.status === 'REFUNDED' && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: '#10b981',
                      fontWeight: 500,
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

            {/* Step Functions Sub-flow Visualizer (§1.6) */}
            <StepFunctionsVisualizer status={ret.status} />

            {/* Main Content Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
              {/* Left Column: Items, Customer Note, Evidence */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Returned Items Card */}
                <Card padding="0">
                  <div
                    style={{
                      padding: '1.25rem 1.5rem',
                      borderBottom: '1px solid var(--color-border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <ShoppingBag size={18} color="var(--color-primary)" />
                    <h3 className="title-display" style={{ fontSize: '1rem' }}>
                      Items Claimed for Return ({ret.items?.length || 0})
                    </h3>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--color-border-subtle)', color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                        <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left' }}>Item & SKU</th>
                        <th style={{ padding: '0.75rem 1.5rem', textAlign: 'center' }}>Qty</th>
                        <th style={{ padding: '0.75rem 1.5rem', textAlign: 'right' }}>Price</th>
                        <th style={{ padding: '0.75rem 1.5rem', textAlign: 'right' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ret.items?.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                          <td style={{ padding: '1rem 1.5rem' }}>
                            <div style={{ fontWeight: 500 }}>{item.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                              SKU: {item.sku}
                            </div>
                          </td>
                          <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                            {item.quantity}
                          </td>
                          <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                            ${item.price?.toFixed(2)}
                          </td>
                          <td style={{ padding: '1rem 1.5rem', textAlign: 'right', fontWeight: 500 }}>
                            ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={3} style={{ padding: '1rem 1.5rem', textAlign: 'right', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                          Total Estimated Refund:
                        </td>
                        <td style={{ padding: '1rem 1.5rem', textAlign: 'right', fontWeight: 500, fontSize: '1.125rem', color: 'var(--color-success)' }}>
                          ${ret.refundAmount?.toFixed(2) || '0.00'}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </Card>

                {/* Customer Reason & Notes */}
                <Card>
                  <h3 className="title-display" style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={18} color="var(--color-primary)" />
                    Return Reason & Customer Comments
                  </h3>
                  <div style={{ backgroundColor: 'var(--color-bg-muted)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                      Primary Reason Category
                    </div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 500, color: '#818cf8' }}>
                      {ret.reason}
                    </div>
                  </div>
                  {ret.customerNote && (
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                        Customer Statement:
                      </div>
                      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
                        "{ret.customerNote}"
                      </p>
                    </div>
                  )}
                </Card>

                {/* Return Evidence Photos */}
                <Card>
                  <h3 className="title-display" style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Camera size={18} color="var(--color-primary)" />
                    Uploaded Return Evidence (S3 Private Objects)
                  </h3>
                  {ret.evidencePhotos && ret.evidencePhotos.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                      {ret.evidencePhotos.map((photoKey, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '1rem',
                            backgroundColor: 'var(--color-bg-muted)',
                            borderRadius: '8px',
                            border: '1px solid var(--color-border-subtle)',
                            textAlign: 'center',
                          }}
                        >
                          <Camera size={24} color="var(--color-text-muted)" style={{ margin: '0 auto 0.5rem' }} />
                          <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', wordBreak: 'break-all' }}>
                            {photoKey}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                      No photo evidence uploaded yet.
                    </p>
                  )}
                  {ret.status === 'PENDING_REVIEW' && (
                    <PhotoUpload
                      returnId={ret._id}
                      onUploadSuccess={() => dispatch(fetchReturnById(returnId))}
                    />
                  )}
                </Card>
              </div>

              {/* Right Column: Customer Details & Timeline */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Customer Details */}
                <Card>
                  <h3 className="title-display" style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <User size={18} color="var(--color-primary)" />
                    Customer Details
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
                    <div>
                      <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.75rem' }}>Name</span>
                      <span style={{ fontWeight: 500 }}>{ret.customerName}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.75rem' }}>Email</span>
                      <span style={{ color: 'var(--color-text-secondary)' }}>{ret.customerEmail}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.75rem' }}>Order Number</span>
                      <span style={{ color: '#818cf8', fontWeight: 500 }}>{ret.orderNumber}</span>
                    </div>
                    {ret.labelKey && (
                      <div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div>
                          <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.75rem' }}>Shipping Label (S3 Object)</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-info)', wordBreak: 'break-all' }}>
                            {ret.labelKey}
                          </span>
                        </div>
                        <LabelDownloadButton returnId={ret._id} labelKey={ret.labelKey} />
                      </div>
                    )}
                  </div>
                </Card>

                {/* Audit Timeline */}
                <Card>
                  <h3 className="title-display" style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <History size={18} color="var(--color-primary)" />
                    State Machine Audit Log
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {ret.timeline?.map((event, idx) => (
                      <div
                        key={idx}
                        style={{
                          position: 'relative',
                          paddingLeft: '1.25rem',
                          borderLeft: '2px solid var(--color-border-subtle)',
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
                            backgroundColor: 'var(--color-primary)',
                          }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                            {event.status}
                          </span>
                          <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                            {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {event.note && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
                            {event.note}
                          </div>
                        )}
                        <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
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
