'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import type { Role } from '../lib/roles';

type User = { name: string; role: Role } | null;
type AuthCtx = { user: User; login: (n: string, r: Role) => void; logout: () => void; };

const AuthContext = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);

  useEffect(() => {
    const saved = localStorage.getItem('academia_user');
    if (saved) setUser(JSON.parse(saved));
  }, []);

  function login(name: string, role: Role) {
    const u = { name, role };
    setUser(u);
    localStorage.setItem('academia_user', JSON.stringify(u));
  }
  function logout() {
    setUser(null);
    localStorage.removeItem('academia_user');
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
