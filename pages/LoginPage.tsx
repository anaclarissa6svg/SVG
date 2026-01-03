
import React, { useState } from 'react';
import { User } from '../types';

interface LoginPageProps {
  onLogin: (user: User) => void;
  users: User[];
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, users }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());

    if (user && user.password === password) {
      onLogin(user);
    } else {
      setError('Credenciales inválidas. Contacte al Administrador.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f1f5f9] px-4">
      <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100">
        <div className="bg-[#2d0000] py-16 text-center">
            <h1 className="text-white text-4xl font-black italic tracking-tighter uppercase">SAVAGE</h1>
            <p className="text-red-500 font-bold uppercase text-[10px] tracking-[0.5em] mt-2">Gestión Academia</p>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-6">
          {error && (
            <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl text-[10px] font-black uppercase text-center border border-rose-100">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Usuario</label>
            <input
              type="text"
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-red-500 outline-none"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder=""
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Contraseña</label>
            <input
              type="password"
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-red-500 outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="w-full bg-[#2d0000] text-white py-5 rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-black transition-all">
            Ingresar al Panel
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
