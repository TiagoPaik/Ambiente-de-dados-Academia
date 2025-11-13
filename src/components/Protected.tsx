'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../lib/roles';

export default function Protected({
  allow,
  children,
}: {
  allow: Role[];
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user && !allow.includes(user.role)) {
      router.replace(user.role === 'ADMIN' ? '/admin' : '/instrutor');
    }
  }, [user, router, allow]);

  if (!user || !allow.includes(user.role)) return null;
  return <>{children}</>;
}
