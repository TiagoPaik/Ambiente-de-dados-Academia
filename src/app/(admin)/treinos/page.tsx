'use client';

import { useEffect, useRef, useState } from 'react';
import Protected from '@/components/Protected';
import Shell from '@/components/Shell';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

type StatusAluno = 'Ativo' | 'Inativo';
type TipoMatricula = 'Mensal' | 'Trimestral' | 'Semestral' | 'Anual';

type Aluno = {
  id_aluno: number;
  nome: string;
  email: string;
  cpf: string;
  status: StatusAluno;
  tipo_matricula: TipoMatricula;
  nome_professor?: string | null;
};

type Treino = {
  id_treino: number;
  id_aluno: number;
  id_professor: number;
  nome: string;
  data_criacao: string;
  observacoes: string | null;
  nome_professor?: string | null;
};

type TreinoExercicio = {
  id_treino: number;
  id_exercicio: number;
  ordem: number | null;
  series: number | null;
  repeticoes: number | null;
  carga_kg: number | null;
  descanso_segundos: number | null;
  nome_exercicio: string;
  imagem: string | null;
};

type ExercicioCatalogo = {
  id_exercicio: number;
  nome: string;
  grupo_muscular: string | null;
  imagem: string | null;
};

type NovoTreinoForm = {
  nome: string;
  observacoes: string;
};

type NovoExercicioForm = {
  id_exercicio: string; // guardo como string para select
  series: string;
  repeticoes: string;
  carga_kg: string;
  descanso_segundos: string;
  ordem: string;
};

export default function TreinosPage() {
  // Passo 1 - alunos
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [qAluno, setQAluno] = useState('');
  const [loadingAlunos, setLoadingAlunos] = useState(true);
  const [selectedAluno, setSelectedAluno] = useState<Aluno | null>(null);

  // Passo 2 - treinos
  const [treinos, setTreinos] = useState<Treino[]>([]);
  const [loadingTreinos, setLoadingTreinos] = useState(false);
  const [selectedTreino, setSelectedTreino] = useState<Treino | null>(null);
  const [novoTreino, setNovoTreino] = useState<NovoTreinoForm>({
    nome: '',
    observacoes: '',
  });
  const [editTreino, setEditTreino] = useState<NovoTreinoForm>({
    nome: '',
    observacoes: '',
  });
  const [novoTreinoError, setNovoTreinoError] = useState<string | null>(null);
  const [editTreinoError, setEditTreinoError] = useState<string | null>(null);
  const novoNomeRef = useRef<HTMLInputElement | null>(null);
  const editNomeRef = useRef<HTMLInputElement | null>(null);

  // Passo 3 - exercícios
  const [exercicios, setExercicios] = useState<TreinoExercicio[]>([]);
  const [loadingExercicios, setLoadingExercicios] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);

  // Catálogo de exercícios para adicionar ao treino
  const [catalogo, setCatalogo] = useState<ExercicioCatalogo[]>([]);
  const [loadingCatalogo, setLoadingCatalogo] = useState(true);
  const [novoExercicio, setNovoExercicio] = useState<NovoExercicioForm>({
    id_exercicio: '',
    series: '',
    repeticoes: '',
    carga_kg: '',
    descanso_segundos: '',
    ordem: '',
  });
  const [novoExercicioErrors, setNovoExercicioErrors] = useState<Partial<Record<keyof NovoExercicioForm, string>>>({});
  const [exercicioFieldErrors, setExercicioFieldErrors] = useState<Record<number, Partial<Record<'series'|'repeticoes'|'carga_kg'|'descanso_segundos'|'ordem', string>>>>({});

  async function fetchAlunos(query?: string) {
    try {
      setLoadingAlunos(true);
      const url = query?.trim()
        ? `/api/alunos?q=${encodeURIComponent(query)}`
        : '/api/alunos';
      const res = await fetch(url);
      const data = await res.json();
      setAlunos(Array.isArray(data) ? data : []);
    } finally {
      setLoadingAlunos(false);
    }
  }

  async function fetchTreinosForAluno(aluno: Aluno) {
    setSelectedTreino(null);
    setExercicios([]);
    setLoadingTreinos(true);
    try {
      const res = await fetch(`/api/treinos?alunoId=${aluno.id_aluno}`);
      const data = await res.json();
      const lista = Array.isArray(data) ? data : [];
      setTreinos(lista);

      // limpa formulários de treino
      setNovoTreino({ nome: '', observacoes: '' });
      setEditTreino({ nome: '', observacoes: '' });
    } finally {
      setLoadingTreinos(false);
    }
  }

  async function fetchExerciciosForTreino(treino: Treino) {
    setLoadingExercicios(true);
    try {
      const res = await fetch(
        `/api/treinos/exercicios?treinoId=${treino.id_treino}`
      );
      const data = await res.json();
      setExercicios(Array.isArray(data) ? data : []);
    } finally {
      setLoadingExercicios(false);
    }
  }

  async function fetchCatalogoExercicios() {
    try {
      setLoadingCatalogo(true);
      const res = await fetch('/api/exercicios');
      const data = await res.json();
      const lista = Array.isArray(data) ? data : [];
      setCatalogo(
        lista.map((e: any) => ({
          id_exercicio: e.id_exercicio,
          nome: e.nome,
          grupo_muscular: e.grupo_muscular ?? null,
          imagem: e.imagem ?? null,
        }))
      );
    } finally {
      setLoadingCatalogo(false);
    }
  }

  useEffect(() => {
    fetchAlunos();
    fetchCatalogoExercicios();
  }, []);

  function handleSelectAluno(a: Aluno) {
    setSelectedAluno(a);
    fetchTreinosForAluno(a);
    setSelectedTreino(null);
    setExercicios([]);
  }

  function handleSelectTreino(t: Treino) {
    setSelectedTreino(t);
    setEditTreino({
      nome: t.nome,
      observacoes: t.observacoes || '',
    });
    fetchExerciciosForTreino(t);
  }

  function updateExercicioLocal(
    id_exercicio: number,
    patch: Partial<TreinoExercicio>
  ) {
    setExercicios((prev) =>
      prev.map((ex) =>
        ex.id_exercicio === id_exercicio ? { ...ex, ...patch } : ex
      )
    );
  }

    async function salvarExercicio(ex: TreinoExercicio) {
  if (!selectedTreino) return;

  // validações por campo
  const fieldErrors: Partial<Record<'series'|'repeticoes'|'carga_kg'|'descanso_segundos'|'ordem', string>> = {};

  // series: inteiro positivo
  if (ex.series == null || !Number.isInteger(Number(ex.series)) || Number(ex.series) <= 0) {
    fieldErrors.series = 'Séries deve ser um número inteiro positivo';
  }

  // repeticoes: inteiro positivo
  if (ex.repeticoes == null || !Number.isInteger(Number(ex.repeticoes)) || Number(ex.repeticoes) <= 0) {
    fieldErrors.repeticoes = 'Repetições deve ser um número inteiro positivo';
  }

  // carga_kg: inteiro não negativo
  if (ex.carga_kg == null || !Number.isInteger(Number(ex.carga_kg)) || Number(ex.carga_kg) < 0) {
    fieldErrors.carga_kg = 'Carga deve ser um número inteiro não negativo';
  }

  // descanso_segundos: inteiro não negativo
  if (ex.descanso_segundos == null || !Number.isInteger(Number(ex.descanso_segundos)) || Number(ex.descanso_segundos) < 0) {
    fieldErrors.descanso_segundos = 'Descanso deve ser um número inteiro não negativo';
  }

  // ordem: inteiro positivo
  if (ex.ordem == null || !Number.isInteger(Number(ex.ordem)) || Number(ex.ordem) <= 0) {
    fieldErrors.ordem = 'Ordem deve ser um número inteiro positivo';
  } else {
    const ordemNum = Number(ex.ordem);
    const outraMesmaOrdem = exercicios.some(
      (e) => e.id_exercicio !== ex.id_exercicio && e.ordem === ordemNum
    );
    if (outraMesmaOrdem) {
      fieldErrors.ordem = 'Já existe outro exercício com essa ordem neste treino';
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    setExercicioFieldErrors((prev) => ({ ...prev, [ex.id_exercicio]: fieldErrors }));
    return;
  }

  // limpa erros antes de enviar
  setExercicioFieldErrors((prev) => {
    const copy = { ...prev };
    delete copy[ex.id_exercicio];
    return copy;
  });

  setSavingId(ex.id_exercicio);

  try {
    const res = await fetch('/api/treinos/exercicios', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_treino: ex.id_treino,
        id_exercicio: ex.id_exercicio,
        series: ex.series,
        repeticoes: ex.repeticoes,
        carga_kg: ex.carga_kg,
        descanso_segundos: ex.descanso_segundos,
        ordem: ex.ordem,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data?.error ?? 'Erro ao salvar exercício');
      return;
    }

    if (data) {
      setExercicios((prev) =>
        prev.map((item) => (item.id_exercicio === data.id_exercicio ? data : item))
      );
    }
  } catch (err) {
    console.error(err);
    alert('Erro inesperado ao salvar exercício');
  } finally {
    setSavingId(null);
  }
  }

  async function removerExercicio(ex: TreinoExercicio) {
    if (!selectedTreino) return;
    if (!confirm(`Remover "${ex.nome_exercicio}" deste treino?`)) return;

    try {
      const res = await fetch(
        `/api/treinos/exercicios?treinoId=${ex.id_treino}&exercicioId=${ex.id_exercicio}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (!res.ok) {
        alert(data?.error ?? 'Erro ao remover exercício');
        return;
      }
      setExercicios((prev) =>
        prev.filter((e) => e.id_exercicio !== ex.id_exercicio)
      );
    } catch (err) {
      console.error(err);
      alert('Erro inesperado ao remover exercício');
    }
  }

  async function criarNovoTreino() {
    // reset previous error
    setNovoTreinoError(null);

    if (!selectedAluno) {
      alert('Selecione um aluno primeiro');
      return;
    }

    if (!novoTreino.nome.trim()) {
      setNovoTreinoError('Informe o nome do treino');
      novoNomeRef.current?.focus();
      return;
    }

    // Nome deve conter pelo menos uma letra
    if (!/[A-Za-zÀ-ÖØ-öø-ÿ]/.test(novoTreino.nome)) {
      setNovoTreinoError('Nome do treino inválido: deve conter ao menos uma letra');
      novoNomeRef.current?.focus();
      return;
    }

    try {
      const res = await fetch('/api/treinos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_aluno: selectedAluno.id_aluno,
          nome: novoTreino.nome.trim(),
          observacoes: novoTreino.observacoes.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data?.error ?? 'Erro ao criar treino');
        return;
      }

      setTreinos((prev) => [data, ...prev]);
      setNovoTreino({ nome: '', observacoes: '' });
      setNovoTreinoError(null);
    } catch (err) {
      console.error(err);
      alert('Erro inesperado ao criar treino');
    }
  }

  async function salvarTreinoAtual() {
    if (!selectedTreino) return;
    // reset previous error
    setEditTreinoError(null);

    if (!editTreino.nome.trim()) {
      setEditTreinoError('Nome do treino não pode ficar vazio');
      editNomeRef.current?.focus();
      return;
    }

    // Nome deve conter pelo menos uma letra
    if (!/[A-Za-zÀ-ÖØ-öø-ÿ]/.test(editTreino.nome)) {
      setEditTreinoError('Nome do treino inválido: deve conter ao menos uma letra');
      editNomeRef.current?.focus();
      return;
    }

    try {
      const res = await fetch('/api/treinos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_treino: selectedTreino.id_treino,
          nome: editTreino.nome.trim(),
          observacoes: editTreino.observacoes.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data?.error ?? 'Erro ao atualizar treino');
        return;
      }

      setTreinos((prev) =>
        prev.map((t) =>
          t.id_treino === data.id_treino ? data : t
        )
      );
      setSelectedTreino(data);
    } catch (err) {
      console.error(err);
      alert('Erro inesperado ao salvar treino');
    }
  }

  async function excluirTreinoAtual() {
    if (!selectedTreino) return;
    if (!confirm(`Excluir o treino "${selectedTreino.nome}"?`)) return;

    try {
      const res = await fetch(
        `/api/treinos?id=${selectedTreino.id_treino}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (!res.ok) {
        alert(data?.error ?? 'Erro ao excluir treino');
        return;
      }

      setTreinos((prev) =>
        prev.filter((t) => t.id_treino !== selectedTreino.id_treino)
      );
      setSelectedTreino(null);
      setExercicios([]);
      setEditTreino({ nome: '', observacoes: '' });
    } catch (err) {
      console.error(err);
      alert('Erro inesperado ao excluir treino');
    }
  }

  async function adicionarExercicioAoTreino() {
    // reset errors
    setNovoExercicioErrors({});

    if (!selectedTreino) {
      alert('Selecione um treino');
      return;
    }

    const errors: Partial<Record<keyof NovoExercicioForm, string>> = {};

    if (!novoExercicio.id_exercicio) {
      errors.id_exercicio = 'Selecione um exercício';
    }

    const id_exercicio = Number(novoExercicio.id_exercicio);
    const series = novoExercicio.series !== '' ? Number(novoExercicio.series) : NaN;
    const repeticoes = novoExercicio.repeticoes !== '' ? Number(novoExercicio.repeticoes) : NaN;
    const carga_kg = novoExercicio.carga_kg !== '' ? Number(novoExercicio.carga_kg) : NaN;
    const descanso_segundos = novoExercicio.descanso_segundos !== '' ? Number(novoExercicio.descanso_segundos) : NaN;
    const ordem = novoExercicio.ordem !== '' ? Number(novoExercicio.ordem) : NaN;

    if (!Number.isInteger(series) || series <= 0) {
      errors.series = 'Séries deve ser um número inteiro positivo';
    }

    if (!Number.isInteger(repeticoes) || repeticoes <= 0) {
      errors.repeticoes = 'Repetições deve ser um número inteiro positivo';
    }

    if (!Number.isInteger(carga_kg) || carga_kg < 0) {
      errors.carga_kg = 'Carga deve ser um número inteiro não negativo';
    }

    if (!Number.isInteger(descanso_segundos) || descanso_segundos < 0) {
      errors.descanso_segundos = 'Descanso deve ser um número inteiro não negativo';
    }

    if (!Number.isInteger(ordem) || ordem <= 0) {
      errors.ordem = 'Ordem deve ser um número inteiro positivo';
    } else if (ordensUsadas.has(ordem)) {
      errors.ordem = 'Já existe um exercício com essa ordem neste treino.';
    }

    if (Object.keys(errors).length > 0) {
      setNovoExercicioErrors(errors);
      return;
    }

    try {
      const res = await fetch('/api/treinos/exercicios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_treino: selectedTreino.id_treino,
          id_exercicio,
          series,
          repeticoes,
          carga_kg,
          descanso_segundos,
          ordem,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data?.error ?? 'Erro ao adicionar exercício');
        return;
      }

      setExercicios((prev) => [...prev, data]);
      setNovoExercicio({ id_exercicio: '', series: '', repeticoes: '', carga_kg: '', descanso_segundos: '', ordem: '' });
      setNovoExercicioErrors({});
    } catch (err) {
      console.error(err);
      alert('Erro inesperado ao adicionar exercício');
    }
  }
  const ordensUsadas = new Set(
  exercicios
    .map((ex) => ex.ordem)
    .filter(
      (ord): ord is number =>
        typeof ord === 'number' && !Number.isNaN(ord)
    )
);

  const exerciciosJaUsadosIds = new Set(
    exercicios.map((ex) => ex.id_exercicio)
  );

  const catalogoDisponivel = catalogo.filter(
    (ex) => !exerciciosJaUsadosIds.has(ex.id_exercicio)
  );

  return (
    <Protected allow={['ADMIN']}>
      <Shell title="Treinos">
        {/* Passo 1: Selecionar Aluno */}
        <section className="section">
          <h2 className="h2 mb-2">Passo 1 — Escolha o aluno</h2>
          <p className="muted text-sm mb-4">
            Selecione o aluno para visualizar e editar os treinos vinculados a ele.
          </p>

          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Buscar aluno por nome, email ou CPF..."
                value={qAluno}
                onChange={(e) => setQAluno(e.target.value)}
              />
              <Button onClick={() => fetchAlunos(qAluno)}>Buscar</Button>
              <button
                onClick={() => {
                  setQAluno('');
                  fetchAlunos();
                }}
                className="px-3 py-2 rounded-lg border hover:bg-gray-50 text-sm"
              >
                Limpar
              </button>
            </div>
            <div className="text-sm muted">
              {Array.isArray(alunos) ? alunos.length : 0} resultado(s)
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-4">Nome</th>
                  <th className="py-2 pr-4">E-mail</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Professor</th>
                  <th className="py-2 text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {loadingAlunos ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td className="py-2 pr-4">
                        <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
                      </td>
                      <td className="py-2 pr-4">
                        <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
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
                ) : alunos.length > 0 ? (
                  alunos.map((a) => (
                    <tr
                      key={a.id_aluno}
                      className={`border-b hover:bg-gray-50 ${
                        selectedAluno?.id_aluno === a.id_aluno
                          ? 'bg-blue-50'
                          : ''
                      }`}
                    >
                      <td className="py-2 pr-4 font-medium">{a.nome}</td>
                      <td className="py-2 pr-4">{a.email}</td>
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
                      <td className="py-2 pr-4">
                        {a.nome_professor || '(sem professor)'}
                      </td>
                      <td className="py-2 text-right">
                        <button
                          onClick={() => handleSelectAluno(a)}
                          className="px-3 py-1.5 rounded border text-sm hover:bg-gray-50"
                        >
                          Selecionar
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="py-4 text-gray-500" colSpan={5}>
                      Nenhum aluno encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Passo 2: Selecionar Treino + CRUD de Treino */}
        <section className="section mt-6">
          <h2 className="h2 mb-2">Passo 2 — Gerenciar treinos do aluno</h2>
          <p className="muted text-sm mb-4">
            Crie novos treinos ou selecione um existente para edição.
          </p>

          {!selectedAluno && (
            <div className="text-sm text-gray-500">
              Selecione um aluno no passo 1 para ver os treinos.
            </div>
          )}

          {selectedAluno && (
            <>
              <div className="mb-3 text-sm">
                <span className="font-medium">Aluno:</span>{' '}
                {selectedAluno.nome} ({selectedAluno.email})
              </div>

              {/* Criar novo treino */}
              <div className="border rounded-2xl p-4 mb-4">
                <h3 className="font-medium mb-2 text-sm">
                  Novo treino para este aluno
                </h3>
                <div className="grid gap-2 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium mb-1">Nome do treino</label>
                    <Input
                      value={novoTreino.nome}
                      onChange={(e) =>
                        setNovoTreino((f) => ({ ...f, nome: e.target.value }))
                      }
                      placeholder="Ex.: Treino A, Treino B..."
                      ref={novoNomeRef}
                    />
                    {novoTreinoError && (
                      <div className="text-sm text-red-600 mt-1">{novoTreinoError}</div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Observações (opcional)</label>
                    <Input
                      value={novoTreino.observacoes}
                      onChange={(e) =>
                        setNovoTreino((f) => ({
                          ...f,
                          observacoes: e.target.value,
                        }))
                      }
                      placeholder="Ex.: foco em peito e costas"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <Button type="button" onClick={criarNovoTreino}>
                    Criar treino
                  </Button>
                </div>
              </div>

              {/* Lista de treinos */}
              {loadingTreinos ? (
                <div className="text-sm text-gray-500">Carregando treinos...</div>
              ) : treinos.length === 0 ? (
                <div className="text-sm text-gray-500">
                  Nenhum treino cadastrado para este aluno.
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {treinos.map((t) => (
                    <button
                      key={t.id_treino}
                      type="button"
                      onClick={() => handleSelectTreino(t)}
                      className={`text-left border rounded-2xl p-3 hover:bg-gray-50 transition ${
                        selectedTreino?.id_treino === t.id_treino
                          ? 'border-blue-500 bg-blue-50'
                          : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold">{t.nome}</span>
                        <span className="text-xs text-gray-500">
                          {t.data_criacao
                            ? new Date(t.data_criacao).toLocaleDateString('pt-BR')
                            : ''}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Professor:{' '}
                        {t.nome_professor || '(não informado)'}
                      </div>
                      {t.observacoes && (
                        <div className="mt-1 text-xs text-gray-600 line-clamp-2">
                          {t.observacoes}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Editar treino selecionado */}
              {selectedTreino && (
                <div className="border rounded-2xl p-4 mt-4">
                  <h3 className="font-medium mb-2 text-sm">
                    Editar treino selecionado
                  </h3>
                  <div className="grid gap-2 md:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium mb-1">Nome</label>
                      <Input
                        value={editTreino.nome}
                        onChange={(e) =>
                          setEditTreino((f) => ({
                            ...f,
                            nome: e.target.value,
                          }))
                        }
                        ref={editNomeRef}
                      />
                      {editTreinoError && (
                        <div className="text-sm text-red-600 mt-1">{editTreinoError}</div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">
                        Observações
                      </label>
                      <Input
                        value={editTreino.observacoes}
                        onChange={(e) =>
                          setEditTreino((f) => ({
                            ...f,
                            observacoes: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button type="button" onClick={salvarTreinoAtual}>
                      Salvar treino
                    </Button>
                    <button
                      type="button"
                      onClick={excluirTreinoAtual}
                      className="px-3 py-2 rounded-lg border border-red-300 text-red-600 text-sm"
                    >
                      Excluir treino
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        {/* Passo 3: Editar exercícios */}
        <section className="section mt-6">
          <h2 className="h2 mb-2">Passo 3 — Exercícios do treino</h2>
          <p className="muted text-sm mb-4">
            Ajuste séries, repetições, carga e adicione/remova exercícios do treino.
          </p>

          {!selectedTreino && (
            <div className="text-sm text-gray-500">
              Selecione um treino no passo 2 para ver os exercícios.
            </div>
          )}

          {selectedTreino && (
            <>
              {/* Lista de exercícios do treino */}
              {loadingExercicios ? (
                <div className="text-sm text-gray-500">
                  Carregando exercícios...
                </div>
              ) : exercicios.length === 0 ? (
                <div className="text-sm text-gray-500 mb-4">
                  Nenhum exercício vinculado a este treino.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 mb-6">
                  {exercicios.map((ex) => (
                    <div
                      key={ex.id_exercicio}
                      className="border rounded-2xl p-3 flex gap-3"
                    >
                      <div className="w-24 h-24 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                        {ex.imagem ? (
                          <img
                            src={ex.imagem}
                            alt={ex.nome_exercicio}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                            sem imagem
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-medium text-sm">
                            {ex.nome_exercicio}
                          </div>
                          <button
                            type="button"
                            onClick={() => removerExercicio(ex)}
                            className="text-xs text-red-600 hover:underline"
                          >
                            Remover
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <label className="block text-[11px] text-gray-500">
                              Séries
                            </label>
                            <Input
                              type="number"
                                value={ex.series ?? ''}
                                onChange={(e) =>
                                  updateExercicioLocal(ex.id_exercicio, {
                                    series: e.target.value ? Number(e.target.value) : null,
                                  })
                                }
                            />
                              {exercicioFieldErrors[ex.id_exercicio]?.series && (
                                <div className="text-xs text-red-600 mt-1">{exercicioFieldErrors[ex.id_exercicio]?.series}</div>
                              )}
                          </div>
                          <div>
                            <label className="block text-[11px] text-gray-500">
                              Repetições
                            </label>
                            <Input
                                type="number"
                                value={ex.repeticoes ?? ''}
                                onChange={(e) =>
                                  updateExercicioLocal(ex.id_exercicio, {
                                    repeticoes: e.target.value ? Number(e.target.value) : null,
                                  })
                                }
                            />
                              {exercicioFieldErrors[ex.id_exercicio]?.repeticoes && (
                                <div className="text-xs text-red-600 mt-1">{exercicioFieldErrors[ex.id_exercicio]?.repeticoes}</div>
                              )}
                          </div>
                          <div>
                            <label className="block text-[11px] text-gray-500">
                              Carga (kg)
                            </label>
                            <Input
                                type="number"
                                value={ex.carga_kg ?? ''}
                                onChange={(e) =>
                                  updateExercicioLocal(ex.id_exercicio, {
                                    carga_kg: e.target.value ? Number(e.target.value) : null,
                                  })
                                }
                            />
                              {exercicioFieldErrors[ex.id_exercicio]?.carga_kg && (
                                <div className="text-xs text-red-600 mt-1">{exercicioFieldErrors[ex.id_exercicio]?.carga_kg}</div>
                              )}
                          </div>
                          <div>
                            <label className="block text-[11px] text-gray-500">
                              Descanso (s)
                            </label>
                            <Input
                                type="number"
                                value={ex.descanso_segundos ?? ''}
                                onChange={(e) =>
                                  updateExercicioLocal(ex.id_exercicio, {
                                    descanso_segundos: e.target.value ? Number(e.target.value) : null,
                                  })
                                }
                            />
                              {exercicioFieldErrors[ex.id_exercicio]?.descanso_segundos && (
                                <div className="text-xs text-red-600 mt-1">{exercicioFieldErrors[ex.id_exercicio]?.descanso_segundos}</div>
                              )}
                          </div>
                          <div>
                            <label className="block text-[11px] text-gray-500">
                              Ordem
                            </label>
                            <Input
                                type="number"
                                min={1}
                                value={ex.ordem ?? ''}
                                onChange={(e) =>
                                  updateExercicioLocal(ex.id_exercicio, {
                                    ordem: e.target.value ? Number(e.target.value) : null,
                                  })
                                }
                            />
                              {exercicioFieldErrors[ex.id_exercicio]?.ordem && (
                                <div className="text-xs text-red-600 mt-1">{exercicioFieldErrors[ex.id_exercicio]?.ordem}</div>
                              )}
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            className="px-3 py-1.5 text-sm"
                            disabled={savingId === ex.id_exercicio}
                            onClick={() => salvarExercicio(ex)}
                          >
                            {savingId === ex.id_exercicio
                              ? 'Salvando...'
                              : 'Salvar'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Adicionar novo exercício ao treino */}
              <div className="border rounded-2xl p-4">
                <h3 className="font-medium mb-2 text-sm">
                  Adicionar exercício ao treino
                </h3>

                {loadingCatalogo ? (
                  <div className="text-sm text-gray-500">
                    Carregando catálogo de exercícios...
                  </div>
                ) : catalogoDisponivel.length === 0 ? (
                  <div className="text-sm text-gray-500">
                    Nenhum exercício disponível (todos já foram adicionados ou catálogo vazio).
                  </div>
                ) : (
                  <>
                    <div className="grid gap-2 md:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium mb-1">
                          Exercício
                        </label>
                        <select
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white text-sm"
                          value={novoExercicio.id_exercicio}
                          onChange={(e) =>
                            setNovoExercicio((f) => ({
                              ...f,
                              id_exercicio: e.target.value,
                            }))
                          }
                        >
                          <option value="">Selecione...</option>
                          {catalogoDisponivel.map((ex) => (
                            <option
                              key={ex.id_exercicio}
                              value={ex.id_exercicio}
                            >
                              {ex.nome}
                              {ex.grupo_muscular
                                ? ` (${ex.grupo_muscular})`
                                : ''}
                            </option>
                          ))}
                        </select>
                        {novoExercicioErrors.id_exercicio && (
                          <div className="text-xs text-red-600 mt-1">{novoExercicioErrors.id_exercicio}</div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] text-gray-500">
                            Séries
                          </label>
                          <Input
                            type="number"
                            value={novoExercicio.series}
                            onChange={(e) =>
                              setNovoExercicio((f) => ({
                                ...f,
                                series: e.target.value,
                              }))
                            }
                          />
                            {novoExercicioErrors.series && (
                              <div className="text-xs text-red-600 mt-1">{novoExercicioErrors.series}</div>
                            )}
                        </div>
                        <div>
                          <label className="block text-[11px] text-gray-500">
                            Repetições
                          </label>
                          <Input
                            type="number"
                            value={novoExercicio.repeticoes}
                            onChange={(e) =>
                              setNovoExercicio((f) => ({
                                ...f,
                                repeticoes: e.target.value,
                              }))
                            }
                          />
                            {novoExercicioErrors.repeticoes && (
                              <div className="text-xs text-red-600 mt-1">{novoExercicioErrors.repeticoes}</div>
                            )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] text-gray-500">
                            Carga (kg)
                          </label>
                          <Input
                            type="number"
                            value={novoExercicio.carga_kg}
                            onChange={(e) =>
                              setNovoExercicio((f) => ({
                                ...f,
                                carga_kg: e.target.value,
                              }))
                            }
                          />
                            {novoExercicioErrors.carga_kg && (
                              <div className="text-xs text-red-600 mt-1">{novoExercicioErrors.carga_kg}</div>
                            )}
                        </div>
                        <div>
                          <label className="block text-[11px] text-gray-500">
                            Descanso (s)
                          </label>
                          <Input
                            type="number"
                            value={novoExercicio.descanso_segundos}
                            onChange={(e) =>
                              setNovoExercicio((f) => ({
                                ...f,
                                descanso_segundos: e.target.value,
                              }))
                            }
                          />
                            {novoExercicioErrors.descanso_segundos && (
                              <div className="text-xs text-red-600 mt-1">{novoExercicioErrors.descanso_segundos}</div>
                            )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] text-gray-500">
                          Ordem
                        </label>
                        <Input
                          type="number"
                          min={1}
                          value={novoExercicio.ordem}
                          onChange={(e) =>
                            setNovoExercicio((f) => ({
                              ...f,
                              ordem: e.target.value,
                            }))
                          }
                        />
                        {novoExercicioErrors.ordem && (
                          <div className="text-xs text-red-600 mt-1">{novoExercicioErrors.ordem}</div>
                        )}
                      </div>
                    </div>

                    <div className="mt-3">
                      <Button type="button" onClick={adicionarExercicioAoTreino}>
                        Adicionar ao treino
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </section>
      </Shell>
    </Protected>
  );
}
