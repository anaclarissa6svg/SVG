
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Athlete, User, UserRole, AthleteFile, SocialReport, PhysioConsultation } from '../types';

interface AthleteDetailProps {
  athlete: Athlete;
  user: User;
  onUpdate: (athlete: Athlete) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
  allAthletes?: Athlete[]; 
}

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const MONTHLY_FEE = 500;

const AthleteDetail: React.FC<AthleteDetailProps> = ({ athlete, user, onUpdate, onDelete, onBack, allAthletes = [] }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'files' | 'social' | 'physio'>('info');
  const photoInputRef = useRef<HTMLInputElement>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: athlete.firstName,
    lastName: athlete.lastName,
    dob: athlete.dob,
    category: athlete.category,
    position: athlete.position,
    isScholarship: athlete.isScholarship,
    photo: athlete.photo,
    tutorName: athlete.tutorName || '',
    tutorPhone: athlete.tutorPhone || ''
  });

  const [editPrevYearMonths, setEditPrevYearMonths] = useState<string[]>([]);

  useEffect(() => {
    if (isEditing) {
      const prevYear = new Date().getFullYear() - 1;
      const owed = Object.keys(athlete.payments || {})
        .filter(key => key.startsWith(`${prevYear}-`) && athlete.payments![key] === 0)
        .map(key => key.split('-')[1]);
      setEditPrevYearMonths(owed);
    }
  }, [isEditing, athlete.payments]);

  const canEditInfo = user.permissions.teams === 'edit' || user.role === UserRole.ADMIN;
  const canSeeSocial = user.permissions.social !== 'none';
  const canEditSocial = user.permissions.social === 'edit';
  const canSeePhysio = user.permissions.physio !== 'none';
  const canEditPhysio = user.permissions.physio === 'edit';
  const canDelete = user.role === UserRole.ADMIN;

  const getMonthsOwedCurrent = (ath: Athlete) => {
    if (ath.isScholarship) return []; // Los becados no deben meses de membresía
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthIndex = now.getMonth();
    const owed: string[] = [];

    for (let i = 0; i <= currentMonthIndex; i++) {
      const month = MONTHS[i];
      const key = `${currentYear}-${month}`;
      if (!ath.payments || !ath.payments[key] || ath.payments[key] === 0) {
        owed.push(month);
      }
    }
    return owed;
  };

  const getMonthsOwedPrev = (ath: Athlete) => {
    const prevYear = new Date().getFullYear() - 1;
    return Object.keys(ath.payments || {})
      .filter(key => key.startsWith(`${prevYear}-`) && ath.payments![key] === 0)
      .map(key => key.split('-')[1]);
  };

  const currentMonthsOwed = useMemo(() => getMonthsOwedCurrent(athlete), [athlete]);
  const prevMonthsOwed = useMemo(() => getMonthsOwedPrev(athlete), [athlete]);

  const handleSaveProfile = () => {
    const prevYear = new Date().getFullYear() - 1;
    const updatedPayments = { ...(athlete.payments || {}) };

    MONTHS.forEach(m => {
      const key = `${prevYear}-${m}`;
      if (editPrevYearMonths.includes(m)) {
          if (updatedPayments[key] === undefined || updatedPayments[key] === null) updatedPayments[key] = 0;
      } else {
          if (updatedPayments[key] === 0) delete updatedPayments[key];
      }
    });

    onUpdate({ 
      ...athlete, 
      ...editForm, 
      previousYearDebt: editPrevYearMonths.length * MONTHLY_FEE,
      payments: updatedPayments 
    });
    setIsEditing(false);
    alert('Ficha técnica actualizada correctamente.');
  };

  const toggleEditPrevYearMonth = (month: string) => {
    setEditPrevYearMonths(prev => 
      prev.includes(month) ? prev.filter(m => m !== month) : [...prev, month]
    );
  };

  const handleDelete = () => {
    if (window.confirm(`¿Está completamente seguro de eliminar a ${athlete.firstName} ${athlete.lastName}?`)) {
      onDelete(athlete.id);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setEditForm({ ...editForm, photo: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canEditInfo) return;
    const file = e.target.files?.[0];
    if (file) {
      const newFile: AthleteFile = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        url: URL.createObjectURL(file),
        uploadDate: new Date().toLocaleDateString(),
        uploadedBy: user.name
      };
      onUpdate({ ...athlete, files: [...(athlete.files || []), newFile] });
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-5xl mx-auto border border-slate-100">
      <div className="bg-red-900 p-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="text-white/80 hover:text-white transition w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center"><i className="fas fa-arrow-left text-xl"></i></button>
          <div className="flex items-center space-x-4">
             <div className="relative group">
                <img src={isEditing ? editForm.photo : athlete.photo} alt={athlete.firstName} className="w-14 h-14 rounded-full border-2 border-white object-cover shadow-lg" />
                {isEditing && (
                   <button onClick={() => photoInputRef.current?.click()} className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><i className="fas fa-camera text-white text-xs"></i></button>
                )}
             </div>
             <div className="flex flex-col">
                <h2 className="text-white text-xl font-bold leading-none">{athlete.firstName} {athlete.lastName}</h2>
                {(athlete.previousYearDebt > 0 || prevMonthsOwed.length > 0) && (
                  <span className="text-[8px] font-black text-red-200 uppercase tracking-[0.2em] mt-1 italic animate-pulse">Adeudo de Ciclo Anterior</span>
                )}
             </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {canEditInfo && !isEditing && (
            <button onClick={() => { setIsEditing(true); }} className="bg-white/10 text-white hover:bg-white/20 px-4 py-2 rounded-xl text-xs font-black transition flex items-center uppercase tracking-widest border border-white/20"><i className="fas fa-pen-to-square mr-2"></i> EDITAR FICHA</button>
          )}
          {canDelete && (
            <button onClick={handleDelete} className="bg-red-500/20 text-red-200 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center"><i className="fas fa-trash-alt mr-2"></i> DAR DE BAJA</button>
          )}
        </div>
      </div>

      <div className="flex border-b border-gray-200 overflow-x-auto bg-slate-50/50">
        {['info', 'files', 'social', 'physio'].map((tab) => {
          if (tab === 'social' && !canSeeSocial) return null;
          if (tab === 'physio' && !canSeePhysio) return null;
          return (
            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-6 py-4 text-xs font-black uppercase tracking-widest border-b-2 transition ${activeTab === tab ? 'border-red-600 text-red-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {tab === 'info' ? 'INFORMACIÓN' : tab === 'files' ? 'ARCHIVOS' : tab === 'social' ? 'ÁREA SOCIAL' : 'FISIOTERAPIA'}
            </button>
          );
        })}
      </div>

      <div className="p-8">
        {activeTab === 'info' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {isEditing ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-4">
                    <h3 className="text-[10px] font-black text-red-600 uppercase tracking-widest flex items-center mb-2"><i className="fas fa-user mr-2"></i> Datos Personales</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre(s)</label><input className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none font-bold text-black text-sm" value={editForm.firstName} onChange={(e) => setEditForm({...editForm, firstName: e.target.value})} /></div>
                      <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Apellido(s)</label><input className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none font-bold text-black text-sm" value={editForm.lastName} onChange={(e) => setEditForm({...editForm, lastName: e.target.value})} /></div>
                      <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha Nacimiento</label><input type="date" className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none font-bold text-black text-sm" value={editForm.dob} onChange={(e) => setEditForm({...editForm, dob: e.target.value})} /></div>
                      
                      <div className="space-y-1 mt-2">
                         <label className="text-[9px] font-black text-red-900 uppercase tracking-widest ml-1 block mb-2">Adeudos Ciclo Anterior ({new Date().getFullYear() - 1})</label>
                         <div className="grid grid-cols-4 gap-1">
                            {MONTHS.map(m => (
                              <button 
                                key={m} 
                                type="button" 
                                onClick={() => toggleEditPrevYearMonth(m)}
                                className={`py-2 rounded-lg border text-[8px] font-black uppercase transition-all ${editPrevYearMonths.includes(m) ? 'bg-red-900 border-red-900 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-400'}`}
                              >
                                {m.substring(0, 3)}
                              </button>
                            ))}
                         </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-4">
                    <h3 className="text-[10px] font-black text-orange-600 uppercase tracking-widest flex items-center mb-2"><i className="fas fa-phone mr-2"></i> Contacto de Emergencia</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre del Tutor</label><input className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none font-bold text-black text-sm" value={editForm.tutorName} onChange={(e) => setEditForm({...editForm, tutorName: e.target.value})} /></div>
                      <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Teléfono Tutor</label><input className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none font-bold text-black text-sm" value={editForm.tutorPhone} onChange={(e) => setEditForm({...editForm, tutorPhone: e.target.value})} /></div>
                      <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Posición de Juego</label><input className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none font-bold text-black text-sm" value={editForm.position} onChange={(e) => setEditForm({...editForm, position: e.target.value})} /></div>
                      <div className="flex items-center space-x-3 p-3 bg-white rounded-xl border border-slate-200 mt-2"><input type="checkbox" id="scholarship-edit" className="w-4 h-4 rounded text-red-600" checked={editForm.isScholarship} onChange={(e) => setEditForm({...editForm, isScholarship: e.target.checked})} /><label htmlFor="scholarship-edit" className="text-xs font-black text-red-900 uppercase italic tracking-widest cursor-pointer">Beca Deportiva</label></div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-4"><button onClick={handleSaveProfile} className="flex-1 bg-emerald-600 text-white font-black py-4 rounded-2xl transition uppercase text-sm tracking-widest">Guardar Cambios</button><button onClick={() => setIsEditing(false)} className="px-8 bg-slate-200 text-slate-500 font-black py-4 rounded-2xl uppercase text-sm tracking-widest">Cancelar</button></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
                  <h3 className="text-[10px] font-black text-red-600 uppercase tracking-widest flex items-center border-b border-slate-50 pb-3"><i className="fas fa-id-card mr-2"></i> Datos Personales</h3>
                  <div className="space-y-5">
                    <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Nombre Completo</label><p className="text-lg font-black text-slate-800">{athlete.firstName} {athlete.lastName}</p></div>
                    <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Fecha de Nacimiento</label><p className="text-lg font-bold text-slate-700">{athlete.dob ? new Date(athlete.dob).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</p></div>
                    <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Categoría</label><span className="inline-block bg-red-50 text-red-600 px-4 py-1.5 rounded-xl font-black text-sm border border-red-100 uppercase tracking-tight">{athlete.category}</span></div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
                  <h3 className="text-[10px] font-black text-orange-600 uppercase tracking-widest flex items-center border-b border-slate-50 pb-3"><i className="fas fa-phone-volume mr-2"></i> Contacto de Emergencia</h3>
                  <div className="space-y-5">
                    <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Nombre del Tutor / Padre</label><p className="text-lg font-black text-slate-800">{athlete.tutorName || 'No registrado'}</p></div>
                    <div><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Teléfono de Contacto</label><a href={`tel:${athlete.tutorPhone}`} className="text-lg font-black text-red-600 hover:underline flex items-center"><i className="fas fa-mobile-screen-button mr-2 text-slate-400"></i>{athlete.tutorPhone || 'No registrado'}</a></div>
                    <div className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between"><div><label className="text-[8px] font-black text-slate-400 uppercase block">Posición Actual</label><p className="text-sm font-bold text-slate-700 uppercase tracking-tight">{athlete.position}</p></div><i className="fas fa-star text-yellow-400"></i></div>
                  </div>
                </div>

                <div className="md:col-span-2 bg-slate-900 p-8 rounded-[2.5rem] text-white">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-red-300 uppercase tracking-widest mb-1">Mensualidad Activa</span>
                        <div className="flex flex-col">
                           <span className={`text-xl font-black ${athlete.isScholarship ? 'text-emerald-400' : (athlete.monthlyDebt > 0 ? 'text-red-400' : 'text-emerald-400')}`}>
                            {athlete.isScholarship ? 'AL CORRIENTE (BECADO)' : (athlete.monthlyDebt > 0 ? `$${athlete.monthlyDebt.toLocaleString()}` : 'AL CORRIENTE')}
                           </span>
                           {currentMonthsOwed.length > 0 && !athlete.isScholarship && (
                             <span className="text-[8px] font-bold text-red-400 uppercase tracking-tighter mt-1">
                                Debe: {currentMonthsOwed.join(', ')}
                             </span>
                           )}
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-amber-300 uppercase tracking-widest mb-1">Adeudo Ciclo Anterior</span>
                        <div className="flex flex-col">
                          <span className={`text-xl font-black ${prevMonthsOwed.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {prevMonthsOwed.length > 0 ? `$${(prevMonthsOwed.length * MONTHLY_FEE).toLocaleString()}` : 'SALDADO'}
                          </span>
                          {prevMonthsOwed.length > 0 && (
                            <span className="text-[8px] font-bold text-amber-400 uppercase tracking-tighter mt-1">
                               Pendiente: {prevMonthsOwed.join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-emerald-300 uppercase tracking-widest mb-1">Terapia Mensual</span>
                        <span className={`text-xl font-black ${(athlete.monthlyTherapyDebt || 0) > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                          {(athlete.monthlyTherapyDebt || 0) > 0 ? `$${(athlete.monthlyTherapyDebt || 0).toLocaleString()}` : 'SIN ADEUDOS'}
                        </span>
                        {(athlete.monthlyTherapyDebt || 0) > 0 && (
                          <span className={`text-[8px] font-black uppercase tracking-tighter mt-1 animate-pulse ${athlete.isScholarship ? 'text-rose-400' : 'text-red-400'}`}>
                             ¡ATENCIÓN! DEUDA DE TERAPIA {athlete.isScholarship ? 'BECADO' : ''}
                          </span>
                        )}
                      </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {/* ... Resto de pestañas ... */}
      </div>
    </div>
  );
};

export default AthleteDetail;
