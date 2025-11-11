import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    const prof = await prisma.professor.findUnique({ where: { id_professor: id } });
    if (!prof) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
    return NextResponse.json(prof);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    const body = await req.json();
    // Campos permitidos pra update
    const { nome, cpf, email, senha, status } = body ?? {};

    const prof = await prisma.professor.update({
      where: { id_professor: id },
      data: { 
        ...(nome !== undefined ? { nome } : {}),
        ...(cpf !== undefined ? { cpf } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(senha !== undefined ? { senha } : {}),
        ...(status !== undefined ? { status } : {}),
      },
    });
    return NextResponse.json(prof);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    // Se preferir "excluir lógico", troque por update status='Inativo'
    // await prisma.professor.update({ where: { id_professor: id }, data: { status: 'Inativo' } });
    await prisma.professor.delete({ where: { id_professor: id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    // Se houver FK (ex.: Treino), a deleção pode falhar; trate aqui:
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
