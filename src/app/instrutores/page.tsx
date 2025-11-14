'use client';

import { useEffect, useMemo, useState } from 'react';
import Protected from '@/components/Protected';
import Shell from '@/components/Shell';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

type Professor = {
  id_professor: number;
  nome: string;
  cpf: string;
  email: string;
  senha: string;
  status: 'Ativo' | 'Inativo';
};

export default function InstrutoresPage() {
  const [list, setList] = useState<Professor[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState<Partial<Professor>>({
    nome: '',
    cpf: '',
    email: '',
    senha: '',
    status: 'Ativo',
  });

  const [editing, setEditing] = useState<Professor | null>(null);

  const canSave = useMemo(() => {
    if (editing) {
      // Editando: senha é opcional
      return !!(
        form.nome &&
        form.cpf &&
        form.email &&
        (form.status === 'Ativo' || form.status === 'Inativo')
      );
    }
    // Criando: senha é obrigatória
    return !!(
      form.nome &&
      form.cpf &&
      form.email &&
      form.senha &&
      (form.status === 'Ativo' || form.status === 'Inativo')
    );
  }, [form, editing]);

  async function fetchProfs(query?: string) {
    try {
      setLoading(true);
      const url = query?.trim()
        ? `/api/professores?q=${encodeURIComponent(query)}`
        : '/api/professores';
      const res = await fetch(url);
      const data = await res.json();
      setList(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProfs();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;

    // monta payload
    let payload: any;

    if (editing) {
      // edição: senha opcional
      payload = {
        id_professor: editing.id_professor,
        nome: form.nome,
        cpf: form.cpf,
        email: form.email,
        status: form.status,
      };

      if (form.senha && form.senha.trim()) {
        payload.senha = form.senha.trim();
      }
    } else {
      // criação: senha obrigatória
      payload = {
        nome: form.nome,
        cpf: form.cpf,
        email: form.email,
        senha: form.senha,
        status: form.status,
      };
    }

    const res = await fetch('/api/professores', {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data?.error ?? 'Erro ao salvar');
      return;
    }

    setForm({ nome: '', cpf: '', email: '', senha: '', status: 'Ativo' });
    setEditing(null);
    fetchProfs(q);
  }

  async function handleEdit(p: Professor) {
    setEditing(p);
    setForm({
      nome: p.nome,
      cpf: p.cpf,
      email: p.email,
      status: p.status,
      senha: '', // senha não é exibida, mas pode ser alterada
    });
  }

  async function handleDelete(id: number) {
    if (!confirm('Excluir este professor?')) return;
    const res = await fetch(`/api/professores?id=${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) {
      alert(data?.error ?? 'Erro ao excluir');
      return;
    }
    fetchProfs(q);
  }

  function cancelEdit() {
    setEditing(null);
    setForm({ nome: '', cpf: '', email: '', senha: '', status: 'Ativo' });
  }

  return (
    <Protected allow={['ADMIN']}>
      <Shell title="Instrutores">
        <section className="section">
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Buscar por nome, email ou CPF..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <Button onClick={() => fetchProfs(q)}>Buscar</Button>
              <button
                onClick={() => {
                  setQ('');
                  fetchProfs();
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
          {/* Form */}
          <form
            onSubmit={handleCreate}
            className="section space-y-4 lg:col-span-1"
          >
            <h2 className="h2">
              {editing ? 'Editar Instrutor' : 'Novo Instrutor'}
            </h2>

            <div>
              <label className="block text-sm font-medium">Nome</label>
              <Input
                value={form.nome || ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, nome: e.target.value }))
                }
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium">CPF</label>
                <Input
                  value={form.cpf || ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, cpf: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={form.email || ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium">
                Senha {editing && <span className="text-xs text-gray-500">(opcional)</span>}
              </label>
              <Input
                type="password"
                placeholder={
                  editing
                    ? 'Deixe em branco para manter a senha atual'
                    : 'Defina uma senha'
                }
                value={form.senha || ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, senha: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Status</label>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white focus:ring-2 focus:ring-blue-600"
                value={form.status || 'Ativo'}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    status: e.target.value as 'Ativo' | 'Inativo',
                  }))
                }
              >
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
              </select>
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
                        <td className="py-2">
                          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                        </td>
                      </tr>
                    ))
                  ) : Array.isArray(list) && list.length > 0 ? (
                    list.map((p) => (
                      <tr
                        key={p.id_professor}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="py-2 pr-4 font-medium">{p.nome}</td>
                        <td className="py-2 pr-4">{p.email}</td>
                        <td className="py-2 pr-4">{p.cpf}</td>
                        <td className="py-2 pr-4">{p.status}</td>
                        <td className="py-2">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleEdit(p)}
                              className="px-2 py-1 rounded border"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDelete(p.id_professor)}
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
                      <td className="py-4 text-gray-500" colSpan={5}>
                        Nenhum instrutor encontrado.
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
