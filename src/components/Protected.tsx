'use client';
import { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';


export default function Protected({ allow, children }: { allow: ('ADMIN'|'INSTRUTOR'|'ALUNO')[]; children: ReactNode }) {
const { user } = useAuth();
if (!user) return <div className="p-6">Faça login para acessar.</div>;
if (!allow.includes(user.role)) return <div className="p-6">Acesso negado</div>;
return <>{children}</>;
}