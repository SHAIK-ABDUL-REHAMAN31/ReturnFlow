'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { RefreshCw, ArrowRight } from 'lucide-react';
import { registerUser } from '../../../features/auth/authSlice.js';
import { Card } from '../../../components/ui/Card.jsx';
import { Input } from '../../../components/ui/Input.jsx';
import { Button } from '../../../components/ui/Button.jsx';

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(
      registerUser({ name, email, password, role: 'MERCHANT' })
    );
    if (registerUser.fulfilled.match(result)) {
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
            Register Merchant
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
            Set up your organization on the ReturnFlow platform
          </p>
        </div>

        <Card elevated padding="32px">
          <form onSubmit={handleSubmit}>
            <Input
              id="reg-name"
              label="Full Name / Merchant Title"
              type="text"
              placeholder="e.g. Alex Morgan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              id="reg-email"
              label="Business Email"
              type="email"
              placeholder="alex@store.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              id="reg-password"
              label="Password (min 8 chars, 1 uppercase, 1 number)"
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
              style={{ width: '100%' }}
              icon={ArrowRight}
            >
              Create Merchant Account
            </Button>
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
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'var(--color-primary)', fontWeight: 500 }}>
              Sign In
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
