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

  // Step 2: Item selection & reason
  const [selectedItems, setSelectedItems] = useState({});
  const [reason, setReason] = useState('DEFECTIVE');
  const [customerNote, setCustomerNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [createdReturn, setCreatedReturn] = useState(null);

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

      setCreatedReturn(res.return);
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit return request');
    } finally {
      setSubmitting(false);
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

              <div style={{ maxWidth: '520px', margin: '0 auto 28px', textAlign: 'left' }}>
                <PhotoUpload returnId={createdReturn._id} />
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
                  style={{ width: '100%', height: '42px' }}
                  icon={ArrowRight}
                >
                  Submit Return Request
                </Button>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
