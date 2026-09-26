'use client';

import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  TrendingDown,
  Clock,
  PieChart,
  ShoppingBag,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import { apiFetch } from '../../lib/api-client.js';
import { Navbar } from '../../components/layout/Navbar.jsx';
import { Sidebar } from '../../components/layout/Sidebar.jsx';
import { Card } from '../../components/ui/Card.jsx';

const REASON_COLORS = {
  DEFECTIVE: '#f43f5e',
  WRONG_ITEM: '#f59e0b',
  NOT_AS_DESCRIBED: '#8b5cf6',
  WRONG_SIZE: '#3b82f6',
  CHANGED_MIND: '#06b6d4',
};

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const res = await apiFetch('/analytics');
        setData(res.analytics);
      } catch (err) {
        setError(err.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, []);

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
                <BarChart3 size={24} color="var(--color-primary)" />
                <h1 className="title-display" style={{ fontSize: '2rem' }}>
                  Reverse Logistics Analytics & Intelligence
                </h1>
              </div>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem' }}>
                Actionable post-purchase intelligence, defect rates, and turnaround efficiency
              </p>
            </div>

            {loading ? (
              <Card style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                Aggregating reverse logistics metrics...
              </Card>
            ) : error ? (
              <Card style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-error)' }}>
                {error}
              </Card>
            ) : !data ? (
              <Card style={{ padding: '2rem', textAlign: 'center' }}>No data available.</Card>
            ) : (
              <>
                {/* KPI Overview Summary Cards */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '1.25rem',
                    marginBottom: '2rem',
                  }}
                >
                  <Card className="metric-card">
                    <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                      Avg Resolution Time
                    </span>
                    <div className="title-display" style={{ fontSize: '2rem', fontWeight: 500, color: 'var(--color-info)' }}>
                      {data.resolutionStats.avgHours} hrs
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      Range: {data.resolutionStats.minHours}h min – {data.resolutionStats.maxHours}h max
                    </span>
                  </Card>

                  <Card className="metric-card">
                    <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                      Total Return Claims
                    </span>
                    <div className="title-display" style={{ fontSize: '2rem', fontWeight: 500 }}>
                      {data.totalReturns}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      Across all sales channels
                    </span>
                  </Card>

                  <Card className="metric-card">
                    <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                      Completed Refunds
                    </span>
                    <div className="title-display" style={{ fontSize: '2rem', fontWeight: 500, color: 'var(--color-success)' }}>
                      {data.statusCounts.REFUNDED || 0}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-emerald)' }}>
                      100% processed through gateway
                    </span>
                  </Card>
                </div>

                {/* Two Column Layout: Reasons Breakdown & Top SKUs */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                  {/* Reasons Breakdown */}
                  <Card>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                      <PieChart size={18} color="var(--color-primary)" />
                      <h3 className="title-display" style={{ fontSize: '1.125rem' }}>
                        Return Reasons Distribution
                      </h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {data.reasons.map((r) => {
                        const color = REASON_COLORS[r.reason] || '#94a3b8';
                        return (
                          <div key={r.reason}>
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '0.8125rem',
                                marginBottom: '0.35rem',
                              }}
                            >
                              <span style={{ fontWeight: 500 }}>{r.reason.replace(/_/g, ' ')}</span>
                              <span style={{ color: 'var(--color-text-secondary)' }}>
                                {r.count} claims ({r.percentage}%)
                              </span>
                            </div>
                            <div
                              style={{
                                height: '8px',
                                backgroundColor: 'var(--color-bg-muted)',
                                borderRadius: '4px',
                                overflow: 'hidden',
                              }}
                            >
                              <div
                                style={{
                                  height: '100%',
                                  width: `${r.percentage}%`,
                                  backgroundColor: color,
                                  borderRadius: '4px',
                                  transition: 'width 0.5s ease',
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>

                  {/* Top Returned Items */}
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
                      <h3 className="title-display" style={{ fontSize: '1.125rem' }}>
                        Highest Return Frequency SKUs
                      </h3>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                      <thead>
                        <tr
                          style={{
                            borderBottom: '1px solid var(--color-border-subtle)',
                            color: 'var(--color-text-muted)',
                            fontSize: '0.75rem',
                            textTransform: 'uppercase',
                          }}
                        >
                          <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left' }}>SKU & Name</th>
                          <th style={{ padding: '0.75rem 1.5rem', textAlign: 'center' }}>Units</th>
                          <th style={{ padding: '0.75rem 1.5rem', textAlign: 'right' }}>Total Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.topSkus.map((skuItem) => (
                          <tr key={skuItem.sku} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                            <td style={{ padding: '0.85rem 1.5rem' }}>
                              <div style={{ fontWeight: 500 }}>{skuItem.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                {skuItem.sku}
                              </div>
                            </td>
                            <td style={{ padding: '0.85rem 1.5rem', textAlign: 'center', fontWeight: 500 }}>
                              {skuItem.returnCount}
                            </td>
                            <td style={{ padding: '0.85rem 1.5rem', textAlign: 'right', fontWeight: 500 }}>
                              ${skuItem.totalValue?.toFixed(2) || '0.00'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Card>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
