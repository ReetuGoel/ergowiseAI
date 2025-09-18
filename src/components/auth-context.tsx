import React, { createContext, useContext, useEffect, useState } from 'react'

interface User {
  id: string
  name: string
  email: string
}

interface AuthContextValue {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
  error: string | null
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('ergowise:user')
    if (stored) {
      try { setUser(JSON.parse(stored)) } catch { /* ignore */ }
    }
    setLoading(false)
  }, [])

  const readUsers = (): User[] => {
    try {
      const raw = localStorage.getItem('ergowise:users')
      return raw ? JSON.parse(raw) : []
    } catch { return [] }
  }

  const writeUsers = (users: User[]) => {
    localStorage.setItem('ergowise:users', JSON.stringify(users))
  }

  const login = async (email: string, password: string) => {
    setError(null)
    await new Promise(r => setTimeout(r, 500))
    if (!email.includes('@')) { setError('Enter a valid email'); return }
    const users = readUsers()
    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase())
    if (!existing) { setError('Account not found. Please sign up.'); return }
    setUser(existing)
    localStorage.setItem('ergowise:user', JSON.stringify(existing))
  }

  const signup = async (name: string, email: string, password: string) => {
    setError(null)
    await new Promise(r => setTimeout(r, 600))
    if (name.trim().length < 2) { setError('Name too short'); return }
    if (!email.includes('@')) { setError('Invalid email'); return }
    if (password.length < 6) { setError('Password must be >= 6 characters'); return }
    const users = readUsers()
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) { setError('Email already registered'); return }
    const newUser: User = { id: crypto.randomUUID(), name: name.trim(), email: email.trim() }
    writeUsers([...users, newUser])
    setUser(newUser)
    localStorage.setItem('ergowise:user', JSON.stringify(newUser))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('ergowise:user')
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading, error }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
