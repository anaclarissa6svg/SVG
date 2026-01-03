
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
const MONTHLY_FEE = 650;
const THERAPY_FEE = 500;

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
      const updatedPayments = athlete.payments || {};
      const owed = MONTHS.filter(m => {
        const key = `${prevYear}-${m}`;
        return updatedPayments[key] === 0;
      });
      setEditPrevYearMonths(owed);
    }
  }, [isEditing, athlete.payments]);

  const canEditInfo = user.permissions.teams === 'edit' || user.role === UserRole.ADMIN;
  const canDelete = user.role === UserRole.ADMIN;

  const getMonthsOwedCurrent = (ath: Athlete) => {
    if (ath.isScholarship) return [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthIndex = now.getMonth();
    const owed: string[] = [];

    for (let i = 0; i <= currentMonthIndex; i++) {
      const month = MONTHS[i];
      const key = `${currentYear}-${month}`;
      const paid = ath.payments?.[key] || 0;
      if (paid < MONTHLY_FEE) {
        owed.push(paid > 0 ? `${month} (Abonado $${paid})` : month);
      }
    }
    return owed;
  };

  const getTherapyMonthsOwed = (ath: Athlete) => {
    if (!ath.isScholarship) return [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthIndex = now.getMonth();
    const owed: string[] = [];
    for (let i = 0; i <= currentMonthIndex; i++) {
      const month = MONTHS[i];
      const key = `${currentYear}-${month}`;
      const paid = ath.therapyPayments?.[key] || 0;
      if (paid < THERAPY_FEE) {
        owed.push(month);
      }
    }
    return owed;
  };

  const currentMonthsOwed = useMemo(() => getMonthsOwedCurrent(athlete), [athlete]);
  const currentTherapyOwed = useMemo(() => getTherapyMonthsOwed(athlete), [athlete]);

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
  };

  const toggleEditPrevYearMonth = (month: string) => {
    setEditPrevYearMonths(prev => 
      prev.includes(month) ? prev.filter(m => m !== month) : [...prev, month]
    );
  };

  const handleDelete = () => {
    if (window.confirm(`¿Está seguro de eliminar a ${athlete.firstName} ${athlete.lastName}?`)) {
      onDelete(athlete.id);
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden max-w-5xl mx-auto border border-slate-100">
      <div className="bg-[#2d0000] p-8 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <button onClick={onBack} className="text-white/60 hover:text-white transition w-12 h-12 rounded-2xl hover:bg-white/10 flex items-center justify-center border border-white/10"><i className="fas fa-arrow-left text-xl"></i></button>
          <div className="flex items-center space-x-4">
             <img src={athlete.photo} alt="" className="w-16 h-16 rounded-2xl border-2 border-white/20 object-cover shadow-2xl" />
             <div className="flex flex-col">
                <h2 className="text-white text-2xl font-black uppercase italic tracking-tighter leading-none">{athlete.firstName} {athlete.lastName}</h2>
                <div className="flex gap-2 mt-1.5">
                   <span className="text-[8px] font-black bg-red-600 text-white px-2 py-0.5 rounded-lg uppercase tracking-widest">{athlete.category}</span>
                   {athlete.isScholarship && <span className="text-[8px] font-black bg-yellow-400 text-black px-2 py-0.5 rounded-lg uppercase tracking-widest">Becado</span>}
                </div>
             </div>
          </div>
        </div>
        <div className="flex gap-3">
          {canEditInfo && !isEditing && (
            <button onClick={() => setIsEditing(true)} className="bg-white/10 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/20 hover:bg-white/20 transition">Editar Ficha</button>
          )}
          {canDelete && (
            <button onClick={handleDelete} className="bg-red-600/20 text-red-200 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-red-500/20 hover:bg-red-600 hover:text-white transition">Eliminar</button>
          )}
        </div>
      </div>

      <div className="p-10">
        {isEditing ? (
          <div className="space-y-8 animate-in zoom-in duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Sección Datos Personales */}
              <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-6">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b pb-2">Datos del Deportista</h4>
                <div className="space-y-4">
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Nombre(s)</label>
                      <input className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-800" value={editForm.firstName} onChange={e => setEditForm({...editForm, firstName: e.target.value})} placeholder="Ej: Mateo" />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Apellidos</label>
                      <input className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-800" value={editForm.lastName} onChange={e => setEditForm({...editForm, lastName: e.target.value})} placeholder="Ej: García" />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                         <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Fecha Nac.</label>
                         <input type="date" className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-800" value={editForm.dob} onChange={e => setEditForm({...editForm, dob: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                         <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Categoría</label>
                         <input className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-800" value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})} placeholder="Sub-12" />
                      </div>
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Posición en Campo</label>
                      <input className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-800" value={editForm.position} onChange={e => setEditForm({...editForm, position: e.target.value})} placeholder="Ej: Delantero" />
                   </div>
                   <div className="flex items-center space-x-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                      <input type="checkbox" id="scholarship-edit" className="w-5 h-5 accent-red-900 rounded-lg" checked={editForm.isScholarship} onChange={e => setEditForm({...editForm, isScholarship: e.target.checked})} />
                      <label htmlFor="scholarship-edit" className="text-xs font-black text-slate-600 uppercase tracking-widest cursor-pointer">Deportista con Beca</label>
                   </div>
                </div>
              </div>

              {/* Sección Tutor y Emergencia */}
              <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-6">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b pb-2">Contacto y Emergencia</h4>
                <div className="space-y-4">
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Nombre del Tutor</label>
                      <input className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-800" value={editForm.tutorName} onChange={e => setEditForm({...editForm, tutorName: e.target.value})} placeholder="Nombre completo del tutor" />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Teléfono (Emergencia)</label>
                      <input className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-800" value={editForm.tutorPhone} onChange={e => setEditForm({...editForm, tutorPhone: e.target.value})} placeholder="614-000-0000" />
                   </div>
                   <div className="pt-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">URL de Foto de Perfil</label>
                      <input className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-400 text-[10px]" value={editForm.photo} onChange={e => setEditForm({...editForm, photo: e.target.value})} placeholder="URL de la imagen" />
                   </div>

                   <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-3">
                      <label className="text-[9px] font-black text-red-900 uppercase tracking-widest block">Adeudos Año Anterior (Meses)</label>
                      <div className="grid grid-cols-3 gap-2">
                         {MONTHS.map(m => (
                            <button key={m} type="button" onClick={() => toggleEditPrevYearMonth(m)} className={`py-2 rounded-xl text-[8px] font-black uppercase transition-all ${editPrevYearMonths.includes(m) ? 'bg-red-900 text-white shadow-md' : 'bg-slate-50 text-slate-300'}`}>
                               {m.substring(0,3)}
                            </button>
                         ))}
                      </div>
                   </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-4">
               <button onClick={handleSaveProfile} className="flex-grow bg-emerald-600 text-white py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-900/20 active:scale-95 transition-all">Guardar Ficha Técnica</button>
               <button onClick={() => setIsEditing(false)} className="px-10 bg-slate-100 text-slate-400 py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all">Cancelar</button>
            </div>
          </div>
        ) : (
          <div className="space-y-10 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Columna Info Técnica */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-6">
                <h3 className="text-[10px] font-black text-red-900 uppercase tracking-[0.3em] border-b pb-3 flex items-center"><i className="fas fa-id-badge mr-2"></i> Perfil Deportivo</h3>
                <div className="space-y-4">
                   <div className="flex flex-col"><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Categoría de Edad</span><span className="font-black text-slate-800 text-lg italic uppercase">{athlete.category}</span></div>
                   <div className="flex flex-col"><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Posición Principal</span><span className="font-black text-slate-800 text-lg italic uppercase">{athlete.position}</span></div>
                   <div className="flex flex-col"><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Fecha de Nacimiento</span><span className="font-bold text-slate-600">{athlete.dob}</span></div>
                </div>
              </div>

              {/* Columna Tutor */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-6">
                <h3 className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.3em] border-b pb-3 flex items-center"><i className="fas fa-phone-alt mr-2"></i> Contacto de Emergencia</h3>
                <div className="space-y-4">
                   <div className="flex flex-col"><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Nombre del Tutor</span><span className="font-black text-slate-800 text-lg uppercase">{athlete.tutorName || 'N/A'}</span></div>
                   <div className="flex flex-col"><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Celular de Emergencia</span><span className="font-black text-slate-800 text-lg tracking-wider">{athlete.tutorPhone || 'N/A'}</span></div>
                   <a href={`tel:${athlete.tutorPhone}`} className="inline-flex items-center space-x-2 bg-emerald-50 text-emerald-600 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all w-fit"><i className="fas fa-phone"></i> <span>Llamar Ahora</span></a>
                </div>
              </div>
              
              {/* Columna Estado Financiero */}
              <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white flex flex-col justify-between shadow-2xl">
                <div>
                   <h3 className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em] border-b border-white/10 pb-3 mb-6">Balance de Cuenta</h3>
                   {!athlete.isScholarship ? (
                     <div className="space-y-2">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Deuda Mensual Vigente</span>
                       <span className={`text-4xl font-black italic ${athlete.monthlyDebt > 0 ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`}>
                         {athlete.monthlyDebt > 0 ? `$${athlete.monthlyDebt.toLocaleString()}` : 'PAGADO'}
                       </span>
                       {currentMonthsOwed.length > 0 && (
                         <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-tight">Adeudos: {currentMonthsOwed.join(', ')}</p>
                       )}
                     </div>
                   ) : (
                     <div className="space-y-2">
                       <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block">Estatus de Pago</span>
                       <span className="text-4xl font-black text-emerald-400 italic">BECADO</span>
                       <p className="text-[10px] font-bold text-slate-500 uppercase mt-2">Membresía exenta por rendimiento</p>
                     </div>
                   )}
                </div>

                {athlete.isScholarship && (
                  <div className="pt-6 border-t border-white/10 mt-6">
                    <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1 block">Mensualidad de Terapia</span>
                    <span className={`text-3xl font-black ${currentTherapyOwed.length > 0 ? 'text-purple-500' : 'text-emerald-400'}`}>
                      {currentTherapyOwed.length > 0 ? `$${(currentTherapyOwed.length * THERAPY_FEE).toLocaleString()}` : 'AL CORRIENTE'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Historia Clínica Rápida (Lectura) */}
            <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-200">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] mb-6 text-center italic">Observaciones Generales</h3>
               <div className="grid md:grid-cols-2 gap-10">
                  <div className="space-y-2">
                     <span className="text-[9px] font-black text-red-900 uppercase tracking-widest">Historial de Lesiones</span>
                     <p className="text-sm font-bold text-slate-600 italic">"{athlete.injuryHistory?.length ? athlete.injuryHistory.join('; ') : 'Sin lesiones registradas.'}"</p>
                  </div>
                  <div className="space-y-2">
                     <span className="text-[9px] font-black text-emerald-900 uppercase tracking-widest">Notas Clínicas</span>
                     <p className="text-sm font-bold text-slate-600 italic">"{athlete.clinicalNotes || 'Sin notas adicionales.'}"</p>
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AthleteDetail;
