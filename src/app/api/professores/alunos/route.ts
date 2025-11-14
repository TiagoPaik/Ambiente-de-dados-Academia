import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type AlunoRow = {
  id_aluno: number;
  id_professor: number;
  nome: string;
  email: string;
  status: 'Ativo' | 'Inativo';
  tipo_matricula: 'Mensal' | 'Trimestral' | 'Semestral' | 'Anual';
  data_pagamento: string | null;
  data_vencimento: string | null;
  situacao_matricula: 'Em dia' | 'Vencida' | 'Sem data';
};

// GET /api/professores/alunos?professorId=1&q=tiago
export async function GET(req: NextRequest) {
  try {
    const professorIdParam = req.nextUrl.searchParams.get('professorId');
    const q = req.nextUrl.searchParams.get('q') || '';

    const id_professor = Number(professorIdParam);
    if (!id_professor || Number.isNaN(id_professor)) {
      return NextResponse.json(
        { error: 'professorId inválido' },
        { status: 400 }
      );
    }

    const whereSearch = q.trim()
      ? `AND (a.nome LIKE :q OR a.email LIKE :q)`
      : '';

    const alunos = await query<AlunoRow>(
      `
      SELECT
        a.id_aluno,
        a.id_professor,
        a.nome,
        a.email,
        a.status,
        a.tipo_matricula,
        a.data_pagamento,
        a.data_vencimento,
        CASE
          WHEN a.data_vencimento IS NULL THEN 'Sem data'
          WHEN a.data_vencimento >= CURDATE() THEN 'Em dia'
          ELSE 'Vencida'
        END AS situacao_matricula
      FROM Aluno a
      WHERE a.id_professor = :id_professor
      ${whereSearch}
      ORDER BY a.nome
      `,
      {
        id_professor,
        q: q.trim() ? `%${q.trim()}%` : undefined,
      }
    );

    return NextResponse.json(alunos);
  } catch (e: any) {
    console.error('Erro GET /api/professores/alunos:', e);
    return NextResponse.json(
      { error: 'Erro ao listar alunos do professor' },
      { status: 500 }
    );
  }
}

// PUT /api/professores/alunos  → atualizar status
// body: { id_aluno, status, professorId }
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id_aluno, status, professorId } = body as {
      id_aluno?: number;
      status?: 'Ativo' | 'Inativo';
      professorId?: number;
    };

    const alunoId = Number(id_aluno);
    const profId = Number(professorId);

    if (!alunoId || Number.isNaN(alunoId) || !profId || Number.isNaN(profId)) {
      return NextResponse.json(
        { error: 'id_aluno ou professorId inválido' },
        { status: 400 }
      );
    }

    if (status !== 'Ativo' && status !== 'Inativo') {
      return NextResponse.json(
        { error: 'Status inválido' },
        { status: 400 }
      );
    }

    // Garante que o professor só atualiza aluno vinculado a ele
    const result: any = await query(
      `
      UPDATE Aluno
      SET status = :status
      WHERE id_aluno = :id_aluno
        AND id_professor = :id_professor
      `,
      {
        status,
        id_aluno: alunoId,
        id_professor: profId,
      }
    );

    if (!result.affectedRows) {
      return NextResponse.json(
        { error: 'Aluno não encontrado para este professor' },
        { status: 404 }
      );
    }

    const [updated] = await query<AlunoRow>(
      `
      SELECT
        a.id_aluno,
        a.id_professor,
        a.nome,
        a.email,
        a.status,
        a.tipo_matricula,
        a.data_pagamento,
        a.data_vencimento,
        CASE
          WHEN a.data_vencimento IS NULL THEN 'Sem data'
          WHEN a.data_vencimento >= CURDATE() THEN 'Em dia'
          ELSE 'Vencida'
        END AS situacao_matricula
      FROM Aluno a
      WHERE a.id_aluno = :id_aluno
      `,
      { id_aluno: alunoId }
    );

    return NextResponse.json(updated);
  } catch (e: any) {
    console.error('Erro PUT /api/professores/alunos:', e);
    return NextResponse.json(
      { error: 'Erro ao atualizar status do aluno' },
      { status: 500 }
    );
  }
}
