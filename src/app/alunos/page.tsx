'use client';

import { useEffect, useMemo, useState } from 'react';
import Protected from '@/components/Protected';
import Shell from '@/components/Shell';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

type StatusAluno = 'Ativo' | 'Inativo';
type TipoMatricula = 'Mensal' | 'Trimestral' | 'Semestral' | 'Anual';

type Aluno = {
  id_aluno: number;
  id_professor: number | null;
  nome: string;
  cpf: string;
  email: string;
  status: StatusAluno;
  tipo_matricula: TipoMatricula;
  nome_professor?: string | null;
};

type Professor = {
  id_professor: number;
  nome: string;
  email: string;
};

type AlunoForm = {
  nome: string;
  cpf: string;
  email: string;
  senha: string;
  status: StatusAluno;
  tipo_matricula: TipoMatricula;
  id_professor: number | null;
};

export default function AlunosPage() {
  const [list, setList] = useState<Aluno[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingProf, setLoadingProf] = useState(true);

  const [form, setForm] = useState<AlunoForm>({
    nome: '',
    cpf: '',
    email: '',
    senha: '',
    status: 'Ativo',         
    tipo_matricula: 'Mensal',
    id_professor: null,       
  });

  const [editing, setEditing] = useState<Aluno | null>(null);

  const canSave = useMemo(() => {
    if (!form.nome.trim()) return false;
    if (!form.cpf.trim()) return false;
    if (!form.email.trim()) return false;
    if (!form.status) return false;
    if (!form.tipo_matricula) return false;
    // Criando: senha obrigatória
    if (!editing && !form.senha.trim()) return false;
    // Editando: senha opcional
    return true;
  }, [form, editing]);

  async function fetchAlunos(query?: string) {
    try {
      setLoading(true);
      const url = query?.trim()
        ? `/api/alunos?q=${encodeURIComponent(query)}`
        : '/api/alunos';
      const res = await fetch(url);
      const data = await res.json();
      setList(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  async function fetchProfessores() {
    try {
      setLoadingProf(true);
      const res = await fetch('/api/professores');
      const data = await res.json();
      const lista: Professor[] = Array.isArray(data) ? data : [];
      setProfessores(lista);

      // Se não está editando e não tem professor setado, define o primeiro como padrão
      if (!editing && lista.length > 0) {
        setForm((f) => ({
          ...f,
          id_professor: f.id_professor ?? lista[0].id_professor,
        }));
      }
    } finally {
      setLoadingProf(false);
    }
  }

  useEffect(() => {
    fetchAlunos();
    fetchProfessores();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;

    const payload = editing
      ? {
          id_aluno: editing.id_aluno,
          nome: form.nome,
          cpf: form.cpf,
          email: form.email,
          status: form.status,
          tipo_matricula: form.tipo_matricula,
          id_professor: form.id_professor,           // pode ser null
          // senha só se preenchida
          ...(form.senha.trim() ? { senha: form.senha.trim() } : {}),
        }
      : {
          nome: form.nome,
          cpf: form.cpf,
          email: form.email,
          senha: form.senha.trim(),
          status: form.status,                      // padrão Inativo já está aqui
          tipo_matricula: form.tipo_matricula,
          id_professor: form.id_professor,          // pode ser null (API escolhe padrão)
        };

    const res = await fetch('/api/alunos', {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data?.error ?? 'Erro ao salvar aluno');
      return;
    }

    // Reseta o formulário
    setEditing(null);
    setForm({
      nome: '',
      cpf: '',
      email: '',
      senha: '',
      status: 'Inativo',
      tipo_matricula: 'Mensal',
      id_professor: professores[0]?.id_professor ?? null,
    });

    fetchAlunos(q);
  }

  function handleEdit(a: Aluno) {
    setEditing(a);
    setForm({
      nome: a.nome,
      cpf: a.cpf,
      email: a.email,
      senha: '',
      status: a.status,
      tipo_matricula: a.tipo_matricula,
      id_professor: a.id_professor, // pode vir null
    });
  }

  async function handleDelete(id: number) {
    if (!confirm('Excluir este aluno?')) return;
    const res = await fetch(`/api/alunos?id=${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) {
      alert(data?.error ?? 'Erro ao excluir aluno');
      return;
    }
    fetchAlunos(q);
  }

  function cancelEdit() {
    setEditing(null);
    setForm({
      nome: '',
      cpf: '',
      email: '',
      senha: '',
      status: 'Inativo',
      tipo_matricula: 'Mensal',
      id_professor: professores[0]?.id_professor ?? null,
    });
  }

  return (
    <Protected allow={['ADMIN']}>
      <Shell title="Alunos">
        <section className="section">
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Buscar por nome, email ou CPF..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <Button onClick={() => fetchAlunos(q)}>Buscar</Button>
              <button
                onClick={() => {
                  setQ('');
                  fetchAlunos();
                }}
                className="px-3 py-2 rounded-lg border hover:bg-gray-50 text-sm"
              >
                Limpar
              </button>
            </div>
            <div className="text-sm muted">
              {Array.isArray(list) ? list.length : 0} resultado(s)
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Formulário */}
          <form
            onSubmit={handleSubmit}
            className="section space-y-4 lg:col-span-1"
          >
            <h2 className="h2">
              {editing ? 'Editar Aluno' : 'Novo Aluno'}
            </h2>

            <div>
              <label className="block text-sm font-medium">Nome</label>
              <Input
                value={form.nome}
                onChange={(e) =>
                  setForm((f) => ({ ...f, nome: e.target.value }))
                }
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium">CPF</label>
                <Input
                  value={form.cpf}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, cpf: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                />
              </div>
            </div>

            {!editing && (
              <div>
                <label className="block text-sm font-medium">Senha</label>
                <Input
                  type="password"
                  value={form.senha}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, senha: e.target.value }))
                  }
                />
              </div>
            )}

            {editing && (
              <div>
                <label className="block text-sm font-medium">
                  Nova senha (opcional)
                </label>
                <Input
                  type="password"
                  value={form.senha}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, senha: e.target.value }))
                  }
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium">
                Professor responsável
              </label>
              {loadingProf ? (
                <div className="text-sm text-gray-500 mt-1">
                  Carregando professores...
                </div>
              ) : professores.length === 0 ? (
                <div className="text-sm text-red-600 mt-1">
                  Nenhum professor cadastrado.
                </div>
              ) : (
                <select
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white focus:ring-2 focus:ring-blue-600 mt-1"
                  value={form.id_professor ?? ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setForm((f) => ({
                      ...f,
                      id_professor: value ? Number(value) : null,
                    }));
                  }}
                >
                  {professores.map((p) => (
                    <option key={p.id_professor} value={p.id_professor}>
                      {p.nome}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium">Status</label>
                <select
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white focus:ring-2 focus:ring-blue-600"
                  value={form.status}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      status: e.target.value as StatusAluno,
                    }))
                  }
                >
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">
                  Tipo de matrícula
                </label>
                <select
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white focus:ring-2 focus:ring-blue-600"
                  value={form.tipo_matricula}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      tipo_matricula: e.target.value as TipoMatricula,
                    }))
                  }
                >
                  <option value="Mensal">Mensal</option>
                  <option value="Trimestral">Trimestral</option>
                  <option value="Semestral">Semestral</option>
                  <option value="Anual">Anual</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={!canSave} className="flex-1">
                {editing ? 'Salvar Alterações' : 'Salvar'}
              </Button>
              {editing && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-3 py-2 rounded-lg border"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>

          {/* Lista */}
          <div className="section lg:col-span-2">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 pr-4">Nome</th>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">CPF</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Tipo</th>
                    <th className="py-2 pr-4">Professor</th>
                    <th className="py-2 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i}>
                        <td className="py-2 pr-4">
                          <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
                        </td>
                        <td className="py-2 pr-4">
                          <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                        </td>
                        <td className="py-2 pr-4">
                          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                        </td>
                        <td className="py-2 pr-4">
                          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                        </td>
                        <td className="py-2 pr-4">
                          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                        </td>
                        <td className="py-2 pr-4">
                          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                        </td>
                        <td className="py-2">
                          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                        </td>
                      </tr>
                    ))
                  ) : Array.isArray(list) && list.length > 0 ? (
                    list.map((a) => (
                      <tr
                        key={a.id_aluno}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="py-2 pr-4 font-medium">{a.nome}</td>
                        <td className="py-2 pr-4">{a.email}</td>
                        <td className="py-2 pr-4">{a.cpf}</td>
                        <td className="py-2 pr-4">{a.status}</td>
                        <td className="py-2 pr-4">{a.tipo_matricula}</td>
                        <td className="py-2 pr-4">{a.nome_professor}
                        </td>
                        <td className="py-2">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleEdit(a)}
                              className="px-2 py-1 rounded border"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDelete(a.id_aluno)}
                              className="px-2 py-1 rounded border text-red-600"
                            >
                              Excluir
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="py-4 text-gray-500" colSpan={7}>
                        Nenhum aluno encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </Shell>
    </Protected>
  );
}
