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
  Upload,
} from 'lucide-react';
import { apiFetch } from '../../../lib/api-client.js';
import { RETURN_REASONS } from '../../../lib/validators/return.schema.js';
import { Card } from '../../../components/ui/Card.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Input } from '../../../components/ui/Input.jsx';

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
    <div style={{ minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header
        style={{
          height: '68px',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 2rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
            }}
          >
            <RefreshCw size={18} />
          </div>
          <span className="title-display" style={{ fontSize: '1.25rem', fontWeight: 700 }}>
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
      <main style={{ flex: 1, padding: '3rem 1.5rem', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: '720px' }}>
          {createdReturn ? (
            /* Success State */
            <Card elevated style={{ textAlign: 'center', padding: '3rem 2rem' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  color: 'var(--accent-emerald)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem',
                }}
              >
                <CheckCircle2 size={36} />
              </div>
              <h2 className="title-display" style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>
                Return Request Submitted!
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                Your request has entered the review pipeline. Tracking ID:
              </p>
              <div
                style={{
                  display: 'inline-block',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: '#818cf8',
                  marginBottom: '2rem',
                }}
              >
                {createdReturn.returnNumber}
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
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
            </Card>
          ) : !eligibilityData ? (
            /* Step 1: Lookup Order */
            <div className="animate-fade-in">
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h1 className="title-display gradient-text" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                  Start a Return or Exchange
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
                  Enter your order number and customer email to check return eligibility.
                </p>
              </div>

              <Card elevated padding="2rem">
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
                        padding: '0.85rem 1rem',
                        backgroundColor: 'rgba(244, 63, 94, 0.12)',
                        border: '1px solid rgba(244, 63, 94, 0.3)',
                        borderRadius: '8px',
                        color: 'var(--accent-rose)',
                        fontSize: '0.8125rem',
                        marginBottom: '1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
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
                    style={{ width: '100%' }}
                    icon={Search}
                  >
                    Check Return Eligibility
                  </Button>
                </form>
              </Card>
            </div>
          ) : (
            /* Step 2: Select Items & Reasons */
            <div className="animate-fade-in">
              <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 className="title-display" style={{ fontSize: '1.5rem' }}>
                    Select Items to Return
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    Order: <strong>{eligibilityData.orderNumber}</strong> ({eligibilityData.customerName})
                  </p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => setEligibilityData(null)}>
                  Change Order
                </Button>
              </div>

              <form onSubmit={handleSubmitReturn}>
                <Card style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {eligibilityData.eligibleItems.map((item) => {
                      const isSelected = !!selectedItems[item.sku];
                      return (
                        <div
                          key={item.sku}
                          onClick={() => toggleItem(item)}
                          style={{
                            padding: '1rem',
                            borderRadius: '8px',
                            border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-subtle)'}`,
                            backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-surface-elevated)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div
                              style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '4px',
                                border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--text-muted)'}`,
                                backgroundColor: isSelected ? 'var(--primary)' : 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              {isSelected && <CheckCircle2 size={14} color="#ffffff" />}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600 }}>{item.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                SKU: {item.sku} • Purchased: {item.quantity}
                              </div>
                            </div>
                          </div>
                          <div style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>
                            ${item.price.toFixed(2)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                {/* Return Reason Selection */}
                <Card style={{ marginBottom: '1.5rem' }}>
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
                        <option key={r} value={r} style={{ backgroundColor: '#0f172a' }}>
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
                </Card>

                {submitError && (
                  <div
                    style={{
                      padding: '0.85rem 1rem',
                      backgroundColor: 'rgba(244, 63, 94, 0.12)',
                      border: '1px solid rgba(244, 63, 94, 0.3)',
                      borderRadius: '8px',
                      color: 'var(--accent-rose)',
                      fontSize: '0.8125rem',
                      marginBottom: '1.25rem',
                    }}
                  >
                    {submitError}
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  loading={submitting}
                  style={{ width: '100%' }}
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
