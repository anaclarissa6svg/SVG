
import React, { useState } from 'react';
import { User, UserRole } from '../types';

interface AdminUsersPageProps {
  users: User[];
  onUpdateUsers: (users: User[]) => void;
}

const AdminUsersPage: React.FC<AdminUsersPageProps> = ({ users, onUpdateUsers }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', username: '', password: '', role: UserRole.COACH });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: User = {
      id: `u-${Date.now()}`,
      name: form.name,
      username: form.username,
      password: form.password,
      role: form.role,
      canEdit: true
    };
    onUpdateUsers([...users, newUser]);
    setShowAdd(false);
    setForm({ name: '', username: '', password: '', role: UserRole.COACH });
  };

  const togglePermission = (userId: string) => {
    onUpdateUsers(users.map(u => 
      u.id === userId ? { ...u, canEdit: !u.canEdit } : u
    ));
  };

  const deleteUser = (id: string) => {
    if (confirm('¿Eliminar acceso de este usuario?')) {
      onUpdateUsers(users.filter(u => u.id !== id));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800 uppercase italic">Gestión de Personal</h1>
          <p className="text-slate-500 text-sm font-medium">Control de accesos y permisos del sistema</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-black transition"
        >
          <i className="fas fa-user-plus mr-2"></i> Nuevo Usuario
        </button>
      </header>

      <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre / Usuario</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Rol</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Permiso de Edición</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50/50 transition">
                <td className="px-8 py-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-black">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-black text-slate-800 uppercase italic text-sm">{u.name}</p>
                      <p className="text-[10px] font-bold text-slate-400">@{u.username}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6 text-center">
                  <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">
                    {u.role}
                  </span>
                </td>
                <td className="px-8 py-6 text-center">
                  <button 
                    onClick={() => togglePermission(u.id)}
                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border-2 ${
                      u.canEdit 
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                        : 'bg-red-50 border-red-200 text-red-400'
                    }`}
                  >
                    {u.canEdit ? 'Activado (Editor)' : 'Desactivado (Lector)'}
                  </button>
                </td>
                <td className="px-8 py-6 text-right">
                  <button 
                    disabled={u.username === 'Clari'}
                    onClick={() => deleteUser(u.id)}
                    className="w-10 h-10 rounded-xl text-slate-300 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-20"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-300">
             <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
                <h3 className="text-xl font-black uppercase italic">Nuevo Usuario</h3>
                <button onClick={() => setShowAdd(false)} className="text-white/40 hover:text-white transition"><i className="fas fa-times text-2xl"></i></button>
             </div>
             <form onSubmit={handleAdd} className="p-8 space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Nombre Real</label>
                  <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Usuario (Login)</label>
                    <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" value={form.username} onChange={e => setForm({...form, username: e.target.value})} required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Contraseña</label>
                    <input type="password" placeholder="••••" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Rol de Sistema</label>
                  <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-black" value={form.role} onChange={e => setForm({...form, role: e.target.value as UserRole})}>
                    {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
                  </select>
                </div>
                <button type="submit" className="w-full bg-red-600 text-white py-5 rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl">Crear Cuenta</button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
