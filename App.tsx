
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
import Navbar from './components/Navbar';

// Claves de LocalStorage
const STORAGE_KEYS = {
  ATHLETES: 'savage_athletes_v1',
  TEAMS: 'savage_teams_v1',
  MATCHES: 'savage_matches_v1',
  EVENTS: 'savage_events_v1',
  AUDIT: 'savage_audit_v1',
  USER: 'savage_session_user'
};

const App: React.FC = () => {
  // --- ESTADO DE SESIÓN ---
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USER);
    return saved ? JSON.parse(saved) : null;
  });

  // --- ESTADOS DE DATOS ---
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

  // --- ESTADO DE NAVEGACIÓN ---
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);

  // --- PERSISTENCIA AUTOMÁTICA ---
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.ATHLETES, JSON.stringify(athletes)); }, [athletes]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(teams)); }, [teams]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(matches)); }, [matches]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events)); }, [events]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(auditLogs)); }, [auditLogs]);
  useEffect(() => {
    if (currentUser) localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
    else localStorage.removeItem(STORAGE_KEYS.USER);
  }, [currentUser]);

  // --- ACCIONES CENTRALIZADAS ---
  const addAuditLog = useCallback((action: string, targetId: string, targetType: string) => {
    if (!currentUser) return;
    const newEntry: AuditEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
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
    addAuditLog('Actualización de información', updatedAthlete.id, 'Atleta');
  };

  const handleAddAthlete = (newAthlete: Athlete) => {
    setAthletes(prev => [...prev, newAthlete]);
    addAuditLog('Registro de nuevo deportista', newAthlete.id, 'Atleta');
  };

  const handleDeleteAthlete = (id: string) => {
    setAthletes(prev => prev.filter(a => a.id !== id));
    addAuditLog('Eliminación de deportista', id, 'Atleta');
    setCurrentPage('dashboard');
    setSelectedAthleteId(null);
  };

  const handleAddEvent = (event: NoticeEvent) => {
    setEvents(prev => [event, ...prev]);
    addAuditLog('Creación de aviso general', event.id, 'Evento');
  };

  // --- RENDERIZADO CONDICIONAL ---
  if (!currentUser) {
    return <LoginPage onLogin={setCurrentUser} />;
  }

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard 
            athletes={athletes} 
            user={currentUser} 
            onViewAthlete={(id) => { setSelectedAthleteId(id); setCurrentPage('athlete-detail'); }} 
            onAddAthlete={handleAddAthlete}
            onSendToPhysio={(id) => { setSelectedAthleteId(id); setCurrentPage('physio'); }}
            matches={matches}
            teams={teams}
            events={events}
            onAddEvent={handleAddEvent}
          />
        );
      case 'athlete-detail':
        const athlete = athletes.find(a => a.id === selectedAthleteId);
        return athlete ? (
          <AthleteDetail 
            athlete={athlete} 
            user={currentUser} 
            onUpdate={handleUpdateAthlete}
            onDelete={handleDeleteAthlete}
            onBack={() => setCurrentPage('dashboard')}
            allAthletes={athletes}
          />
        ) : <div className="text-center py-20 font-bold">Atleta no encontrado.</div>;
      case 'payments':
        return currentUser.role === UserRole.ADMIN ? (
          <PaymentsPage athletes={athletes} onUpdateAthlete={handleUpdateAthlete} />
        ) : null;
      case 'physio':
        return (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.FISIO) ? (
          <PhysioPage 
            athletes={athletes}
            selectedAthleteId={selectedAthleteId}
            onUpdateAthlete={handleUpdateAthlete}
          />
        ) : null;
      case 'social':
        return (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SOCIAL) ? (
          <SocialPage athletes={athletes} onUpdateAthlete={handleUpdateAthlete} />
        ) : null;
      case 'teams':
        return (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.COACH) ? (
          <TeamsPage 
            athletes={athletes}
            teams={teams}
            setTeams={(newTeams) => { setTeams(newTeams); addAuditLog('Actualización de equipos', 'N/A', 'Sistema'); }}
            matches={matches}
            setMatches={setMatches}
            user={currentUser}
            onUpdateAthlete={handleUpdateAthlete}
          />
        ) : null;
      case 'audit':
        return currentUser.role === UserRole.ADMIN ? <AuditLogPage logs={auditLogs} /> : null;
      case 'db-physio':
        return <DatabasePhysio athletes={athletes} />;
      case 'db-athletes':
        return <DatabaseAthletes athletes={athletes} />;
      default:
        return <Dashboard athletes={athletes} user={currentUser} onViewAthlete={() => {}} onAddAthlete={() => {}} onSendToPhysio={() => {}} matches={[]} teams={[]} events={[]} onAddEvent={() => {}} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f1f5f9]">
      <Navbar 
        user={currentUser} 
        onLogout={() => setCurrentUser(null)} 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage} 
      />
      
      <main className="flex-grow container mx-auto px-4 py-8 page-transition">
        {renderContent()}
      </main>

      <footer className="bg-slate-900 text-slate-400 py-6 text-center border-t border-slate-800">
        <div className="container mx-auto">
          <p className="text-[10px] font-black uppercase tracking-[0.3em]">
            &copy; {new Date().getFullYear()} ACADEMIA SAVAGE CUU - SISTEMA DE GESTIÓN DEPORTIVA V1.0
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
