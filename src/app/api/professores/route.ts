import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get('q')?.trim();
    const where = q
      ? {
          OR: [
            { nome: { contains: q } },
            { email: { contains: q } },
            { cpf: { contains: q } },
          ],
        }
      : {};
    const list = await prisma.professor.findMany({
      where,
      orderBy: { id_professor: 'desc' },
    });
    return NextResponse.json(list);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nome, cpf, email, senha, status = 'Ativo' } = body;

    if (!nome || !cpf || !email || !senha) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 });
    }

    const created = await prisma.professor.create({
      data: { nome, cpf, email, senha, status },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id_professor, nome, cpf, email, senha, status } = body;

    const id = Number(id_professor);
    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ error: 'id_professor inválido' }, { status: 400 });
    }

    const updated = await prisma.professor.update({
      where: { id_professor: id },
      data: { nome, cpf, email, senha, status },
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const idParam = req.nextUrl.searchParams.get('id');
    const id = Number(idParam);
    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ error: 'id inválido' }, { status: 400 });
    }

    await prisma.professor.delete({ where: { id_professor: id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
