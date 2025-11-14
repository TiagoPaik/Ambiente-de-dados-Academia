'use client'
import { useEffect, useState } from 'react'
import Protected from '@/components/Protected'
import Shell from '@/components/Shell'
import Link from 'next/link'

type Stats = {
  alunos: number
  instrutores: number
  treinos: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchStats() {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/stats', { cache: 'no-store' })
      const data = await res.json()
      if (res.ok) setStats(data as Stats)
      else throw new Error(data?.error || 'Falha ao carregar estatísticas')
    } catch (e) {
      console.error(e)
      setStats({ alunos: 0, instrutores: 0, treinos: 0})
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const cards = [
    { label: 'Total de Alunos', value: stats?.alunos ?? '—' },
    { label: 'Instrutores',     value: stats?.instrutores ?? '—' },
    { label: 'Treinos',         value: stats?.treinos ?? '—' },
  ]

  return (
    <Protected allow={['ADMIN']}>
      <Shell title="Dashboard">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => (
            <div key={c.label} className="card">
              <div className="muted text-sm">{c.label}</div>
              <div className="mt-2 text-2xl font-semibold">
                {loading ? <span className="inline-block h-6 w-16 bg-gray-200 rounded animate-pulse" /> : c.value}
              </div>
            </div>
          ))}
        </section>

        <section className="section mt-6">
          <div className="flex items-center justify-between">
            <h2 className="h2">Ações rápidas</h2>
            <div className="flex gap-2">
              <Link href="/alunos" className="px-3 py-2 rounded-lg border hover:bg-gray-50 text-sm">Novo Aluno</Link>
              <Link href="/instrutores" className="px-3 py-2 rounded-lg border hover:bg-gray-50 text-sm">Novo Instrutor</Link>
              <Link href="/treinos" className="px-3 py-2 rounded-lg border hover:bg-gray-50 text-sm">Criar Treino</Link>
            </div>
          </div>
          <div className="mt-3">
            <button
              onClick={fetchStats}
              className="px-3 py-2 rounded-lg border hover:bg-gray-50 text-sm"
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? 'Atualizando…' : 'Atualizar números'}
            </button>
          </div>
        </section>
      </Shell>
    </Protected>
  )
}
