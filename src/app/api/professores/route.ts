import { NextRequest, NextResponse } from 'next/server';
import { query, tx } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// =========================================================
// GET — LISTAR PROFESSORES + BUSCA
// =========================================================

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get('q')?.trim();

    let sql = `
      SELECT id_professor, nome, cpf, email, status, criado_em
      FROM Professor
    `;
    const params: any = {};

    if (q) {
      sql += `
        WHERE nome LIKE :q
           OR email LIKE :q
           OR cpf LIKE :q
      `;
      params.q = `%${q}%`;
    }

    sql += ` ORDER BY id_professor DESC`;

    const list = await query(sql, params);
    return NextResponse.json(list);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// =========================================================
// POST — CRIAR PROFESSOR
// =========================================================

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nome, cpf, email, senha, status = 'Ativo' } = body;

    if (!nome || !cpf || !email || !senha) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando' },
        { status: 400 }
      );
    }

    const created = await tx(async (conn) => {
      const [r] = await conn.execute(
        `
        INSERT INTO Professor (nome, cpf, email, senha, status)
        VALUES (:nome, :cpf, :email, :senha, :status)
        `,
        { nome, cpf, email, senha, status }
      );

      // @ts-ignore
      const insertId = r.insertId;

      const [rows] = await conn.query(
        `SELECT * FROM Professor WHERE id_professor = ?`,
        [insertId]
      );

      return (rows as any[])[0];
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    if (String(e.message).includes('Duplicate')) {
      let campo = 'Campo';
      if (e.message.includes('cpf')) campo = 'CPF';
      if (e.message.includes('email')) campo = 'E-mail';

      return NextResponse.json(
        { error: `${campo} já cadastrado` },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// =========================================================
// PUT — EDITAR PROFESSOR
// =========================================================

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id_professor, nome, cpf, email, senha, status } = body;

    const id = Number(id_professor);
    if (!id || Number.isNaN(id)) {
      return NextResponse.json(
        { error: 'id_professor inválido' },
        { status: 400 }
      );
    }

    const result = await tx(async (conn) => {
      await conn.execute(
        `
        UPDATE Professor
        SET nome = :nome,
            cpf = :cpf,
            email = :email,
            senha = :senha,
            status = :status
        WHERE id_professor = :id
        `,
        { id, nome, cpf, email, senha, status }
      );

      const [rows] = await conn.query(
        `SELECT * FROM Professor WHERE id_professor = ?`,
        [id]
      );

      return (rows as any[])[0];
    });

    return NextResponse.json(result);
  } catch (e: any) {
    if (String(e.message).includes('Duplicate')) {
      let campo = 'Campo';
      if (e.message.includes('cpf')) campo = 'CPF';
      if (e.message.includes('email')) campo = 'E-mail';

      return NextResponse.json(
        { error: `${campo} já cadastrado` },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// =========================================================
// DELETE — REMOVER PROFESSOR
// =========================================================

export async function DELETE(req: NextRequest) {
  try {
    const idParam = req.nextUrl.searchParams.get('id');
    const id = Number(idParam);

    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ error: 'id inválido' }, { status: 400 });
    }

    await query(`DELETE FROM Professor WHERE id_professor = :id`, { id });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
