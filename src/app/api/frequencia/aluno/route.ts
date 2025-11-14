import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RowFreq = {
  data: string;
  status: 'Presente' | 'Falta';
};

function toInt(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const n = Number(value);
  return Number.isNaN(n) ? fallback : n;
}

function formatDateYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const alunoIdParam = searchParams.get('alunoId');
    if (!alunoIdParam) {
      return NextResponse.json(
        { error: 'Informe alunoId' },
        { status: 400 }
      );
    }

    const id_aluno = Number(alunoIdParam);
    if (!Number.isInteger(id_aluno) || id_aluno <= 0) {
      return NextResponse.json(
        { error: 'alunoId inválido' },
        { status: 400 }
      );
    }

    const hoje = new Date();
    const ano = toInt(searchParams.get('ano'), hoje.getFullYear());
    const mes = toInt(searchParams.get('mes'), hoje.getMonth() + 1); // 1..12

    // início e fim do mês
    const inicio = new Date(ano, mes - 1, 1);
    const fim = new Date(ano, mes, 0);

    const inicioStr = formatDateYMD(inicio);
    const fimStr = formatDateYMD(fim);

    const rows = await query<RowFreq>(
      `
      SELECT
        data,
        status
      FROM Frequencia
      WHERE id_aluno = :id_aluno
        AND data BETWEEN :inicio AND :fim
      ORDER BY data
      `,
      { id_aluno, inicio: inicioStr, fim: fimStr }
    );

    let presencas = 0;
    let faltas = 0;

    for (const r of rows) {
      if (r.status === 'Presente') presencas++;
      else if (r.status === 'Falta') faltas++;
    }

    const total = presencas + faltas;
    const percentual_presenca = total > 0 ? (presencas / total) * 100 : 0;

    return NextResponse.json({
      ano,
      mes,
      registros: rows, // [{data:'2025-11-01', status:'Presente'}...]
      presencas,
      faltas,
      percentual_presenca,
    });
  } catch (e: any) {
    console.error('Erro GET /api/frequencia/aluno:', e);
    return NextResponse.json(
      { error: 'Erro ao buscar frequência do aluno' },
      { status: 500 }
    );
  }
}
