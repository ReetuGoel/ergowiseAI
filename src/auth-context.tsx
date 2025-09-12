import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string; // data URL or image URL
}

interface AuthContextValue {
  user: User | null;
  users: User[];
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (patch: Partial<User>) => void;
}

const fallbackAuth: AuthContextValue = {
  user: null,
  users: [],
  login: async () => false,
  signup: async () => false,
  logout: () => {},
  updateUser: () => {}
};

const AuthContext = createContext<AuthContextValue>(fallbackAuth);

const USER_KEY = 'ergowise:user';
const USERS_KEY = 'ergowise:users';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(USER_KEY);
      const storedUsers = localStorage.getItem(USERS_KEY);
      if (storedUser) setUser(JSON.parse(storedUser));
      if (storedUsers) setUsers(JSON.parse(storedUsers));
    } catch (e) {
      console.warn('Auth init failed', e);
    }
  }, []);

  const persistUsers = (list: User[]) => {
    setUsers(list);
    localStorage.setItem(USERS_KEY, JSON.stringify(list));
  };

  const login = async (email: string, password: string) => {
    // password ignored in this mock implementation
    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!existing) return false;
    setUser(existing);
    localStorage.setItem(USER_KEY, JSON.stringify(existing));
    return true;
  };

  const signup = async (name: string, email: string, password: string) => {
    const exists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) return false;
    const newUser: User = { id: crypto.randomUUID(), name, email, avatar: undefined };
    const updated = [...users, newUser];
    persistUsers(updated);
    setUser(newUser);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(USER_KEY);
  };

  const updateUser = (patch: Partial<User>) => {
    if (!user) return;
    const updatedUser: User = { ...user, ...patch };
    setUser(updatedUser);
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    // also update users list if user exists there
    const idx = users.findIndex(u => u.id === updatedUser.id);
    if (idx >= 0) {
      const updatedUsers = [...users];
      updatedUsers[idx] = updatedUser;
      persistUsers(updatedUsers);
    }
  };

  return (
    <AuthContext.Provider value={{ user, users, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  // Return context; if no provider is present, the context has a safe fallback implementation
  return useContext(AuthContext);
}
