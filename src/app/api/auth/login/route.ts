import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

type Role = 'ADMIN' | 'INSTRUTOR' | 'ALUNO';
type Status = 'Ativo' | 'Inativo';

type RawUser = {
  id: number;
  nome: string;
  email: string;
  senha: string;
  role: Role;
  status: Status;
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

    const emailNorm = String(email).trim();

    // 1) Tenta Admin
    const adminRows = await query<RawUser>(
      `
      SELECT
        id_admin AS id,
        'Administrador' AS nome,
        email,
        senha,
        'ADMIN' AS role,
        'Ativo' AS status
      FROM Adm
      WHERE email = :email
      `,
      { email: emailNorm }
    );

    if (adminRows.length) {
      const admin = adminRows[0];
      if (admin.senha !== senha) {
        return NextResponse.json(
          { error: 'E-mail ou senha inválidos' },
          { status: 401 }
        );
      }
      const { senha: _ignored, ...safeUser } = admin;
      return NextResponse.json({ user: safeUser });
    }

    // 2) Tenta Professor (INSTRUTOR)
    const profRows = await query<RawUser>(
      `
      SELECT
        id_professor AS id,
        nome,
        email,
        senha,
        'INSTRUTOR' AS role,
        status AS status
      FROM Professor
      WHERE email = :email
      `,
      { email: emailNorm }
    );

    if (profRows.length) {
      const prof = profRows[0];

      if (prof.senha !== senha) {
        return NextResponse.json(
          { error: 'E-mail ou senha inválidos' },
          { status: 401 }
        );
      }

      if (prof.status !== 'Ativo') {
        return NextResponse.json(
          {
            error:
              'O acesso deste instrutor está inativo. Contate o administrador.',
          },
          { status: 403 }
        );
      }

      const { senha: _ignored, ...safeUser } = prof;
      return NextResponse.json({ user: safeUser });
    }

    // 3) Tenta Aluno
    const alunoRows = await query<RawUser>(
      `
      SELECT
        id_aluno AS id,
        nome,
        email,
        senha,
        'ALUNO' AS role,
        status AS status
      FROM Aluno
      WHERE email = :email
      `,
      { email: emailNorm }
    );

    if (alunoRows.length) {
      const aluno = alunoRows[0];

      if (aluno.senha !== senha) {
        return NextResponse.json(
          { error: 'E-mail ou senha inválidos' },
          { status: 401 }
        );
      }

      if (aluno.status !== 'Ativo') {
        return NextResponse.json(
          {
            error:
              'Seu cadastro está inativo. Procure o seu instrutor para regularizar sua matrícula.',
          },
          { status: 403 }
        );
      }

      const { senha: _ignored, ...safeUser } = aluno;
      return NextResponse.json({ user: safeUser });
    }

    // 4) Não achou em nenhum lugar
    return NextResponse.json(
      { error: 'E-mail ou senha inválidos' },
      { status: 401 }
    );
  } catch (e: any) {
    console.error('Erro no login:', e);
    return NextResponse.json(
      { error: 'Erro interno ao fazer login' },
      { status: 500 }
    );
  }
}
