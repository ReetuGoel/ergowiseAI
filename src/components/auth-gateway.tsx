import React, { useState } from 'react'
import { LoginForm } from './login-form'
import { SignUpForm } from './signup-form'

export const AuthGateway: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  return (
    <div className="min-h-screen flex items-center justify-center bg-[linear-gradient(120deg,var(--brand-orange-50),var(--brand-orange-100))] px-4 py-8">
      {mode === 'login' ? (
        <LoginForm onSwitchToSignup={() => setMode('signup')} />
      ) : (
        <SignUpForm onSwitchToLogin={() => setMode('login')} />
      )}
    </div>
  )
}
