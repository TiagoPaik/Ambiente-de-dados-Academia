// src/app/api/admin/stats/route.ts
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type CountRow = { total: number };

export async function GET() {
  try {
    const [alunosRows, instrutoresRows, treinosRows] = await Promise.all([
      query<CountRow>('SELECT COUNT(*) AS total FROM Aluno'),
      query<CountRow>('SELECT COUNT(*) AS total FROM Professor'),
      query<CountRow>('SELECT COUNT(*) AS total FROM Treino'),
    ]);

    const alunos = alunosRows[0]?.total ?? 0;
    const instrutores = instrutoresRows[0]?.total ?? 0;
    const treinos = treinosRows[0]?.total ?? 0;

    // ainda não temos tabela de aulas / sessões → deixa 0
    const aulasHoje = 0;

    return NextResponse.json({
      alunos,
      instrutores,
      treinos,
      aulasHoje,
    });
  } catch (e: any) {
    console.error('Erro em /api/admin/stats:', e);
    return NextResponse.json(
      { error: 'Erro ao carregar estatísticas' },
      { status: 500 }
    );
  }
}
