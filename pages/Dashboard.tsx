
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
  const [newEventData, setNewEventData] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [newAthlete, setNewAthlete] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    category: '',
    position: '',
    isScholarship: false,
    tutorName: '',
    tutorPhone: ''
  });

  const filteredAthletes = useMemo(() => {
    return athletes.filter(a => 
      `${a.firstName} ${a.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [athletes, searchTerm]);

  const stats = useMemo(() => {
    return {
      total: athletes.length,
      scholarships: athletes.filter(a => a.isScholarship).length,
      debtors: athletes.filter(a => (a.monthlyDebt || 0) > 0 || (a.physioDebt || 0) > 0).length,
      recentMatches: matches.length
    };
  }, [athletes, matches]);

  const getMonthsOwed = (athlete: Athlete) => {
    if (athlete.isScholarship && athlete.monthlyDebt === 0) return [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthIndex = now.getMonth();
    const owed: string[] = [];

    // Verificamos año actual
    for (let i = 0; i <= currentMonthIndex; i++) {
      const month = MONTHS[i];
      const key = `${currentYear}-${month}`;
      if (!athlete.payments || !athlete.payments[key] || athlete.payments[key] === 0) {
        owed.push(month);
      }
    }
    
    // Verificamos si hay registros de deuda del año anterior
    const prevYear = currentYear - 1;
    for (let i = 0; i < 12; i++) {
        const month = MONTHS[i];
        const key = `${prevYear}-${month}`;
        if (athlete.payments && athlete.payments[key] === 0) {
            owed.push(`${month} ${prevYear}`);
        }
    }

    return owed;
  };

  const today = new Date();
  const currentMonthName = today.toLocaleString('es-ES', { month: 'long' });
  const daysInMonth = new Array(31).fill(0).map((_, i) => i + 1);

  const handleAddAthleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const athlete: Athlete = {
      id: Math.random().toString(36).substr(2, 9),
      ...newAthlete,
      photo: `https://picsum.photos/seed/${Math.random()}/200/200`,
      monthlyDebt: 0,
      physioDebt: 0,
      files: [],
      socialReports: [],
      physioConsultations: [],
      injuryHistory: [],
      physicalTests: [],
      payments: {}
    };
    onAddAthlete(athlete);
    setShowAddModal(false);
    setNewAthlete({
      firstName: '',
      lastName: '',
      dob: '',
      category: '',
      position: '',
      isScholarship: false,
      tutorName: '',
      tutorPhone: ''
    });
  };

  const handleAddEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const event: NoticeEvent = {
      id: Math.random().toString(36).substr(2, 9),
      title: newEventData.title,
      description: newEventData.description,
      date: newEventData.date,
      createdBy: user.name
    };
    onAddEvent(event);
    setShowAddEventModal(false);
    setNewEventData({ title: '', description: '', date: new Date().toISOString().split('T')[0] });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Dashboard Savage</h1>
          <p className="text-slate-500 font-medium">Panel de control unificado para la academia.</p>
        </div>
        <div className="flex gap-3">
          {(user.role === UserRole.ADMIN || user.role === UserRole.COACH) && (
            <button onClick={() => setShowAddModal(true)} className="bg-red-900 text-white px-6 py-3 rounded-2xl font-black hover:bg-black transition shadow-xl shadow-red-900/20 uppercase text-xs tracking-widest flex items-center">
              <i className="fas fa-plus mr-2"></i> Nuevo Deportista
            </button>
          )}
          <button onClick={() => setShowAddEventModal(true)} className="bg-white text-slate-700 border border-slate-200 px-6 py-3 rounded-2xl font-black hover:bg-slate-50 transition shadow-sm uppercase text-xs tracking-widest flex items-center">
            <i className="fas fa-calendar-plus mr-2"></i> Nuevo Aviso
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Plantilla', value: stats.total, icon: 'fa-users', color: 'bg-red-600' },
          { label: 'Deportistas Becados', value: stats.scholarships, icon: 'fa-award', color: 'bg-amber-500' },
          { label: 'Usuarios Morosos', value: stats.debtors, icon: 'fa-exclamation-triangle', color: 'bg-rose-600' },
          { label: 'Partidos Listos', value: stats.recentMatches, icon: 'fa-trophy', color: 'bg-emerald-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center space-x-4">
            <div className={`${stat.color} w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg`}>
              <i className={`fas ${stat.icon} text-lg`}></i>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
              <p className="text-2xl font-black text-slate-800">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Directorio de Atletas</h2>
              <div className="relative w-full md:w-72">
                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input type="text" placeholder="Buscar nombre o categoría..." className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-500 outline-none text-sm font-bold text-black" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-4">Deportista</th>
                    <th className="px-8 py-4">Categoría</th>
                    <th className="px-8 py-4">Posición</th>
                    <th className="px-8 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredAthletes.map(athlete => {
                    const monthsOwed = getMonthsOwed(athlete);
                    return (
                      <tr key={athlete.id} className="hover:bg-slate-50/50 transition group">
                        <td className="px-8 py-4">
                          <div className="flex items-center space-x-4">
                            <img src={athlete.photo} className="w-10 h-10 rounded-full object-cover shadow-sm border-2 border-white ring-1 ring-slate-100" alt="" />
                            <div>
                              <p className="font-bold text-slate-800 leading-none mb-1">{athlete.firstName} {athlete.lastName}</p>
                              {monthsOwed.length > 0 ? (
                                <p className="text-[9px] text-red-600 font-black uppercase flex flex-wrap gap-1 mt-1">
                                  <i className="fas fa-warning mr-1"></i> DEBE: {monthsOwed.join(', ')}
                                </p>
                              ) : (
                                <p className="text-[10px] text-slate-400 font-bold uppercase">{athlete.isScholarship ? 'Beca Activa' : 'Pago Regular'}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-4 text-sm font-bold text-slate-600">{athlete.category}</td>
                        <td className="px-8 py-4">
                          <span className="bg-red-50 text-red-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight">{athlete.position}</span>
                        </td>
                        <td className="px-8 py-4 text-right">
                          <div className="flex justify-end space-x-2">
                            <button onClick={() => onViewAthlete(athlete.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition" title="Ver Ficha"><i className="fas fa-id-card text-sm"></i></button>
                            {(user.role === UserRole.ADMIN || user.role === UserRole.FISIO) && (
                              <button onClick={() => onSendToPhysio(athlete.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition" title="Fisioterapia"><i className="fas fa-plus-square text-sm"></i></button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredAthletes.length === 0 && (
                    <tr><td colSpan={4} className="text-center py-20 text-slate-400 italic font-medium">No se encontraron deportistas.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black uppercase tracking-tighter italic">Avisos Academia</h3>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-red-400">{currentMonthName}</span>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-8">
                {['D','L','M','M','J','V','S'].map(d => (<span key={d} className="text-[8px] font-black text-center text-slate-500">{d}</span>))}
                {daysInMonth.slice(0, 14).map(d => {
                  const hasEvent = events.some(e => new Date(e.date).getDate() === d);
                  return (<div key={d} className={`h-1.5 w-1.5 rounded-full mx-auto ${hasEvent ? 'bg-red-500 animate-pulse shadow-lg shadow-red-500/50' : 'bg-slate-700'}`}></div>);
                })}
              </div>
              <div className="space-y-6 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                {events.length > 0 ? events.map(event => (
                  <div key={event.id} className="group border-l-2 border-red-500 pl-4 py-1 hover:bg-white/5 transition rounded-r-lg">
                    <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">{event.date}</p>
                    <h4 className="font-bold text-sm mb-1 group-hover:text-red-300 transition">{event.title}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2">{event.description}</p>
                  </div>
                )) : (
                  <div className="text-center py-6 opacity-40"><i className="fas fa-bell-slash mb-2 block"></i><p className="text-xs italic">No hay avisos hoy</p></div>
                )}
              </div>
            </div>
            <div className="absolute top-0 right-0 p-8 opacity-5"><i className="fas fa-calendar-alt text-8xl"></i></div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-4 flex justify-between items-center">
              <span>Próximos Partidos</span>
              <i className="fas fa-futbol text-red-600"></i>
            </h3>
            <div className="space-y-5">
              {matches.length > 0 ? matches.slice(0, 4).map(match => {
                const team = teams.find(t => t.id === match.teamId);
                return (
                  <div key={match.id} className="flex items-center space-x-4 p-3 hover:bg-slate-50 rounded-2xl transition border border-transparent hover:border-slate-100 group">
                    <div className="bg-red-900 w-11 h-11 rounded-2xl flex flex-col items-center justify-center text-white shadow-lg flex-shrink-0 group-hover:bg-black transition">
                      <span className="text-[8px] font-black uppercase leading-none mb-1 opacity-70">{match.date.split('-')[1]}</span>
                      <span className="text-lg font-black leading-none">{match.date.split('-')[2]}</span>
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-black text-xs text-slate-800 truncate uppercase italic tracking-tighter">{team?.ageCategory} {team?.category} vs {match.opponent}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{match.location} • {match.time}</p>
                    </div>
                  </div>
                );
              }) : (
                <div className="text-center py-8"><p className="text-slate-400 text-xs italic">Sin encuentros próximos</p></div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 max-h-[90vh] flex flex-col">
            <div className="bg-red-900 p-8 text-white flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter italic">Nuevo Atleta</h3>
                <p className="text-red-200 text-xs font-bold uppercase tracking-widest opacity-80">Registrando en base de datos oficial</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="bg-white/20 w-10 h-10 rounded-full hover:bg-white/40 transition flex items-center justify-center"><i className="fas fa-times text-xl"></i></button>
            </div>
            <div className="overflow-y-auto custom-scrollbar flex-grow">
              <form onSubmit={handleAddAthleteSubmit} className="p-10 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre(s)</label><input required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-red-500 font-bold text-black" value={newAthlete.firstName} onChange={e => setNewAthlete({...newAthlete, firstName: e.target.value})} /></div>
                <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Apellido(s)</label><input required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-red-500 font-bold text-black" value={newAthlete.lastName} onChange={e => setNewAthlete({...newAthlete, lastName: e.target.value})} /></div>
                <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha Nacimiento</label><input type="date" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-red-500 font-bold text-black" value={newAthlete.dob} onChange={e => setNewAthlete({...newAthlete, dob: e.target.value})} /></div>
                <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoría</label><input required placeholder="Sub-XX" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-red-500 font-bold text-black" value={newAthlete.category} onChange={e => setNewAthlete({...newAthlete, category: e.target.value})} /></div>
                <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tutor / Padre</label><input required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-red-500 font-bold text-black" value={newAthlete.tutorName} onChange={e => setNewAthlete({...newAthlete, tutorName: e.target.value})} /></div>
                <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Teléfono Tutor</label><input required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-red-500 font-bold text-black" value={newAthlete.tutorPhone} onChange={e => setNewAthlete({...newAthlete, tutorPhone: e.target.value})} /></div>
                <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Posición de Juego</label><input required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-red-500 font-bold text-black" value={newAthlete.position} onChange={e => setNewAthlete({...newAthlete, position: e.target.value})} /></div>
                <div className="flex items-center space-x-3 p-4"><input type="checkbox" id="modal-beca" className="w-5 h-5 rounded" checked={newAthlete.isScholarship} onChange={e => setNewAthlete({...newAthlete, isScholarship: e.target.checked})} /><label htmlFor="modal-beca" className="text-xs font-bold text-slate-700">Cuenta con Beca</label></div>
                <div className="md:col-span-2 pt-6 flex gap-4"><button type="submit" className="flex-1 bg-red-900 text-white font-black py-5 rounded-3xl hover:bg-black transition uppercase text-sm tracking-widest shadow-xl">Registrar</button><button type="button" onClick={() => setShowAddModal(false)} className="px-8 bg-slate-100 text-slate-500 font-bold rounded-3xl uppercase text-xs">Cancelar</button></div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showAddEventModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 max-h-[90vh] flex flex-col">
            <div className="bg-slate-900 p-8 text-white flex justify-between items-center flex-shrink-0"><h3 className="text-xl font-black uppercase tracking-tighter italic">Crear Aviso</h3><button onClick={() => setShowAddEventModal(false)} className="text-white/40 hover:text-white transition"><i className="fas fa-times text-xl"></i></button></div>
            <div className="overflow-y-auto custom-scrollbar flex-grow">
              <form onSubmit={handleAddEventSubmit} className="p-8 space-y-6">
                <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Título del Aviso</label><input required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-red-500 font-bold text-black" value={newEventData.title} onChange={e => setNewEventData({...newEventData, title: e.target.value})} /></div>
                <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha Programada</label><input type="date" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-red-500 font-bold text-black" value={newEventData.date} onChange={e => setNewEventData({...newEventData, date: e.target.value})} /></div>
                <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descripción / Detalles</label><textarea required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-red-500 font-medium h-32 resize-none text-black" value={newEventData.description} onChange={e => setNewEventData({...newEventData, description: e.target.value})} /></div>
                <button type="submit" className="w-full bg-red-600 text-white font-black py-5 rounded-3xl hover:bg-red-700 transition uppercase text-sm tracking-widest shadow-xl shadow-red-900/20">Publicar en el Muro</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
