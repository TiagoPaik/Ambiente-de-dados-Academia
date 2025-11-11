import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/*
POST body:
{
  "id_aluno": 1,
  "id_professor": 2,
  "nome": "Treino A",
  "observacoes": "Peito e costas",
  "exercicios": [
    { "id_exercicio": 1, "series": 4, "repeticoes": 10, "carga_kg": 40, "descanso_segundos": 90 },
    { "id_exercicio": 2, "series": 3, "repeticoes": 12 }
  ],
  "marcarComoAtivo": true
}
*/
export async function GET(req: NextRequest) {
  try {
    const aluno = req.nextUrl.searchParams.get('aluno');
    const where = aluno ? { id_aluno: Number(aluno) } : {};
    const treinos = await prisma.treino.findMany({
      where,
      orderBy: { id_treino: 'desc' },
      include: { Treino_Exercicio: { include: { Exercicio: true } }, Aluno: true, Professor: true },
    });
    return NextResponse.json(treinos);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id_aluno, id_professor, nome, observacoes, exercicios, marcarComoAtivo } = body;
    if (!id_aluno || !id_professor || !nome) {
      return NextResponse.json({ error: 'id_aluno, id_professor e nome são obrigatórios' }, { status: 400 });
    }

    const created = await prisma.treino.create({
      data: {
        id_aluno,
        id_professor,
        nome,
        observacoes: observacoes ?? null,
        Treino_Exercicio: {
          create: (exercicios ?? []).map((it: any) => ({
            id_exercicio: it.id_exercicio,
            series: it.series ?? null,
            repeticoes: it.repeticoes ?? null,
            carga_kg: it.carga_kg ?? null,
            descanso_segundos: it.descanso_segundos ?? null,
          })),
        },
      },
      include: { Treino_Exercicio: true },
    });

    if (marcarComoAtivo) {
      await prisma.aluno.update({
        where: { id_aluno },
        data: { id_treino_ativo: created.id_treino },
      });
    }

    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
