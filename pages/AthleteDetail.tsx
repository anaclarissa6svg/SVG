
import React, { useState, useMemo, useRef } from 'react';
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

  const canEditInfo = user.permissions.teams === 'edit' || user.role === UserRole.ADMIN;
  const canSeeSocial = user.permissions.social !== 'none';
  const canEditSocial = user.permissions.social === 'edit';
  const canSeePhysio = user.permissions.physio !== 'none';
  const canEditPhysio = user.permissions.physio === 'edit';
  const canDelete = user.role === UserRole.ADMIN;

  const getMonthsOwed = (ath: Athlete) => {
    if (ath.isScholarship && ath.monthlyDebt === 0) return [];
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
    
    if (ath.payments) {
        Object.keys(ath.payments).forEach(key => {
            if (ath.payments![key] === 0 && !key.startsWith(`${currentYear}-`)) {
                owed.push(key.replace('-', ' '));
            }
        });
    }

    return owed;
  };

  const monthsOwed = useMemo(() => getMonthsOwed(athlete), [athlete]);

  const existingCategories = useMemo(() => {
    const cats = new Set(allAthletes.map(a => a.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [allAthletes]);

  const handleSaveProfile = () => {
    onUpdate({ ...athlete, ...editForm });
    setIsEditing(false);
    alert('Ficha técnica actualizada correctamente.');
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
             <h2 className="text-white text-xl font-bold">{athlete.firstName} {athlete.lastName}</h2>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {canEditInfo && !isEditing && (
            <button onClick={() => { setEditForm({ firstName: athlete.firstName, lastName: athlete.lastName, dob: athlete.dob, category: athlete.category, position: athlete.position, isScholarship: athlete.isScholarship, photo: athlete.photo, tutorName: athlete.tutorName || '', tutorPhone: athlete.tutorPhone || '' }); setIsEditing(true); }} className="bg-white/10 text-white hover:bg-white/20 px-4 py-2 rounded-xl text-xs font-black transition flex items-center uppercase tracking-widest border border-white/20"><i className="fas fa-pen-to-square mr-2"></i> EDITAR FICHA</button>
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
        <input type="file" ref={photoInputRef} onChange={handlePhotoUpload} className="hidden" accept="image/*" />

        {activeTab === 'info' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {isEditing ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-4">
                    <h3 className="text-[10px] font-black text-red-600 uppercase tracking-widest flex items-center mb-2"><i className="fas fa-user mr-2"></i> Editar Datos Personales</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre(s)</label><input className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none font-bold text-black text-sm" value={editForm.firstName} onChange={(e) => setEditForm({...editForm, firstName: e.target.value})} /></div>
                      <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Apellido(s)</label><input className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none font-bold text-black text-sm" value={editForm.lastName} onChange={(e) => setEditForm({...editForm, lastName: e.target.value})} /></div>
                      <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha Nacimiento</label><input type="date" className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none font-bold text-black text-sm" value={editForm.dob} onChange={(e) => setEditForm({...editForm, dob: e.target.value})} /></div>
                      <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoría</label><input list="categories-list-edit" className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none font-bold text-black text-sm" value={editForm.category} onChange={(e) => setEditForm({...editForm, category: e.target.value})} /><datalist id="categories-list-edit">{existingCategories.map(cat => <option key={cat} value={cat} />)}</datalist></div>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-4">
                    <h3 className="text-[10px] font-black text-orange-600 uppercase tracking-widest flex items-center mb-2"><i className="fas fa-phone mr-2"></i> Editar Contacto de Emergencia</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre del Tutor</label><input className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none font-bold text-black text-sm" value={editForm.tutorName} onChange={(e) => setEditForm({...editForm, tutorName: e.target.value})} /></div>
                      <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Teléfono Tutor</label><input className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none font-bold text-black text-sm" value={editForm.tutorPhone} onChange={(e) => setEditForm({...editForm, tutorPhone: e.target.value})} /></div>
                      <div className="space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Posición de Juego</label><input className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none font-bold text-black text-sm" value={editForm.position} onChange={(e) => setEditForm({...editForm, position: e.target.value})} /></div>
                      <div className="flex items-center space-x-3 p-3 bg-white rounded-xl border border-slate-200 mt-2"><input type="checkbox" id="scholarship-edit" className="w-4 h-4 rounded text-red-600" checked={editForm.isScholarship} onChange={(e) => setEditForm({...editForm, isScholarship: e.target.checked})} /><label htmlFor="scholarship-edit" className="text-xs font-bold text-slate-600 cursor-pointer">Beca Deportiva</label></div>
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

                <div className="md:col-span-2 bg-slate-900 p-8 rounded-[2.5rem] text-white flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center space-x-6">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-red-300 uppercase tracking-widest mb-1">Mensualidad</span>
                        <div className="flex flex-col">
                           <span className={`text-xl font-black ${athlete.monthlyDebt > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                            {athlete.monthlyDebt > 0 ? `$${athlete.monthlyDebt.toLocaleString()}` : 'AL CORRIENTE'}
                           </span>
                           {monthsOwed.length > 0 && (
                             <span className="text-[8px] font-bold text-red-400 uppercase tracking-tighter mt-1">
                                Debe: {monthsOwed.join(', ')}
                             </span>
                           )}
                        </div>
                      </div>
                      <div className="w-px h-10 bg-white/10 hidden md:block"></div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-red-300 uppercase tracking-widest mb-1">Fisioterapia</span>
                        <span className={`text-xl font-black ${athlete.physioDebt > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                          {athlete.physioDebt > 0 ? `$${athlete.physioDebt.toLocaleString()}` : 'AL CORRIENTE'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col md:text-right">
                       <span className="text-[9px] font-black text-red-300 uppercase tracking-widest mb-1">Coach a Cargo</span>
                       <span className="text-sm font-bold italic opacity-80">Prof. {athlete.coachName || 'Sin asignar'}</span>
                       {athlete.isScholarship && <span className="mt-2 inline-block bg-yellow-400 text-black px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mx-auto md:ml-auto">BECADO</span>}
                    </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'files' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-400">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div><h3 className="text-xl font-bold text-slate-800">Expediente de Documentos</h3><p className="text-slate-400 text-xs">Almacenamiento de identificaciones y certificados</p></div>
              {canEditInfo && <label className="bg-red-600 text-white px-6 py-3 rounded-2xl cursor-pointer hover:bg-red-700 transition text-xs font-black uppercase tracking-widest shadow-lg shadow-red-900/10"><i className="fas fa-upload mr-2"></i> Subir Archivo<input type="file" className="hidden" onChange={handleFileUpload} /></label>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(athlete.files || []).map(file => (
                <div key={file.id} className="border border-slate-100 p-5 rounded-2xl flex items-center justify-between group hover:border-red-300 hover:bg-red-50/50 transition-all shadow-sm">
                  <div className="flex items-center space-x-4 overflow-hidden"><div className="bg-red-100 w-12 h-12 rounded-xl flex items-center justify-center text-red-600"><i className="fas fa-file-pdf text-xl"></i></div><div className="overflow-hidden"><p className="font-bold text-sm text-slate-700 truncate">{file.name}</p><p className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">{file.uploadDate} • Por: {file.uploadedBy}</p></div></div>
                  <a href={file.url} download className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-600 hover:bg-white transition-colors"><i className="fas fa-download"></i></a>
                </div>
              ))}
              {(athlete.files || []).length === 0 && (
                <div className="col-span-full text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100"><i className="fas fa-folder-open text-4xl text-slate-200 mb-4"></i><p className="text-slate-400 font-bold italic">No hay documentos cargados en el expediente.</p></div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'social' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-400">
             <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div><h3 className="text-xl font-bold text-slate-800">Área Social e Intervenciones</h3><p className="text-slate-400 text-xs">Seguimiento socio-emocional y conductual</p></div>
                {canEditSocial && (
                  <button className="bg-purple-600 text-white px-6 py-3 rounded-2xl hover:bg-purple-700 transition text-xs font-black uppercase tracking-widest shadow-lg shadow-purple-900/10"><i className="fas fa-plus mr-2"></i> Nuevo Reporte</button>
                )}
             </div>
            <div className="grid gap-6">
              {(athlete.socialReports || []).map(report => (
                <div key={report.id} className="border border-slate-100 bg-white p-6 rounded-3xl shadow-sm hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-4"><div><h4 className="font-bold text-slate-800 text-lg">{report.title}</h4><p className="text-[10px] font-black text-purple-600 uppercase tracking-widest">{report.date}</p></div><span className="bg-purple-50 text-purple-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter">Intervención Social</span></div>
                  <p className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed">"{report.content}"</p>
                  <div className="mt-6 pt-4 border-t border-slate-50 flex justify-end"><p className="text-[9px] font-black text-slate-300 uppercase italic">Registrado por: {report.createdBy}</p></div>
                </div>
              ))}
              {(athlete.socialReports || []).length === 0 && (
                <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100"><i className="fas fa-users-viewfinder text-4xl text-slate-200 mb-4"></i><p className="text-slate-400 font-bold italic">Sin reportes sociales registrados hasta la fecha.</p></div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'physio' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-400">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-rose-50 p-6 rounded-[2rem] border border-rose-100 shadow-sm">
                <h4 className="text-rose-800 font-black text-xs uppercase tracking-widest mb-4 flex items-center"><i className="fas fa-history mr-2"></i> Historial de Lesiones</h4>
                <div className="space-y-3">
                  {(athlete.injuryHistory || []).map((injury, idx) => (
                    <div key={idx} className="flex items-start space-x-3 text-rose-700"><div className="w-1.5 h-1.5 bg-rose-400 rounded-full mt-1.5"></div><p className="text-sm font-semibold">{injury}</p></div>
                  ))}
                  {(athlete.injuryHistory || []).length === 0 && (<p className="text-rose-400 text-sm font-bold italic flex items-center"><i className="fas fa-check-circle mr-2"></i> Sin antecedentes traumáticos reportados.</p>)}
                </div>
              </div>
              <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 shadow-sm flex flex-col justify-center">
                <h4 className="text-emerald-800 font-black text-xs uppercase tracking-widest mb-4">Estado de Salud Actual</h4>
                <div className="flex items-center space-x-4"><div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm"><i className="fas fa-person-running text-2xl"></i></div><div><p className="text-emerald-900 font-black uppercase text-sm">Apto para competencia</p><p className="text-emerald-700 text-[10px] font-bold">Sin restricciones médicas vigentes.</p></div></div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div><h3 className="text-xl font-bold text-slate-800">Bitácora Clínica</h3><p className="text-slate-400 text-xs">Registro detallado de consultas de fisioterapia</p></div>
                {canEditPhysio && (
                   <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest italic bg-emerald-50 px-3 py-1 rounded-lg">Edición habilitada en módulo principal</span>
                )}
              </div>
              <div className="grid gap-6">
                {(athlete.physioConsultations || []).map(consult => (
                  <div key={consult.id} className="border border-slate-100 bg-white p-7 rounded-[2rem] shadow-sm hover:shadow-md transition group">
                    <div className="flex justify-between items-start mb-6"><div><h5 className="font-black text-slate-800 text-lg uppercase tracking-tight">{consult.reason}</h5><p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{consult.date}</p></div><span className="bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-200">SESIÓN CLÍNICA</span></div>
                    <div className="grid md:grid-cols-2 gap-8"><div className="bg-slate-50 p-5 rounded-2xl border border-slate-100"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Diagnóstico</label><p className="text-slate-700 text-sm font-bold leading-relaxed">{consult.diagnosis}</p></div><div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100"><label className="text-[9px] font-black text-emerald-600 uppercase tracking-widest block mb-2">Tratamiento</label><p className="text-slate-700 text-sm font-bold leading-relaxed">{consult.treatment}</p></div></div>
                    {consult.observations && (<div className="mt-6 pt-6 border-t border-slate-50"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2 italic">Observaciones de evolución</label><p className="text-slate-500 text-xs font-bold italic leading-relaxed">"{consult.observations}"</p></div>)}
                    <div className="mt-8 pt-4 border-t border-slate-50 flex justify-end"><p className="text-[9px] font-black text-slate-300 uppercase italic">Especialista: {consult.createdBy}</p></div>
                  </div>
                ))}
                {(athlete.physioConsultations || []).length === 0 && (<div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100"><i className="fas fa-stethoscope text-4xl text-slate-200 mb-4"></i><p className="text-slate-400 font-bold italic">Sin expedientes clínicos registrados.</p></div>)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AthleteDetail;
