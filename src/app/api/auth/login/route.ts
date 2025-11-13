// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

type Role = 'ADMIN' | 'INSTRUTOR' | 'ALUNO';

type RawUser = {
  id: number;
  nome: string;
  email: string;
  senha: string;
  role: Role;
};

export async function POST(req: NextRequest) {
  try {
    const { email, senha } = await req.json();

    if (!email || !senha) {
      return NextResponse.json(
        { error: 'Informe e-mail e senha' },
        { status: 400 }
      );
    }

    // Admin + professor + aluno
    const users = await query<RawUser>(
      `
      SELECT 
        id_admin     AS id,
        'Administrador' AS nome,
        email,
        senha,
        'ADMIN'      AS role
      FROM Adm
      WHERE email = :email

      UNION ALL

      SELECT
        id_professor AS id,
        nome,
        email,
        senha,
        'INSTRUTOR'  AS role
      FROM Professor
      WHERE email = :email

      UNION ALL

      SELECT
        id_aluno     AS id,
        nome,
        email,
        senha,
        'ALUNO'      AS role
      FROM Aluno
      WHERE email = :email
      LIMIT 1;
      `,
      { email }
    );

    const user = users[0];

    if (!user || user.senha !== senha) {
      return NextResponse.json(
        { error: 'E-mail ou senha inválidos' },
        { status: 401 }
      );
    }

    const { senha: _ignored, ...safeUser } = user;
    return NextResponse.json({ user: safeUser });
  } catch (e: any) {
    console.error('Erro no login:', e);
    return NextResponse.json(
      { error: 'Erro interno ao fazer login' },
      { status: 500 }
    );
  }
}
