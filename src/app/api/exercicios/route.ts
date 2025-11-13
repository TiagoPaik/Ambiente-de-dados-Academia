// app/api/exercicios/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query, tx } from '@/lib/db';

export async function GET() {
  try {
    const [rows] = await query(
      'SELECT id_exercicio, nome, descricao, grupo_muscular, equipamento FROM Exercicio ORDER BY id_exercicio ASC'
    );
    return NextResponse.json(rows);
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { nome, descricao, grupo_muscular, equipamento } = await req.json();
    if (!nome || !nome.trim()) {
      return NextResponse.json({ error: 'nome é obrigatório' }, { status: 400 });
    }

    const [result] = await query(
      `INSERT INTO Exercicio (nome, descricao, grupo_muscular, equipamento)
       VALUES (?, ?, ?, ?)`,
      [
        nome.trim(),
        descricao ?? null,
        grupo_muscular ?? null,
        equipamento ?? null,
      ]
    );

    // Pega o ID inserido
    // @ts-ignore - tipos do mysql2 variam, mas insertId existe
    const insertedId = result.insertId as number;

    const [novo] = await query(
      'SELECT id_exercicio, nome, descricao, grupo_muscular, equipamento FROM Exercicio WHERE id_exercicio = ?',
      [insertedId]
    );

    return NextResponse.json(novo, { status: 201 });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
