// src/app/(public)/cadastro/page.tsx
'use client';

import { useRef, useState } from 'react';
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
  const [formErrors, setFormErrors] = useState<Partial<Record<'nome'|'cpf'|'email'|'senha', string>>>({});
  const nomeRef = useRef<HTMLInputElement | null>(null);
  const cpfRef = useRef<HTMLInputElement | null>(null);
  const emailRef = useRef<HTMLInputElement | null>(null);
  const senhaRef = useRef<HTMLInputElement | null>(null);

  function limparMensagens() {
    setErro('');
    setSuccess('');
    setFormErrors({});
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    limparMensagens();

    // validação cliente
    const valid = validateForm();
    if (!valid) return;

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

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        const msg = data?.error ?? 'Falha ao cadastrar aluno';
        if (res.status === 409) {
          if (/cpf/i.test(msg)) {
            setFormErrors({ cpf: msg });
            cpfRef.current?.focus();
          } else if (/e-?mail/i.test(msg)) {
            setFormErrors({ email: msg });
            emailRef.current?.focus();
          } else {
            setErro(msg);
          }
          return;
        }

        setErro(msg);
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

  function validateForm() {
    const errors: Partial<Record<'nome'|'cpf'|'email'|'senha', string>> = {};
    const nomeTrim = nome.trim();
    const cpfTrim = cpf.trim();
    const emailTrim = email.trim();
    const senhaVal = senha;

    if (!nomeTrim) {
      errors.nome = 'Nome é obrigatório';
    } else if (!/[A-Za-zÀ-ÖØ-öø-ÿ]/.test(nomeTrim)) {
      errors.nome = 'Nome inválido: deve conter letras';
    }

    const cpfDigits = cpfTrim.replace(/\D/g, '');
    if (!cpfDigits) {
      errors.cpf = 'CPF é obrigatório';
    } else if (!/^\d+$/.test(cpfDigits)) {
      errors.cpf = 'CPF inválido: somente números';
    } else if (cpfDigits.length !== 11) {
      errors.cpf = 'CPF deve conter 11 dígitos';
    }

    if (!emailTrim) {
      errors.email = 'E-mail é obrigatório';
    } else if (!/^\S+@\S+\.\S+$/.test(emailTrim)) {
      errors.email = 'E-mail inválido';
    }

    if (!senhaVal || senhaVal.trim().length < 8) {
      errors.senha = 'Senha deve ter no mínimo 8 caracteres';
    }

    setFormErrors(errors);

    if (errors.nome) {
      setErro('Corrija os erros do formulário');
      nomeRef.current?.focus();
      return false;
    }
    if (errors.cpf) {
      setErro('Corrija os erros do formulário');
      cpfRef.current?.focus();
      return false;
    }
    if (errors.email) {
      setErro('Corrija os erros do formulário');
      emailRef.current?.focus();
      return false;
    }
    if (errors.senha) {
      setErro('Corrija os erros do formulário');
      senhaRef.current?.focus();
      return false;
    }

    return Object.keys(errors).length === 0;
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
            ref={nomeRef}
          />
          {formErrors.nome && (
            <div className="text-sm text-red-600 mt-1">{formErrors.nome}</div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium">CPF</label>
          <Input
            placeholder="Somente números"
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
            ref={cpfRef}
          />
          {formErrors.cpf && (
            <div className="text-sm text-red-600 mt-1">{formErrors.cpf}</div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium">E-mail</label>
          <Input
            placeholder="voce@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            ref={emailRef}
          />
          {formErrors.email && (
            <div className="text-sm text-red-600 mt-1">{formErrors.email}</div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium">Senha</label>
          <Input
            type="password"
            placeholder="••••••••"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            ref={senhaRef}
          />
          <div className="text-xs text-gray-500 mt-1">Mínimo 8 caracteres.</div>
          {formErrors.senha && (
            <div className="text-sm text-red-600 mt-1">{formErrors.senha}</div>
          )}
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
