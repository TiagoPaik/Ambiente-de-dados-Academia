import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Valores mensais por tipo de matrícula
const VALOR_MENSAL_POR_TIPO: Record<string, number> = {
  Mensal: 120,
  Trimestral: 100,
  Semestral: 90,
  Anual: 80,
};

type TotaisRow = {
  total: number;
  ativos: number;
  inativos: number;
};

type TipoRow = {
  tipo_matricula: string;
  qtd: number;
};

type FrequenciaRow = {
  id_aluno: number;
  nome: string;
  presencas: number | null;
  faltas: number | null;
};

function formatDateYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export async function GET(req: NextRequest) {
  try {
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

    const inicioStr = formatDateYMD(inicioMes);
    const fimStr = formatDateYMD(fimMes);

    const mesReferencia = `${inicioMes.toLocaleString('pt-BR', {
      month: 'long',
    })} / ${inicioMes.getFullYear()}`;

    // 1) Totais
    const [totais] = await query<TotaisRow>(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'Ativo' THEN 1 ELSE 0 END) AS ativos,
        SUM(CASE WHEN status = 'Inativo' THEN 1 ELSE 0 END) AS inativos
      FROM Aluno
    `);

    // 2) Tipos de matrícula
    const porTipo = await query<TipoRow>(`
      SELECT
        tipo_matricula,
        COUNT(*) AS qtd
      FROM Aluno
      WHERE status = 'Ativo'
      GROUP BY tipo_matricula
      ORDER BY tipo_matricula
    `);

    let faturamentoTotalMensal = 0;
    const porTipoComValores = porTipo.map((t) => {
      const valor_mensal = VALOR_MENSAL_POR_TIPO[t.tipo_matricula] ?? 0;
      const faturamento = valor_mensal * t.qtd;
      faturamentoTotalMensal += faturamento;
      return {
        tipo_matricula: t.tipo_matricula,
        qtd: t.qtd,
        valor_mensal,
        faturamento,
      };
    });

    // 3) Frequência
    const freq = await query<FrequenciaRow>(
      `
      SELECT
        a.id_aluno,
        a.nome,
        SUM(CASE WHEN f.status = 'Presente' THEN 1 ELSE 0 END) AS presencas,
        SUM(CASE WHEN f.status = 'Falta' THEN 1 ELSE 0 END) AS faltas
      FROM Aluno a
      LEFT JOIN Frequencia f
        ON f.id_aluno = a.id_aluno
       AND f.data BETWEEN :inicio AND :fim
      GROUP BY a.id_aluno, a.nome
      ORDER BY a.nome
      `,
      { inicio: inicioStr, fim: fimStr }
    );

    const frequenciaComPercentual = freq.map((r) => {
  const pres = Number(r.presencas) || 0;
  const falt = Number(r.faltas) || 0;
  const total = pres + falt;
  const perc = total > 0 ? (pres / total) * 100 : 0;

  console.log('DEBUG FREQ', {
    id_aluno: r.id_aluno,
    nome: r.nome,
    pres,
    falt,
    total,
    perc,
  });

  return {
    id_aluno: r.id_aluno,
    nome: r.nome,
    presencas: pres,
    faltas: falt,
    percentual_presenca: perc,
  };
});


    return NextResponse.json({
      mes_referencia: mesReferencia,
      totais: {
        total: totais?.total ?? 0,
        ativos: totais?.ativos ?? 0,
        inativos: totais?.inativos ?? 0,
      },
      por_tipo: porTipoComValores,
      faturamento_total_mensal: faturamentoTotalMensal,
      frequencia: frequenciaComPercentual,
    });
  } catch (e: any) {
    console.error('Erro GET /api/relatorios/academia:', e);
    return NextResponse.json(
      { error: 'Erro ao gerar relatório da academia' },
      { status: 500 }
    );
  }
}
