'use client';

import { useEffect, useMemo, useState } from 'react';
import Protected from '@/components/Protected';
import Shell from '@/components/Shell';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import Input from '@/components/ui/Input';

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

type RegistroFreq = {
  data: string;
  status: 'Presente' | 'Falta';
};

type FreqAlunoMes = {
  ano: number;
  mes: number;
  registros: RegistroFreq[];
  presencas: number;
  faltas: number;
  percentual_presenca: number;
};

function nomeMes(num: number) {
  const nomes = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril',
    'Maio', 'Junho', 'Julho', 'Agosto',
    'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];
  return nomes[num - 1] ?? `${num}`;
}

export default function AlunoDashboardPage() {
  const { user } = useAuth();

  // --------- Treinos ----------
  const [treinos, setTreinos] = useState<Treino[]>([]);
  const [loadingTreinos, setLoadingTreinos] = useState(true);
  const [treinoSelecionado, setTreinoSelecionado] = useState<Treino | null>(null);

  const [exercicios, setExercicios] = useState<TreinoExercicio[]>([]);
  const [loadingExercicios, setLoadingExercicios] = useState(false);

  // --------- Frequência / Calendário ----------
  const hoje = useMemo(() => new Date(), []);
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth() + 1); // 1..12
  const [freqMes, setFreqMes] = useState<FreqAlunoMes | null>(null);
  const [loadingFreq, setLoadingFreq] = useState(true);

  // Mapa dia -> status
  const mapaStatusPorDia = useMemo(() => {
    const map = new Map<number, 'Presente' | 'Falta'>();
    if (!freqMes) return map;
    for (const r of freqMes.registros) {
      const d = new Date(r.data);
      const dia = d.getDate();
      map.set(dia, r.status);
    }
    return map;
  }, [freqMes]);

  // --------- Fetch treinos do aluno ----------
  async function fetchTreinosAluno() {
    if (!user?.id) return;
    try {
      setLoadingTreinos(true);
      const res = await fetch(`/api/treinos?alunoId=${user.id}`);
      const data = await res.json();
      const lista = Array.isArray(data) ? data : [];
      setTreinos(lista);

      if (lista.length > 0) {
        setTreinoSelecionado(lista[0]);
        fetchExerciciosTreino(lista[0].id_treino);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTreinos(false);
    }
  }

  async function fetchExerciciosTreino(id_treino: number) {
    try {
      setLoadingExercicios(true);
      const res = await fetch(`/api/treinos/exercicios?treinoId=${id_treino}`);
      const data = await res.json();
      setExercicios(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingExercicios(false);
    }
  }

  // --------- Fetch frequência mês ----------
  async function fetchFrequenciaMes(a: number, m: number) {
    if (!user?.id) return;
    try {
      setLoadingFreq(true);
      const params = new URLSearchParams();
      params.set('alunoId', String(user.id));
      params.set('ano', String(a));
      params.set('mes', String(m));

      const res = await fetch(`/api/frequencia/aluno?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        console.error(data?.error);
        setFreqMes(null);
        return;
      }
      setFreqMes(data);
    } catch (e) {
      console.error(e);
      setFreqMes(null);
    } finally {
      setLoadingFreq(false);
    }
  }

  // Inicial
  useEffect(() => {
    if (user?.id) {
      fetchTreinosAluno();
      fetchFrequenciaMes(ano, mes);
    }
  }, [user?.id]);

  // Troca de mês
  function irMesAnterior() {
    let novoAno = ano;
    let novoMes = mes - 1;
    if (novoMes < 1) {
      novoMes = 12;
      novoAno -= 1;
    }
    setAno(novoAno);
    setMes(novoMes);
    fetchFrequenciaMes(novoAno, novoMes);
  }

  function irProximoMes() {
    let novoAno = ano;
    let novoMes = mes + 1;
    if (novoMes > 12) {
      novoMes = 1;
      novoAno += 1;
    }
    setAno(novoAno);
    setMes(novoMes);
    fetchFrequenciaMes(novoAno, novoMes);
  }

  // Dados do calendário
  const primeiroDia = useMemo(() => new Date(ano, mes - 1, 1), [ano, mes]);
  const diasNoMes = useMemo(
    () => new Date(ano, mes, 0).getDate(),
    [ano, mes]
  );
  const diaSemanaPrimeiro = primeiroDia.getDay(); // 0=Domingo, 6=Sábado

  const totalPresencas = freqMes?.presencas ?? 0;
  const totalFaltas = freqMes?.faltas ?? 0;
  const percPresenca = freqMes ? freqMes.percentual_presenca.toFixed(1) : '0.0';

  return (
    <Protected allow={['ALUNO']}>
      <Shell title="Minha área">
        {/* Cabeçalho / Boas-vindas */}
        <section className="section">
          <h1 className="h1 mb-1">
            Olá, {user?.nome ?? 'Aluno'}
          </h1>
          <p className="muted text-sm">
            Aqui você acompanha seus treinos e sua frequência na academia.
          </p>
        </section>

        {/* Seção 1: Meus treinos */}
        <section className="section mt-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
            <div>
              <h2 className="h2 mb-1">Meus treinos</h2>
              <p className="muted text-sm">
                Visualize a ficha de exercícios montada pelo seu instrutor.
              </p>
            </div>
          </div>

          {loadingTreinos ? (
            <div className="text-sm text-gray-500">Carregando treinos...</div>
          ) : treinos.length === 0 ? (
            <div className="text-sm text-gray-500">
              Nenhum treino cadastrado ainda. Fale com seu instrutor.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-3">
              {/* Lista de treinos */}
              <div className="md:col-span-1">
                <div className="text-xs text-gray-500 mb-2">
                  {treinos.length} treino(s) disponível(is)
                </div>
                <div className="space-y-2">
                  {treinos.map((t) => (
                    <button
                      key={t.id_treino}
                      type="button"
                      onClick={() => {
                        setTreinoSelecionado(t);
                        fetchExerciciosTreino(t.id_treino);
                      }}
                      className={`w-full text-left border rounded-2xl px-3 py-2 hover:bg-gray-50 text-sm ${
                        treinoSelecionado?.id_treino === t.id_treino
                          ? 'border-blue-500 bg-blue-50'
                          : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{t.nome}</span>
                        <span className="text-[11px] text-gray-500">
                          {t.data_criacao
                            ? new Date(t.data_criacao).toLocaleDateString('pt-BR')
                            : ''}
                        </span>
                      </div>
                      {t.observacoes && (
                        <div className="mt-1 text-xs text-gray-600 line-clamp-2">
                          {t.observacoes}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Exercícios do treino selecionado */}
              <div className="md:col-span-2">
                {treinoSelecionado ? (
                  <>
                    <h3 className="font-semibold text-sm mb-2">
                      Ficha: {treinoSelecionado.nome}
                    </h3>
                    {loadingExercicios ? (
                      <div className="text-sm text-gray-500">
                        Carregando exercícios...
                      </div>
                    ) : exercicios.length === 0 ? (
                      <div className="text-sm text-gray-500">
                        Nenhum exercício cadastrado neste treino ainda.
                      </div>
                    ) : (
                      <div className="grid gap-3 md:grid-cols-2">
                        {exercicios.map((ex) => (
                          <div
                            key={ex.id_exercicio}
                            className="border rounded-2xl p-3 flex gap-3"
                          >
                            <div className="w-20 h-20 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                              {ex.imagem ? (
                                <img
                                  src={ex.imagem}
                                  alt={ex.nome_exercicio}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">
                                  sem imagem
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-sm">
                                {ex.nome_exercicio}
                              </div>
                              <div className="mt-1 text-xs text-gray-600">
                                {ex.series && ex.repeticoes && (
                                  <div>
                                    {ex.series} séries de {ex.repeticoes} reps
                                  </div>
                                )}
                                {ex.carga_kg && (
                                  <div>Carga: {ex.carga_kg} kg</div>
                                )}
                                {ex.descanso_segundos && (
                                  <div>Descanso: {ex.descanso_segundos} s</div>
                                )}
                              </div>
                              {ex.ordem && (
                                <div className="mt-1 text-[11px] text-gray-500">
                                  Ordem na ficha: {ex.ordem}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-sm text-gray-500">
                    Selecione um treino na lista ao lado.
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Seção 2: Frequência / Calendário */}
        <section className="section mt-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
            <div>
              <h2 className="h2 mb-1">Minha frequência</h2>
              <p className="muted text-sm">
                Acompanhe os dias em que você esteve presente ou faltou.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" onClick={irMesAnterior}>
                ◀
              </Button>
              <div className="text-sm font-medium">
                {nomeMes(mes)} / {ano}
              </div>
              <Button type="button" onClick={irProximoMes}>
                ▶
              </Button>
            </div>
          </div>

          {loadingFreq ? (
            <div className="text-sm text-gray-500">
              Carregando frequência...
            </div>
          ) : (
            <>
              {/* Indicadores rápidos */}
              <div className="grid gap-3 md:grid-cols-3 mb-4">
                <div className="card">
                  <div className="text-xs text-gray-500">Presenças</div>
                  <div className="text-2xl font-semibold text-green-600">
                    {totalPresencas}
                  </div>
                </div>
                <div className="card">
                  <div className="text-xs text-gray-500">Faltas</div>
                  <div className="text-2xl font-semibold text-red-600">
                    {totalFaltas}
                  </div>
                </div>
                <div className="card">
                  <div className="text-xs text-gray-500">% de presença no mês</div>
                  <div className="text-2xl font-semibold text-blue-600">
                    {percPresenca}%
                  </div>
                </div>
              </div>

              {/* Legenda */}
              <div className="flex items-center gap-4 text-xs mb-2">
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-green-500" /> Presente
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-red-500" /> Falta
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-gray-200 border border-gray-300" /> Sem registro
                </div>
              </div>

              {/* Calendário simples */}
              <div className="border rounded-2xl p-4 inline-block">
                <div className="grid grid-cols-7 gap-1 text-xs mb-1">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((dia, idx) => (
                    <div
                    key={`${dia}-${idx}`}
                    className="text-center font-semibold text-gray-600"
                    >
                    {dia}
                    </div>
                ))}
                </div>


                <div className="grid grid-cols-7 gap-1 text-xs">
                  {/* Espaços em branco antes do primeiro dia */}
                  {Array.from({ length: diaSemanaPrimeiro }).map((_, idx) => (
                    <div key={`blank-${idx}`} />
                  ))}

                  {/* Dias do mês */}
                  {Array.from({ length: diasNoMes }).map((_, idx) => {
                    const dia = idx + 1;
                    const status = mapaStatusPorDia.get(dia); // 'Presente' | 'Falta' | undefined

                    let bgClass =
                      'bg-gray-200 border border-gray-300 text-gray-800';
                    if (status === 'Presente') {
                      bgClass = 'bg-green-500 text-white';
                    } else if (status === 'Falta') {
                      bgClass = 'bg-red-500 text-white';
                    }

                    return (
                      <div
                        key={dia}
                        className={`h-8 w-8 flex items-center justify-center rounded-lg text-xs ${bgClass}`}
                      >
                        {dia}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </section>
      </Shell>
    </Protected>
  );
}
