import React, { useState } from 'react';
import { useAuth } from './auth-context';
import { useToast } from './toast-context';

export function SignupForm({ onSwitch }: { onSwitch: () => void }) {
  const { signup } = useAuth();
  const { addToast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const ok = await signup(name, email, password);
    if (!ok) {
      setError('Email already registered');
      addToast('Signup failed. Email already exists.', 'error');
    } else {
      addToast(`Welcome to ErgoWise, ${name}! Account created successfully.`, 'success');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={submit} style={formStyle}>
      <h2 style={titleStyle}>Create your account</h2>
      <label style={labelStyle}>Name<input style={inputStyle} value={name} onChange={e => setName(e.target.value)} required /></label>
      <label style={labelStyle}>Email<input style={inputStyle} value={email} onChange={e => setEmail(e.target.value)} required type="email" /></label>
      <label style={labelStyle}>Password<input style={inputStyle} value={password} onChange={e => setPassword(e.target.value)} required type="password" /></label>
      {error && <div style={errorStyle}>{error}</div>}
      <button style={buttonStyle} disabled={loading}>{loading ? 'Signing up...' : 'Sign Up'}</button>
      <p style={{ textAlign: 'center', marginTop: 12, fontSize: 14 }}>Have an account? <span style={linkStyle} onClick={onSwitch}>Log in</span></p>
    </form>
  );
}

const formStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  background: 'var(--color-surface)',
  padding: '32px 36px',
  borderRadius: 24,
  boxShadow: '0 8px 32px rgba(234,88,12,0.15)',
  width: '100%',
  maxWidth: 380
};
const titleStyle: React.CSSProperties = { margin: 0, textAlign: 'center', color: 'var(--color-primary)' };
const labelStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', fontSize: 14, fontWeight: 600, color: 'var(--color-text-soft)' };
const inputStyle: React.CSSProperties = { marginTop: 4, padding: '10px 14px', borderRadius: 12, border: '1px solid var(--color-surface-alt2)', fontSize: 15 };
const buttonStyle: React.CSSProperties = { marginTop: 8, padding: '12px 20px', borderRadius: 14, border: 'none', background: 'var(--color-primary)', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 16 };
const errorStyle: React.CSSProperties = { background: '#fef2f2', color: '#b91c1c', padding: '8px 12px', borderRadius: 8, fontSize: 13 };
const linkStyle: React.CSSProperties = { color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600 };
