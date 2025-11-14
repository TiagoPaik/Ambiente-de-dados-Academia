'use client';

import { useEffect, useMemo, useState } from 'react';
import Protected from '@/components/Protected';
import Shell from '@/components/Shell';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';

type StatusAluno = 'Ativo' | 'Inativo';

type AlunoInstrutor = {
  id_aluno: number;
  nome: string;
  email: string;
  tipo_matricula: 'Mensal' | 'Trimestral' | 'Semestral' | 'Anual';
  status: StatusAluno;
  data_pagamento: string | null;
  data_vencimento: string | null;
  situacao_matricula: 'Em dia' | 'Vencida' | 'Sem data';
};

export default function InstrutorAlunosPage() {
  const { user } = useAuth();
  const [lista, setLista] = useState<AlunoInstrutor[]>([]);
  const [q, setQ] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'Todos' | StatusAluno>('Todos');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [erro, setErro] = useState('');

  async function fetchAlunos() {
    if (!user?.id) return;
    try {
      setLoading(true);
      setErro('');
      const params = new URLSearchParams();
      params.set('professorId', String(user.id));
      if (q.trim()) params.set('q', q.trim());

      const res = await fetch(`/api/professores/alunos?${params.toString()}`);
      const json = await res.json();

      if (!res.ok) {
        setErro(json?.error ?? 'Erro ao carregar alunos');
        setLista([]);
        return;
      }

      setLista(Array.isArray(json) ? json : []);
    } catch (e) {
      console.error(e);
      setErro('Erro inesperado ao carregar alunos');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAlunos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const filtrados = useMemo(() => {
    return lista.filter((a) => {
      if (filtroStatus !== 'Todos' && a.status !== filtroStatus) return false;
      return true;
    });
  }, [lista, filtroStatus]);

  const totais = useMemo(() => {
    const total = lista.length;
    const ativos = lista.filter((a) => a.status === 'Ativo').length;
    const inativos = lista.filter((a) => a.status === 'Inativo').length;
    return { total, ativos, inativos };
  }, [lista]);

  function updateStatusLocal(id_aluno: number, status: StatusAluno) {
    setLista((prev) =>
      prev.map((a) =>
        a.id_aluno === id_aluno ? { ...a, status } : a
      )
    );
  }

  async function salvarStatus(a: AlunoInstrutor) {
    try {
      setSavingId(a.id_aluno);
      const res = await fetch('/api/professores/alunos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_aluno: a.id_aluno,
          status: a.status,
          professorId: user?.id,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        alert(json?.error ?? 'Erro ao atualizar status do aluno');
        return;
      }

      // atualiza com o que voltou do backend (caso tenha algo a mais)
      setLista((prev) =>
        prev.map((al) =>
          al.id_aluno === json.id_aluno ? json : al
        )
      );
    } catch (e) {
      console.error(e);
      alert('Erro inesperado ao salvar status');
    } finally {
      setSavingId(null);
    }
  }

  function formatDate(d: string | null) {
    if (!d) return '-';
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return d;
    return date.toLocaleDateString('pt-BR');
  }

  return (
    <Protected allow={['INSTRUTOR']}>
      <Shell title="Meus alunos">
        <section className="section">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className="h1 mb-1">Alunos vinculados</h1>
              <p className="muted text-sm">
                Veja seus alunos, o tipo de matrícula e altere o status de ativo/inativo.
              </p>
            </div>

            <div className="flex flex-col gap-2 items-stretch md:items-end">
              <div className="flex gap-2">
                <Input
                  placeholder="Buscar por nome ou e-mail..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
                <Button type="button" onClick={fetchAlunos}>
                  Buscar
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setQ('');
                    fetchAlunos();
                  }}
                  className="px-3 py-2 rounded-lg border hover:bg-gray-50 text-sm"
                >
                  Limpar
                </button>
              </div>
              <div className="flex gap-2 text-xs text-gray-500">
                <span>Total: {totais.total}</span>
                <span>· Ativos: {totais.ativos}</span>
                <span>· Inativos: {totais.inativos}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 items-center">
            <span className="text-xs text-gray-500">Filtrar status:</span>
            <button
              type="button"
              onClick={() => setFiltroStatus('Todos')}
              className={`px-2 py-1 rounded-full text-xs border ${
                filtroStatus === 'Todos'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setFiltroStatus('Ativo')}
              className={`px-2 py-1 rounded-full text-xs border ${
                filtroStatus === 'Ativo'
                  ? 'bg-green-600 text-white border-green-600'
                  : 'border-green-300 text-green-700 hover:bg-green-50'
              }`}
            >
              Ativos
            </button>
            <button
              type="button"
              onClick={() => setFiltroStatus('Inativo')}
              className={`px-2 py-1 rounded-full text-xs border ${
                filtroStatus === 'Inativo'
                  ? 'bg-yellow-500 text-white border-yellow-500'
                  : 'border-yellow-300 text-yellow-700 hover:bg-yellow-50'
              }`}
            >
              Inativos
            </button>
          </div>
        </section>

        <section className="section mt-4">
          {loading ? (
            <div className="text-sm text-gray-500">Carregando alunos...</div>
          ) : filtrados.length === 0 ? (
            <div className="text-sm text-gray-500">
              Nenhum aluno encontrado para os filtros selecionados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="py-2 px-3 text-left">Aluno</th>
                    <th className="py-2 px-3 text-left">E-mail</th>
                    <th className="py-2 px-3 text-center">Tipo matrícula</th>
                    <th className="py-2 px-3 text-center">Situação</th>
                    <th className="py-2 px-3 text-center">Status</th>
                    <th className="py-2 px-3 text-center">Data vencimento</th>
                    <th className="py-2 px-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((a) => (
                    <tr key={a.id_aluno} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-3 font-medium">{a.nome}</td>
                      <td className="py-2 px-3">{a.email}</td>
                      <td className="py-2 px-3 text-center">{a.tipo_matricula}</td>
                      <td className="py-2 px-3 text-center">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs ${
                            a.situacao_matricula === 'Em dia'
                              ? 'bg-green-100 text-green-700'
                              : a.situacao_matricula === 'Vencida'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {a.situacao_matricula}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <select
                          className="text-xs border rounded-lg px-2 py-1 bg-white"
                          value={a.status}
                          onChange={(e) =>
                            updateStatusLocal(
                              a.id_aluno,
                              e.target.value as StatusAluno
                            )
                          }
                        >
                          <option value="Ativo">Ativo</option>
                          <option value="Inativo">Inativo</option>
                        </select>
                      </td>
                      <td className="py-2 px-3 text-center">
                        {formatDate(a.data_vencimento)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <Button
                          type="button"
                          className="px-3 py-1.5 text-xs"
                          disabled={savingId === a.id_aluno}
                          onClick={() => salvarStatus(a)}
                        >
                          {savingId === a.id_aluno ? 'Salvando...' : 'Salvar'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </Shell>
    </Protected>
  );
}
