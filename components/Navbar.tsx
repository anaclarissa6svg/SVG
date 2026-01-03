
import React from 'react';
import { User, UserRole } from '../types';

interface NavbarProps {
  user: User;
  onLogout: () => void;
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout, currentPage, setCurrentPage }) => {
  const navItems = [
    { id: 'dashboard', label: 'Inicio', icon: 'fa-home', roles: [UserRole.ADMIN, UserRole.FISIO, UserRole.SOCIAL, UserRole.COACH] },
    { id: 'payments', label: 'Pagos', icon: 'fa-credit-card', roles: [UserRole.ADMIN] },
    { id: 'physio', label: 'Fisioterapia', icon: 'fa-hand-holding-medical', roles: [UserRole.ADMIN, UserRole.FISIO] },
    { id: 'social', label: 'Área Social', icon: 'fa-users', roles: [UserRole.ADMIN, UserRole.SOCIAL] },
    { id: 'teams', label: 'Equipos/Partidos', icon: 'fa-calendar-alt', roles: [UserRole.ADMIN, UserRole.COACH] },
    { id: 'audit', label: 'Auditoría', icon: 'fa-shield-alt', roles: [UserRole.ADMIN] },
  ];

  return (
    <nav className="bg-[#2d0000] text-white shadow-xl sticky top-0 z-50 border-b border-red-950">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div className="flex flex-col cursor-pointer group" onClick={() => setCurrentPage('dashboard')}>
              <span className="font-black text-2xl tracking-tighter leading-none italic group-hover:text-red-400 transition-colors">SAVAGE</span>
              <span className="text-[8px] font-bold text-red-500 uppercase tracking-[0.4em] leading-none">ACADEMIA</span>
            </div>

            <div className="hidden lg:flex space-x-1">
              {navItems.filter(item => item.roles.includes(user.role)).map(item => (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all text-xs font-bold uppercase tracking-tight ${
                    currentPage === item.id 
                      ? 'bg-red-600 text-white shadow-lg' 
                      : 'text-red-200/60 hover:text-white hover:bg-red-900/40'
                  }`}
                >
                  <i className={`fas ${item.icon}`}></i>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <div className="hidden sm:block text-right pr-6 border-r border-red-900/50">
              <p className="text-[9px] font-black text-red-500 uppercase tracking-widest leading-none mb-1">
                {user.role} {user.canEdit ? '• Editor' : '• Lector'}
              </p>
              <p className="text-sm font-black italic">{user.name}</p>
            </div>
            <button
              onClick={onLogout}
              className="bg-red-600 hover:bg-red-700 w-10 h-10 flex items-center justify-center rounded-xl transition-all active:scale-90 shadow-lg"
              title="Salir"
            >
              <i className="fas fa-power-off text-white"></i>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
