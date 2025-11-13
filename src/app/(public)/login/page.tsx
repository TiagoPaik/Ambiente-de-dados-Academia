// src/app/(public)/login/page.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');

    if (!email.trim() || !senha.trim()) {
      setErro('Preencha e-mail e senha');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          senha: senha.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(data.error || 'Falha no login');
        return;
      }

      console.log('Usuário logado:', data.user); // 👀 debug: veja role aqui

      // data.user: { id, nome, email, role }
      login(data.user);

      const role = data.user.role as 'ADMIN' | 'INSTRUTOR' | 'ALUNO';
      const home: Record<'ADMIN' | 'INSTRUTOR' | 'ALUNO', string> = {
        ADMIN: '/admin',
        INSTRUTOR: '/instrutor',
        ALUNO: '/aluno',
      };

      router.push(home[role]);
    } catch (err) {
      console.error(err);
      setErro('Erro inesperado ao fazer login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-24 section">
      <h1 className="h1 mb-2 text-center">Acesso</h1>
      <p className="muted text-center mb-6">
        Entre com seu e-mail e senha
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium">E-mail</label>
          <Input
            placeholder="usuario@academia.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Senha</label>
          <Input
            type="password"
            placeholder="••••••••"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
        </div>

        {erro && <div className="text-sm text-red-600">{erro}</div>}

        <Button
          type="submit"
          className="w-full text-base py-2.5"
          disabled={loading}
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>

      <div className="text-center mt-4 text-sm">
        Ainda não tem conta?{' '}
        <Link
          href="/cadastro"
          className="text-blue-600 hover:underline"
        >
          Cadastrar
        </Link>
      </div>
    </div>
  );
}
