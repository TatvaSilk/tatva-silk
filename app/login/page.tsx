// app/login/page.tsx
'use client';

import { useState } from 'react';
import { supabaseBrowser } from '../../lib/supabaseClient';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle'|'sending'|'sent'|'error'>('idle');
  const [message, setMessage] = useState<string>('');

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    setMessage('');
    try {
      const supabase = supabaseBrowser();
      // Magic link sign-in (email link)
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: typeof window !== 'undefined'
            ? `${window.location.origin}/admin`  // after sign-in, go to admin
            : undefined
        }
      });
      if (error) throw error;
      setStatus('sent');
      setMessage('Check your email for the sign-in link.');
    } catch (err: any) {
      setStatus('error');
      setMessage(err?.message ?? 'Login failed.');
    }
  }

  return (
    <main style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', background: '#0b0f1a', color: '#e2e8f0' }}>
      <div style={{ width: 360, padding: 20, border: '1px solid #1f2937', borderRadius: 10, background: '#0f172a' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>Sign in</h1>
        <p style={{ opacity: 0.8, marginBottom: 16 }}>
          Enter your email. We’ll send you a login link.
        </p>
        <form onSubmit={signIn} className="space-y-3">
          <input
            type="email"
            placeholder="you@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #334155', background: '#0b1220', color: '#e2e8f0' }}
          />
          <button
            type="submit"
            disabled={status === 'sending'}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: '#2563eb', color: 'white', border: 'none', cursor: 'pointer' }}
          >
            {status === 'sending' ? 'Sending link…' : 'Send magic link'}
          </button>
        </form>
        {message && (
          <div style={{ marginTop: 12, fontSize: 14, opacity: 0.9 }}>
            {message}
          </div>
        )}
        <div style={{ marginTop: 14, fontSize: 12, opacity: 0.7 }}>
          Make sure your Supabase Email Auth is enabled (Auth → Providers → Email).
        </div>
      </div>
    </main>
  );
}
