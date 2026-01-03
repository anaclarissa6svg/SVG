
import React, { useState, useMemo, useRef } from 'react';
import { Athlete, Team, Match, User, UserRole, PhysicalTest } from '../types';
import { GoogleGenAI } from "@google/genai";

interface TeamsPageProps {
  athletes: Athlete[];
  teams: Team[];
  setTeams: (teams: Team[]) => void;
  matches: Match[];
  setMatches: (matches: Match[]) => void;
  user: User;
  onUpdateAthlete?: (athlete: Athlete) => void;
  users?: User[];
  setUsers?: (users: User[]) => void;
}

const TeamsPage: React.FC<TeamsPageProps> = ({ 
  athletes, teams, setTeams, matches, setMatches, user, onUpdateAthlete, users = [], setUsers 
}) => {
  const [activeTab, setActiveTab] = useState<'teams' | 'matches' | 'phys_tests' | 'coaches'>('teams');
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showCoachModal, setShowCoachModal] = useState(false);
  
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [selectedTeamForRoster, setSelectedTeamForRoster] = useState<Team | null>(null);
  const [selectedAthleteForTest, setSelectedAthleteForTest] = useState<Athlete | null>(null);
  const [rosterSearch, setRosterSearch] = useState('');
  const [testAthleteSearch, setTestAthleteSearch] = useState('');
  const [viewingHistoryId, setViewingHistoryId] = useState<string | null>(null);

  const [teamForm, setTeamForm] = useState({ category: 'Varonil', ageCategory: 'Sub-12', coachName: '' });
  const [newMatch, setNewMatch] = useState({ 
    teamId: '', opponent: '', date: '', time: '', location: '', locationUri: '', observations: '' 
  });
  
  const [testForm, setTestForm] = useState({
    date: new Date().toISOString().split('T')[0],
    weight: '',
    height: '',
    speed: '',
    endurance: '',
    power: '',
    observations: ''
  });

  const [coachForm, setCoachForm] = useState({ name: '', username: '', password: '' });

  // States for Predictive Maps Search
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [locationSearchResults, setLocationSearchResults] = useState<{title: string, uri: string}[]>([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const searchTimeoutRef = useRef<number | null>(null);

  const isAdmin = user.role === UserRole.ADMIN;
  const canEdit = user.permissions.teams === 'edit' || isAdmin;
  
  const coachesList = useMemo(() => users.filter(u => u.role === UserRole.COACH), [users]);

  const handleOpenTeamModal = (team?: Team) => {
    if (!canEdit) return;
    if (team) {
      setEditingTeam(team);
      setTeamForm({ category: team.category, ageCategory: team.ageCategory || 'Sub-12', coachName: team.coachName || '' });
    } else {
      setEditingTeam(null);
      setTeamForm({ category: 'Varonil', ageCategory: 'Sub-12', coachName: '' });
    }
    setShowTeamModal(true);
  };

  const handleSaveTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    if (editingTeam) {
      const updatedTeams = teams.map(t => t.id === editingTeam.id ? { ...t, category: teamForm.category, ageCategory: teamForm.ageCategory, coachName: teamForm.coachName } : t);
      setTeams(updatedTeams);
    } else {
      const team: Team = { id: Math.random().toString(36).substr(2, 9), category: teamForm.category, ageCategory: teamForm.ageCategory, coachName: teamForm.coachName, athleteIds: [] };
      setTeams([...teams, team]);
    }
    setShowTeamModal(false);
  };

  const handleToggleAthleteInRoster = (athleteId: string) => {
    if (!canEdit || !selectedTeamForRoster) return;
    const currentIds = selectedTeamForRoster.athleteIds || [];
    const newIds = currentIds.includes(athleteId) ? currentIds.filter(id => id !== athleteId) : [...currentIds, athleteId];
    const updatedTeam = { ...selectedTeamForRoster, athleteIds: newIds };
    setSelectedTeamForRoster(updatedTeam);
    setTeams(teams.map(t => t.id === updatedTeam.id ? updatedTeam : t));
  };

  const handleSaveTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAthleteForTest || !onUpdateAthlete || !canEdit) return;
    
    const newTest: PhysicalTest = {
      id: Math.random().toString(36).substr(2, 9),
      ...testForm,
      createdBy: user.name
    };

    const updatedAthlete = {
      ...selectedAthleteForTest,
      physicalTests: [newTest, ...(selectedAthleteForTest.physicalTests || [])]
    };

    onUpdateAthlete(updatedAthlete);
    setShowTestModal(false);
    setSelectedAthleteForTest(null);
    setTestAthleteSearch('');
    alert('Prueba física registrada exitosamente.');
  };

  const handleAddCoach = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !setUsers) return;

    const isDuplicate = users.some(u => u.username.toLowerCase() === coachForm.username.toLowerCase());
    if (isDuplicate) {
      alert('El nombre de usuario ya existe.');
      return;
    }

    const newCoach: User = {
      id: `coach-${Date.now()}`,
      name: coachForm.name,
      username: coachForm.username,
      password: coachForm.password,
      role: UserRole.COACH,
      permissions: {
        payments: 'none',
        physio: 'view',
        social: 'none',
        teams: 'edit'
      }
    };

    setUsers([...users, newCoach]);
    setCoachForm({ name: '', username: '', password: '' });
    setShowCoachModal(false);
    alert('Coach registrado correctamente.');
  };

  const suggestedAthletesForTest = useMemo(() => {
    if (testAthleteSearch.length < 2) return [];
    return athletes.filter(a => 
      `${a.firstName} ${a.lastName}`.toLowerCase().includes(testAthleteSearch.toLowerCase())
    ).slice(0, 5);
  }, [athletes, testAthleteSearch]);

  const filteredAthletesForRoster = useMemo(() => {
    return athletes.filter(a => 
      `${a.firstName} ${a.lastName}`.toLowerCase().includes(rosterSearch.toLowerCase()) ||
      a.category.toLowerCase().includes(rosterSearch.toLowerCase())
    );
  }, [athletes, rosterSearch]);

  const performLocationSearch = async (query: string) => {
    if (query.length < 3 || !canEdit) {
      setLocationSearchResults([]);
      return;
    }
    setIsSearchingLocation(true);
    setShowLocationDropdown(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Lista los lugares más probables para la sede: "${query}" en Chihuahua, México. Proporciona los nombres de las canchas, estadios o complejos deportivos exactos.`,
        config: { tools: [{ googleMaps: {} }] },
      });
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        setLocationSearchResults(chunks.filter(c => c.maps).map(c => ({ title: c.maps.title || query, uri: c.maps.uri })));
      }
    } catch (error) { console.error(error); } finally { setIsSearchingLocation(false); }
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMatch(prev => ({ ...prev, location: value, locationUri: '' }));
    if (searchTimeoutRef.current) window.clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = window.setTimeout(() => performLocationSearch(value), 800);
  };

  const handleAddMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    const match: Match = { id: Math.random().toString(36).substr(2, 9), ...newMatch, selectedAthleteIds: [] };
    setMatches([...matches, match]);
    setShowMatchModal(false);
    setNewMatch({ teamId: '', opponent: '', date: '', time: '', location: '', locationUri: '', observations: '' });
  };

  const athleteWithHistory = athletes.find(a => a.id === viewingHistoryId);

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight italic uppercase">Módulo Deportivo</h1>
        </div>
        <div className="flex bg-slate-900 p-1.5 rounded-2xl w-full sm:w-auto shadow-2xl overflow-x-auto custom-scrollbar no-scrollbar">
          <button onClick={() => setActiveTab('teams')} className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-black text-[10px] uppercase transition-all ${activeTab === 'teams' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>EQUIPOS</button>
          <button onClick={() => setActiveTab('matches')} className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-black text-[10px] uppercase transition-all ${activeTab === 'matches' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>PARTIDOS</button>
          <button onClick={() => setActiveTab('phys_tests')} className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-black text-[10px] uppercase transition-all ${activeTab === 'phys_tests' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>PRUEBAS</button>
          {isAdmin && (
            <button onClick={() => setActiveTab('coaches')} className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-black text-[10px] uppercase transition-all ${activeTab === 'coaches' ? 'bg-slate-700 text-white shadow-lg' : 'text-red-500 hover:bg-red-500/10'}`}>
              <i className="fas fa-user-shield mr-1"></i> COACHES
            </button>
          )}
        </div>
      </header>

      {activeTab === 'teams' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex justify-end">
            {canEdit && <button onClick={() => handleOpenTeamModal()} className="bg-red-900 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">Registrar Equipo</button>}
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map(team => (
              <div key={team.id} className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden group">
                <div className="bg-red-900 p-6 text-white flex justify-between items-center">
                  <div><h4 className="font-black text-xl uppercase italic leading-none">{team.ageCategory}</h4><p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mt-1">{team.category}</p></div>
                  {canEdit && <button onClick={() => handleOpenTeamModal(team)} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition"><i className="fas fa-edit"></i></button>}
                </div>
                <div className="p-6 space-y-4">
                   <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-400 px-2"><span>Integrantes</span><span className="text-red-900">{(team.athleteIds || []).length}</span></div>
                   <button onClick={() => setSelectedTeamForRoster(team)} className="w-full bg-slate-50 py-4 rounded-2xl font-black text-xs text-red-900 border border-slate-200 hover:bg-red-50 hover:border-red-200 transition-all flex items-center justify-center space-x-2"><i className="fas fa-users-gear"></i><span>{canEdit ? 'Gestionar Plantilla' : 'Ver Plantilla'}</span></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'matches' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex justify-end">
            {canEdit && <button onClick={() => setShowMatchModal(true)} className="bg-orange-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">Agendar Partido</button>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {matches.map(match => {
               const team = teams.find(t => t.id === match.teamId);
               return (
                 <div key={match.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl relative group">
                    <div className="flex justify-between items-start mb-6"><div><p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1">{match.date} @ {match.time}</p><h4 className="text-xl font-black uppercase italic tracking-tighter text-slate-800">{team?.ageCategory || 'Equipo'} vs {match.opponent}</h4></div><i className="fas fa-futbol text-2xl text-slate-100 group-hover:text-orange-500 transition-colors"></i></div>
                    <div className="flex items-center space-x-3 bg-slate-50 p-4 rounded-2xl border border-slate-100"><i className="fas fa-location-dot text-red-600"></i><div className="flex-grow"><p className="text-xs font-black uppercase tracking-tight text-slate-600">{match.location}</p>{match.locationUri && <a href={match.locationUri} target="_blank" rel="noopener noreferrer" className="text-[9px] font-bold text-blue-600 hover:underline uppercase tracking-widest">Ver en Google Maps</a>}</div></div>
                 </div>
               );
             })}
          </div>
        </div>
      )}

      {activeTab === 'phys_tests' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
             <div>
                <h3 className="text-xl font-black text-slate-800 uppercase italic">Registro de Rendimiento</h3>
                <p className="text-slate-400 text-xs font-medium">Pruebas de potencia, velocidad y resistencia</p>
             </div>
             {canEdit && (
               <button 
                onClick={() => {
                  setTestForm({ date: new Date().toISOString().split('T')[0], weight: '', height: '', speed: '', endurance: '', power: '', observations: '' });
                  setSelectedAthleteForTest(null);
                  setTestAthleteSearch('');
                  setShowTestModal(true);
                }}
                className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-emerald-900/20 hover:bg-emerald-700 transition"
               >
                 Nuevo Registro
               </button>
             )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-4">
               <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                  <h4 className="text-[10px] font-black text-emerald-600 uppercase mb-4 tracking-widest">Atletas con Pruebas</h4>
                  <div className="relative mb-4">
                    <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
                    <input 
                      type="text" 
                      placeholder="Buscar atleta..." 
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold"
                      value={rosterSearch}
                      onChange={(e) => setRosterSearch(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
                    {athletes
                      .filter(a => `${a.firstName} ${a.lastName}`.toLowerCase().includes(rosterSearch.toLowerCase()))
                      .map(a => (
                        <button 
                          key={a.id} 
                          onClick={() => setViewingHistoryId(a.id)}
                          className={`w-full p-3 rounded-2xl border transition-all flex items-center space-x-3 text-left ${viewingHistoryId === a.id ? 'border-emerald-500 bg-emerald-50' : 'border-slate-50 bg-white hover:bg-slate-50'}`}
                        >
                           <img src={a.photo} className="w-8 h-8 rounded-lg object-cover" alt="" />
                           <div className="flex-grow">
                             <p className="text-[10px] font-black uppercase italic text-slate-700 leading-none">{a.firstName} {a.lastName}</p>
                             <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase">{(a.physicalTests || []).length} Pruebas</p>
                           </div>
                        </button>
                      ))}
                  </div>
               </div>
            </div>

            <div className="lg:col-span-2">
               {athleteWithHistory ? (
                 <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden animate-in slide-in-from-right-4 duration-300">
                    <div className="bg-slate-900 p-8 text-white flex items-center space-x-6">
                       <img src={athleteWithHistory.photo} className="w-16 h-16 rounded-2xl border-2 border-white/20 object-cover" alt="" />
                       <div>
                          <h3 className="text-2xl font-black uppercase italic tracking-tighter">{athleteWithHistory.firstName} {athleteWithHistory.lastName}</h3>
                          <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">Historial de Evolución Física</p>
                       </div>
                    </div>
                    <div className="p-8 space-y-6">
                       {(athleteWithHistory.physicalTests || []).map(test => (
                         <div key={test.id} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 hover:shadow-lg transition group">
                            <div className="flex justify-between items-center mb-6">
                               <div className="flex items-center space-x-3">
                                  <div className="bg-emerald-500 text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"><i className="fas fa-calendar-check"></i></div>
                                  <span className="text-xs font-black uppercase italic text-slate-800">{test.date}</span>
                               </div>
                               <span className="text-[8px] font-black text-slate-300 uppercase italic">Por: {test.createdBy}</span>
                            </div>
                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
                               <div className="text-center bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
                                  <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Peso</p>
                                  <p className="text-xs font-black text-emerald-600">{test.weight} <span className="text-[8px]">KG</span></p>
                               </div>
                               <div className="text-center bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
                                  <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Altura</p>
                                  <p className="text-xs font-black text-emerald-600">{test.height} <span className="text-[8px]">CM</span></p>
                               </div>
                               <div className="text-center bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
                                  <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Velocidad</p>
                                  <p className="text-xs font-black text-emerald-600">{test.speed} <span className="text-[8px]">S</span></p>
                               </div>
                               <div className="text-center bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
                                  <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Cooper</p>
                                  <p className="text-xs font-black text-emerald-600">{test.endurance} <span className="text-[8px]">M</span></p>
                               </div>
                               <div className="text-center bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
                                  <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Salto</p>
                                  <p className="text-xs font-black text-emerald-600">{test.power} <span className="text-[8px]">CM</span></p>
                               </div>
                            </div>
                            {test.observations && (
                              <div className="mt-4 pt-4 border-t border-slate-200">
                                 <p className="text-[9px] text-slate-400 font-bold italic">"{test.observations}"</p>
                              </div>
                            )}
                         </div>
                       ))}
                       {(athleteWithHistory.physicalTests || []).length === 0 && (
                         <div className="py-20 text-center text-slate-300 italic">No hay registros para este deportista.</div>
                       )}
                    </div>
                 </div>
               ) : (
                 <div className="bg-slate-50 h-full min-h-[400px] rounded-[3rem] border-4 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                    <i className="fas fa-chart-line text-6xl mb-4"></i>
                    <p className="font-black uppercase italic tracking-widest text-sm">Selecciona un atleta para ver su evolución</p>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'coaches' && isAdmin && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">Gestión de Coaches</h3>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Control exclusivo de personal técnico</p>
            </div>
            <button 
              onClick={() => setShowCoachModal(true)}
              className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-black transition flex items-center"
            >
              <i className="fas fa-user-plus mr-2"></i> Registrar Coach
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coachesList.map(coach => (
              <div key={coach.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-red-900 text-white flex items-center justify-center font-black italic">
                  {coach.name.charAt(0)}
                </div>
                <div>
                  <p className="font-black text-slate-800 uppercase italic text-sm">{coach.name}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">@{coach.username}</p>
                </div>
              </div>
            ))}
            {coachesList.length === 0 && (
              <div className="col-span-full py-20 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                <p className="text-slate-400 font-bold italic">No hay coaches registrados todavía.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL AGREGAR COACH - EXCLUSIVO ADMIN */}
      {showCoachModal && isAdmin && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[250] p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="bg-[#2d0000] p-8 text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black uppercase italic tracking-tighter">Nuevo Coach</h3>
                <p className="text-red-500 text-[10px] font-black uppercase tracking-widest">Registro Administrativo</p>
              </div>
              <button onClick={() => setShowCoachModal(false)} className="text-white/40 hover:text-white transition"><i className="fas fa-times text-2xl"></i></button>
            </div>
            <form onSubmit={handleAddCoach} className="p-8 space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nombre Completo</label>
                <input required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-slate-800 uppercase italic" value={coachForm.name} onChange={e => setCoachForm({...coachForm, name: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Usuario de Acceso</label>
                <input required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-700" value={coachForm.username} onChange={e => setCoachForm({...coachForm, username: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Contraseña</label>
                <input required type="password" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-700" value={coachForm.password} onChange={e => setCoachForm({...coachForm, password: e.target.value})} />
              </div>
              <button type="submit" className="w-full bg-red-900 text-white py-5 rounded-3xl font-black uppercase text-xs tracking-widest shadow-2xl shadow-red-900/20">Registrar Coach</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL GESTIÓN DE PLANTILLA */}
      {selectedTeamForRoster && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[200] p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-300 max-h-[90vh] flex flex-col">
            <div className="bg-[#2d0000] p-8 text-white flex justify-between items-center flex-shrink-0">
               <div className="flex items-center space-x-6">
                  <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg"><i className="fas fa-users text-2xl"></i></div>
                  <div><h3 className="text-2xl font-black uppercase italic tracking-tighter">Plantilla de Equipo</h3><p className="text-red-400 text-[10px] font-black uppercase tracking-[0.2em]">{selectedTeamForRoster.ageCategory} • {selectedTeamForRoster.category}</p></div>
               </div>
               <button onClick={() => setSelectedTeamForRoster(null)} className="text-white/40 hover:text-white transition text-3xl"><i className="fas fa-times"></i></button>
            </div>
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
               <div className="relative w-full md:w-80"><i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i><input type="text" placeholder="Buscar niño..." className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none text-sm font-bold" value={rosterSearch} onChange={(e) => setRosterSearch(e.target.value)} /></div>
               <div className="flex items-center space-x-2"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total:</span><span className="bg-red-900 text-white px-4 py-1 rounded-full text-xs font-black">{(selectedTeamForRoster.athleteIds || []).length}</span></div>
            </div>
            <div className="overflow-y-auto custom-scrollbar flex-grow p-8 bg-white">
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredAthletesForRoster.map(athlete => {
                    const isSelected = (selectedTeamForRoster.athleteIds || []).includes(athlete.id);
                    return (
                      <button key={athlete.id} disabled={!canEdit} onClick={() => handleToggleAthleteInRoster(athlete.id)} className={`p-4 rounded-[2rem] border-2 transition-all flex items-center space-x-4 text-left group ${isSelected ? 'border-red-600 bg-red-50 shadow-inner' : 'border-slate-50 bg-slate-50 hover:border-red-200 hover:bg-white'}`}>
                        <img src={athlete.photo} className="w-10 h-10 rounded-xl object-cover shadow-sm group-hover:scale-110 transition" alt="" />
                        <div className="flex-grow overflow-hidden"><p className={`font-black text-xs uppercase italic truncate ${isSelected ? 'text-red-900' : 'text-slate-700'}`}>{athlete.firstName} {athlete.lastName}</p></div>
                        {isSelected && <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white text-[10px] shadow-lg"><i className="fas fa-check"></i></div>}
                      </button>
                    );
                  })}
               </div>
            </div>
            <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
               <button onClick={() => setSelectedTeamForRoster(null)} className="bg-red-900 text-white px-10 py-4 rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {showTestModal && canEdit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[220] p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-300 max-h-[95vh] flex flex-col">
            <div className="bg-emerald-600 p-8 text-white flex justify-between items-center flex-shrink-0">
               <h3 className="text-2xl font-black uppercase italic tracking-tighter">Nuevo Registro Físico</h3>
               <button onClick={() => setShowTestModal(false)} className="text-white/30 hover:text-white transition text-3xl"><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleSaveTest} className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-grow bg-white">
               <div className="relative">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-1 block">Deportista a Evaluar*</label>
                  <input 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-black focus:ring-2 focus:ring-emerald-500 transition-all" 
                    placeholder="Escribe nombre..." 
                    value={testAthleteSearch} 
                    onChange={(e) => { setTestAthleteSearch(e.target.value); setSelectedAthleteForTest(null); }} 
                    required={!selectedAthleteForTest}
                  />
                  {suggestedAthletesForTest.length > 0 && !selectedAthleteForTest && (
                    <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
                       {suggestedAthletesForTest.map(a => (
                         <button 
                          key={a.id} 
                          type="button" 
                          onClick={() => { setSelectedAthleteForTest(a); setTestAthleteSearch(`${a.firstName} ${a.lastName}`); }}
                          className="w-full p-4 flex items-center space-x-3 hover:bg-emerald-50 text-left transition"
                         >
                            <img src={a.photo} className="w-8 h-8 rounded-lg object-cover" alt="" />
                            <span className="text-xs font-black uppercase italic text-slate-800">{a.firstName} {a.lastName}</span>
                         </button>
                       ))}
                    </div>
                  )}
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Fecha</label><input type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={testForm.date} onChange={e => setTestForm({...testForm, date: e.target.value})} /></div>
                  <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Peso (kg)</label><input type="number" step="0.1" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={testForm.weight} onChange={e => setTestForm({...testForm, weight: e.target.value})} required /></div>
                  <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Altura (cm)</label><input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={testForm.height} onChange={e => setTestForm({...testForm, height: e.target.value})} required /></div>
                  <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Velocidad (30m/seg)</label><input type="number" step="0.01" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={testForm.speed} onChange={e => setTestForm({...testForm, speed: e.target.value})} /></div>
                  <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Resistencia (metros)</label><input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={testForm.endurance} onChange={e => setTestForm({...testForm, endurance: e.target.value})} /></div>
                  <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Potencia (Salto/cm)</label><input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" value={testForm.power} onChange={e => setTestForm({...testForm, power: e.target.value})} /></div>
               </div>
               
               <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Observaciones Técnicas</label>
                  <textarea className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium h-24 resize-none" placeholder="Estado de fatiga, técnica, etc..." value={testForm.observations} onChange={e => testForm.observations = e.target.value} />
               </div>

               <button 
                type="submit" 
                disabled={!selectedAthleteForTest}
                className="w-full bg-emerald-600 text-white py-5 rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-900/20 active:scale-95 transition disabled:opacity-50"
               >
                 Confirmar y Guardar
               </button>
            </form>
          </div>
        </div>
      )}

      {showTeamModal && canEdit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-md shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="bg-red-900 p-8 text-white flex justify-between items-center"><h3 className="text-2xl font-black uppercase italic">{editingTeam ? 'Editar Equipo' : 'Nuevo Equipo'}</h3><button onClick={() => setShowTeamModal(false)} className="text-white/40 hover:text-white transition text-2xl"><i className="fas fa-times"></i></button></div>
            <form onSubmit={handleSaveTeam} className="p-8 space-y-6">
              <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Rama</label><select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-black" value={teamForm.category} onChange={(e) => setTeamForm({...teamForm, category: e.target.value})} required><option value="Varonil">Varonil</option><option value="Femenino">Femenino</option><option value="Mixto">Mixto</option></select></div>
              <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Categoría Edad</label><input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-black" value={teamForm.ageCategory} onChange={(e) => setTeamForm({...teamForm, ageCategory: e.target.value})} required /></div>
              <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Coach</label><select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-black" value={teamForm.coachName} onChange={(e) => setTeamForm({...teamForm, coachName: e.target.value})}><option value="">Seleccionar...</option>{users.filter(u => u.role === UserRole.COACH || u.role === UserRole.ADMIN).map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div>
              <button type="submit" className="w-full bg-red-900 text-white py-5 rounded-3xl font-black uppercase text-xs tracking-widest">Guardar</button>
            </form>
          </div>
        </div>
      )}

      {showMatchModal && canEdit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="bg-orange-600 p-8 text-white flex justify-between items-center"><h3 className="text-2xl font-black uppercase italic">Programar Partido</h3><button onClick={() => setShowMatchModal(false)} className="text-white/40 hover:text-white transition text-2xl"><i className="fas fa-times"></i></button></div>
            <form onSubmit={handleAddMatch} className="p-8 space-y-6 overflow-y-auto max-h-[80vh] custom-scrollbar">
              <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Equipo Local</label><select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-black" value={newMatch.teamId} onChange={(e) => setNewMatch({...newMatch, teamId: e.target.value})} required><option value="">-- Buscar Equipo --</option>{teams.map(t => <option key={t.id} value={t.id}>{t.ageCategory} {t.category}</option>)}</select></div>
              <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nombre del Rival</label><input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black italic uppercase text-black" value={newMatch.opponent} onChange={(e) => setNewMatch({...newMatch, opponent: e.target.value})} required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Fecha</label><input type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-black" value={newMatch.date} onChange={(e) => setNewMatch({...newMatch, date: e.target.value})} required /></div>
                <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Hora</label><input type="time" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-black" value={newMatch.time} onChange={(e) => setNewMatch({...newMatch, time: e.target.value})} required /></div>
              </div>
              <div className="space-y-2 relative">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Sede (Predictivo Maps)</label>
                <div className="relative group">
                  <i className={`fas ${isSearchingLocation ? 'fa-spinner fa-spin' : 'fa-location-dot'} absolute left-4 top-1/2 -translate-y-1/2 ${isSearchingLocation ? 'text-orange-500' : 'text-slate-400'}`}></i>
                  <input className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-black focus:ring-2 focus:ring-orange-500 outline-none transition-all" placeholder="Escriba el lugar..." value={newMatch.location} onChange={handleLocationChange} onFocus={() => locationSearchResults.length > 0 && setShowLocationDropdown(true)} required />
                  {showLocationDropdown && (locationSearchResults.length > 0 || isSearchingLocation) && (
                    <div className="absolute z-[210] w-full mt-2 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2">
                       {isSearchingLocation && <div className="p-4 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Buscando lugares...</div>}
                       {locationSearchResults.map((res, i) => (<button key={i} type="button" onClick={() => { setNewMatch({...newMatch, location: res.title, locationUri: res.uri}); setShowLocationDropdown(false); setLocationSearchResults([]); }} className="w-full p-4 flex items-start space-x-3 hover:bg-orange-50 text-left transition border-b border-slate-50 last:border-0"><i className="fas fa-map-pin text-orange-500 mt-1"></i><div><p className="text-[11px] font-black uppercase italic tracking-tight text-slate-800">{res.title}</p><p className="text-[8px] text-blue-500 font-bold truncate mt-0.5 max-w-[200px]">{res.uri}</p></div></button>))}
                    </div>
                  )}
                </div>
                {newMatch.locationUri && <div className="mt-2 bg-emerald-50 text-emerald-700 p-2 px-4 rounded-xl border border-emerald-100 flex items-center space-x-2 text-[8px] font-black uppercase tracking-widest"><i className="fas fa-check-circle"></i><span>Lugar Verificado en Google Maps</span></div>}
              </div>
              <button type="submit" className="w-full bg-orange-600 text-white py-5 rounded-3xl font-black uppercase text-xs tracking-widest">Agendar Partido</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamsPage;
