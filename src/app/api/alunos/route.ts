import { NextRequest, NextResponse } from 'next/server';
import { query, tx } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type StatusAluno = 'Ativo' | 'Inativo';
type TipoMatricula = 'Mensal' | 'Trimestral' | 'Semestral' | 'Anual';

type AlunoRow = {
  id_aluno: number;
  id_professor: number | null;
  nome: string;
  cpf: string;
  email: string;
  senha: string;
  status: StatusAluno;
  tipo_matricula: TipoMatricula;
  nome_professor?: string | null;
};

// =========================================================
// GET - listar alunos (com professor)
// =========================================================
export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get('q')?.trim();

    let sql = `
      SELECT 
        a.id_aluno,
        a.id_professor,
        a.nome,
        a.cpf,
        a.email,
        a.senha,
        a.status,
        a.tipo_matricula,
        p.nome AS nome_professor
      FROM Aluno a
      LEFT JOIN Professor p ON p.id_professor = a.id_professor
    `;

    const params: any = {};

    if (q) {
      sql += `
        WHERE a.nome  LIKE :q
           OR a.email LIKE :q
           OR a.cpf   LIKE :q
      `;
      params.q = `%${q}%`;
    }

    sql += ` ORDER BY a.id_aluno DESC`;

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

// =========================================================
// POST - criar aluno
// =========================================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      nome,
      cpf,
      email,
      senha,
      status = 'Inativo',         // 🔹 padrão INATIVO
      tipo_matricula = 'Mensal',
      id_professor,
    } = body as {
      nome?: string;
      cpf?: string;
      email?: string;
      senha?: string;
      status?: StatusAluno;
      tipo_matricula?: TipoMatricula;
      id_professor?: number | null;
    };

    if (!nome || !cpf || !email || !senha) {
      return NextResponse.json(
        { error: 'Nome, CPF, e-mail e senha são obrigatórios' },
        { status: 400 }
      );
    }

    const tiposValidos: TipoMatricula[] = [
      'Mensal',
      'Trimestral',
      'Semestral',
      'Anual',
    ];
    const tipo: TipoMatricula = tiposValidos.includes(tipo_matricula)
      ? tipo_matricula
      : 'Mensal';

    const created = await tx(async (conn) => {
      // Se não veio id_professor, pega o primeiro professor ATIVO
      let professorId = id_professor ?? null;

      if (professorId == null) {
        const [rowsProf] = await conn.query(
          `
          SELECT id_professor
          FROM Professor
          WHERE status = 'Ativo'
          ORDER BY id_professor ASC
          LIMIT 1
          `
        );
        const prof = (rowsProf as any[])[0];
        if (!prof) {
          throw new Error(
            'Nenhum professor ativo encontrado para vincular ao aluno.'
          );
        }
        professorId = prof.id_professor as number;
      }

      const [r] = await conn.execute(
        `
        INSERT INTO Aluno
          (id_professor, nome, cpf, email, senha, status, tipo_matricula, data_pagamento)
        VALUES
          (
            :id_professor,
            :nome,
            :cpf,
            :email,
            :senha,
            :status,
            :tipo_matricula,
            CURDATE()
          )
        `,
        {
          id_professor: professorId,
          nome,
          cpf,
          email,
          senha,
          status,
          tipo_matricula: tipo,
        }
      );
      // @ts-ignore
      const insertId = r.insertId as number;

      const [rows] = await conn.query(
        `
        SELECT 
          a.id_aluno,
          a.id_professor,
          a.nome,
          a.cpf,
          a.email,
          a.status,
          a.tipo_matricula,
          p.nome AS nome_professor
        FROM Aluno a
        LEFT JOIN Professor p ON p.id_professor = a.id_professor
        WHERE a.id_aluno = ?
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
      { error: e.message || 'Erro ao criar aluno' },
      { status: 500 }
    );
  }
}

// =========================================================
// PUT - atualizar aluno
// =========================================================
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
      id_professor,
    } = body as {
      id_aluno?: number;
      nome?: string;
      cpf?: string;
      email?: string;
      senha?: string;
      status?: StatusAluno;
      tipo_matricula?: TipoMatricula;
      id_professor?: number | null;
    };

    const id = Number(id_aluno);
    if (!id || Number.isNaN(id)) {
      return NextResponse.json(
        { error: 'id_aluno inválido' },
        { status: 400 }
      );
    }

    const tiposValidos: TipoMatricula[] = [
      'Mensal',
      'Trimestral',
      'Semestral',
      'Anual',
    ];
    const tipo: TipoMatricula = tipo_matricula && tiposValidos.includes(tipo_matricula)
      ? tipo_matricula
      : 'Mensal';

    const updated = await tx(async (conn) => {
      // Monta os parâmetros base
      const paramsBase: any = {
        id,
        nome,
        cpf,
        email,
        status,
        tipo_matricula: tipo,
      };

      // Atualiza com ou sem senha, mas sempre permite atualizar id_professor (se vier)
      if (senha) {
        await conn.execute(
          `
          UPDATE Aluno
          SET 
            nome = :nome,
            cpf  = :cpf,
            email = :email,
            senha = :senha,
            status = :status,
            tipo_matricula = :tipo_matricula,
            id_professor = COALESCE(:id_professor, id_professor)
          WHERE id_aluno = :id
          `,
          { ...paramsBase, senha, id_professor }
        );
      } else {
        await conn.execute(
          `
          UPDATE Aluno
          SET 
            nome = :nome,
            cpf  = :cpf,
            email = :email,
            status = :status,
            tipo_matricula = :tipo_matricula,
            id_professor = COALESCE(:id_professor, id_professor)
          WHERE id_aluno = :id
          `,
          { ...paramsBase, id_professor }
        );
      }

      const [rows] = await conn.query(
        `
        SELECT 
          a.id_aluno,
          a.id_professor,
          a.nome,
          a.cpf,
          a.email,
          a.status,
          a.tipo_matricula,
          p.nome AS nome_professor
        FROM Aluno a
        LEFT JOIN Professor p ON p.id_professor = a.id_professor
        WHERE a.id_aluno = ?
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
      { error: e.message || 'Erro ao atualizar aluno' },
      { status: 500 }
    );
  }
}

// =========================================================
// DELETE - remover aluno
// =========================================================
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
