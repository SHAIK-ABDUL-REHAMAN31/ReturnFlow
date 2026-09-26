'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { Search, Filter, Inbox, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchReturns } from '../../features/returns/returnsSlice.js';
import { Navbar } from '../../components/layout/Navbar.jsx';
import { Sidebar } from '../../components/layout/Sidebar.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { ReturnStatusBadge } from '../../components/returns/ReturnStatusBadge.jsx';

const STATUS_TABS = [
  { id: '', label: 'All Returns' },
  { id: 'PENDING_REVIEW', label: 'Pending Review' },
  { id: 'APPROVED', label: 'Approved' },
  { id: 'LABEL_GENERATED', label: 'Label Ready' },
  { id: 'IN_TRANSIT', label: 'In Transit' },
  { id: 'RECEIVED', label: 'Received' },
  { id: 'REFUNDED', label: 'Refunded' },
  { id: 'REJECTED', label: 'Rejected' },
];

export default function ReturnsQueuePage() {
  const dispatch = useDispatch();
  const { items, total, page, totalPages, loading } = useSelector((state) => state.returns);

  const [activeTab, setActiveTab] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    dispatch(fetchReturns({ status: activeTab, search: searchTerm, page: 1, limit: 15 }));
  }, [dispatch, activeTab]);

  const handleSearch = (e) => {
    e.preventDefault();
    dispatch(fetchReturns({ status: activeTab, search: searchTerm, page: 1, limit: 15 }));
  };

  const handlePageChange = (newPage) => {
    dispatch(fetchReturns({ status: activeTab, search: searchTerm, page: newPage, limit: 15 }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <Navbar />
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar />
        <main className="main-content">
          <div className="page-wrapper animate-fade-in">
            {/* Header */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h1 className="title-display" style={{ fontSize: '1.875rem' }}>
                Returns Queue
              </h1>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                Manage all reverse logistics requests across every stage of the lifecycle
              </p>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                marginBottom: '1.25rem',
              }}
            >
              {/* Status Tabs */}
              <div
                style={{
                  display: 'flex',
                  gap: '0.35rem',
                  overflowX: 'auto',
                  padding: '0.25rem',
                  backgroundColor: 'var(--color-bg-muted)',
                  borderRadius: '10px',
                  border: '1px solid var(--color-border-subtle)',
                }}
              >
                {STATUS_TABS.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      style={{
                        padding: '0.45rem 0.85rem',
                        borderRadius: '6px',
                        fontSize: '0.8125rem',
                        fontWeight: 500,
                        backgroundColor: isActive ? 'var(--color-primary)' : 'transparent',
                        color: isActive ? '#ffffff' : 'var(--color-text-secondary)',
                        border: 'none',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Search Form */}
              <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem' }}>
                <div style={{ position: 'relative', width: '280px' }}>
                  <Search
                    size={16}
                    color="var(--color-text-muted)"
                    style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
                  />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search return #, order #, email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ paddingLeft: '2.5rem', paddingRight: '0.75rem', height: '38px' }}
                  />
                </div>
                <Button type="submit" variant="secondary" size="sm">
                  Search
                </Button>
              </form>
            </div>

            {/* Table Card */}
            <Card padding="0">
              {loading && items.length === 0 ? (
                <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  Loading queue data...
                </div>
              ) : items.length === 0 ? (
                <div style={{ padding: '3.5rem', textAlign: 'center' }}>
                  <Inbox size={36} color="var(--color-text-muted)" style={{ margin: '0 auto 0.75rem' }} />
                  <p style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>No return requests found</p>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                    Try adjusting the search query or selected status tab.
                  </p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                    <thead>
                      <tr
                        style={{
                          borderBottom: '1px solid var(--color-border-subtle)',
                          color: 'var(--color-text-muted)',
                          fontSize: '0.75rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        <th style={{ padding: '0.85rem 1.5rem' }}>Return #</th>
                        <th style={{ padding: '0.85rem 1.5rem' }}>Order #</th>
                        <th style={{ padding: '0.85rem 1.5rem' }}>Customer</th>
                        <th style={{ padding: '0.85rem 1.5rem' }}>Items</th>
                        <th style={{ padding: '0.85rem 1.5rem' }}>Reason</th>
                        <th style={{ padding: '0.85rem 1.5rem' }}>Refund Est.</th>
                        <th style={{ padding: '0.85rem 1.5rem' }}>Status</th>
                        <th style={{ padding: '0.85rem 1.5rem', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((ret) => (
                        <tr
                          key={ret._id}
                          style={{
                            borderBottom: '1px solid var(--color-border-subtle)',
                            transition: 'background-color 0.15s ease',
                          }}
                        >
                          <td style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>
                            {ret.returnNumber}
                          </td>
                          <td style={{ padding: '1rem 1.5rem', color: 'var(--color-text-secondary)' }}>
                            {ret.orderNumber}
                          </td>
                          <td style={{ padding: '1rem 1.5rem' }}>
                            <div style={{ fontWeight: 500 }}>{ret.customerName}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                              {ret.customerEmail}
                            </div>
                          </td>
                          <td style={{ padding: '1rem 1.5rem' }}>
                            {ret.items?.length || 1} item(s)
                          </td>
                          <td style={{ padding: '1rem 1.5rem', color: 'var(--color-text-secondary)' }}>
                            {ret.reason}
                          </td>
                          <td style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>
                            ${ret.refundAmount?.toFixed(2) || '0.00'}
                          </td>
                          <td style={{ padding: '1rem 1.5rem' }}>
                            <ReturnStatusBadge status={ret.status} />
                          </td>
                          <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                            <Link href={`/returns/${ret._id}`}>
                              <Button variant="secondary" size="sm">
                                Manage
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination Footer */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem 1.5rem',
                  borderTop: '1px solid var(--color-border-subtle)',
                  fontSize: '0.8125rem',
                  color: 'var(--color-text-muted)',
                }}
              >
                <span>
                  Showing {items.length} of {total} return requests
                </span>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => handlePageChange(page - 1)}
                  >
                    <ChevronLeft size={16} />
                  </Button>
                  <span>
                    Page {page} of {totalPages || 1}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => handlePageChange(page + 1)}
                  >
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
