// src/app/api/exercicios/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ExercicioRow = {
  id_exercicio: number;
  nome: string;
  grupo_muscular: string | null;
  imagem: string | null;
};

export async function GET(req: NextRequest) {
  try {
    const lista = await query<ExercicioRow>(
      `
      SELECT
        id_exercicio,
        nome,
        grupo_muscular,
        imagem
      FROM Exercicio
      ORDER BY nome ASC
      `
    );

    return NextResponse.json(lista);
  } catch (e: any) {
    console.error('Erro GET /api/exercicios:', e);
    return NextResponse.json(
      { error: 'Erro ao listar exercícios do catálogo' },
      { status: 500 }
    );
  }
}
