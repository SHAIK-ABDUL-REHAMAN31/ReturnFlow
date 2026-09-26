'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { RefreshCw, ArrowRight, Sparkles } from 'lucide-react';
import { loginUser } from '../../../features/auth/authSlice.js';
import { Card } from '../../../components/ui/Card.jsx';
import { Input } from '../../../components/ui/Input.jsx';
import { Button } from '../../../components/ui/Button.jsx';

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleFillDemo = () => {
    setEmail('merchant@returnflow.io');
    setPassword('Password123!');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(loginUser({ email, password }));
    if (loginUser.fulfilled.match(result)) {
      router.push('/dashboard');
    }
  };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '32px',
        backgroundColor: 'var(--color-bg-subtle)',
      }}
    >
      <div style={{ width: '100%', maxWidth: '420px' }} className="animate-fade-in">
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: 'var(--color-primary)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-on-dark)',
              marginBottom: '16px',
            }}
          >
            <RefreshCw size={22} strokeWidth={1.75} />
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
            Merchant Console
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
            Sign in to manage reverse logistics, approvals &amp; refunds
          </p>
        </div>

        <Card elevated padding="32px">
          <form onSubmit={handleSubmit}>
            <Input
              id="login-email"
              label="Merchant Email"
              type="email"
              placeholder="merchant@returnflow.io"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              id="login-password"
              label="Password"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && (
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: 'var(--color-error-soft)',
                  border: '1px solid var(--color-error)',
                  borderRadius: '8px',
                  color: 'var(--color-error)',
                  fontSize: '13px',
                  marginBottom: '20px',
                }}
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              style={{ width: '100%', marginBottom: '12px' }}
              icon={ArrowRight}
            >
              Sign In to Console
            </Button>

            <button
              type="button"
              onClick={handleFillDemo}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: 'var(--color-accent-soft)',
                border: '1px dashed var(--color-accent-border)',
                borderRadius: '8px',
                color: 'var(--color-text-on-accent)',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 180ms ease',
              }}
            >
              <Sparkles size={14} />
              <span>Fill Demo Credentials (Merchant)</span>
            </button>
          </form>

          <div
            style={{
              marginTop: '24px',
              paddingTop: '24px',
              borderTop: '1px solid var(--color-border-subtle)',
              textAlign: 'center',
              fontSize: '13px',
              color: 'var(--color-text-muted)',
            }}
          >
            Need a merchant account?{' '}
            <Link href="/register" style={{ color: 'var(--color-primary)', fontWeight: 500 }}>
              Create Account
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
