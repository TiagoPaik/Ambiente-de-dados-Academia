// app/api/alunos/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    const body = await req.json();
    const { id_professor, nome, cpf, email, status } = body;

    if (!id || !id_professor || !nome || !cpf || !email) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando.' },
        { status: 400 }
      );
    }

    // Atualiza
    await db.query(
      `UPDATE Aluno
       SET id_professor = ?, nome = ?, cpf = ?, email = ?, status = ?
       WHERE id_aluno = ?`,
      [Number(id_professor), nome, cpf, email, status === 'Inativo' ? 'Inativo' : 'Ativo', id]
    );

    // Retorna o registro atualizado (com join do professor)
    const [rows] = await db.query(
      `SELECT a.*, p.nome AS professor_nome, p.email AS professor_email
       FROM Aluno a
       JOIN Professor p ON p.id_professor = a.id_professor
       WHERE a.id_aluno = ?`,
      [id]
    );

    const aluno = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
    if (!aluno) return NextResponse.json({ error: 'Aluno não encontrado' }, { status: 404 });

    return NextResponse.json(aluno);
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    if (!id) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

    await db.query('DELETE FROM Aluno WHERE id_aluno = ?', [id]);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
