import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type TreinoRow = {
  id_treino: number;
  id_aluno: number;
  id_professor: number;
  nome: string;
  data_criacao: string;
  observacoes: string | null;
  nome_professor?: string | null;
};

// GET /api/treinos?alunoId=123  → lista treinos de um aluno
export async function GET(req: NextRequest) {
  try {
    const alunoIdParam = req.nextUrl.searchParams.get('alunoId');
    const id_aluno = Number(alunoIdParam);

    if (!id_aluno || Number.isNaN(id_aluno)) {
      return NextResponse.json(
        { error: 'alunoId inválido' },
        { status: 400 }
      );
    }

    const treinos = await query<TreinoRow>(
      `
      SELECT
        t.id_treino,
        t.id_aluno,
        t.id_professor,
        t.nome,
        t.data_criacao,
        t.observacoes,
        p.nome AS nome_professor
      FROM Treino t
      LEFT JOIN Professor p ON p.id_professor = t.id_professor
      WHERE t.id_aluno = :id_aluno
      ORDER BY t.data_criacao DESC, t.id_treino DESC
      `,
      { id_aluno }
    );

    return NextResponse.json(treinos);
  } catch (e: any) {
    console.error('Erro GET /api/treinos:', e);
    return NextResponse.json(
      { error: 'Erro ao listar treinos do aluno' },
      { status: 500 }
    );
  }
}

// POST /api/treinos  → criar novo treino para um aluno
// body: { id_aluno, nome, observacoes? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id_aluno, nome, observacoes } = body as {
      id_aluno?: number;
      nome?: string;
      observacoes?: string;
    };

    const alunoId = Number(id_aluno);
    if (!alunoId || Number.isNaN(alunoId) || !nome?.trim()) {
      return NextResponse.json(
        { error: 'id_aluno ou nome inválidos' },
        { status: 400 }
      );
    }

    // professor que será vinculado ao treino = professor do aluno
    const profRows = await query<{ id_professor: number }>(
      `
      SELECT id_professor
      FROM Aluno
      WHERE id_aluno = :id_aluno
      `,
      { id_aluno: alunoId }
    );

    if (!profRows.length) {
      return NextResponse.json(
        { error: 'Aluno não encontrado' },
        { status: 404 }
      );
    }

    const id_professor = profRows[0].id_professor;

    // cria o treino
    const result: any = await query<any>(
      `
      INSERT INTO Treino (id_aluno, id_professor, nome, observacoes)
      VALUES (:id_aluno, :id_professor, :nome, :observacoes)
      `,
      {
        id_aluno: alunoId,
        id_professor,
        nome: nome.trim(),
        observacoes: observacoes?.trim() || null,
      }
    );

    const insertId = result.insertId as number;

    const created = await query<TreinoRow>(
      `
      SELECT
        t.id_treino,
        t.id_aluno,
        t.id_professor,
        t.nome,
        t.data_criacao,
        t.observacoes,
        p.nome AS nome_professor
      FROM Treino t
      LEFT JOIN Professor p ON p.id_professor = t.id_professor
      WHERE t.id_treino = :id_treino
      `,
      { id_treino: insertId }
    );

    return NextResponse.json(created[0], { status: 201 });
  } catch (e: any) {
    console.error('Erro POST /api/treinos:', e);
    return NextResponse.json(
      { error: 'Erro ao criar treino' },
      { status: 500 }
    );
  }
}

// PUT /api/treinos  → atualizar nome/observacoes do treino
// body: { id_treino, nome?, observacoes? }
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id_treino, nome, observacoes } = body as {
      id_treino?: number;
      nome?: string;
      observacoes?: string | null;
    };

    const treinoId = Number(id_treino);
    if (!treinoId || Number.isNaN(treinoId)) {
      return NextResponse.json(
        { error: 'id_treino inválido' },
        { status: 400 }
      );
    }

    await query(
      `
      UPDATE Treino
      SET
        nome = COALESCE(:nome, nome),
        observacoes = :observacoes
      WHERE id_treino = :id_treino
      `,
      {
        id_treino: treinoId,
        nome: nome?.trim() || null,
        observacoes: observacoes?.trim() || null,
      }
    );

    const updated = await query<TreinoRow>(
      `
      SELECT
        t.id_treino,
        t.id_aluno,
        t.id_professor,
        t.nome,
        t.data_criacao,
        t.observacoes,
        p.nome AS nome_professor
      FROM Treino t
      LEFT JOIN Professor p ON p.id_professor = t.id_professor
      WHERE t.id_treino = :id_treino
      `,
      { id_treino: treinoId }
    );

    return NextResponse.json(updated[0] ?? null);
  } catch (e: any) {
    console.error('Erro PUT /api/treinos:', e);
    return NextResponse.json(
      { error: 'Erro ao atualizar treino' },
      { status: 500 }
    );
  }
}

// DELETE /api/treinos?id=123  → deletar treino (e itens via CASCADE)
export async function DELETE(req: NextRequest) {
  try {
    const idParam = req.nextUrl.searchParams.get('id');
    const id_treino = Number(idParam);

    if (!id_treino || Number.isNaN(id_treino)) {
      return NextResponse.json(
        { error: 'id inválido' },
        { status: 400 }
      );
    }

    await query(
      `
      DELETE FROM Treino
      WHERE id_treino = :id_treino
      `,
      { id_treino }
    );

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('Erro DELETE /api/treinos:', e);
    return NextResponse.json(
      { error: 'Erro ao excluir treino' },
      { status: 500 }
    );
  }
}
