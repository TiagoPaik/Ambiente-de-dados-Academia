// src/app/api/alunos/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { tx, query } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { nome, cpf, email, senha, tipo_matricula } = await req.json();

    if (!nome || !cpf || !email || !senha) {
      return NextResponse.json(
        { error: 'Preencha nome, CPF, e-mail e senha.' },
        { status: 400 }
      );
    }

    // Garante tipo de matrícula válido
    const tipoValido = ['Mensal', 'Trimestral', 'Semestral', 'Anual'];
    const tipo =
      tipoValido.includes(tipo_matricula) ? tipo_matricula : 'Mensal';

    // Busca um professor ativo padrão (ADMIN depois pode alterar no CRUD)
    const profs = await query<{ id_professor: number }>(
      `SELECT id_professor
       FROM Professor
       WHERE status = 'Ativo'
       ORDER BY id_professor ASC
       LIMIT 1`
    );

    if (!profs.length) {
      return NextResponse.json(
        { error: 'Nenhum professor ativo cadastrado. Peça ao admin para criar um.' },
        { status: 500 }
      );
    }

    const id_professor = profs[0].id_professor;

    const created = await tx(async (conn) => {
      const [r] = await conn.execute(
        `INSERT INTO Aluno 
          (id_professor, nome, cpf, email, senha, status, tipo_matricula, data_pagamento)
         VALUES
          (:id_professor, :nome, :cpf, :email, :senha, 'Inativo', :tipo_matricula, CURDATE())`,
        { id_professor, nome, cpf, email, senha, tipo_matricula: tipo }
      );
      // @ts-ignore
      const insertId = r.insertId as number;

      const [rows] = await conn.query(
        `SELECT id_aluno, nome, cpf, email, status, tipo_matricula 
         FROM Aluno
         WHERE id_aluno = ?`,
        [insertId]
      );

      return (rows as any[])[0];
    });

    return NextResponse.json({ aluno: created }, { status: 201 });
  } catch (e: any) {
    console.error('Erro ao cadastrar aluno:', e);

    // Tratando erro de chave única (email / cpf duplicado)
    if (String(e?.message || '').includes('Duplicate')) {
      let campo = 'dados';
      if (String(e.message).includes('cpf')) campo = 'CPF';
      if (String(e.message).includes('email')) campo = 'e-mail';
      return NextResponse.json(
        { error: `${campo} já cadastrado` },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno ao cadastrar aluno' },
      { status: 500 }
    );
  }
}
