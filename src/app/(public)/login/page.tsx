'use client';
import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'INSTRUTOR'>('ADMIN');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    login(name.trim(), role);
    router.push(role === 'ADMIN' ? '/admin' : '/instrutor');
  }

  return (
    <div className="max-w-md mx-auto mt-24 section">
      <h1 className="h1 mb-2 text-center">Acesso</h1>
      <p className="muted text-center mb-6">Entre e escolha seu tipo de usuário</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-800">Seu nome</label>
          <Input placeholder="Ex.: João Silva" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-800">Tipo de usuário</label>
          <select
            className="w-full rounded-lg border border-gray-300 px-3 py-2 mt-1 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            value={role}
            onChange={(e) => setRole(e.target.value as any)}
          >
            <option value="ADMIN">Administrador (ADMIN)</option>
            <option value="INSTRUTOR">Instrutor</option>
          </select>
        </div>

        <Button type="submit" className="w-full text-base py-2.5">Entrar</Button>
      </form>
    </div>
  );
}
