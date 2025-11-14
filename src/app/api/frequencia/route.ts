import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/frequencia?professorId=1&data=2025-11-13
export async function GET(req: NextRequest) {
  try {
    const professorIdParam = req.nextUrl.searchParams.get('professorId');
    const dataParam = req.nextUrl.searchParams.get('data');

    const id_professor = Number(professorIdParam);
    const data = dataParam || new Date().toISOString().slice(0, 10);

    if (!id_professor || Number.isNaN(id_professor)) {
      return NextResponse.json(
        { error: 'professorId inválido' },
        { status: 400 }
      );
    }

    const rows = await query<{
      id_aluno: number;
      nome: string;
      id_frequencia: number | null;
      status: 'Presente' | 'Falta' | null;
      observacao: string | null;
    }>(
      `
      SELECT
        a.id_aluno,
        a.nome,
        f.id_frequencia,
        f.status,
        f.observacao
      FROM Aluno a
      LEFT JOIN Frequencia f
        ON f.id_aluno = a.id_aluno
       AND f.data = :data
      WHERE a.id_professor = :id_professor
      ORDER BY a.nome ASC
      `,
      { id_professor, data }
    );

    return NextResponse.json({
      data,
      alunos: rows,
    });
  } catch (e: any) {
    console.error('Erro GET /api/frequencia:', e);
    return NextResponse.json(
      { error: 'Erro ao carregar frequência' },
      { status: 500 }
    );
  }
}

// POST /api/frequencia
// body: { id_aluno, data, status, observacao? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id_aluno, data, status, observacao } = body as {
      id_aluno?: number;
      data?: string;
      status?: 'Presente' | 'Falta';
      observacao?: string | null;
    };

    const alunoId = Number(id_aluno);

    if (!alunoId || Number.isNaN(alunoId) || !data || !status) {
      return NextResponse.json(
        { error: 'id_aluno, data e status são obrigatórios' },
        { status: 400 }
      );
    }

    if (status !== 'Presente' && status !== 'Falta') {
      return NextResponse.json(
        { error: 'Status inválido (use Presente ou Falta)' },
        { status: 400 }
      );
    }

    await query(
      `
      INSERT INTO Frequencia (id_aluno, data, status, observacao)
      VALUES (:id_aluno, :data, :status, :observacao)
      ON DUPLICATE KEY UPDATE
        status = VALUES(status),
        observacao = VALUES(observacao)
      `,
      {
        id_aluno: alunoId,
        data,
        status,
        observacao: observacao ?? null,
      }
    );

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('Erro POST /api/frequencia:', e);
    return NextResponse.json(
      { error: 'Erro ao salvar frequência' },
      { status: 500 }
    );
  }
}
