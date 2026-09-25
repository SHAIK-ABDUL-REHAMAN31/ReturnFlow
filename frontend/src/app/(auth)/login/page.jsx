'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { RefreshCw, Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';
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
        padding: '2rem',
      }}
    >
      <div style={{ width: '100%', maxWidth: '440px' }} className="animate-fade-in">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 0 24px rgba(99, 102, 241, 0.4)',
              marginBottom: '1rem',
            }}
          >
            <RefreshCw size={24} />
          </div>
          <h1 className="title-display" style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>
            Merchant Console
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Sign in to manage reverse logistics, approvals & refunds
          </p>
        </div>

        <Card elevated padding="2rem">
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
                  padding: '0.75rem 1rem',
                  backgroundColor: 'rgba(244, 63, 94, 0.1)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  borderRadius: '8px',
                  color: 'var(--accent-rose)',
                  fontSize: '0.8125rem',
                  marginBottom: '1.25rem',
                }}
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              style={{ width: '100%', marginBottom: '1rem' }}
              icon={ArrowRight}
            >
              Sign In to Console
            </Button>

            <button
              type="button"
              onClick={handleFillDemo}
              style={{
                width: '100%',
                padding: '0.6rem',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                border: '1px dashed rgba(99, 102, 241, 0.3)',
                borderRadius: '8px',
                color: '#818cf8',
                fontSize: '0.8125rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease',
              }}
            >
              <Sparkles size={14} />
              <span>Fill Demo Credentials (Merchant)</span>
            </button>
          </form>

          <div
            style={{
              marginTop: '1.5rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid var(--border-subtle)',
              textAlign: 'center',
              fontSize: '0.8125rem',
              color: 'var(--text-muted)',
            }}
          >
            Need a merchant account?{' '}
            <Link href="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>
              Create Account
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
