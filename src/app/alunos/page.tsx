'use client'

import { useEffect, useMemo, useState } from 'react'
import Protected from '@/components/Protected'
import Shell from '@/components/Shell'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

type Professor = { id_professor: number; nome: string }
type Aluno = {
  id_aluno: number
  id_professor: number
  nome: string
  email: string
  cpf: string
  status: 'Ativo' | 'Inativo'
  professor?: Professor | null   // <-- minúsculo
}

export default function AlunosPage() {
  const [alunos, setAlunos]   = useState<Aluno[]>([])
  const [profs, setProfs]     = useState<Professor[]>([])
  const [q, setQ]             = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)

  // criação/edição
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({
    id_professor: '' as string | number,
    nome: '',
    cpf: '',
    email: '',
    status: 'Ativo' as 'Ativo' | 'Inativo',
  })

  const canSave = useMemo(() => {
    const { id_professor, nome, cpf, email } = form
    return !!(id_professor && nome && cpf && email)
  }, [form])

  async function fetchAlunos(query?: string) {
    try {
      setLoading(true)
      const url = query?.trim() ? `/api/alunos?q=${encodeURIComponent(query)}` : '/api/alunos'
      const res = await fetch(url)
      const data = await res.json()
      setAlunos(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error(e)
      setAlunos([])
    } finally {
      setLoading(false)
    }
  }

  async function fetchProfs() {
    try {
      const res = await fetch('/api/professores')
      const data = await res.json()
      setProfs(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error(e)
      setProfs([])
    }
  }

  useEffect(() => {
    fetchAlunos()
    fetchProfs()
  }, [])

  function startCreate() {
    setEditingId(null)
    setForm({ id_professor: '', nome: '', cpf: '', email: '', status: 'Ativo' })
  }

  function startEdit(a: Aluno) {
    setEditingId(a.id_aluno)
    setForm({
      id_professor: a.id_professor,
      nome: a.nome,
      cpf: a.cpf,
      email: a.email,
      status: a.status,
    })
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSave) return
    setSaving(true)
    try {
      const payload = {
        ...form,
        id_professor: Number(form.id_professor),
      }

      const res = await fetch(editingId ? `/api/alunos/${editingId}` : '/api/alunos', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert(err?.error || 'Falha ao salvar')
        return
      }

      startCreate()
      await fetchAlunos(q)
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: number) {
    if (!confirm('Excluir este aluno?')) return
    const res = await fetch(`/api/alunos/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      alert(err?.error || 'Falha ao excluir')
      return
    }
    fetchAlunos(q)
  }

  return (
    <Protected allow={['ADMIN']}>
      <Shell title="Alunos">
        {/* Busca */}
        <section className="section">
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Buscar por nome, email ou CPF..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <Button onClick={() => fetchAlunos(q)}>Buscar</Button>
              <button
                onClick={() => { setQ(''); fetchAlunos() }}
                className="px-3 py-2 rounded-lg border hover:bg-gray-50 text-sm"
              >
                Limpar
              </button>
            </div>
            <div className="text-sm muted">{alunos.length} resultado(s)</div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Form */}
          <form onSubmit={submit} className="section space-y-4 lg:col-span-1">
            <div className="flex items-center justify-between">
              <h2 className="h2">{editingId ? 'Editar Aluno' : 'Novo Aluno'}</h2>
              {editingId && (
                <button type="button" className="text-sm underline" onClick={startCreate}>
                  cancelar
                </button>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium">Professor</label>
              <select
                className="w-full rounded-lg border px-3 py-2 bg-white focus:ring-2 focus:ring-blue-600"
                value={form.id_professor}
                onChange={(e) => setForm((f) => ({ ...f, id_professor: e.target.value }))}
              >
                <option value="">Selecione...</option>
                {profs.map((p) => (
                  <option key={p.id_professor} value={p.id_professor}>
                    {p.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium">Nome</label>
              <Input value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium">CPF</label>
                <Input value={form.cpf} onChange={(e) => setForm((f) => ({ ...f, cpf: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium">Email</label>
                <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium">Status da Matrícula</label>
              <select
                className="w-full rounded-lg border px-3 py-2 bg-white focus:ring-2 focus:ring-blue-600"
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as 'Ativo' | 'Inativo' }))}
              >
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
              </select>
            </div>

            <Button type="submit" disabled={!canSave || saving} className="w-full">
              {saving ? 'Salvando…' : (editingId ? 'Salvar alterações' : 'Criar Aluno')}
            </Button>
          </form>

          {/* Lista */}
          <div className="section lg:col-span-2">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 pr-4">Nome</th>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">CPF</th>
                    <th className="py-2 pr-4">Professor</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i}>
                        <td className="py-2 pr-4"><div className="h-4 w-40 bg-gray-200 rounded animate-pulse" /></td>
                        <td className="py-2 pr-4"><div className="h-4 w-48 bg-gray-200 rounded animate-pulse" /></td>
                        <td className="py-2 pr-4"><div className="h-4 w-24 bg-gray-200 rounded animate-pulse" /></td>
                        <td className="py-2 pr-4"><div className="h-4 w-32 bg-gray-200 rounded animate-pulse" /></td>
                        <td className="py-2 pr-4"><div className="h-4 w-16 bg-gray-200 rounded animate-pulse" /></td>
                        <td className="py-2"><div className="h-4 w-24 bg-gray-200 rounded animate-pulse" /></td>
                      </tr>
                    ))
                  ) : alunos.length === 0 ? (
                    <tr><td className="py-4 text-gray-500" colSpan={6}>Nenhum aluno encontrado.</td></tr>
                  ) : (
                    alunos.map((a) => (
                      <tr key={a.id_aluno} className="border-b hover:bg-gray-50">
                        <td className="py-2 pr-4 font-medium">{a.nome}</td>
                        <td className="py-2 pr-4">{a.email}</td>
                        <td className="py-2 pr-4">{a.cpf}</td>
                        <td className="py-2 pr-4">{a.professor?.nome ?? '—'}</td>
                        <td className="py-2 pr-4">
                          <span className="px-2 py-1 rounded bg-gray-100">{a.status}</span>
                        </td>
                        <td className="py-2 flex gap-2">
                          <button className="px-2 py-1 rounded border" onClick={() => startEdit(a)}>
                            Editar
                          </button>
                          <button className="px-2 py-1 rounded border text-red-600" onClick={() => remove(a.id_aluno)}>
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </Shell>
    </Protected>
  )
}
