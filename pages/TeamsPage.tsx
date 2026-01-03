
import React, { useState, useMemo } from 'react';
import { Athlete, Team, Match, User, UserRole, PhysicalTest } from '../types';
import { MOCK_USERS } from '../constants';

interface TeamsPageProps {
  athletes: Athlete[];
  teams: Team[];
  setTeams: (teams: Team[]) => void;
  matches: Match[];
  setMatches: (matches: Match[]) => void;
  user: User;
  onUpdateAthlete?: (athlete: Athlete) => void;
}

const DEFAULT_AGE_CATEGORIES = [
  'Sub-6', 'Sub-7', 'Sub-8', 'Sub-9', 'Sub-10', 
  'Sub-11', 'Sub-12', 'Sub-13', 'Sub-14', 'Sub-15', 
  'Sub-16', 'Sub-17', 'Sub-18', 'Sub-19', 'Sub-20', 'Libre'
];

const TeamsPage: React.FC<TeamsPageProps> = ({ athletes, teams, setTeams, matches, setMatches, user, onUpdateAthlete }) => {
  const [activeTab, setActiveTab] = useState<'teams' | 'matches' | 'phys_tests'>('teams');
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [selectedTeamForRoster, setSelectedTeamForRoster] = useState<Team | null>(null);
  const [selectedAthleteForTest, setSelectedAthleteForTest] = useState<Athlete | null>(null);

  const [teamForm, setTeamForm] = useState({ category: 'Varonil', ageCategory: 'Sub-12', coachName: '' });
  const [newMatch, setNewMatch] = useState({ 
    teamId: '', opponent: '', date: '', time: '', location: '', observations: '' 
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

  const coaches = useMemo(() => MOCK_USERS.filter(u => u.role === UserRole.COACH || u.role === UserRole.ADMIN), []);

  const dynamicAgeCategories = useMemo(() => {
    const existing = teams.map(t => t.ageCategory).filter(Boolean) as string[];
    const combined = Array.from(new Set([...DEFAULT_AGE_CATEGORIES, ...existing]));
    return combined.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  }, [teams]);

  const handleOpenTeamModal = (team?: Team) => {
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
    if (editingTeam) {
      const updatedTeams = teams.map(t => t.id === editingTeam.id ? { ...t, category: teamForm.category, ageCategory: teamForm.ageCategory, coachName: teamForm.coachName } : t);
      setTeams(updatedTeams);
    } else {
      const team: Team = { id: Math.random().toString(36).substr(2, 9), category: teamForm.category, ageCategory: teamForm.ageCategory, coachName: teamForm.coachName, athleteIds: [] };
      setTeams([...teams, team]);
    }
    setShowTeamModal(false);
  };

  const handleAddMatch = (e: React.FormEvent) => {
    e.preventDefault();
    const match: Match = { id: Math.random().toString(36).substr(2, 9), ...newMatch, selectedAthleteIds: [] };
    setMatches([...matches, match]);
    setShowMatchModal(false);
    setNewMatch({ teamId: '', opponent: '', date: '', time: '', location: '', observations: '' });
  };

  const handleSaveTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAthleteForTest || !onUpdateAthlete) return;
    const newTest: PhysicalTest = { id: Math.random().toString(36).substr(2, 9), ...testForm, createdBy: user.name };
    const updatedAthlete = { ...selectedAthleteForTest, physicalTests: [...(selectedAthleteForTest.physicalTests || []), newTest] };
    onUpdateAthlete(updatedAthlete);
    setShowTestModal(false);
    setSelectedAthleteForTest(null);
  };

  const toggleAthleteInTeam = (teamId: string, athleteId: string) => {
    const updatedTeams = teams.map(t => {
      if (t.id === teamId) {
        const hasAthlete = t.athleteIds.includes(athleteId);
        return { ...t, athleteIds: hasAthlete ? t.athleteIds.filter(id => id !== athleteId) : [...t.athleteIds, athleteId] };
      }
      return t;
    });
    setTeams(updatedTeams);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight italic uppercase">Módulo Deportivo</h1>
        </div>
        <div className="flex bg-slate-900 p-1.5 rounded-2xl w-full sm:w-auto shadow-2xl">
          <button onClick={() => setActiveTab('teams')} className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-black text-[10px] uppercase ${activeTab === 'teams' ? 'bg-red-600 text-white' : 'text-slate-400'}`}>EQUIPOS</button>
          <button onClick={() => setActiveTab('matches')} className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-black text-[10px] uppercase ${activeTab === 'matches' ? 'bg-orange-600 text-white' : 'text-slate-400'}`}>PARTIDOS</button>
          <button onClick={() => setActiveTab('phys_tests')} className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-black text-[10px] uppercase ${activeTab === 'phys_tests' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}>PRUEBAS</button>
        </div>
      </header>

      {activeTab === 'teams' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex justify-end"><button onClick={() => handleOpenTeamModal()} className="bg-red-900 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest">Registrar Equipo</button></div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map(team => (
              <div key={team.id} className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden group">
                <div className="bg-red-900 p-6 text-white flex justify-between items-center">
                  <h4 className="font-black text-xl uppercase italic">{team.ageCategory} {team.category}</h4>
                  <button onClick={() => handleOpenTeamModal(team)} className="bg-white/10 p-2 rounded-full"><i className="fas fa-edit"></i></button>
                </div>
                <div className="p-6">
                   <button onClick={() => setSelectedTeamForRoster(team)} className="w-full bg-slate-50 py-3 rounded-2xl font-black text-xs text-red-900 border border-slate-200">Gestionar Plantilla</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'matches' && (
        <div className="space-y-6">
          <div className="flex justify-end"><button onClick={() => setShowMatchModal(true)} className="bg-orange-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest">Agendar Partido</button></div>
          {/* Listado de partidos... */}
        </div>
      )}

      {showTeamModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 max-h-[95vh] flex flex-col">
            <div className="bg-red-900 p-8 text-white flex justify-between items-center flex-shrink-0">
              <h3 className="text-2xl font-black uppercase italic">{editingTeam ? 'Editar Equipo' : 'Nuevo Equipo'}</h3>
              <button onClick={() => setShowTeamModal(false)} className="text-white/40 hover:text-white transition text-2xl"><i className="fas fa-times"></i></button>
            </div>
            <div className="overflow-y-auto custom-scrollbar flex-grow">
              <form onSubmit={handleSaveTeam} className="p-8 space-y-6">
                <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Rama</label><select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-black" value={teamForm.category} onChange={(e) => setTeamForm({...teamForm, category: e.target.value})} required><option value="Varonil">Varonil</option><option value="Femenino">Femenino</option><option value="Mixto">Mixto</option></select></div>
                <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Categoría Edad</label><input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-black" value={teamForm.ageCategory} onChange={(e) => setTeamForm({...teamForm, ageCategory: e.target.value})} required /></div>
                <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Coach</label><select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-black" value={teamForm.coachName} onChange={(e) => setTeamForm({...teamForm, coachName: e.target.value})}><option value="">Seleccionar...</option>{coaches.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div>
                <button type="submit" className="w-full bg-red-900 text-white py-5 rounded-3xl font-black uppercase text-xs tracking-widest">Guardar</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {showMatchModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 max-h-[95vh] flex flex-col">
            <div className="bg-orange-600 p-8 text-white flex justify-between items-center flex-shrink-0">
                <h3 className="text-2xl font-black uppercase italic">Programar Partido</h3>
                <button onClick={() => setShowMatchModal(false)} className="text-white/40 hover:text-white transition text-2xl"><i className="fas fa-times"></i></button>
            </div>
            <div className="overflow-y-auto custom-scrollbar flex-grow">
              <form onSubmit={handleAddMatch} className="p-8 space-y-6">
                <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Equipo Local</label><select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-black" value={newMatch.teamId} onChange={(e) => setNewMatch({...newMatch, teamId: e.target.value})} required><option value="">-- Buscar Equipo --</option>{teams.map(t => <option key={t.id} value={t.id}>{t.ageCategory} {t.category}</option>)}</select></div>
                <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nombre del Rival</label><input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black italic uppercase text-black" value={newMatch.opponent} onChange={(e) => setNewMatch({...newMatch, opponent: e.target.value})} required /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Fecha</label><input type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-black" value={newMatch.date} onChange={(e) => setNewMatch({...newMatch, date: e.target.value})} required /></div>
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Hora</label><input type="time" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-black" value={newMatch.time} onChange={(e) => setNewMatch({...newMatch, time: e.target.value})} required /></div>
                </div>
                <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Sede</label><input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-black" value={newMatch.location} onChange={(e) => setNewMatch({...newMatch, location: e.target.value})} required /></div>
                <button type="submit" className="w-full bg-orange-600 text-white py-5 rounded-3xl font-black uppercase text-xs tracking-widest">Agendar</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamsPage;
