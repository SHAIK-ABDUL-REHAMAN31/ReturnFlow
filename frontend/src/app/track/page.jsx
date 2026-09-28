'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Package,
  RefreshCw,
  Search,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { apiFetch } from '../../lib/api-client.js';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { ReturnStatusBadge } from '../../components/returns/ReturnStatusBadge.jsx';

export default function TrackLookupPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!orderNumber.trim() || !customerEmail.trim()) {
      setError('Please provide both your order number and checkout email address.');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const res = await apiFetch('/returns/track/lookup', {
        method: 'POST',
        body: JSON.stringify({
          orderNumber: orderNumber.trim(),
          email: customerEmail.trim(),
        }),
      });

      if (res.returns && res.returns.length > 0) {
        setResults(res.returns);
      } else {
        setError('No return requests were found for the provided order number and email.');
      }
    } catch (err) {
      setError(err.message || 'No return requests were found for the provided order number and email.');
    } finally {
      setLoading(false);
    }
  };

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
      {/* Header */}
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
              <RefreshCw size={18} strokeWidth={1.75} />
            </div>
            <span style={{ fontSize: '18px', fontWeight: 500, letterSpacing: '-0.01em' }}>
              Return<span style={{ color: 'var(--color-primary)' }}>Flow</span>
            </span>
          </div>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/returns/new">
            <Button variant="secondary" size="sm">
              Start a Return
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main
        style={{
          flex: 1,
          padding: '48px 24px',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div style={{ width: '100%', maxWidth: '580px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1
              style={{
                fontSize: '28px',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                letterSpacing: '-0.02em',
                marginBottom: '8px',
              }}
            >
              Track Your Return
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', margin: 0 }}>
              Enter your order number and the email address used during purchase.
            </p>
          </div>

          <Card padding="32px">
            <form onSubmit={handleLookup}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label
                    htmlFor="orderNumber"
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 500,
                      marginBottom: '6px',
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    Order Number
                  </label>
                  <Input
                    id="orderNumber"
                    placeholder="e.g. ORD-9021"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="customerEmail"
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 500,
                      marginBottom: '6px',
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    Checkout Email Address
                  </label>
                  <Input
                    id="customerEmail"
                    type="email"
                    placeholder="e.g. customer@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    required
                  />
                </div>

                {error && (
                  <div
                    style={{
                      padding: '12px 14px',
                      backgroundColor: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      borderRadius: '8px',
                      color: 'var(--color-error)',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <AlertTriangle size={16} />
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  loading={loading}
                  style={{ width: '100%', height: '44px' }}
                  icon={Search}
                >
                  Find My Return
                </Button>
              </div>
            </form>

            {/* Results List */}
            {results && results.length > 0 && (
              <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--color-border-subtle)' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '14px' }}>
                  Matching Return Requests ({results.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {results.map((r) => (
                    <div
                      key={r.returnNumber}
                      style={{
                        padding: '16px',
                        borderRadius: '8px',
                        border: '1px solid var(--color-border-subtle)',
                        backgroundColor: 'var(--color-bg-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 600, fontSize: '15px' }}>{r.returnNumber}</span>
                          <ReturnStatusBadge status={r.status} />
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                          {r.itemName} • Estimated Refund: ${r.refundAmount?.toFixed(2) || '0.00'}
                        </div>
                      </div>

                      <Link href={`/track/${r.trackingToken}`}>
                        <Button variant="primary" size="sm" icon={ArrowRight}>
                          Track Status
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            Need to start a new return?{' '}
            <Link href="/returns/new" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>
              Create return request
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
