'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Package,
  Search,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  Camera,
  Upload,
  X,
  Trash2,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';
import { apiFetch } from '../../../lib/api-client.js';
import { RETURN_REASONS } from '../../../lib/validators/return.schema.js';
import { Card } from '../../../components/ui/Card.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Input } from '../../../components/ui/Input.jsx';
import { PhotoUpload } from '../../../components/returns/PhotoUpload.jsx';

export default function NewReturnPortalPage() {
  const router = useRouter();

  // Step 1: Order verification
  const [orderNumber, setOrderNumber] = useState('ORD-9021');
  const [customerEmail, setCustomerEmail] = useState('customer@example.com');
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [eligibilityData, setEligibilityData] = useState(null);
  const [eligibilityError, setEligibilityError] = useState(null);

  // Step 2: Item selection, reason & photo evidence
  const [selectedItems, setSelectedItems] = useState({});
  const [reason, setReason] = useState('DEFECTIVE');
  const [customerNote, setCustomerNote] = useState('');
  const [photoFiles, setPhotoFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [submitError, setSubmitError] = useState(null);
  const [createdReturn, setCreatedReturn] = useState(null);

  const handleAddPhotos = (e) => {
    const files = Array.from(e.target.files || []);
    const valid = [];
    for (const f of files) {
      if (f.size > 5 * 1024 * 1024) {
        setSubmitError(`File "${f.name}" exceeds 5MB limit.`);
        continue;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) {
        setSubmitError(`File "${f.name}" is not a supported format (JPG, PNG, WebP).`);
        continue;
      }
      valid.push({
        file: f,
        previewUrl: URL.createObjectURL(f),
      });
    }
    setPhotoFiles((prev) => [...prev, ...valid]);
  };

  const handleRemovePhoto = (index) => {
    setPhotoFiles((prev) => {
      const target = prev[index];
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleCheckEligibility = async (e) => {
    e.preventDefault();
    setCheckingEligibility(true);
    setEligibilityError(null);
    setEligibilityData(null);

    try {
      const data = await apiFetch(
        `/orders/eligibility/${orderNumber.trim()}?email=${encodeURIComponent(customerEmail.trim())}`
      );

      if (!data.isEligible) {
        setEligibilityError(data.reason || 'This order is not eligible for return.');
      } else {
        setEligibilityData(data);
        // Pre-select first item
        if (data.eligibleItems?.length > 0) {
          setSelectedItems({
            [data.eligibleItems[0].sku]: {
              ...data.eligibleItems[0],
              returnQuantity: 1,
            },
          });
        }
      }
    } catch (err) {
      setEligibilityError(err.message || 'Could not verify order eligibility.');
    } finally {
      setCheckingEligibility(false);
    }
  };

  const toggleItem = (item) => {
    setSelectedItems((prev) => {
      const next = { ...prev };
      if (next[item.sku]) {
        delete next[item.sku];
      } else {
        next[item.sku] = { ...item, returnQuantity: 1 };
      }
      return next;
    });
  };

  const handleSubmitReturn = async (e) => {
    e.preventDefault();
    const itemsToReturn = Object.values(selectedItems).map((i) => ({
      sku: i.sku,
      name: i.name,
      price: i.price,
      quantity: i.returnQuantity || 1,
      reason,
    }));

    if (itemsToReturn.length === 0) {
      setSubmitError('Please select at least one item to return');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setUploadStatusText('Creating return request...');

    try {
      const payload = {
        orderNumber: eligibilityData.orderNumber,
        customerEmail: eligibilityData.customerEmail,
        customerName: eligibilityData.customerName,
        reason,
        items: itemsToReturn,
        customerNote,
      };

      const res = await apiFetch('/returns', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const ret = res.return;

      // Upload any pre-selected photos to the created return
      if (photoFiles.length > 0) {
        setUploadStatusText(`Uploading ${photoFiles.length} photo evidence image(s)...`);
        for (let i = 0; i < photoFiles.length; i++) {
          const { file } = photoFiles[i];
          const formData = new FormData();
          formData.append('file', file);
          try {
            await apiFetch(`/returns/${ret._id}/photos`, {
              method: 'POST',
              body: formData,
            });
          } catch (uploadErr) {
            console.error('Evidence photo upload error:', uploadErr);
          }
        }
      }

      setCreatedReturn(ret);
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit return request');
    } finally {
      setSubmitting(false);
      setUploadStatusText('');
    }
  };

  return (
    <div style={{ minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-bg-subtle)' }}>
      {/* Design System Header (§17 & §3.1) */}
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
            <span
              style={{
                fontSize: '18px',
                fontWeight: 500,
                letterSpacing: '-0.01em',
                color: 'var(--color-text-primary)',
              }}
            >
              Return<span style={{ color: 'var(--color-primary)' }}>Flow</span>
            </span>
          </div>

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
            Customer Returns Portal
          </span>
        </div>

        <Link href="/dashboard">
          <Button variant="secondary" size="sm">
            Merchant Console
          </Button>
        </Link>
      </header>

      {/* Main Container */}
      <main style={{ flex: 1, padding: '48px 24px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: '640px' }}>
          {createdReturn ? (
            /* Success State */
            <div
              style={{
                backgroundColor: 'var(--color-bg)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: '12px',
                padding: '48px 32px',
                textAlign: 'center',
                boxShadow: '0 2px 12px rgba(25, 52, 56, 0.04)',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-success-soft)',
                  color: 'var(--color-success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                }}
              >
                <CheckCircle2 size={32} />
              </div>
              <h2
                style={{
                  fontSize: '24px',
                  fontWeight: 500,
                  color: 'var(--color-text-primary)',
                  letterSpacing: '-0.02em',
                  marginBottom: '8px',
                }}
              >
                Return Request Submitted
              </h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
                Your request has entered the automated review pipeline.
              </p>
              <div
                style={{
                  display: 'inline-block',
                  padding: '10px 20px',
                  backgroundColor: 'var(--color-bg-muted)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: '8px',
                  fontSize: '18px',
                  fontWeight: 500,
                  color: 'var(--color-primary)',
                  marginBottom: '28px',
                }}
              >
                {createdReturn.returnNumber}
              </div>

              {/* Summary of submitted request & photos */}
              <div
                style={{
                  maxWidth: '520px',
                  margin: '0 auto 28px',
                  textAlign: 'left',
                  backgroundColor: 'var(--color-bg-muted)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: '10px',
                  padding: '16px 20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    Submission Summary
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(234, 179, 8, 0.1)',
                      color: '#b45309',
                      fontWeight: 600,
                    }}
                  >
                    PENDING REVIEW
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                  <div>Order: <strong>{createdReturn.orderNumber}</strong></div>
                  <div>Estimated Refund: <strong>${createdReturn.refundAmount?.toFixed(2) || '0.00'}</strong></div>
                  <div>Items Claimed: <strong>{createdReturn.items?.length || 1} item(s)</strong></div>
                  {photoFiles.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', color: '#059669', fontWeight: 500 }}>
                      <CheckCircle2 size={14} />
                      <span>{photoFiles.length} condition photo(s) securely attached and sent to merchant</span>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <Link href={`/returns/${createdReturn._id}`}>
                  <Button variant="primary">Track Return Status</Button>
                </Link>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setCreatedReturn(null);
                    setEligibilityData(null);
                  }}
                >
                  Submit Another Return
                </Button>
              </div>
            </div>
          ) : !eligibilityData ? (
            /* Step 1: Lookup Order */
            <div className="animate-fade-in">
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <h1
                  style={{
                    fontSize: '28px',
                    fontWeight: 500,
                    letterSpacing: '-0.02em',
                    color: 'var(--color-text-primary)',
                    marginBottom: '8px',
                  }}
                >
                  Start a Return or Exchange
                </h1>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                  Enter your order number and customer email to check return eligibility.
                </p>
              </div>

              <div
                style={{
                  backgroundColor: 'var(--color-bg)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: '12px',
                  padding: '32px',
                  boxShadow: '0 2px 12px rgba(25, 52, 56, 0.04)',
                }}
              >
                <form onSubmit={handleCheckEligibility}>
                  <Input
                    id="order-num"
                    label="Order Number"
                    placeholder="e.g. ORD-9021"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    required
                  />

                  <Input
                    id="order-email"
                    label="Customer Email"
                    type="email"
                    placeholder="e.g. customer@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    required
                  />

                  {eligibilityError && (
                    <div
                      style={{
                        padding: '12px 14px',
                        backgroundColor: 'var(--color-error-soft)',
                        border: '1px solid var(--color-error)',
                        borderRadius: '8px',
                        color: 'var(--color-error)',
                        fontSize: '13px',
                        marginBottom: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <AlertTriangle size={16} />
                      <span>{eligibilityError}</span>
                    </div>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    loading={checkingEligibility}
                    style={{ width: '100%', height: '42px', marginTop: '8px' }}
                    icon={Search}
                  >
                    Check Return Eligibility
                  </Button>
                </form>
              </div>
            </div>
          ) : (
            /* Step 2: Select Items & Reasons */
            <div className="animate-fade-in">
              <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '22px', fontWeight: 500, color: 'var(--color-text-primary)', letterSpacing: '-0.01em' }}>
                    Select Items to Return
                  </h2>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', marginTop: '2px' }}>
                    Order: <strong style={{ color: 'var(--color-text-primary)' }}>{eligibilityData.orderNumber}</strong> ({eligibilityData.customerName})
                  </p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => setEligibilityData(null)}>
                  Change Order
                </Button>
              </div>

              <form onSubmit={handleSubmitReturn}>
                <div
                  style={{
                    backgroundColor: 'var(--color-bg)',
                    border: '1px solid var(--color-border-subtle)',
                    borderRadius: '12px',
                    padding: '24px',
                    marginBottom: '20px',
                    boxShadow: '0 2px 12px rgba(25, 52, 56, 0.04)',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {eligibilityData.eligibleItems.map((item) => {
                      const isSelected = !!selectedItems[item.sku];
                      return (
                        <div
                          key={item.sku}
                          onClick={() => toggleItem(item)}
                          style={{
                            padding: '14px 16px',
                            borderRadius: '8px',
                            border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border-subtle)'}`,
                            backgroundColor: isSelected ? 'var(--color-accent-soft)' : 'var(--color-bg)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div
                              style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '4px',
                                border: `1.5px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border-strong)'}`,
                                backgroundColor: isSelected ? 'var(--color-primary)' : 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              {isSelected && <CheckCircle2 size={13} color="#ffffff" />}
                            </div>
                            <div>
                              <div style={{ fontWeight: 500, fontSize: '14px', color: 'var(--color-text-primary)' }}>{item.name}</div>
                              <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>
                                SKU: {item.sku} • Purchased: {item.quantity}
                              </div>
                            </div>
                          </div>
                          <div style={{ fontWeight: 500, fontSize: '14px', color: 'var(--color-text-primary)' }}>
                            ${item.price.toFixed(2)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Return Reason Selection */}
                <div
                  style={{
                    backgroundColor: 'var(--color-bg)',
                    border: '1px solid var(--color-border-subtle)',
                    borderRadius: '12px',
                    padding: '24px',
                    marginBottom: '20px',
                    boxShadow: '0 2px 12px rgba(25, 52, 56, 0.04)',
                  }}
                >
                  <div className="form-group">
                    <label className="form-label" htmlFor="return-reason">
                      Reason for Return
                    </label>
                    <select
                      id="return-reason"
                      className="form-select"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    >
                      {RETURN_REASONS.map((r) => (
                        <option key={r} value={r}>
                          {r.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="customer-note">
                      Additional Comments / Notes (Optional)
                    </label>
                    <textarea
                      id="customer-note"
                      className="form-textarea"
                      rows={3}
                      placeholder="Please describe any issues or condition of the item..."
                      value={customerNote}
                      onChange={(e) => setCustomerNote(e.target.value)}
                    />
                  </div>
                </div>

                {/* Photo Evidence Section (Before submitting return request) */}
                <div
                  style={{
                    backgroundColor: 'var(--color-bg)',
                    border: '1px solid var(--color-border-subtle)',
                    borderRadius: '12px',
                    padding: '24px',
                    marginBottom: '20px',
                    boxShadow: '0 2px 12px rgba(25, 52, 56, 0.04)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Camera size={18} color="var(--color-primary)" />
                      <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        Photo Evidence & Item Condition
                      </h3>
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: 'var(--color-bg-muted)',
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      Optional
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
                    Upload clear photos of the item, tags, or damage to speed up merchant review and approval (JPG, PNG, WebP up to 5MB).
                  </p>

                  {/* Previews if any */}
                  {photoFiles.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                      {photoFiles.map((item, idx) => (
                        <div
                          key={idx}
                          style={{
                            position: 'relative',
                            width: '100%',
                            aspectRatio: '1',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            border: '1px solid var(--color-border-subtle)',
                            backgroundColor: 'var(--color-bg-muted)',
                          }}
                        >
                          <img
                            src={item.previewUrl}
                            alt={`Evidence preview ${idx + 1}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(idx)}
                            style={{
                              position: 'absolute',
                              top: '4px',
                              right: '4px',
                              width: '22px',
                              height: '22px',
                              borderRadius: '50%',
                              backgroundColor: 'rgba(0,0,0,0.6)',
                              color: '#ffffff',
                              border: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                            }}
                            title="Remove photo"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Photos Button / Input */}
                  <label
                    style={{
                      border: '1.5px dashed var(--color-border-subtle)',
                      borderRadius: '8px',
                      padding: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                      backgroundColor: 'var(--color-bg-muted)',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <Upload size={18} color="var(--color-primary)" />
                    <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                      {photoFiles.length > 0 ? 'Add More Photos' : 'Click to Upload Condition Photos'}
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={handleAddPhotos}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>

                {submitError && (
                  <div
                    style={{
                      padding: '12px 14px',
                      backgroundColor: 'var(--color-error-soft)',
                      border: '1px solid var(--color-error)',
                      borderRadius: '8px',
                      color: 'var(--color-error)',
                      fontSize: '13px',
                      marginBottom: '20px',
                    }}
                  >
                    {submitError}
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  loading={submitting}
                  style={{ width: '100%', height: '44px' }}
                  icon={submitting ? Loader2 : ArrowRight}
                >
                  {uploadStatusText || 'Submit Return Request'}
                </Button>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
