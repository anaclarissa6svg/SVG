
import React, { useState, useMemo } from 'react';
import { Athlete, User, UserRole, Match, Team, NoticeEvent } from '../types';

interface DashboardProps {
  athletes: Athlete[];
  user: User;
  onViewAthlete: (id: string) => void;
  onSendToPhysio: (id: string) => void;
  onAddAthlete: (athlete: Athlete) => void;
  matches: Match[];
  teams: Team[];
  events: NoticeEvent[];
  onAddEvent: (event: NoticeEvent) => void;
}

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const MONTHLY_FEE = 650;
const THERAPY_FEE = 500;

const Dashboard: React.FC<DashboardProps> = ({ 
  athletes, 
  user, 
  onViewAthlete, 
  onSendToPhysio, 
  onAddAthlete,
  matches,
  teams,
  events,
  onAddEvent
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const currentYear = new Date().getFullYear().toString();

  const filteredAthletes = useMemo(() => {
    return athletes.filter(a => 
      `${a.firstName} ${a.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [athletes, searchTerm]);

  function getMonthsOwed(athlete: Athlete) {
    if (athlete.isScholarship) return [];
    const now = new Date();
    const currentYearNum = now.getFullYear();
    const currentMonthIndex = now.getMonth();
    const owed: string[] = [];

    for (let i = 0; i <= currentMonthIndex; i++) {
      const month = MONTHS[i];
      const key = `${currentYearNum}-${month}`;
      const paid = athlete.payments?.[key] || 0;
      if (paid < MONTHLY_FEE) {
        owed.push(paid > 0 ? `${month} (Abonado)` : month);
      }
    }
    return owed;
  }

  function getTherapyMonthsOwed(athlete: Athlete) {
    if (!athlete.isScholarship) return [];
    const now = new Date();
    const currentYearNum = now.getFullYear();
    const currentMonthIndex = now.getMonth();
    const owed: string[] = [];
    for (let i = 0; i <= currentMonthIndex; i++) {
      const month = MONTHS[i];
      const key = `${currentYearNum}-${month}`;
      const paid = athlete.therapyPayments?.[key] || 0;
      if (paid < THERAPY_FEE) {
        owed.push(month);
      }
    }
    return owed;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight italic uppercase">Dashboard Savage</h1>
          <p className="text-slate-500 font-medium">Control unificado del club deportivo.</p>
        </div>
        {user.permissions.teams === 'edit' && (
          <button onClick={() => setShowAddModal(true)} className="bg-red-900 text-white px-8 py-4 rounded-2xl font-black hover:bg-black transition shadow-xl uppercase text-xs tracking-widest flex items-center">
            <i className="fas fa-plus mr-2"></i> Nuevo Deportista
          </button>
        )}
      </header>

      {/* Stats row... */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight italic">Directorio Técnico</h2>
              <div className="relative w-full md:w-72">
                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input type="text" placeholder="Localizar deportista..." className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm font-bold text-black" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-4">Deportista</th>
                    <th className="px-8 py-4">Inscripción</th>
                    <th className="px-8 py-4">Categoría</th>
                    <th className="px-8 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredAthletes.map(athlete => {
                    const monthsOwed = getMonthsOwed(athlete);
                    const isInsPaid = athlete.inscriptionPaid?.[currentYear];
                    const therapyOwed = getTherapyMonthsOwed(athlete);
                    
                    return (
                      <tr key={athlete.id} className="hover:bg-slate-50/50 transition group">
                        <td className="px-8 py-4">
                          <div className="flex items-center space-x-4">
                            <img src={athlete.photo} className="w-10 h-10 rounded-full object-cover shadow-sm ring-2 ring-slate-100" alt="" />
                            <div>
                              <p className="font-bold text-slate-800 leading-none mb-1">{athlete.firstName} {athlete.lastName}</p>
                              <div className="flex flex-wrap gap-1">
                                {athlete.isScholarship && (
                                  <span className="text-[7px] font-black bg-yellow-400 text-white px-2 py-0.5 rounded shadow-sm uppercase italic tracking-tighter">Becado</span>
                                )}
                                {monthsOwed.length > 0 && !athlete.isScholarship && (
                                  <span className="text-[7px] font-black bg-red-100 text-red-600 px-2 py-0.5 rounded uppercase tracking-tighter">Deudor Mensual</span>
                                )}
                                {athlete.isScholarship && therapyOwed.length > 0 && (
                                  <span className="text-[7px] font-black bg-purple-100 text-purple-600 px-2 py-0.5 rounded uppercase tracking-tighter">Deuda Terapia</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-4">
                            <div className={`flex items-center space-x-2 text-[10px] font-black uppercase tracking-tight ${isInsPaid ? 'text-emerald-500' : 'text-red-400'}`}>
                                <i className={`fas ${isInsPaid ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                                <span>{isInsPaid ? 'PAGADO' : 'PENDIENTE'}</span>
                            </div>
                        </td>
                        <td className="px-8 py-4 text-sm font-bold text-slate-600">{athlete.category}</td>
                        <td className="px-8 py-4 text-right">
                          <div className="flex justify-end space-x-2">
                            <button onClick={() => onViewAthlete(athlete.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition"><i className="fas fa-id-card text-sm"></i></button>
                            <button onClick={() => onSendToPhysio(athlete.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition"><i className="fas fa-plus-square text-sm"></i></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {/* Próximos partidos y avisos... */}
      </div>
      {/* Modales de agregar atleta y avisos... */}
    </div>
  );
};

export default Dashboard;
