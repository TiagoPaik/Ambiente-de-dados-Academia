import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id)
    const body = await req.json()
    const { id_professor, nome, cpf, email, status } = body

    const aluno = await prisma.aluno.update({
      where: { id_aluno: id },
      data: {
        id_professor: Number(id_professor),
        nome,
        cpf,
        email,
        status: status === 'Inativo' ? 'Inativo' : 'Ativo',
      },
      include: { professor: true },
    })

    return NextResponse.json(aluno)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id)
    await prisma.aluno.delete({ where: { id_aluno: id } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
