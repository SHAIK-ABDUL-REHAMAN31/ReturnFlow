'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { RefreshCw, LogOut, ExternalLink, ShieldCheck } from 'lucide-react';
import { logoutUser } from '../../features/auth/authSlice.js';
import { Button } from '../ui/Button.jsx';
import { DemoBar } from './DemoBar.jsx';

export function Navbar() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    router.push('/login');
  };

  return (
    <>
      <DemoBar />
      <header
        style={{
          height: '64px',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-bg)',
          position: 'sticky',
          top: 0,
          zIndex: 'var(--z-sticky)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
          </Link>

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
            Phase 05 Ready
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link
            href="/returns/new"
            target="_blank"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              color: 'var(--color-text-secondary)',
              transition: 'color 180ms ease',
            }}
          >
            <span>Customer Return Portal</span>
            <ExternalLink size={14} strokeWidth={1.75} />
          </Link>

          <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--color-border)' }} />

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{user.name}</div>
                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--color-text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    justifyContent: 'flex-end',
                  }}
                >
                  <ShieldCheck size={12} color="var(--color-success)" strokeWidth={1.75} />
                  <span>{user.role}</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="Logout"
                aria-label="Logout"
                style={{
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-secondary)',
                  padding: '8px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 180ms ease',
                }}
              >
                <LogOut size={16} strokeWidth={1.75} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link href="/login">
                <Button variant="secondary" size="sm">
                  Merchant Sign In
                </Button>
              </Link>
            </div>
          )}
        </div>
      </header>
    </>
  );
}
