// src/app/api/admin/stats/route.ts
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type CountRow = { total: number };

export async function GET() {
  try {
    // Conta alunos
    const alunosRows = await query<CountRow>(
      'SELECT COUNT(*) AS total FROM Aluno'
    );
    const alunos = alunosRows[0]?.total ?? 0;

    // Conta instrutores (professores)
    const instrutoresRows = await query<CountRow>(
      'SELECT COUNT(*) AS total FROM Professor'
    );
    const instrutores = instrutoresRows[0]?.total ?? 0;

    // Conta treinos
    const treinosRows = await query<CountRow>(
      'SELECT COUNT(*) AS total FROM Treino'
    );
    const treinos = treinosRows[0]?.total ?? 0;

    // Se não tiver tabela de Aulas ainda, deixa 0
    const aulasHoje = 0;

    const result = {
      alunos,
      instrutores,
      treinos,
      aulasHoje,
    };

    return NextResponse.json(result);
  } catch (e: any) {
    console.error('Erro em /api/admin/stats:', e);
    return NextResponse.json(
      { error: 'Erro ao carregar estatísticas' },
      { status: 500 }
    );
  }
}
