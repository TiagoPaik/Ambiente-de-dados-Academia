'use client';
import Protected from '../../../components/Protected';
import Shell from '../../../components/Shell';

export default function InstrutorDashboard() {
  return (
    <Protected allow={['INSTRUTOR']}>
      <Shell title="Dashboard">
        <section className="grid gap-4 sm:grid-cols-2">
          <div className="card">
            <h3 className="font-medium">Meus alunos</h3>
            <p className="muted text-sm">Carregar do backend depois.</p>
          </div>
          <div className="card">
            <h3 className="font-medium">Marcar Frequência</h3>
            <p className="muted text-sm">Presente / Falta / Justificada.</p>
          </div>
        </section>

        <section className="section mt-6">
          <div className="flex items-center gap-2 border-b pb-3">
            <button className="px-3 py-1.5 rounded-lg text-sm bg-blue-600 text-white">Hoje</button>
            <button className="px-3 py-1.5 rounded-lg text-sm hover:bg-gray-100">Semana</button>
            <button className="px-3 py-1.5 rounded-lg text-sm hover:bg-gray-100">Mês</button>
          </div>
          <div className="mt-4 muted text-sm">
            Agenda e presenças aparecerão aqui.
          </div>
        </section>
      </Shell>
    </Protected>
  );
}
