'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { ReactNode, useMemo } from "react";
import Image from "next/image";

type Item = { href: string; label: string };

export default function Shell({ children, title }: { children: ReactNode; title?: string }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const items: Item[] = useMemo(() => {
  if (!user) return [];

  if (user.role === "ADMIN") {
    return [
        { href: "/admin", label: "Dashboard" },
        { href: "/alunos", label: "Alunos" },
        { href: "/instrutores", label: "Instrutores" },
        { href: "/treinos", label: "Treinos" },
        { href: "/relatorios", label: "Relatórios" },
    ];
  }

  if (user.role === "INSTRUTOR") {
    return [
      { href: "/instrutor", label: "Dashboard" },
      { href: "/meus-alunos", label: "Meus Alunos" },
      { href: "/meus-treinos", label: "Meus Treinos" },
      { href: "/frequencia", label: "Frequência" },
    ];
  }

  // ALUNO: só uma rota simples, sem menu complexo
  if (user.role === "ALUNO") {
    return [
      { href: "/aluno", label: "Treinos & Frequência" },
    ];
  }

  return [];
}, [user?.role]);

  return (
    <div className="min-h-screen">
      {/* Topbar */}
      <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image
            src="/LogoAcad.png" // ou .svg
            alt="Logo da Academia"
            width={28}
            height={28}
            className="rounded"
          />
          <span className="font-semibold">Academia Crescimento O(1)</span>
        </div>
          {user && (
              <div className="flex items-center gap-3">
                <span className="text-sm muted">
                  {user.nome} • {user.role}
                </span>
                <button
                  onClick={logout}
                  className="px-3 py-1.5 rounded-lg border hover:bg-gray-50 text-sm"
                >
                  Sair
                </button>
              </div>
            )}
        </div>
      </header>

      {/* Body */}
      <div className="mx-auto max-w-6xl px-4 py-6 grid grid-cols-12 gap-6">
        <aside className="col-span-12 md:col-span-3">
          <nav className="rounded-2xl border bg-white p-2 flex flex-col gap-1">
            {items.map((it) => {
              const active = pathname === it.href;
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  className={`w-full px-3 py-2 rounded-lg text-sm transition
                    ${active ? "bg-blue-600 text-white shadow-sm" : "text-gray-800 hover:bg-gray-100"}`}
                >
                  {it.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="col-span-12 md:col-span-9">
          {children}
        </main>
      </div>
    </div>
  );
}
