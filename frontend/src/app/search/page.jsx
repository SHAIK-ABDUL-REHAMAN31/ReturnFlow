'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search as SearchIcon, ArrowRight, Database, Zap, AlertCircle } from 'lucide-react';
import { apiFetch } from '../../lib/api-client.js';
import { Navbar } from '../../components/layout/Navbar.jsx';
import { Sidebar } from '../../components/layout/Sidebar.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { ReturnStatusBadge } from '../../components/returns/ReturnStatusBadge.jsx';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Debounced search effect
  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch(`/search/returns?q=${encodeURIComponent(query.trim())}`);
        setResults(data);
      } catch (err) {
        setError(err.message || 'Search request failed');
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <Navbar />
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar />
        <main className="main-content">
          <div className="page-wrapper animate-fade-in">
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <Zap size={24} color="var(--color-primary)" />
                <h1 className="title-display" style={{ fontSize: '2rem' }}>
                  OpenSearch Returns Query Engine
                </h1>
              </div>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem' }}>
                Full-text search indexed across SKUs, customer details, return reasons, and orders
              </p>
            </div>

            {/* Search Input Bar */}
            <Card style={{ marginBottom: '2rem' }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <SearchIcon
                  size={20}
                  color="var(--color-text-muted)"
                  style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search by customer name, SKU (e.g. AUDIO-WH1000), return #, order #, or reason..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  style={{
                    paddingLeft: '3rem',
                    fontSize: '1rem',
                    paddingTop: '0.9rem',
                    paddingBottom: '0.9rem',
                  }}
                  autoFocus
                />
              </div>

              {results?.source && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginTop: '0.75rem',
                    fontSize: '0.75rem',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  <Database size={14} color="var(--color-success)" />
                  <span>
                    Indexed Engine:{' '}
                    <strong style={{ color: 'var(--color-primary)', textTransform: 'capitalize' }}>
                      {results.source.replace(/_/g, ' ')}
                    </strong>{' '}
                    • {results.total} results found
                  </span>
                </div>
              )}
            </Card>

            {/* Results Section */}
            {loading ? (
              <Card style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                Querying OpenSearch index...
              </Card>
            ) : error ? (
              <Card style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-error)' }}>
                {error}
              </Card>
            ) : !results ? (
              <Card style={{ padding: '3.5rem', textAlign: 'center' }}>
                <SearchIcon size={40} color="var(--color-text-muted)" style={{ margin: '0 auto 1rem' }} />
                <h3 className="title-display" style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>
                  Search OpenSearch Index
                </h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                  Try queries like <code>"Headphones"</code>, <code>"Sarah"</code>, <code>"DEFECTIVE"</code>, or <code>"ORD-9021"</code>
                </p>
              </Card>
            ) : results.items?.length === 0 ? (
              <Card style={{ padding: '3.5rem', textAlign: 'center' }}>
                <AlertCircle size={36} color="var(--color-text-muted)" style={{ margin: '0 auto 0.75rem' }} />
                <p style={{ color: 'var(--color-text-secondary)' }}>No matches found for "{query}"</p>
              </Card>
            ) : (
              <Card padding="0">
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                    <thead>
                      <tr
                        style={{
                          borderBottom: '1px solid var(--color-border-subtle)',
                          color: 'var(--color-text-muted)',
                          fontSize: '0.75rem',
                          textTransform: 'uppercase',
                        }}
                      >
                        <th style={{ padding: '0.85rem 1.5rem' }}>Return #</th>
                        <th style={{ padding: '0.85rem 1.5rem' }}>Order Ref</th>
                        <th style={{ padding: '0.85rem 1.5rem' }}>Customer</th>
                        <th style={{ padding: '0.85rem 1.5rem' }}>Reason</th>
                        <th style={{ padding: '0.85rem 1.5rem' }}>Refund Value</th>
                        <th style={{ padding: '0.85rem 1.5rem' }}>Status</th>
                        <th style={{ padding: '0.85rem 1.5rem', textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.items.map((item) => (
                        <tr
                          key={item._id || item.id}
                          style={{
                            borderBottom: '1px solid var(--color-border-subtle)',
                            transition: 'background-color 0.15s ease',
                          }}
                        >
                          <td style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>
                            {item.returnNumber}
                          </td>
                          <td style={{ padding: '1rem 1.5rem', color: 'var(--color-text-secondary)' }}>
                            {item.orderNumber}
                          </td>
                          <td style={{ padding: '1rem 1.5rem' }}>
                            <div style={{ fontWeight: 500 }}>{item.customerName}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                              {item.customerEmail}
                            </div>
                          </td>
                          <td style={{ padding: '1rem 1.5rem', color: 'var(--color-text-secondary)' }}>
                            {item.reason}
                          </td>
                          <td style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>
                            ${item.refundAmount?.toFixed(2) || '0.00'}
                          </td>
                          <td style={{ padding: '1rem 1.5rem' }}>
                            <ReturnStatusBadge status={item.status} />
                          </td>
                          <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                            <Link href={`/returns/${item._id || item.id}`}>
                              <Button variant="secondary" size="sm" icon={ArrowRight}>
                                View
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
