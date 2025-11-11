import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get('q')?.trim()

    const where = q
      ? {
          OR: [
            { nome: { contains: q } },
            { email: { contains: q } },
            { cpf:   { contains: q } },
          ],
        }
      : {}

    // ⚠️ Relação correta é "professor" (minúsculo) no include
    const alunos = await prisma.aluno.findMany({
      where,
      orderBy: { id_aluno: 'desc' },
      include: { professor: true }, // <-- ajuste aqui
    })

    return NextResponse.json(alunos)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { id_professor, nome, cpf, email, status } = body

    if (!id_professor || !nome || !cpf || !email) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
    }

    const aluno = await prisma.aluno.create({
      data: {
        id_professor: Number(id_professor),
        nome,
        cpf,
        email,
        status: status === 'Inativo' ? 'Inativo' : 'Ativo',
      },
      include: { professor: true },
    })

    return NextResponse.json(aluno, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
