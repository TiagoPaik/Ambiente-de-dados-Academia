import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const itens = await prisma.exercicio.findMany({ orderBy: { id_exercicio: 'asc' } });
    return NextResponse.json(itens);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { nome, descricao, grupo_muscular, equipamento } = await req.json();
    if (!nome) return NextResponse.json({ error: 'nome é obrigatório' }, { status: 400 });
    const it = await prisma.exercicio.create({
      data: { nome, descricao: descricao ?? null, grupo_muscular: grupo_muscular ?? null, equipamento: equipamento ?? null },
    });
    return NextResponse.json(it, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
