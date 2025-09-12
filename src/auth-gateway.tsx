import React, { useState } from 'react';
import { LoginForm } from './login-form';
import { SignupForm } from './signup-form';

export function AuthGateway() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  return (
    <div style={wrapperStyle}>
      <div style={panelStyle}>
        {mode === 'login' ? (
          <LoginForm onSwitch={() => setMode('signup')} />
        ) : (
          <SignupForm onSwitch={() => setMode('login')} />
        )}
      </div>
    </div>
  );
}

const wrapperStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'var(--gradient-bg)'
};
const panelStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 };
