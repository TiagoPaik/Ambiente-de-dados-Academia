// src/context/AuthContext.tsx
'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type Role = 'ADMIN' | 'INSTRUTOR' | 'ALUNO';

export type User = {
  id: number;
  nome: string;
  email: string;
  role: Role;
};

type AuthContextType = {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem('user');
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch {
        localStorage.removeItem('user');
      }
    }
  }, []);

  const login = (u: User) => {
    setUser(u);
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(u));
    }
  };

  const logout = () => {
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
    }
  };

  const value = useMemo(() => ({ user, login, logout }), [user]);

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
