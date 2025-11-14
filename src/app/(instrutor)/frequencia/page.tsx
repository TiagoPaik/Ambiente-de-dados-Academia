'use client';

import { useEffect, useState } from 'react';
import Protected from '@/components/Protected';
import Shell from '@/components/Shell';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';

type StatusFreq = 'Presente' | 'Falta' | null;

type FreqAluno = {
  id_aluno: number;
  nome: string;
  status: StatusFreq;      // null = não marcado
  observacao: string | null;
};

type ApiResponse = {
  data: string;
  alunos: {
    id_aluno: number;
    nome: string;
    id_frequencia: number | null;
    status: 'Presente' | 'Falta' | null;
    observacao: string | null;
  }[];
};

export default function FrequenciaInstrutorPage() {
  const { user } = useAuth();
  const [data, setData] = useState<string>(() => {
    const hoje = new Date();
    return hoje.toISOString().slice(0, 10); // YYYY-MM-DD
  });
  const [lista, setLista] = useState<FreqAluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  const [erro, setErro] = useState('');

  async function fetchFrequencia(d: string) {
    if (!user?.id) return;
    try {
      setLoading(true);
      setErro('');
      const res = await fetch(
        `/api/frequencia?professorId=${user.id}&data=${encodeURIComponent(d)}`
      );
      const json: ApiResponse | { error: string } = await res.json();

      if (!res.ok) {
        setErro((json as any).error ?? 'Erro ao carregar frequência');
        return;
      }

      const ok = json as ApiResponse;
      setLista(
        ok.alunos.map((a) => ({
          id_aluno: a.id_aluno,
          nome: a.nome,
          status: a.status ?? null,
          observacao: a.observacao,
        }))
      );
    } catch (e) {
      console.error(e);
      setErro('Erro inesperado ao carregar frequência');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchFrequencia(data);
  }, [user?.id]);

  function handleChangeData(e: React.ChangeEvent<HTMLInputElement>) {
    const novaData = e.target.value;
    setData(novaData);
    fetchFrequencia(novaData);
  }

  function setStatusLocal(id_aluno: number, status: StatusFreq) {
    setLista((prev) =>
      prev.map((a) =>
        a.id_aluno === id_aluno ? { ...a, status } : a
      )
    );
  }

  async function salvarStatus(a: FreqAluno) {
    if (!a.status) {
      alert('Selecione Presente ou Falta antes de salvar.');
      return;
    }

    try {
      setSavingId(a.id_aluno);
      const res = await fetch('/api/frequencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_aluno: a.id_aluno,
          data,
          status: a.status,
          observacao: a.observacao ?? null,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        alert(json?.error ?? 'Erro ao salvar frequência');
        return;
      }
    } catch (e) {
      console.error(e);
      alert('Erro inesperado ao salvar frequência');
    } finally {
      setSavingId(null);
    }
  }

  // 🔥 novo: salvar geral
  async function salvarTodos() {
    const marcados = lista.filter((a) => a.status !== null);

    if (marcados.length === 0) {
      alert('Nenhum aluno marcado como Presente ou Falta.');
      return;
    }

    try {
      setSavingAll(true);
      let erros = 0;

      for (const a of marcados) {
        try {
          const res = await fetch('/api/frequencia', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id_aluno: a.id_aluno,
              data,
              status: a.status,
              observacao: a.observacao ?? null,
            }),
          });

          if (!res.ok) {
            erros++;
          }
        } catch {
          erros++;
        }
      }

      if (erros === 0) {
        alert('Frequência salva para todos os alunos marcados.');
      } else {
        alert(
          `Frequência salva com alguns erros. Verifique os alunos não atualizados. (Erros: ${erros})`
        );
      }
    } catch (e) {
      console.error(e);
      alert('Erro inesperado ao salvar frequência geral');
    } finally {
      setSavingAll(false);
    }
  }

  return (
    <Protected allow={['INSTRUTOR']}>
      <Shell title="Frequência dos Alunos">
        <section className="section">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className="h1 mb-1">Marcar Frequência</h1>
              <p className="muted text-sm">
                Selecione a data e registre presença ou falta para cada aluno.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Data:</label>
              <input
                type="date"
                value={data}
                onChange={handleChangeData}
                className="border rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          {erro && (
            <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
              {erro}
            </div>
          )}
        </section>

        <section className="section mt-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="h2">Alunos para frequência</h2>
            <Button
              type="button"
              onClick={salvarTodos}
              disabled={savingAll || loading || lista.length === 0}
              className="px-4 py-2 text-sm"
            >
              {savingAll ? 'Salvando todos...' : 'Salvar todos'}
            </Button>
          </div>

          {loading ? (
            <div className="text-sm text-gray-500">Carregando alunos...</div>
          ) : lista.length === 0 ? (
            <div className="text-sm text-gray-500">
              Nenhum aluno vinculado a você para registrar frequência.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="py-2 px-3 text-left">Aluno</th>
                    <th className="py-2 px-3 text-center">Status</th>
                    <th className="py-2 px-3 text-center">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {lista.map((a) => (
                    <tr key={a.id_aluno} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-3 font-medium">{a.nome}</td>
                      <td className="py-2 px-3 text-center">
                        <div className="inline-flex gap-2">
                          <button
                            type="button"
                            onClick={() => setStatusLocal(a.id_aluno, 'Presente')}
                            className={`px-2 py-1 rounded-full text-xs border ${
                              a.status === 'Presente'
                                ? 'bg-green-600 text-white border-green-600'
                                : 'border-green-300 text-green-700 hover:bg-green-50'
                            }`}
                          >
                            Presente
                          </button>
                          <button
                            type="button"
                            onClick={() => setStatusLocal(a.id_aluno, 'Falta')}
                            className={`px-2 py-1 rounded-full text-xs border ${
                              a.status === 'Falta'
                                ? 'bg-red-600 text-white border-red-600'
                                : 'border-red-300 text-red-700 hover:bg-red-50'
                            }`}
                          >
                            Falta
                          </button>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <Button
                          type="button"
                          className="px-3 py-1.5 text-xs"
                          disabled={savingAll || savingId === a.id_aluno || !a.status}
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
