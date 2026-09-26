'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Inbox, ShoppingBag, ShieldCheck, PlusCircle, Search, BarChart3 } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/returns', label: 'Returns Queue', icon: Inbox },
  { href: '/search', label: 'OpenSearch Query', icon: Search },
  { href: '/analytics', label: 'Logistics Analytics', icon: BarChart3 },
  { href: '/returns/new', label: 'Submit Return', icon: PlusCircle },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: '240px',
        borderRight: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-bg-subtle)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '20px 16px',
      }}
    >
      <div>
        <div
          style={{
            fontSize: '11px',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--color-text-muted)',
            padding: '0 12px',
            marginBottom: '12px',
          }}
        >
          Merchant Console
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: isActive ? 500 : 400,
                  color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  backgroundColor: isActive ? 'var(--color-bg)' : 'transparent',
                  borderLeft: isActive ? '3px solid var(--color-accent)' : '3px solid transparent',
                  transition: 'all 180ms cubic-bezier(0.2, 0.8, 0.2, 1)',
                }}
              >
                <Icon size={18} strokeWidth={1.75} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div
        style={{
          padding: '16px',
          backgroundColor: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <ShieldCheck size={16} color="var(--color-success)" strokeWidth={1.75} />
          <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
            State Machine Engine
          </span>
        </div>
        <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', lineHeight: '1.45' }}>
          Deterministic transitions enforced strictly per reverse logistics specification.
        </p>
      </div>
    </aside>
  );
}
