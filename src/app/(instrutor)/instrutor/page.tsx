'use client';

import { useEffect, useState } from 'react';
import Protected from '@/components/Protected';
import Shell from '@/components/Shell';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

type AlunoInstrutor = {
  id_aluno: number;
  nome: string;
  email: string;
  status: 'Ativo' | 'Inativo';
  tipo_matricula: 'Mensal' | 'Trimestral' | 'Semestral' | 'Anual';
};

export default function InstrutorDashboard() {
  const { user } = useAuth();
  const [alunos, setAlunos] = useState<AlunoInstrutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  async function fetchMeusAlunos() {
    if (!user?.id) return;

    try {
      setLoading(true);
      setErro('');

      const res = await fetch(`/api/professores/alunos?professorId=${user.id}`);

      // 🔍 Se a API respondeu HTML (erro / rota errada), evita o crash do .json()
      const contentType = res.headers.get('content-type') || '';
      const raw = await res.text();

      const data = JSON.parse(raw);

      if (!res.ok) {
        setErro(data?.error ?? 'Erro ao carregar alunos');
        return;
      }

      setAlunos(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setErro('Erro inesperado ao carregar alunos');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMeusAlunos();
  }, [user?.id]);

  const totalAtivos = alunos.filter((a) => a.status === 'Ativo').length;

  return (
    <Protected allow={['INSTRUTOR']}>
      <Shell title="Dashboard do Instrutor">
        {/* Cards principais */}
        <section className="grid gap-4 sm:grid-cols-2">
          <div className="card flex flex-col justify-between">
            <div>
              <h3 className="font-medium mb-1">Meus alunos</h3>
              <p className="muted text-sm mb-2">
                Alunos vinculados a você no sistema.
              </p>
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <div>
                <div className="text-xs text-gray-500">Total</div>
                <div className="text-2xl font-semibold">{alunos.length}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Ativos</div>
                <div className="text-xl font-semibold text-green-700">
                  {totalAtivos}
                </div>
              </div>
            </div>
          </div>

          <Link href="/frequencia" className="card block">
            <div className="flex flex-col justify-between h-full">
              <div>
                <h3 className="font-medium mb-1">Marcar Frequência</h3>
                <p className="muted text-sm">
                  Registre presença ou falta dos seus alunos por dia.
                </p>
              </div>
              <div className="mt-3">
                <Button type="button" className="text-sm">
                  Ir para frequência
                </Button>
              </div>
            </div>
          </Link>
        </section>

        {/* Lista de alunos */}
        <section className="section mt-6">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="h2">Alunos vinculados</h2>
            <Button
              type="button"
              onClick={fetchMeusAlunos}
              className="px-3 py-1.5 text-sm border border-gray-300 bg-white hover:bg-gray-50"
            >
              Atualizar
            </Button>
          </div>

          {erro && (
            <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
              {erro}
            </div>
          )}

          {loading ? (
            <div className="text-sm text-gray-500">Carregando alunos...</div>
          ) : alunos.length === 0 ? (
            <div className="text-sm text-gray-500">
              Nenhum aluno vinculado a você no momento.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 pr-4">Nome</th>
                    <th className="py-2 pr-4">E-mail</th>
                    <th className="py-2 pr-4">Matrícula</th>
                    <th className="py-2 pr-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {alunos.map((a) => (
                    <tr key={a.id_aluno} className="border-b hover:bg-gray-50">
                      <td className="py-2 pr-4 font-medium">{a.nome}</td>
                      <td className="py-2 pr-4">{a.email}</td>
                      <td className="py-2 pr-4">{a.tipo_matricula}</td>
                      <td className="py-2 pr-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs ${
                            a.status === 'Ativo'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {a.status}
                        </span>
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
