'use client';

import { useEffect, useState } from 'react';
import Protected from '@/components/Protected';
import Shell from '@/components/Shell';

type TipoResumo = {
  tipo_matricula: string;
  qtd: number;
  valor_mensal: number;
  faturamento: number;
};

type FrequenciaAluno = {
  id_aluno: number;
  nome: string;
  presencas: number;
  faltas: number;
  percentual_presenca: number;
};

type RelatorioAcademia = {
  mes_referencia: string;
  totais: {
    total: number;
    ativos: number;
    inativos: number;
  };
  por_tipo: TipoResumo[];
  faturamento_total_mensal: number;
  frequencia: FrequenciaAluno[];
};

function formatCurrency(valor: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

export default function RelatoriosPage() {
  const [data, setData] = useState<RelatorioAcademia | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetch('/api/relatorios/academia', {
          cache: 'no-store',
        });
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <Protected allow={['ADMIN']}>
      <Shell title="Relatórios">
        <section className="section">
          <h1 className="h1 mb-2">Relatório da Academia</h1>
          <p className="muted text-sm mb-4">
          </p>

          {loading && (
            <div className="text-sm text-gray-500">Carregando relatório...</div>
          )}

          {!loading && !data && (
            <div className="text-sm text-red-600">
              Não foi possível carregar o relatório.
            </div>
          )}

          {!loading && data && (
            <>
              <div className="text-xs text-gray-500 mb-3">
                Mês de referência: {data.mes_referencia}
              </div>

              {/* Cards de resumo */}
              <div className="grid gap-4 md:grid-cols-4 mb-6">
                <div className="card">
                  <div className="text-xs text-gray-500">Total de alunos</div>
                  <div className="text-2xl font-semibold">
                    {data.totais.total}
                  </div>
                </div>
                <div className="card">
                  <div className="text-xs text-gray-500">Alunos ativos</div>
                  <div className="text-2xl font-semibold text-green-600">
                    {data.totais.ativos}
                  </div>
                </div>
                <div className="card">
                  <div className="text-xs text-gray-500">Alunos inativos</div>
                  <div className="text-2xl font-semibold text-yellow-600">
                    {data.totais.inativos}
                  </div>
                </div>
                <div className="card">
                  <div className="text-xs text-gray-500">Faturamento mensal estimado</div>
                  <div className="text-xl font-semibold text-blue-600">
                    {formatCurrency(data.faturamento_total_mensal)}
                  </div>
                </div>
              </div>

              {/* Tabela por tipo de matrícula */}
              <div className="border rounded-2xl p-4 mb-6">
                <h2 className="font-semibold mb-2 text-sm">
                  Alunos por tipo de matrícula
                </h2>
                {data.por_tipo.length === 0 ? (
                  <div className="text-sm text-gray-500">
                    Nenhum aluno ativo cadastrado.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="py-2 pr-4">Tipo</th>
                          <th className="py-2 pr-4">Qtd. alunos</th>
                          <th className="py-2 pr-4">Valor mensal (por aluno)</th>
                          <th className="py-2 pr-4">Faturamento mensal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.por_tipo.map((t) => (
                          <tr key={t.tipo_matricula} className="border-b">
                            <td className="py-2 pr-4">{t.tipo_matricula}</td>
                            <td className="py-2 pr-4">{t.qtd}</td>
                            <td className="py-2 pr-4">
                              {formatCurrency(t.valor_mensal)}
                            </td>
                            <td className="py-2 pr-4">
                              {formatCurrency(t.faturamento)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Frequência por aluno */}
              <div className="border rounded-2xl p-4">
                <h2 className="font-semibold mb-2 text-sm">
                  Frequência dos alunos (mês atual)
                </h2>
                {data.frequencia.length === 0 ? (
                  <div className="text-sm text-gray-500">
                    Nenhum registro de frequência encontrado para este mês.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="py-2 pr-4">Aluno</th>
                          <th className="py-2 pr-4">Presenças</th>
                          <th className="py-2 pr-4">Faltas</th>
                          <th className="py-2 pr-4">% Presença</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.frequencia.map((f) => (
                          <tr key={f.id_aluno} className="border-b">
                            <td className="py-2 pr-4">{f.nome}</td>
                            <td className="py-2 pr-4">{f.presencas}</td>
                            <td className="py-2 pr-4">{f.faltas}</td>
                            <td className="py-2 pr-4">
                              {f.percentual_presenca.toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </Shell>
    </Protected>
  );
}
