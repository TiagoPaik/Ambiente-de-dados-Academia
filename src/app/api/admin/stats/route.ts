// app/api/admin/stats/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const [alunos, instrutores, treinos] = await Promise.all([
      prisma.aluno.count(),
      prisma.professor.count(),
      prisma.treino.count(),
    ])

    // Não existe tabela Aula no schema atual, então devolvo 0.
    const aulasHoje = 0

    return NextResponse.json({
      alunos,
      instrutores,
      treinos,
      aulasHoje,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
