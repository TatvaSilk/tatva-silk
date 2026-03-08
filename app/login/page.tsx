// app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabaseBrowser } from '../../lib/supabaseClient';

type Mode = 'password' | 'otp' | 'magic';

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('password'); // default to password
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [status, setStatus] = useState<'idle'|'working'|'done'|'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const router = useRouter();
  const search = useSearchParams();

  // If you navigated here due to redirect, we can show a small note.
  const reason = search.get('reason'); // e.g., ?reason=auth-required

  function note(msg: string) {
    setMessage(msg);
    setStatus('idle');
  }

  async function signInWithPassword(e: React.FormEvent) {
    e.preventDefault();
    setStatus('working'); setMessage('');
    try {
      const supabase = supabaseBrowser();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setStatus('done');
      note('Signed in successfully.');
      router.replace('/admin'); // send admins to admin by default
    } catch (err: any) {
      setStatus('error');
      setMessage(err?.message ?? 'Sign-in failed.');
    }
  }

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setStatus('working'); setMessage('');
    try {
      const supabase = supabaseBrowser();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: typeof window !== 'undefined'
            ? `${window.location.origin}/admin`
            : undefined
        }
      });
      if (error) throw error;
      setStatus('done');
      note('OTP sent. Check your email for the 6‑digit code.');
    } catch (err: any) {
      setStatus('error');
      setMessage(err?.message ?? 'Could not send OTP.');
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setStatus('working'); setMessage('');
    try {
      const supabase = supabaseBrowser();
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email' // type can be 'email' for email OTP
      });
      if (error) throw error;
      setStatus('done');
      note('Signed in with OTP.');
      router.replace('/admin');
    } catch (err: any) {
      setStatus('error');
      setMessage(err?.message ?? 'OTP verification failed.');
    }
  }

  async function sendMagic(e: React.FormEvent) {
    e.preventDefault();
    setStatus('working'); setMessage('');
    try {
      const supabase = supabaseBrowser();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: typeof window !== 'undefined'
            ? `${window.location.origin}/admin`
            : undefined
        }
      });
      if (error) throw error;
      setStatus('done');
      note('Magic link sent. Check your email.');
    } catch (err: any) {
      setStatus('error');
      setMessage(err?.message ?? 'Could not send magic link.');
    }
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setStatus('working'); setMessage('');
    try {
      const supabase = supabaseBrowser();
      const { error } = await supabase.auth.signUp({
        email,
        password
      });
      if (error) throw error;
      setStatus('done');
      note('Account created. Check your email (if confirmation required) or try signing in.');
    } catch (err: any) {
      setStatus('error');
      setMessage(err?.message ?? 'Sign-up failed.');
    }
  }

  return (
    <main style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', background: '#0b0f1a', color: '#e2e8f0' }}>
      <div style={{ width: 380, padding: 20, border: '1px solid #1f2937', borderRadius: 12, background: '#0f172a' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>Sign in</h1>
        {reason === 'auth-required' && (
          <div style={{ marginBottom: 10, fontSize: 13, color: '#93c5fd' }}>
            Please sign in to continue.
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          <button onClick={() => setMode('password')} style={tabStyle(mode === 'password')}>Password</button>
          <button onClick={() => setMode('otp')} style={tabStyle(mode === 'otp')}>Email OTP</button>
          <button onClick={() => setMode('magic')} style={tabStyle(mode === 'magic')}>Magic Link</button>
        </div>

        {/* Forms */}
        {mode === 'password' && (
          <form onSubmit={signInWithPassword} className="space-y-3">
            <input
              type="email" required placeholder="you@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
            />
            <input
              type="password" required placeholder="Your password"
              value={password} onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
            />
            <button type="submit" disabled={status === 'working'} style={primaryBtn}>
              {status === 'working' ? 'Signing in…' : 'Sign in'}
            </button>
            <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
              New user? <a href="#" onClick={(e)=>{e.preventDefault(); signUp(e);}} style={{ color: '#93c5fd' }}>Create account</a>
            </div>
          </form>
        )}

        {mode === 'otp' && (
          <div>
            <form onSubmit={sendOtp} className="space-y-3">
              <input
                type="email" required placeholder="you@example.com"
                value={email} onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
              />
              <button type="submit" disabled={status === 'working'} style={primaryBtn}>
                {status === 'working' ? 'Sending OTP…' : 'Send OTP to email'}
              </button>
            </form>

            <form onSubmit={verifyOtp} style={{ marginTop: 10 }}>
              <input
                type="text" inputMode="numeric" pattern="[0-9]*" placeholder="Enter 6‑digit code"
                value={otp} onChange={(e) => setOtp(e.target.value)}
                style={inputStyle}
              />
              <button type="submit" disabled={status === 'working'} style={primaryBtn}>
                {status === 'working' ? 'Verifying…' : 'Verify OTP'}
              </button>
            </form>
          </div>
        )}

        {mode === 'magic' && (
          <form onSubmit={sendMagic} className="space-y-3">
            <input
              type="email" required placeholder="you@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
            />
            <button type="submit" disabled={status === 'working'} style={primaryBtn}>
              {status === 'working' ? 'Sending link…' : 'Send magic link'}
            </button>
          </form>
        )}

        {message && (
          <div style={{ marginTop: 12, fontSize: 14, opacity: 0.95 }}>
            {message}
          </div>
        )}
        <div style={{ marginTop: 14, fontSize: 12, opacity: 0.7 }}>
          Email provider must be enabled in Supabase Auth.
        </div>
      </div>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #334155',
  background: '#0b1220',
  color: '#e2e8f0',
  marginBottom: 8
};

const primaryBtn: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  background: '#2563eb',
  color: '#fff',
  border: 'none',
  cursor: 'pointer'
};

function tabStyle(active: boolean): React.CSSProperties {
  return {
    flex: 1,
    padding: '8px 10px',
    borderRadius: 8,
    border: '1px solid #334155',
    background: active ? '#1e293b' : '#0b1220',
    color: '#e2e8f0',
    cursor: 'pointer'
  };
}
