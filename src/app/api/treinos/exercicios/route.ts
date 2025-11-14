import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type TreinoExercicioRow = {
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

// GET /api/treinos/exercicios?treinoId=123
export async function GET(req: NextRequest) {
  try {
    const treinoIdParam = req.nextUrl.searchParams.get('treinoId');
    const id_treino = Number(treinoIdParam);

    if (!id_treino || Number.isNaN(id_treino)) {
      return NextResponse.json(
        { error: 'treinoId inválido' },
        { status: 400 }
      );
    }

    const list = await query<TreinoExercicioRow>(
      `
      SELECT
        te.id_treino,
        te.id_exercicio,
        te.ordem,
        te.series,
        te.repeticoes,
        te.carga_kg,
        te.descanso_segundos,
        e.nome AS nome_exercicio,
        e.imagem
      FROM Treino_Exercicio te
      JOIN Exercicio e ON e.id_exercicio = te.id_exercicio
      WHERE te.id_treino = :id_treino
      ORDER BY te.ordem ASC, e.nome ASC
      `,
      { id_treino }
    );

    return NextResponse.json(list);
  } catch (e: any) {
    console.error('Erro GET /api/treinos/exercicios:', e);
    return NextResponse.json(
      { error: 'Erro ao listar exercícios do treino' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id_treino,
      id_exercicio,
      series,
      repeticoes,
      carga_kg,
      descanso_segundos,
      ordem,
    } = body as {
      id_treino?: number;
      id_exercicio?: number;
      series?: number | null;
      repeticoes?: number | null;
      carga_kg?: number | null;
      descanso_segundos?: number | null;
      ordem?: number | null;
    };

    const treinoId = Number(id_treino);
    const exercicioId = Number(id_exercicio);

    if (!treinoId || Number.isNaN(treinoId) || !exercicioId || Number.isNaN(exercicioId)) {
      return NextResponse.json(
        { error: 'id_treino ou id_exercicio inválido' },
        { status: 400 }
      );
    }

    const ordemValue =
      typeof ordem === 'number' ? ordem : Number(ordem as any);

    if (!Number.isInteger(ordemValue) || ordemValue <= 0) {
      return NextResponse.json(
        { error: 'A ordem deve ser um inteiro positivo (1, 2, 3, ...).' },
        { status: 400 }
      );
    }

    // verifica se já existe alguém com essa ordem nesse treino
    const [row] = await query<{ total: number }>(
      `
      SELECT COUNT(*) AS total
      FROM Treino_Exercicio
      WHERE id_treino = :id_treino
        AND ordem = :ordem
      `,
      { id_treino: treinoId, ordem: ordemValue }
    );

    if (row.total > 0) {
      return NextResponse.json(
        { error: 'Já existe um exercício com essa ordem neste treino.' },
        { status: 409 }
      );
    }

    try {
      await query(
        `
        INSERT INTO Treino_Exercicio
          (id_treino, id_exercicio, ordem, series, repeticoes, carga_kg, descanso_segundos)
        VALUES
          (:id_treino, :id_exercicio, :ordem, :series, :repeticoes, :carga_kg, :descanso_segundos)
        `,
        {
          id_treino: treinoId,
          id_exercicio: exercicioId,
          ordem: ordemValue,
          series: series ?? null,
          repeticoes: repeticoes ?? null,
          carga_kg: carga_kg ?? null,
          descanso_segundos: descanso_segundos ?? null,
        }
      );
    } catch (e: any) {
      if (String(e.message).includes('Duplicate')) {
        // ainda pode bater UNIQUE(id_treino, id_exercicio) caso já exista esse exercício no treino
        return NextResponse.json(
          { error: 'Este exercício já está vinculado a este treino.' },
          { status: 409 }
        );
      }
      throw e;
    }

    const created = await query<TreinoExercicioRow>(
      `
      SELECT
        te.id_treino,
        te.id_exercicio,
        te.ordem,
        te.series,
        te.repeticoes,
        te.carga_kg,
        te.descanso_segundos,
        e.nome AS nome_exercicio,
        e.imagem
      FROM Treino_Exercicio te
      JOIN Exercicio e ON e.id_exercicio = te.id_exercicio
      WHERE te.id_treino = :id_treino
        AND te.id_exercicio = :id_exercicio
      `,
      { id_treino: treinoId, id_exercicio: exercicioId }
    );

    return NextResponse.json(created[0] ?? null, { status: 201 });
  } catch (e: any) {
    console.error('Erro POST /api/treinos/exercicios:', e);
    return NextResponse.json(
      { error: 'Erro ao adicionar exercício ao treino' },
      { status: 500 }
    );
  }
}


export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id_treino,
      id_exercicio,
      series,
      repeticoes,
      carga_kg,
      descanso_segundos,
      ordem,
    } = body as {
      id_treino?: number;
      id_exercicio?: number;
      series?: number | null;
      repeticoes?: number | null;
      carga_kg?: number | null;
      descanso_segundos?: number | null;
      ordem?: number | null;
    };

    const treinoId = Number(id_treino);
    const exercicioId = Number(id_exercicio);

    if (!treinoId || Number.isNaN(treinoId) || !exercicioId || Number.isNaN(exercicioId)) {
      return NextResponse.json(
        { error: 'id_treino ou id_exercicio inválido' },
        { status: 400 }
      );
    }

    const ordemValue =
      typeof ordem === 'number' ? ordem : Number(ordem as any);

    if (!Number.isInteger(ordemValue) || ordemValue <= 0) {
      return NextResponse.json(
        { error: 'A ordem deve ser um inteiro positivo (1, 2, 3, ...).' },
        { status: 400 }
      );
    }

    // verifica se existe outro exercício com essa mesma ordem nesse treino
    const [row] = await query<{ total: number }>(
      `
      SELECT COUNT(*) AS total
      FROM Treino_Exercicio
      WHERE id_treino = :id_treino
        AND ordem = :ordem
        AND id_exercicio <> :id_exercicio
      `,
      {
        id_treino: treinoId,
        ordem: ordemValue,
        id_exercicio: exercicioId,
      }
    );

    if (row.total > 0) {
      return NextResponse.json(
        { error: 'Já existe outro exercício com essa ordem neste treino.' },
        { status: 409 }
      );
    }

    await query(
      `
      UPDATE Treino_Exercicio
      SET
        series = :series,
        repeticoes = :repeticoes,
        carga_kg = :carga_kg,
        descanso_segundos = :descanso_segundos,
        ordem = :ordem
      WHERE id_treino = :id_treino
        AND id_exercicio = :id_exercicio
      `,
      {
        id_treino: treinoId,
        id_exercicio: exercicioId,
        series: series ?? null,
        repeticoes: repeticoes ?? null,
        carga_kg: carga_kg ?? null,
        descanso_segundos: descanso_segundos ?? null,
        ordem: ordemValue,
      }
    );

    const updated = await query<TreinoExercicioRow>(
      `
      SELECT
        te.id_treino,
        te.id_exercicio,
        te.ordem,
        te.series,
        te.repeticoes,
        te.carga_kg,
        te.descanso_segundos,
        e.nome AS nome_exercicio,
        e.imagem
      FROM Treino_Exercicio te
      JOIN Exercicio e ON e.id_exercicio = te.id_exercicio
      WHERE te.id_treino = :id_treino
        AND te.id_exercicio = :id_exercicio
      `,
      { id_treino: treinoId, id_exercicio: exercicioId }
    );

    return NextResponse.json(updated[0] ?? null);
  } catch (e: any) {
    console.error('Erro PUT /api/treinos/exercicios:', e);
    return NextResponse.json(
      { error: 'Erro ao atualizar exercício do treino' },
      { status: 500 }
    );
  }
}


// DELETE /api/treinos/exercicios?treinoId=1&exercicioId=2
export async function DELETE(req: NextRequest) {
  try {
    const treinoIdParam = req.nextUrl.searchParams.get('treinoId');
    const exercicioIdParam = req.nextUrl.searchParams.get('exercicioId');

    const id_treino = Number(treinoIdParam);
    const id_exercicio = Number(exercicioIdParam);

    if (!id_treino || Number.isNaN(id_treino) || !id_exercicio || Number.isNaN(id_exercicio)) {
      return NextResponse.json(
        { error: 'treinoId ou exercicioId inválido' },
        { status: 400 }
      );
    }

    await query(
      `
      DELETE FROM Treino_Exercicio
      WHERE id_treino = :id_treino
        AND id_exercicio = :id_exercicio
      `,
      { id_treino, id_exercicio }
    );

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('Erro DELETE /api/treinos/exercicios:', e);
    return NextResponse.json(
      { error: 'Erro ao remover exercício do treino' },
      { status: 500 }
    );
  }
}
