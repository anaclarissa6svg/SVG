
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
    { id: 'dashboard', label: 'Inicio', icon: 'fa-home', isVisible: true },
    { id: 'payments', label: 'Pagos', icon: 'fa-credit-card', isVisible: user.permissions.payments !== 'none' },
    { id: 'physio', label: 'Fisioterapia', icon: 'fa-hand-holding-medical', isVisible: user.permissions.physio !== 'none' },
    { id: 'social', label: 'Área Social', icon: 'fa-users', isVisible: user.permissions.social !== 'none' },
    { id: 'teams', label: 'Equipos', icon: 'fa-calendar-alt', isVisible: user.permissions.teams !== 'none' },
    { id: 'audit', label: 'Logs', icon: 'fa-shield-alt', isVisible: user.role === UserRole.ADMIN },
  ];

  return (
    <nav className="bg-[#2d0000] text-white shadow-2xl sticky top-0 z-50 border-b border-red-950">
      <div className="container mx-auto px-4">
        {/* Top bar: Brand and User Action */}
        <div className="flex justify-between items-center h-16 border-b border-white/5 lg:border-none">
          <div className="flex items-center space-x-4">
            <div className="flex flex-col cursor-pointer group" onClick={() => setCurrentPage('dashboard')}>
              <span className="font-black text-2xl tracking-tighter leading-none italic group-hover:text-red-400 transition-colors">SAVAGE</span>
              <span className="text-[8px] font-bold text-red-500 uppercase tracking-[0.4em] leading-none">ACADEMIA</span>
            </div>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-6">
            <div className="hidden sm:block text-right pr-4 border-r border-red-900/50">
              <p className="text-[8px] font-black text-red-500 uppercase tracking-widest leading-none mb-1">
                {user.role}
              </p>
              <p className="text-xs font-black italic">{user.name}</p>
            </div>
            <button
              onClick={onLogout}
              className="bg-red-600 hover:bg-red-700 w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl transition-all active:scale-90 shadow-lg"
              title="Cerrar Sesión"
            >
              <i className="fas fa-power-off text-white text-xs sm:text-base"></i>
            </button>
          </div>
        </div>

        {/* Navigation Items: Scrollable on mobile, flex on desktop */}
        <div className="flex overflow-x-auto custom-scrollbar no-scrollbar-mobile py-2 -mx-4 px-4 lg:mx-0 lg:px-0 lg:py-0 lg:h-12 lg:items-center space-x-1">
          {navItems.filter(item => item.isVisible).map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`flex-shrink-0 flex items-center space-x-2 px-4 py-2 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest lg:text-xs ${
                currentPage === item.id 
                  ? 'bg-red-600 text-white shadow-lg' 
                  : 'text-red-200/50 hover:text-white hover:bg-red-900/40'
              }`}
            >
              <i className={`fas ${item.icon}`}></i>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width: 1024px) {
          .no-scrollbar-mobile::-webkit-scrollbar {
            display: none;
          }
          .no-scrollbar-mobile {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
