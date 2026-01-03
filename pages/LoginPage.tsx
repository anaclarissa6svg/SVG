
import React, { useState, useRef } from 'react';
import { MOCK_USERS } from '../constants';
import { User } from '../types';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [realPassword, setRealPassword] = useState('');
  const [displayPassword, setDisplayPassword] = useState('');
  const [error, setError] = useState('');
  const timersRef = useRef<{ [key: number]: any }>({});

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const prevDisplay = displayPassword;
    const prevReal = realPassword;
    
    // Si se añadió un carácter
    if (newValue.length > prevDisplay.length) {
      const charAdded = newValue.charAt(newValue.length - 1);
      const newReal = prevReal + charAdded;
      
      // Los caracteres anteriores se convierten en asteriscos inmediatamente
      const newDisplay = '*'.repeat(prevDisplay.length) + charAdded;
      const index = newDisplay.length - 1;

      setRealPassword(newReal);
      setDisplayPassword(newDisplay);

      // Limpiar todos los timers existentes para que no haya conflictos
      Object.values(timersRef.current).forEach(clearTimeout);
      timersRef.current = {};

      // Programar el enmascaramiento del ÚLTIMO carácter a los 2 segundos
      timersRef.current[index] = setTimeout(() => {
        setDisplayPassword(current => {
          const chars = current.split('');
          if (chars[index]) chars[index] = '*';
          return chars.join('');
        });
      }, 2000);
    } 
    // Si se borró un carácter
    else if (newValue.length < prevDisplay.length) {
      const newReal = prevReal.slice(0, newValue.length);
      // Al borrar, mantenemos todo enmascarado para mayor seguridad
      const newDisplay = '*'.repeat(newReal.length); 
      
      // Limpiar timers al borrar
      Object.values(timersRef.current).forEach(clearTimeout);
      timersRef.current = {};

      setRealPassword(newReal);
      setDisplayPassword(newDisplay);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = MOCK_USERS.find(u => u.username === username);

    if (username === 'Clari') {
        if (realPassword === '1215') {
            onLogin(user!);
            return;
        } else {
            setError('Contraseña administrativa incorrecta.');
            return;
        }
    }

    if (user) {
      onLogin(user);
    } else {
      setError('Usuario no encontrado. Verifique sus credenciales.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100">
        {/* Header con el Gradiente */}
        <div className="bg-gradient-to-br from-[#1e1e1e] via-[#2d0000] to-[#1e1e1e] py-16 px-4 text-center relative">
          <div className="relative z-10">
            <h1 className="text-white text-3xl font-black tracking-tighter uppercase italic">ACADEMIA SAVAGE</h1>
            <div className="h-1 w-16 bg-red-600 mx-auto mt-4 rounded-full"></div>
            <p className="text-red-200 mt-4 font-bold opacity-80 uppercase text-[10px] tracking-[0.3em]">Sistema de Gestión Integral</p>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-10 space-y-7">
          {error && (
            <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-600 p-4 rounded-xl text-sm flex items-center animate-shake">
              <i className="fas fa-exclamation-circle mr-3 text-lg"></i>
              <span className="font-bold">{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Usuario Autorizado</label>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 group-focus-within:text-red-600 transition-colors">
                <i className="fas fa-user-shield"></i>
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:bg-white transition-all font-bold text-black placeholder-slate-300"
                placeholder="Nombre de usuario"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Clave de Acceso</label>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 group-focus-within:text-red-600 transition-colors">
                <i className="fas fa-lock"></i>
              </span>
              <input
                type="text"
                value={displayPassword}
                onChange={handlePasswordChange}
                className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:bg-white transition-all font-bold text-black tracking-[0.5em] placeholder-slate-300 placeholder:tracking-normal"
                placeholder="••••••••"
                required
                autoComplete="off"
                spellCheck="false"
              />
            </div>
            <div className="flex items-center mt-2 ml-1">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse mr-2"></div>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight italic">Seguridad activa: Caracteres temporales (2s)</p>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[#2d0000] text-white font-black py-5 px-4 rounded-2xl hover:bg-black focus:outline-none focus:ring-4 focus:ring-red-500/30 transition-all transform active:scale-[0.97] shadow-2xl shadow-red-950/20 uppercase text-sm tracking-widest flex items-center justify-center group"
          >
            <span>Ingresar al Panel</span>
            <i className="fas fa-chevron-right ml-3 text-xs group-hover:translate-x-1 transition-transform"></i>
          </button>
        </form>

        <div className="p-6 bg-slate-50 text-center border-t border-slate-100">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
            Academia Savage CUU • © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
