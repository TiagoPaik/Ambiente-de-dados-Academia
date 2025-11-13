import { NextRequest, NextResponse } from 'next/server';
import { query, tx } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type StatusAluno = 'Ativo' | 'Inativo';
type TipoMatricula = 'Mensal' | 'Trimestral' | 'Semestral' | 'Anual';

type AlunoRow = {
  id_aluno: number;
  nome: string;
  cpf: string;
  email: string;
  senha: string;
  status: StatusAluno;
  tipo_matricula: TipoMatricula;
};

// GET - listar alunos
export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get('q')?.trim();

    let sql = `
      SELECT id_aluno, nome, cpf, email, senha, status, tipo_matricula
      FROM Aluno
    `;
    const params: any = {};

    if (q) {
      sql += `
        WHERE nome  LIKE :q
           OR email LIKE :q
           OR cpf   LIKE :q
      `;
      params.q = `%${q}%`;
    }

    sql += ` ORDER BY id_aluno DESC`;

    const list = await query<AlunoRow>(sql, params);

    // Não devolvo senha pra listagem
    const safe = list.map(({ senha, ...rest }) => rest);
    return NextResponse.json(safe);
  } catch (e: any) {
    console.error('Erro GET /api/alunos:', e);
    return NextResponse.json(
      { error: 'Erro ao listar alunos' },
      { status: 500 }
    );
  }
}

// POST - criar aluno
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      nome,
      cpf,
      email,
      senha,
      status = 'Ativo',
      tipo_matricula = 'Mensal',
    } = body;

    if (!nome || !cpf || !email || !senha) {
      return NextResponse.json(
        { error: 'Nome, CPF, e-mail e senha são obrigatórios' },
        { status: 400 }
      );
    }

    const tiposValidos = ['Mensal', 'Trimestral', 'Semestral', 'Anual'];
    const tipo = tiposValidos.includes(tipo_matricula)
      ? tipo_matricula
      : 'Mensal';

    const created = await tx(async (conn) => {
      const [r] = await conn.execute(
        `
        INSERT INTO Aluno
          (id_professor, nome, cpf, email, senha, status, tipo_matricula, data_pagamento)
        VALUES
          (
            -- professor padrão: primeiro ATIVO
            (SELECT id_professor FROM Professor WHERE status = 'Ativo' ORDER BY id_professor ASC LIMIT 1),
            :nome,
            :cpf,
            :email,
            :senha,
            :status,
            :tipo_matricula,
            CURDATE()
          )
        `,
        { nome, cpf, email, senha, status, tipo_matricula: tipo }
      );
      // @ts-ignore
      const insertId = r.insertId as number;

      const [rows] = await conn.query(
        `
        SELECT id_aluno, nome, cpf, email, status, tipo_matricula
        FROM Aluno
        WHERE id_aluno = ?
        `,
        [insertId]
      );

      return (rows as any[])[0];
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    console.error('Erro POST /api/alunos:', e);
    if (String(e.message).includes('Duplicate')) {
      let campo = 'Dados';
      if (e.message.includes('cpf')) campo = 'CPF';
      if (e.message.includes('email')) campo = 'E-mail';
      return NextResponse.json(
        { error: `${campo} já cadastrado` },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Erro ao criar aluno' },
      { status: 500 }
    );
  }
}

// PUT - atualizar aluno
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id_aluno,
      nome,
      cpf,
      email,
      senha,
      status,
      tipo_matricula,
    } = body;

    const id = Number(id_aluno);
    if (!id || Number.isNaN(id)) {
      return NextResponse.json(
        { error: 'id_aluno inválido' },
        { status: 400 }
      );
    }

    const tiposValidos = ['Mensal', 'Trimestral', 'Semestral', 'Anual'];
    const tipo = tiposValidos.includes(tipo_matricula)
      ? tipo_matricula
      : 'Mensal';

    const updated = await tx(async (conn) => {
      if (senha) {
        await conn.execute(
          `
          UPDATE Aluno
          SET nome = :nome,
              cpf  = :cpf,
              email = :email,
              senha = :senha,
              status = :status,
              tipo_matricula = :tipo_matricula
          WHERE id_aluno = :id
          `,
          { id, nome, cpf, email, senha, status, tipo_matricula: tipo }
        );
      } else {
        await conn.execute(
          `
          UPDATE Aluno
          SET nome = :nome,
              cpf  = :cpf,
              email = :email,
              status = :status,
              tipo_matricula = :tipo_matricula
          WHERE id_aluno = :id
          `,
          { id, nome, cpf, email, status, tipo_matricula: tipo }
        );
      }

      const [rows] = await conn.query(
        `
        SELECT id_aluno, nome, cpf, email, status, tipo_matricula
        FROM Aluno
        WHERE id_aluno = ?
        `,
        [id]
      );

      return (rows as any[])[0];
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    console.error('Erro PUT /api/alunos:', e);
    if (String(e.message).includes('Duplicate')) {
      let campo = 'Dados';
      if (e.message.includes('cpf')) campo = 'CPF';
      if (e.message.includes('email')) campo = 'E-mail';
      return NextResponse.json(
        { error: `${campo} já cadastrado` },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Erro ao atualizar aluno' },
      { status: 500 }
    );
  }
}

// DELETE - remover aluno
export async function DELETE(req: NextRequest) {
  try {
    const idParam = req.nextUrl.searchParams.get('id');
    const id = Number(idParam);

    if (!id || Number.isNaN(id)) {
      return NextResponse.json(
        { error: 'id inválido' },
        { status: 400 }
      );
    }

    await query(`DELETE FROM Aluno WHERE id_aluno = :id`, { id });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('Erro DELETE /api/alunos:', e);
    return NextResponse.json(
      { error: 'Erro ao excluir aluno' },
      { status: 500 }
    );
  }
}
