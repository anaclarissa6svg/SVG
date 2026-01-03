
import React, { useState, useEffect, useCallback } from 'react';
import { User, UserRole, Athlete, Team, Match, AuditEntry, NoticeEvent } from './types';
import { MOCK_USERS, MOCK_ATHLETES, MOCK_TEAMS } from './constants';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import AthleteDetail from './pages/AthleteDetail';
import PaymentsPage from './pages/PaymentsPage';
import PhysioPage from './pages/PhysioPage';
import SocialPage from './pages/SocialPage';
import TeamsPage from './pages/TeamsPage';
import AuditLogPage from './pages/AuditLogPage';
import DatabasePhysio from './pages/DatabasePhysio';
import DatabaseAthletes from './pages/DatabaseAthletes';
import AdminUsersPage from './pages/AdminUsersPage';
import Navbar from './components/Navbar';

const STORAGE_KEYS = {
  ATHLETES: 'savage_athletes_v1',
  TEAMS: 'savage_teams_v1',
  MATCHES: 'savage_matches_v1',
  EVENTS: 'savage_events_v1',
  AUDIT: 'savage_audit_v1',
  USER: 'savage_session_user',
  USERS: 'savage_system_users'
};

const App: React.FC = () => {
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    return saved ? JSON.parse(saved) : MOCK_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USER);
    return saved ? JSON.parse(saved) : null;
  });

  const [athletes, setAthletes] = useState<Athlete[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ATHLETES);
    return saved ? JSON.parse(saved) : MOCK_ATHLETES;
  });

  const [teams, setTeams] = useState<Team[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TEAMS);
    return saved ? JSON.parse(saved) : MOCK_TEAMS;
  });

  const [matches, setMatches] = useState<Match[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MATCHES);
    return saved ? JSON.parse(saved) : [];
  });

  const [events, setEvents] = useState<NoticeEvent[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EVENTS);
    return saved ? JSON.parse(saved) : [];
  });

  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUDIT);
    return saved ? JSON.parse(saved) : [];
  });

  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);
  const [showAdminPassModal, setShowAdminPassModal] = useState(false);
  const [adminPassInput, setAdminPassInput] = useState('');
  const [adminPassError, setAdminPassError] = useState(false);

  useEffect(() => { localStorage.setItem(STORAGE_KEYS.ATHLETES, JSON.stringify(athletes)); }, [athletes]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(teams)); }, [teams]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(matches)); }, [matches]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events)); }, [events]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(auditLogs)); }, [auditLogs]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users)); }, [users]);
  useEffect(() => {
    if (currentUser) localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
    else localStorage.removeItem(STORAGE_KEYS.USER);
  }, [currentUser]);

  const addAuditLog = useCallback((action: string, targetId: string, targetType: string) => {
    if (!currentUser) return;
    const newEntry: AuditEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      action,
      targetId,
      targetType
    };
    setAuditLogs(prev => [newEntry, ...prev]);
  }, [currentUser]);

  const handleUpdateAthlete = (updatedAthlete: Athlete) => {
    setAthletes(prev => prev.map(a => a.id === updatedAthlete.id ? updatedAthlete : a));
    addAuditLog('Actualización Atleta', updatedAthlete.id, 'Atleta');
  };

  const handleAddAthlete = (newAthlete: Athlete) => {
    if (currentUser?.permissions.teams !== 'edit') { alert('No tienes permiso para registrar atletas.'); return; }
    setAthletes(prev => [...prev, newAthlete]);
    addAuditLog('Registro Atleta', newAthlete.id, 'Atleta');
  };

  const handleDeleteAthlete = (id: string) => {
    if (currentUser?.role !== UserRole.ADMIN) { alert('Solo administradores pueden borrar datos.'); return; }
    setAthletes(prev => prev.filter(a => a.id !== id));
    addAuditLog('Baja Atleta', id, 'Atleta');
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentPage('dashboard');
    setSelectedAthleteId(null);
  };

  const handleAdminPassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassInput === '0102') {
      setCurrentPage('admin-users');
      setShowAdminPassModal(false);
      setAdminPassInput('');
      setAdminPassError(false);
    } else {
      setAdminPassError(true);
      setTimeout(() => setAdminPassError(false), 2000);
    }
  };

  if (!currentUser) {
    return <LoginPage onLogin={setCurrentUser} users={users} />;
  }

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard 
            athletes={athletes} user={currentUser} 
            onViewAthlete={(id) => { setSelectedAthleteId(id); setCurrentPage('athlete-detail'); }} 
            onAddAthlete={handleAddAthlete}
            onSendToPhysio={(id) => { setSelectedAthleteId(id); setCurrentPage('physio'); }}
            matches={matches} teams={teams} events={events}
            onAddEvent={(ev) => { if(currentUser.permissions.teams === 'edit') setEvents(prev => [ev, ...prev]); }}
          />
        );
      case 'athlete-detail':
        const athlete = athletes.find(a => a.id === selectedAthleteId);
        return athlete ? (
          <AthleteDetail 
            athlete={athlete} user={currentUser} onUpdate={handleUpdateAthlete}
            onDelete={handleDeleteAthlete} onBack={() => setCurrentPage('dashboard')}
            allAthletes={athletes}
          />
        ) : null;
      case 'payments':
        return currentUser.permissions.payments !== 'none' ? <PaymentsPage athletes={athletes} onUpdateAthlete={handleUpdateAthlete} user={currentUser} /> : null;
      case 'physio':
        return currentUser.permissions.physio !== 'none' ? (
          <PhysioPage athletes={athletes} selectedAthleteId={selectedAthleteId} onUpdateAthlete={handleUpdateAthlete} user={currentUser} />
        ) : null;
      case 'social':
        return currentUser.permissions.social !== 'none' ? (
          <SocialPage athletes={athletes} onUpdateAthlete={handleUpdateAthlete} user={currentUser} />
        ) : null;
      case 'teams':
        return currentUser.permissions.teams !== 'none' ? (
          <TeamsPage 
            athletes={athletes} 
            teams={teams} 
            setTeams={setTeams} 
            matches={matches} 
            setMatches={setMatches} 
            user={currentUser} 
            onUpdateAthlete={handleUpdateAthlete}
            users={users}
            setUsers={setUsers}
          />
        ) : null;
      case 'audit':
        return currentUser.role === UserRole.ADMIN ? <AuditLogPage logs={auditLogs} /> : null;
      case 'db-physio':
        return <DatabasePhysio athletes={athletes} />;
      case 'db-athletes':
        return <DatabaseAthletes athletes={athletes} />;
      case 'admin-users':
        return currentUser.role === UserRole.ADMIN ? (
          <AdminUsersPage 
            users={users} 
            onUpdateUsers={setUsers} 
            currentUser={currentUser}
            onUpdateCurrentUser={setCurrentUser}
          />
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Navbar user={currentUser} onLogout={handleLogout} currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <main className="flex-grow container mx-auto px-4 py-8 page-transition pb-32">
        {renderContent()}
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-200 z-40 py-4 shadow-2xl">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex gap-4">
             {currentUser.permissions.physio !== 'none' && (
               <button onClick={() => setCurrentPage('db-physio')} className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${currentPage === 'db-physio' ? 'bg-emerald-600 text-white' : 'text-emerald-700 hover:bg-emerald-50'}`}>
                 <i className="fas fa-file-medical"></i> <span>Reporte Fisio</span>
               </button>
             )}
             {currentUser.permissions.payments !== 'none' && (
               <button onClick={() => setCurrentPage('db-athletes')} className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${currentPage === 'db-athletes' ? 'bg-red-900 text-white' : 'text-red-900 hover:bg-red-50'}`}>
                 <i className="fas fa-file-invoice-dollar"></i> <span>Base Pagos</span>
               </button>
             )}
          </div>
          
          <div className="flex gap-4">
            {currentUser.role === UserRole.ADMIN && (
              <button 
                onClick={() => setShowAdminPassModal(true)}
                className={`flex items-center space-x-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition ${currentPage === 'admin-users' ? 'bg-slate-900 border-slate-900 text-white' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
              >
                <i className="fas fa-user-gear"></i> <span>Gestión Personal</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {showAdminPassModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[250] p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="bg-[#2d0000] p-8 text-white text-center">
              <i className="fas fa-shield-halved text-4xl mb-4 text-red-500"></i>
              <h3 className="text-xl font-black uppercase italic tracking-tighter">Acceso Restringido</h3>
              <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mt-1">Super Administrador</p>
            </div>
            <form onSubmit={handleAdminPassSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-center">Ingrese Clave Maestra</label>
                <input 
                  autoFocus
                  type="password" 
                  className={`w-full p-4 bg-slate-50 border-2 rounded-2xl text-center text-2xl font-black tracking-[0.5em] outline-none transition-all ${adminPassError ? 'border-red-500 bg-red-50 text-red-600 animate-shake' : 'border-slate-100 focus:border-red-900'}`}
                  value={adminPassInput}
                  onChange={(e) => setAdminPassInput(e.target.value)}
                  placeholder="••••"
                  maxLength={4}
                />
                {adminPassError && (
                  <p className="text-[9px] font-black text-red-600 text-center uppercase tracking-widest">Clave Incorrecta</p>
                )}
              </div>
              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-red-900 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-red-900/20 active:scale-95 transition">Validar</button>
                <button type="button" onClick={() => { setShowAdminPassModal(false); setAdminPassInput(''); }} className="px-6 bg-slate-100 text-slate-500 font-black rounded-2xl uppercase text-[10px] tracking-widest">Cerrar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer className="bg-slate-900 text-slate-500 py-10 text-center border-t border-slate-800 pb-36">
        <p className="text-[9px] font-black uppercase tracking-[0.5em] mb-2 opacity-50">ACADEMIA SAVAGE CUU - SISTEMA CENTRALIZADO</p>
        <p className="text-[8px] font-bold">ACCESO RESTRINGIDO A PERSONAL AUTORIZADO</p>
      </footer>
    </div>
  );
};

export default App;
