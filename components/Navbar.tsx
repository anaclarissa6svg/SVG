import React, { useState } from 'react';
import { User, UserRole } from '../types';

interface NavbarProps {
  user: User;
  onLogout: () => void;
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout, currentPage, setCurrentPage }) => {
  const [showDbDock, setShowDbDock] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Inicio', icon: 'fa-home', roles: [UserRole.ADMIN, UserRole.FISIO, UserRole.SOCIAL, UserRole.COACH] },
    { id: 'payments', label: 'Pagos', icon: 'fa-credit-card', roles: [UserRole.ADMIN] },
    { id: 'physio', label: 'Fisioterapia', icon: 'fa-hand-holding-medical', roles: [UserRole.ADMIN, UserRole.FISIO] },
    { id: 'social', label: 'Área Social', icon: 'fa-users', roles: [UserRole.ADMIN, UserRole.SOCIAL] },
    { id: 'teams', label: 'Equipos/Partidos', icon: 'fa-calendar-alt', roles: [UserRole.ADMIN, UserRole.COACH] },
    { id: 'audit', label: 'Auditoría', icon: 'fa-shield-alt', roles: [UserRole.ADMIN] },
  ];

  const dbDockItems = [
    { id: 'db-physio', label: 'Reporte Terapias (Excel)', icon: 'fa-file-medical', roles: [UserRole.ADMIN, UserRole.FISIO] },
    { id: 'db-athletes', label: 'Base Deportistas (Excel)', icon: 'fa-file-invoice-dollar', roles: [UserRole.ADMIN] },
  ];

  return (
    <nav className="bg-red-900 text-white shadow-lg sticky top-0 z-50 border-b border-red-800">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            {/* Titulo de la Academia (Logo de imagen eliminado) */}
            <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => setCurrentPage('dashboard')}>
              <div className="flex flex-col">
                <span className="font-black text-xl md:text-2xl tracking-tighter leading-none group-hover:text-red-200 transition-colors">SAVAGE</span>
                <span className="text-[8px] font-bold text-red-300 uppercase tracking-[0.3em] leading-none">ACADEMIA CUU</span>
              </div>
            </div>

            {/* Dock de Bases de Datos */}
            <div className="relative">
              <button 
                onClick={() => setShowDbDock(!showDbDock)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border border-red-700/50 transition-all ${showDbDock ? 'bg-red-800 text-white shadow-inner' : 'bg-red-950/30 text-red-200 hover:bg-red-800'}`}
              >
                <i className="fas fa-database text-xs"></i>
                <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Bases de Datos</span>
                <i className={`fas fa-chevron-down text-[8px] transition-transform ${showDbDock ? 'rotate-180' : ''}`}></i>
              </button>

              {showDbDock && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowDbDock(false)}></div>
                  <div className="absolute left-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-2 border-b border-slate-50">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Consultas Estilo Excel</p>
                    </div>
                    {dbDockItems.filter(item => item.roles.includes(user.role)).map(item => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setCurrentPage(item.id);
                          setShowDbDock(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center space-x-3 group transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-red-100 group-hover:text-red-600 transition-colors">
                          <i className={`fas ${item.icon} text-sm`}></i>
                        </div>
                        <span className="text-xs font-bold text-slate-700 group-hover:text-red-900">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="hidden md:flex space-x-1">
            {navItems.filter(item => item.roles.includes(user.role)).map(item => (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-xl transition-all ${
                  currentPage === item.id 
                    ? 'bg-red-800 text-white shadow-inner font-bold' 
                    : 'text-red-100 hover:bg-red-800/50'
                }`}
              >
                <i className={`fas ${item.icon} text-sm`}></i>
                <span className="text-sm">{item.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block border-l border-red-800 pl-4">
              <div className="text-[10px] uppercase font-black text-red-300 leading-none mb-1">{user.role === UserRole.COACH ? 'COACH' : user.role}</div>
              <div className="text-sm font-bold tracking-tight">{user.name}</div>
            </div>
            <button
              onClick={onLogout}
              className="bg-red-600 hover:bg-red-700 w-9 h-9 flex items-center justify-center rounded-xl transition-all shadow-lg active:scale-95"
              title="Cerrar Sesión"
            >
              <i className="fas fa-sign-out-alt text-white"></i>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;