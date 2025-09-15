import React, { useState } from 'react'
import { useAuth } from './auth-context'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Alert, AlertDescription } from './ui/alert'

export const SignUpForm: React.FC<{ onSwitchToLogin: () => void }> = ({ onSwitchToLogin }) => {
  const { signup, error, loading } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    await signup(name, email.trim(), password)
    setSubmitting(false)
  }

  if (loading) return null

  return (
    <Card className="w-full max-w-sm shadow-lg">
      <CardHeader>
        <CardTitle className="text-center text-xl tracking-tight">Create your account</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">Name</label>
            <Input id="name" value={name} required minLength={2} onChange={e => setName(e.target.value)} placeholder="Jane" />
          </div>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <Input id="email" type="email" value={email} required onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">Password</label>
            <Input id="password" type="password" value={password} required minLength={6} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>{submitting ? 'Creating...' : 'Sign Up'}</Button>
          <p className="text-xs text-center text-muted-foreground pt-2">Already registered? <button type="button" onClick={onSwitchToLogin} className="text-primary underline">Sign in</button></p>
        </form>
      </CardContent>
    </Card>
  )
}
