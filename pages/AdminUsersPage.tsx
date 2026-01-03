
import React, { useState } from 'react';
import { User, UserRole, PermissionLevel, UserPermissions } from '../types';

interface AdminUsersPageProps {
  users: User[];
  onUpdateUsers: (users: User[]) => void;
  currentUser: User;
  onUpdateCurrentUser: (user: User) => void;
}

const AdminUsersPage: React.FC<AdminUsersPageProps> = ({ users, onUpdateUsers, currentUser, onUpdateCurrentUser }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<{ [key: string]: boolean }>({});
  
  const [form, setForm] = useState({ 
    name: '', 
    username: '', 
    password: '', 
    role: UserRole.COACH,
    permissions: {
      payments: 'none',
      physio: 'none',
      social: 'none',
      teams: 'none'
    } as UserPermissions
  });

  const handleOpenAdd = () => {
    setEditingUser(null);
    setForm({ 
      name: '', 
      username: '', 
      password: '', 
      role: UserRole.COACH,
      permissions: { payments: 'none', physio: 'none', social: 'none', teams: 'view' }
    });
    setShowModal(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setForm({ 
      name: user.name, 
      username: user.username, 
      password: user.password || '', 
      role: user.role,
      permissions: { ...user.permissions }
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que el nombre de usuario no esté tomado por otro usuario
    const isDuplicate = users.some(u => 
      u.username.toLowerCase() === form.username.toLowerCase() && 
      (!editingUser || u.id !== editingUser.id)
    );

    if (isDuplicate) {
      alert('Error: Este nombre de usuario ya está en uso por otro colaborador.');
      return;
    }

    if (editingUser) {
      const updatedUsers = users.map(u => u.id === editingUser.id ? { ...u, ...form } : u);
      onUpdateUsers(updatedUsers);
      
      // Si el usuario editado es el actual, actualizar la sesión
      if (editingUser.id === currentUser.id) {
        onUpdateCurrentUser({ ...currentUser, ...form });
      }
    } else {
      const newUser: User = { id: `u-${Date.now()}`, ...form };
      onUpdateUsers([...users, newUser]);
    }
    setShowModal(false);
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (u: string, p: string) => {
    const text = `Acceso Academia Savage:\nUsuario: ${u}\nContraseña: ${p}`;
    navigator.clipboard.writeText(text).then(() => {
      alert('Credenciales copiadas al portapapeles');
    });
  };

  const updatePermission = (module: keyof UserPermissions, level: PermissionLevel) => {
    setForm({
      ...form,
      permissions: {
        ...form.permissions,
        [module]: level
      }
    });
  };

  const deleteUser = (id: string) => {
    if (id === currentUser.id) {
      alert('No puedes eliminar tu propio usuario de administrador mientras estás en sesión.');
      return;
    }
    if (confirm('¿Eliminar acceso de este usuario permanentemente?')) {
      onUpdateUsers(users.filter(u => u.id !== id));
    }
  };

  const PermissionToggle = ({ module, label, icon }: { module: keyof UserPermissions, label: string, icon: string }) => {
    const current = form.permissions[module];
    return (
      <div className="bg-slate-50 p-4 rounded-3xl border border-slate-200 space-y-3">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-red-900 border border-slate-100">
            <i className={`fas ${icon} text-xs`}></i>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{label}</span>
        </div>
        <div className="grid grid-cols-3 gap-1 bg-white p-1 rounded-2xl border border-slate-200 shadow-inner">
          {[
            { id: 'none', label: 'Ocultar', color: 'text-slate-400', active: 'bg-slate-100 text-slate-800' },
            { id: 'view', label: 'Solo Ver', color: 'text-amber-500', active: 'bg-amber-500 text-white' },
            { id: 'edit', label: 'Editar', color: 'text-emerald-500', active: 'bg-emerald-600 text-white' }
          ].map(opt => (
            <button
              key={opt.id}
              type="button"
              onClick={() => updatePermission(module, opt.id as PermissionLevel)}
              className={`py-2 rounded-xl text-[8px] font-black uppercase tracking-tighter transition-all ${current === opt.id ? opt.active + ' shadow-md' : 'text-slate-300 hover:text-slate-500'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 uppercase italic tracking-tight">Gestión de Personal</h1>
          <p className="text-slate-500 text-sm font-medium">Configura accesos y permisos por módulo.</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="bg-red-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-black transition flex items-center"
        >
          <i className="fas fa-user-plus mr-2"></i> Nuevo Colaborador
        </button>
      </header>

      <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Colaborador</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Credenciales de Acceso</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Permisos de Módulo</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#2d0000] text-white flex items-center justify-center font-black italic text-lg shadow-lg">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-black text-slate-800 uppercase italic text-sm">{u.name}</p>
                        <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest">{u.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 inline-flex items-center gap-4">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-400 uppercase">Usuario:</span>
                        <span className="text-xs font-bold text-slate-700">@{u.username}</span>
                      </div>
                      <div className="w-px h-6 bg-slate-200"></div>
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-400 uppercase">Contraseña:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-slate-800">
                            {visiblePasswords[u.id] ? u.password : '••••••••'}
                          </span>
                          <button onClick={() => togglePasswordVisibility(u.id)} className="text-slate-300 hover:text-red-900 transition">
                            <i className={`fas ${visiblePasswords[u.id] ? 'fa-eye-slash' : 'fa-eye'} text-[10px]`}></i>
                          </button>
                        </div>
                      </div>
                      <button onClick={() => copyToClipboard(u.username, u.password || '')} className="ml-2 bg-white p-2 rounded-xl text-slate-400 hover:text-emerald-600 shadow-sm border border-slate-100">
                        <i className="fas fa-copy text-[10px]"></i>
                      </button>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex justify-center flex-wrap gap-1 max-w-[200px] mx-auto">
                       {Object.entries(u.permissions).map(([mod, level]) => (
                         <div key={mod} className={`px-2 py-0.5 rounded-lg text-[7px] font-black uppercase tracking-widest border ${level === 'edit' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : level === 'view' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-slate-50 text-slate-300 border-slate-100'}`}>
                            {mod}
                         </div>
                       ))}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end space-x-2">
                      <button onClick={() => handleOpenEdit(u)} className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 hover:bg-red-900 hover:text-white transition flex items-center justify-center shadow-sm"><i className="fas fa-edit"></i></button>
                      <button disabled={u.username === 'Clari'} onClick={() => deleteUser(u.id)} className="w-10 h-10 rounded-xl bg-slate-100 text-slate-300 hover:text-red-600 hover:bg-red-50 transition flex items-center justify-center disabled:opacity-20 shadow-sm"><i className="fas fa-trash"></i></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-300 flex flex-col max-h-[90vh]">
             <div className="bg-[#2d0000] p-10 text-white flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                    {editingUser ? 'Actualizar Miembro' : 'Nuevo Miembro'}
                  </h3>
                  <p className="text-red-500 text-[10px] font-black uppercase tracking-[0.2em]">Configuración de Privilegios</p>
                </div>
                <button onClick={() => setShowModal(false)} className="text-white/40 hover:text-white transition"><i className="fas fa-times text-2xl"></i></button>
             </div>
             
             <div className="overflow-y-auto custom-scrollbar flex-grow">
               <form onSubmit={handleSubmit} className="p-10 space-y-10">
                  <section className="space-y-6">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Información de Acceso</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nombre Completo</label>
                        <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black italic uppercase text-slate-800 outline-none" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Cargo Principal</label>
                        <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black uppercase text-slate-800" value={form.role} onChange={e => setForm({...form, role: e.target.value as UserRole})}>
                          {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Usuario (Login)</label>
                        <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none" value={form.username} onChange={e => setForm({...form, username: e.target.value})} required />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Contraseña</label>
                        <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
                      </div>
                    </div>
                  </section>

                  <section className="space-y-6">
                    <h4 className="text-[10px] font-black text-red-900 uppercase tracking-widest border-b border-red-100 pb-2 flex justify-between items-center">
                      <span>Configuración de Permisos por Módulo</span>
                      <i className="fas fa-lock"></i>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <PermissionToggle module="payments" label="Módulo de Pagos" icon="fa-credit-card" />
                      <PermissionToggle module="physio" label="Fisioterapia" icon="fa-hand-holding-medical" />
                      <PermissionToggle module="social" label="Área Social" icon="fa-users" />
                      <PermissionToggle module="teams" label="Equipos y Partidos" icon="fa-calendar-alt" />
                    </div>
                  </section>

                  <button 
                    type="submit" 
                    className="w-full bg-red-900 text-white py-6 rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:bg-black transition-all transform active:scale-95 mt-8"
                  >
                    {editingUser ? 'Aplicar Cambios de Seguridad' : 'Confirmar Nuevo Colaborador'}
                  </button>
               </form>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
