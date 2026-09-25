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
            Register Merchant
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Set up your organization on the ReturnFlow platform
          </p>
        </div>

        <Card elevated padding="2rem">
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
              style={{ width: '100%' }}
              icon={ArrowRight}
            >
              Create Merchant Account
            </Button>
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
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>
              Sign In
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
