'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import Protected from '@/components/Protected';
import Shell from '@/components/Shell';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

type StatusAluno = 'Ativo' | 'Inativo';
type TipoMatricula = 'Mensal' | 'Trimestral' | 'Semestral' | 'Anual';

type Aluno = {
  id_aluno: number;
  id_professor: number | null;
  nome: string;
  cpf: string;
  email: string;
  status: StatusAluno;
  tipo_matricula: TipoMatricula;
  nome_professor?: string | null;
};

type Professor = {
  id_professor: number;
  nome: string;
  email: string;
};

type AlunoForm = {
  nome: string;
  cpf: string;
  email: string;
  senha: string;
  status: StatusAluno;
  tipo_matricula: TipoMatricula;
  id_professor: number | null;
};

export default function AlunosPage() {
  const [list, setList] = useState<Aluno[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingProf, setLoadingProf] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof AlunoForm, string>>>({});
  const cpfRef = useRef<HTMLInputElement | null>(null);
  const nomeRef = useRef<HTMLInputElement | null>(null);
  const emailRef = useRef<HTMLInputElement | null>(null);
  const senhaRef = useRef<HTMLInputElement | null>(null);

  const auth = useAuth();
  const router = useRouter();

  const [form, setForm] = useState<AlunoForm>({
    nome: '',
    cpf: '',
    email: '',
    senha: '',
    status: 'Ativo',         
    tipo_matricula: 'Mensal',
    id_professor: null,       
  });

  const [editing, setEditing] = useState<Aluno | null>(null);

  const canSave = useMemo(() => {
    if (!form.nome.trim()) return false;
    if (!form.cpf.trim()) return false;
    if (!form.email.trim()) return false;
    if (!form.status) return false;
    if (!form.tipo_matricula) return false;
    // Criando: senha obrigatória
    if (!editing && !form.senha.trim()) return false;
    // Editando: senha opcional
    return true;
  }, [form, editing]);

  async function fetchAlunos(query?: string) {
    setGlobalError(null);
    try {
      setLoading(true);
      const url = query?.trim()
        ? `/api/alunos?q=${encodeURIComponent(query)}`
        : '/api/alunos';
      const res = await fetch(url);
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        const msg = data?.error ?? 'Erro ao carregar alunos';
        setGlobalError(msg);
        setList([]);
        return;
      }

      setList(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setGlobalError('Falha de rede ao listar alunos');
      setList([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchProfessores() {
    setGlobalError(null);
    try {
      setLoadingProf(true);
      const res = await fetch('/api/professores');
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        setGlobalError(data?.error ?? 'Erro ao carregar professores');
        setProfessores([]);
        return;
      }

      const lista: Professor[] = Array.isArray(data) ? data : [];
      setProfessores(lista);

      // Se não está editando e não tem professor setado, define o primeiro como padrão
      if (!editing && lista.length > 0) {
        setForm((f) => ({
          ...f,
          id_professor: f.id_professor ?? lista[0].id_professor,
        }));
      }
    } catch (e: any) {
      setGlobalError('Falha de rede ao carregar professores');
      setProfessores([]);
    } finally {
      setLoadingProf(false);
    }
  }

  useEffect(() => {
    fetchAlunos();
    fetchProfessores();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    // Validação cliente antes de enviar
    const isValid = validateForm();
    if (!isValid) return;

    // reset previous errors/messages
    setGlobalError(null);
    setSuccessMessage(null);
    setFormErrors({});
    setIsSubmitting(true);

    const payload = editing
      ? {
          id_aluno: editing.id_aluno,
          nome: form.nome,
          cpf: form.cpf,
          email: form.email,
          status: form.status,
          tipo_matricula: form.tipo_matricula,
          id_professor: form.id_professor,           // pode ser null
          // senha só se preenchida
          ...(form.senha.trim() ? { senha: form.senha.trim() } : {}),
        }
      : {
          nome: form.nome,
          cpf: form.cpf,
          email: form.email,
          senha: form.senha.trim(),
          status: form.status,                      // padrão Inativo já está aqui
          tipo_matricula: form.tipo_matricula,
          id_professor: form.id_professor,          // pode ser null (API escolhe padrão)
        };
    try {
      const res = await fetch('/api/alunos', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        const err = data?.error ?? 'Erro ao salvar aluno';

        // Tratamento específico para duplicidade
        if (res.status === 409) {
          // API retorna mensagens como "CPF já cadastrado" ou "E-mail já cadastrado"
          if (/cpf/i.test(err)) {
            setFormErrors({ cpf: err });
            // focus no campo CPF se possível
            cpfRef.current?.focus();
          } else if (/e-?mail/i.test(err)) {
            setFormErrors({ email: err });
          } else {
            setGlobalError(err);
          }
          return;
        }

        if (res.status === 400) {
          // Mensagem de validação geral do backend
          setGlobalError(err);
          return;
        }

        if (res.status === 401) {
          // Sessão expirada/sem permissão: desloga e redireciona
          auth.logout();
          router.push('/login');
          return;
        }

        // Outros erros (500 etc.)
        setGlobalError(err);
        return;
      }

      // Sucesso
      setSuccessMessage(editing ? 'Aluno atualizado com sucesso' : 'Aluno criado com sucesso');

      // Reseta o formulário
      setEditing(null);
      setForm({
        nome: '',
        cpf: '',
        email: '',
        senha: '',
        status: 'Inativo',
        tipo_matricula: 'Mensal',
        id_professor: professores[0]?.id_professor ?? null,
      });

      fetchAlunos(q);
    } catch (e: any) {
      setGlobalError('Falha de rede ao salvar aluno');
    } finally {
      setIsSubmitting(false);
    }
  }

  function validateForm() {
    const errors: Partial<Record<keyof AlunoForm, string>> = {};

    const nome = form.nome?.trim() ?? '';
    const cpf = form.cpf?.trim() ?? '';
    const email = form.email?.trim() ?? '';
    const senha = form.senha ?? '';

    // Nome: não vazio e deve conter pelo menos uma letra (não pode ser apenas números)
    if (!nome) {
      errors.nome = 'Nome é obrigatório';
    } else if (!/[A-Za-zÀ-ÖØ-öø-ÿ]/.test(nome)) {
      errors.nome = 'Nome inválido: deve conter letras';
    }

    // CPF: somente dígitos, 11 caracteres (após remover pontos/traços)
    const cpfDigits = cpf.replace(/\D/g, '');
    if (!cpfDigits) {
      errors.cpf = 'CPF é obrigatório';
    } else if (!/^\d+$/.test(cpfDigits)) {
      errors.cpf = 'CPF inválido: somente números';
    } else if (cpfDigits.length !== 11) {
      errors.cpf = 'CPF deve conter 11 dígitos';
    }

    // Email: validação simples
    if (!email) {
      errors.email = 'E-mail é obrigatório';
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      errors.email = 'E-mail inválido';
    }

    // Senha: mínimo 8 caracteres na criação; na edição, se preenchida deve ter >=8
    if (!editing) {
      if (!senha || senha.trim().length < 8) {
        errors.senha = 'Senha deve ter no mínimo 8 caracteres';
      }
    } else {
      if (senha && senha.trim().length > 0 && senha.trim().length < 8) {
        errors.senha = 'Nova senha deve ter no mínimo 8 caracteres';
      }
    }

    // Status e tipo_matricula: validar valores permitidos
    if (!['Ativo', 'Inativo'].includes(form.status)) {
      errors.status = 'Status inválido';
    }
    if (!['Mensal', 'Trimestral', 'Semestral', 'Anual'].includes(form.tipo_matricula)) {
      errors.tipo_matricula = 'Tipo de matrícula inválido';
    }

    setFormErrors(errors);

    // foco no primeiro campo com erro
    if (errors.nome) {
      nomeRef.current?.focus();
      setGlobalError('Corrija os erros do formulário');
      return false;
    }
    if (errors.cpf) {
      cpfRef.current?.focus();
      setGlobalError('Corrija os erros do formulário');
      return false;
    }
    if (errors.email) {
      emailRef.current?.focus();
      setGlobalError('Corrija os erros do formulário');
      return false;
    }
    if (errors.senha) {
      senhaRef.current?.focus();
      setGlobalError('Corrija os erros do formulário');
      return false;
    }

    return Object.keys(errors).length === 0;
  }

  function handleEdit(a: Aluno) {
    setEditing(a);
    setForm({
      nome: a.nome,
      cpf: a.cpf,
      email: a.email,
      senha: '',
      status: a.status,
      tipo_matricula: a.tipo_matricula,
      id_professor: a.id_professor, // pode vir null
    });
  }

  async function handleDelete(id: number) {
    if (!confirm('Excluir este aluno?')) return;
    setGlobalError(null);
    setDeletingId(id);
    try {
      const res = await fetch(`/api/alunos?id=${id}`, { method: 'DELETE' });
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        setGlobalError(data?.error ?? 'Erro ao excluir aluno');
        return;
      }

      setSuccessMessage('Aluno excluído com sucesso');
      fetchAlunos(q);
    } catch (e: any) {
      setGlobalError('Falha de rede ao excluir aluno');
    } finally {
      setDeletingId(null);
    }
  }

  function cancelEdit() {
    setEditing(null);
    setForm({
      nome: '',
      cpf: '',
      email: '',
      senha: '',
      status: 'Inativo',
      tipo_matricula: 'Mensal',
      id_professor: professores[0]?.id_professor ?? null,
    });
  }

  return (
    <Protected allow={['ADMIN']}>
      <Shell title="Alunos">
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
                onClick={() => {
                  setQ('');
                  fetchAlunos();
                }}
                className="px-3 py-2 rounded-lg border hover:bg-gray-50 text-sm"
              >
                Limpar
              </button>
            </div>
            <div className="text-sm muted">
              {Array.isArray(list) ? list.length : 0} resultado(s)
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Formulário */}
          <form
            onSubmit={handleSubmit}
            className="section space-y-4 lg:col-span-1"
          >
            <h2 className="h2">{editing ? 'Editar Aluno' : 'Novo Aluno'}</h2>

            {globalError && (
              <div className="text-sm text-red-600">{globalError}</div>
            )}
            {successMessage && (
              <div className="text-sm text-green-600">{successMessage}</div>
            )}

            <div>
              <label className="block text-sm font-medium">Nome</label>
              <Input
                value={form.nome}
                onChange={(e) =>
                  setForm((f) => ({ ...f, nome: e.target.value }))
                }
                ref={nomeRef}
              />
              {formErrors.nome && (
                <div className="text-sm text-red-600 mt-1">{formErrors.nome}</div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium">CPF</label>
                <Input
                  value={form.cpf}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, cpf: e.target.value }))
                  }
                  ref={cpfRef}
                />
                {formErrors.cpf && (
                  <div className="text-sm text-red-600 mt-1">{formErrors.cpf}</div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  ref={emailRef}
                />
                {formErrors.email && (
                  <div className="text-sm text-red-600 mt-1">{formErrors.email}</div>
                )}
              </div>
            </div>

            {!editing && (
              <div>
                <label className="block text-sm font-medium">Senha</label>
                <Input
                  type="password"
                  value={form.senha}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, senha: e.target.value }))
                  }
                  disabled={isSubmitting}
                  ref={senhaRef}
                />
                <div className="text-xs text-gray-500 mt-1">Mínimo 8 caracteres.</div>
                {formErrors.senha && (
                  <div className="text-sm text-red-600 mt-1">{formErrors.senha}</div>
                )}
              </div>
            )}

            {editing && (
              <div>
                <label className="block text-sm font-medium">
                  Nova senha (opcional)
                </label>
                <Input
                  type="password"
                  value={form.senha}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, senha: e.target.value }))
                  }
                  ref={senhaRef}
                />
                <div className="text-xs text-gray-500 mt-1">Opcional — mínimo 8 caracteres se preenchida.</div>
                {formErrors.senha && (
                  <div className="text-sm text-red-600 mt-1">{formErrors.senha}</div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium">
                Professor responsável
              </label>
              {loadingProf ? (
                <div className="text-sm text-gray-500 mt-1">
                  Carregando professores...
                </div>
              ) : professores.length === 0 ? (
                <div className="text-sm text-red-600 mt-1">
                  Nenhum professor cadastrado.
                </div>
              ) : (
                <select
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white focus:ring-2 focus:ring-blue-600 mt-1"
                  value={form.id_professor ?? ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setForm((f) => ({
                      ...f,
                      id_professor: value ? Number(value) : null,
                    }));
                  }}
                  disabled={loadingProf || isSubmitting}
                >
                  {professores.map((p) => (
                    <option key={p.id_professor} value={p.id_professor}>
                      {p.nome}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium">Status</label>
                <select
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white focus:ring-2 focus:ring-blue-600"
                  value={form.status}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      status: e.target.value as StatusAluno,
                    }))
                  }
                  disabled={isSubmitting}
                >
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">
                  Tipo de matrícula
                </label>
                <select
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white focus:ring-2 focus:ring-blue-600"
                  value={form.tipo_matricula}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      tipo_matricula: e.target.value as TipoMatricula,
                    }))
                  }
                  disabled={isSubmitting}
                >
                  <option value="Mensal">Mensal</option>
                  <option value="Trimestral">Trimestral</option>
                  <option value="Semestral">Semestral</option>
                  <option value="Anual">Anual</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={!canSave || isSubmitting} className="flex-1">
                {isSubmitting ? (editing ? 'Salvando...' : 'Salvando...') : editing ? 'Salvar Alterações' : 'Salvar'}
              </Button>
              {editing && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-3 py-2 rounded-lg border"
                >
                  Cancelar
                </button>
              )}
            </div>
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
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Tipo</th>
                    <th className="py-2 pr-4">Professor</th>
                    <th className="py-2 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i}>
                        <td className="py-2 pr-4">
                          <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
                        </td>
                        <td className="py-2 pr-4">
                          <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                        </td>
                        <td className="py-2 pr-4">
                          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                        </td>
                        <td className="py-2 pr-4">
                          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                        </td>
                        <td className="py-2 pr-4">
                          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                        </td>
                        <td className="py-2 pr-4">
                          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                        </td>
                        <td className="py-2">
                          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                        </td>
                      </tr>
                    ))
                  ) : Array.isArray(list) && list.length > 0 ? (
                    list.map((a) => (
                      <tr
                        key={a.id_aluno}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="py-2 pr-4 font-medium">{a.nome}</td>
                        <td className="py-2 pr-4">{a.email}</td>
                        <td className="py-2 pr-4">{a.cpf}</td>
                        <td className="py-2 pr-4">{a.status}</td>
                        <td className="py-2 pr-4">{a.tipo_matricula}</td>
                        <td className="py-2 pr-4">{a.nome_professor}
                        </td>
                        <td className="py-2">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleEdit(a)}
                              className="px-2 py-1 rounded border"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDelete(a.id_aluno)}
                              className="px-2 py-1 rounded border text-red-600"
                            >
                              Excluir
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="py-4 text-gray-500" colSpan={7}>
                        Nenhum aluno encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </Shell>
    </Protected>
  );
}
