// src/app/(public)/cadastro/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Link from 'next/link';

const tiposMatricula = ['Mensal', 'Trimestral', 'Semestral', 'Anual'] as const;
type TipoMatricula = (typeof tiposMatricula)[number];

export default function CadastroAlunoPage() {
  const router = useRouter();

  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [tipoMatricula, setTipoMatricula] = useState<TipoMatricula>('Mensal');

  const [erro, setErro] = useState('');
  const [success, setSuccess] = useState('');
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  function limparMensagens() {
    setErro('');
    setSuccess('');
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    limparMensagens();

    if (!nome.trim() || !cpf.trim() || !email.trim() || !senha.trim()) {
      setErro('Preencha todos os campos obrigatórios.');
      return;
    }

    setLoadingSubmit(true);
    try {
      const res = await fetch('/api/alunos/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nome.trim(),
          cpf: cpf.trim(),
          email: email.trim(),
          senha: senha.trim(),
          tipo_matricula: tipoMatricula,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(data.error || 'Falha ao cadastrar aluno');
        return;
      }

      setSuccess('Cadastro realizado com sucesso! Você já pode fazer login.');
      setTimeout(() => {
        router.push('/login');
      }, 1000);
    } catch (e) {
      console.error(e);
      setErro('Erro inesperado ao cadastrar aluno');
    } finally {
      setLoadingSubmit(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-24 section">
      <h1 className="h1 mb-2 text-center">Cadastro de Aluno</h1>
      <p className="muted text-center mb-6">
        Preencha os dados para se cadastrar na academia
      </p>

      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium">Nome completo</label>
          <Input
            placeholder="Seu nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">CPF</label>
          <Input
            placeholder="Somente números"
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">E-mail</label>
          <Input
            placeholder="voce@exemplo.com"
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

        <div>
          <label className="block text-sm font-medium">Tipo de matrícula</label>
          <select
            className="w-full rounded-lg border border-gray-300 px-3 py-2 mt-1 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            value={tipoMatricula}
            onChange={(e) => setTipoMatricula(e.target.value as TipoMatricula)}
          >
            {tiposMatricula.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {erro && <div className="text-sm text-red-600">{erro}</div>}
        {success && <div className="text-sm text-green-600">{success}</div>}

        <Button
          type="submit"
          className="w-full text-base py-2.5"
          disabled={loadingSubmit}
        >
          {loadingSubmit ? 'Cadastrando...' : 'Cadastrar aluno'}
        </Button>
      </form>

      <div className="text-center mt-4 text-sm">
        Já tem cadastro?{' '}
        <Link href="/login" className="text-blue-600 hover:underline">
          Faça login
        </Link>
      </div>
    </div>
  );
}
