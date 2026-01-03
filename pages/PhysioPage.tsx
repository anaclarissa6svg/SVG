
import React, { useState, useMemo } from 'react';
import { Athlete, PhysioConsultation, User, UserRole } from '../types';

interface PhysioPageProps {
  athletes: Athlete[];
  selectedAthleteId: string | null;
  onUpdateAthlete: (athlete: Athlete) => void;
  user: User;
}

const PhysioPage: React.FC<PhysioPageProps> = ({ athletes, selectedAthleteId, onUpdateAthlete, user }) => {
  const [activeTab, setActiveTab] = useState<'sessions' | 'records'>('sessions');
  const [showForm, setShowForm] = useState(false);
  const [showClinicalEdit, setShowClinicalEdit] = useState(false);
  const [editingSession, setEditingSession] = useState<{athleteId: string, consultation: PhysioConsultation} | null>(null);
  const [sortOrder, setSortOrder] = useState<'recent' | 'oldest'>('recent');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingAthleteId, setViewingAthleteId] = useState<string | null>(selectedAthleteId);
  
  const canEdit = user.permissions.physio === 'edit';

  const [formData, setFormData] = useState({
    athleteId: '',
    athleteSearch: '',
    date: new Date().toISOString().split('T')[0],
    reason: '',
    diagnosis: '',
    observations: '',
    treatment: ''
  });

  const selectedAthleteInForm = useMemo(() => athletes.find(a => a.id === formData.athleteId), [formData.athleteId, athletes]);

  const [clinicalForm, setClinicalForm] = useState({
    bloodType: '',
    allergies: '',
    chronicDiseases: '',
    medications: '',
    surgicalHistory: '',
    clinicalNotes: ''
  });

  const allConsultations = useMemo(() => {
    const consultations: (PhysioConsultation & { athleteName: string, photo: string, athleteId: string })[] = [];
    athletes.forEach(athlete => {
      athlete.physioConsultations.forEach(c => {
        consultations.push({
          ...c,
          athleteName: `${athlete.firstName} ${athlete.lastName}`,
          photo: athlete.photo,
          athleteId: athlete.id
        });
      });
    });

    return consultations.sort((a, b) => {
      const dateA = new Date(a.date.split('/').reverse().join('-')).getTime();
      const dateB = new Date(b.date.split('/').reverse().join('-')).getTime();
      return sortOrder === 'recent' ? dateB - dateA : dateA - dateB;
    });
  }, [athletes, sortOrder]);

  const filteredAthletes = useMemo(() => {
    return athletes.filter(a => 
      `${a.firstName} ${a.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [athletes, searchTerm]);

  const suggestedAthletes = useMemo(() => {
    if (formData.athleteSearch.length < 2) return [];
    return athletes.filter(a => 
      `${a.firstName} ${a.lastName}`.toLowerCase().includes(formData.athleteSearch.toLowerCase())
    ).slice(0, 5);
  }, [athletes, formData.athleteSearch]);

  const handleSelectAthlete = (athlete: Athlete) => {
    setFormData({ 
      ...formData, 
      athleteId: athlete.id, 
      athleteSearch: `${athlete.firstName} ${athlete.lastName}` 
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    
    const athlete = athletes.find(a => a.id === (editingSession ? editingSession.athleteId : formData.athleteId));
    if (!athlete) return;

    const formattedDate = formData.date.split('-').reverse().join('/');

    if (editingSession) {
      const updatedConsultations = athlete.physioConsultations.map(c => 
        c.id === editingSession.consultation.id 
          ? { 
              ...c, 
              date: formattedDate,
              reason: formData.reason,
              diagnosis: formData.diagnosis, 
              treatment: formData.treatment, 
              observations: formData.observations 
            }
          : c
      );
      onUpdateAthlete({ ...athlete, physioConsultations: updatedConsultations });
      setEditingSession(null);
    } else {
      const newConsultation: PhysioConsultation = {
        id: Math.random().toString(36).substr(2, 9),
        date: formattedDate,
        reason: formData.reason,
        diagnosis: formData.diagnosis,
        observations: formData.observations,
        treatment: formData.treatment,
        createdBy: user.name
      };
      onUpdateAthlete({ ...athlete, physioConsultations: [newConsultation, ...athlete.physioConsultations] });
    }

    setShowForm(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({ 
      athleteId: '', 
      athleteSearch: '', 
      date: new Date().toISOString().split('T')[0], 
      reason: '', 
      diagnosis: '', 
      observations: '', 
      treatment: '' 
    });
  };

  const handleOpenEditSession = (athleteId: string, consult: PhysioConsultation) => {
    const athlete = athletes.find(a => a.id === athleteId);
    if (!athlete) return;
    setEditingSession({ athleteId, consultation: consult });
    const dateParts = consult.date.split('/');
    const dateForInput = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
    setFormData({
      athleteId: athlete.id,
      athleteSearch: `${athlete.firstName} ${athlete.lastName}`,
      date: dateForInput,
      reason: consult.reason,
      diagnosis: consult.diagnosis,
      observations: consult.observations,
      treatment: consult.treatment
    });
    setShowForm(true);
  };

  const handleOpenClinicalEdit = (athlete: Athlete) => {
    setClinicalForm({
      bloodType: athlete.bloodType || '',
      allergies: athlete.allergies || '',
      chronicDiseases: athlete.chronicDiseases || '',
      medications: athlete.medications || '',
      surgicalHistory: athlete.surgicalHistory || '',
      clinicalNotes: athlete.clinicalNotes || ''
    });
    setShowClinicalEdit(true);
  };

  const handleSaveClinicalHistory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingAthleteId) return;
    const athlete = athletes.find(a => a.id === viewingAthleteId);
    if (!athlete) return;
    onUpdateAthlete({ ...athlete, ...clinicalForm });
    setShowClinicalEdit(false);
    alert('Historia Clínica actualizada correctamente.');
  };

  const selectedAthleteForHistory = athletes.find(a => a.id === viewingAthleteId);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight italic uppercase">Módulo de Fisioterapia</h1>
          <p className="text-slate-500 font-medium italic uppercase text-[10px] tracking-widest font-black">Control Clínico Especializado</p>
        </div>
        <div className="flex gap-3">
          {canEdit && (
            <button 
              onClick={() => { resetForm(); setEditingSession(null); setShowForm(true); }}
              className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black hover:bg-emerald-700 transition flex items-center justify-center shadow-xl shadow-emerald-900/20 uppercase text-xs tracking-widest"
            >
              <i className="fas fa-plus mr-2"></i> Nueva Sesión
            </button>
          )}
        </div>
      </header>

      <div className="flex bg-slate-100 p-1 rounded-2xl w-fit">
        <button onClick={() => setActiveTab('sessions')} className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase transition-all ${activeTab === 'sessions' ? 'bg-white text-red-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Sesiones Recientes</button>
        <button onClick={() => setActiveTab('records')} className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase transition-all ${activeTab === 'records' ? 'bg-white text-red-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Expedientes Clínicos</button>
      </div>

      {activeTab === 'sessions' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="font-black text-slate-700 text-xs uppercase tracking-widest flex items-center"><i className="fas fa-history mr-2 text-emerald-500"></i> Bitácora Global</h3>
            <button onClick={() => setSortOrder(sortOrder === 'recent' ? 'oldest' : 'recent')} className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl hover:bg-emerald-100 transition flex items-center uppercase tracking-widest">
              {sortOrder === 'recent' ? 'Recientes' : 'Antiguas'} <i className={`fas fa-sort-amount-${sortOrder === 'recent' ? 'down' : 'up'} ml-2`}></i>
            </button>
          </div>
          <div className="grid gap-4">
            {allConsultations.map(consult => (
              <div key={consult.id} className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex items-center space-x-4 min-w-[220px]">
                    <img src={consult.photo} className="w-14 h-14 rounded-2xl object-cover shadow-md" alt="" />
                    <div>
                      <h4 className="font-black text-slate-800 uppercase italic text-sm">{consult.athleteName}</h4>
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">{consult.date}</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Motivo: {consult.reason}</p>
                    </div>
                  </div>
                  <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6 border-l border-slate-100 pl-8">
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase block mb-1 tracking-widest">Diagnóstico</label>
                      <p className="text-xs text-slate-700 font-bold leading-relaxed">{consult.diagnosis}</p>
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase block mb-1 tracking-widest">Tratamiento</label>
                      <p className="text-xs text-slate-700 font-bold leading-relaxed">{consult.treatment}</p>
                    </div>
                    <div className="flex flex-col justify-between items-end">
                      {canEdit && (
                        <button onClick={() => handleOpenEditSession(consult.athleteId, consult)} className="bg-slate-900 text-white w-10 h-10 rounded-xl hover:bg-black transition flex items-center justify-center shadow-lg"><i className="fas fa-edit text-xs"></i></button>
                      )}
                      <p className="text-[8px] font-black text-slate-300 uppercase italic mt-2">Firma: {consult.createdBy}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'records' && (
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
            <div className="relative w-full">
              <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <input type="text" placeholder="Buscar expediente..." className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl outline-none font-bold text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredAthletes.map(a => (
              <button key={a.id} onClick={() => setViewingAthleteId(a.id)} className={`p-4 rounded-3xl border-2 transition-all flex flex-col items-center space-y-3 ${viewingAthleteId === a.id ? 'border-red-900 bg-red-50 shadow-inner' : 'border-slate-100 bg-white hover:border-red-200'}`}>
                <img src={a.photo} className="w-12 h-12 rounded-xl object-cover shadow-sm" alt="" />
                <div className="overflow-hidden text-center">
                  <p className="font-black text-[10px] uppercase italic truncate w-full">{a.firstName} {a.lastName}</p>
                  <p className="text-[8px] font-black text-slate-400 uppercase">{a.category}</p>
                </div>
              </button>
            ))}
          </div>

          {selectedAthleteForHistory && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100">
                <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
                  <div className="flex items-center space-x-6">
                    <img src={selectedAthleteForHistory.photo} className="w-20 h-20 rounded-3xl object-cover shadow-2xl border-2 border-white/10" alt="" />
                    <div>
                      <h2 className="text-2xl font-black uppercase italic tracking-tighter">{selectedAthleteForHistory.firstName} {selectedAthleteForHistory.lastName}</h2>
                      <div className="flex gap-2 mt-1">
                        <span className="bg-red-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">{selectedAthleteForHistory.bloodType || 'RH ?'}</span>
                        <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] self-center">{selectedAthleteForHistory.category} • {selectedAthleteForHistory.position}</p>
                      </div>
                    </div>
                  </div>
                  {canEdit && (
                    <button onClick={() => handleOpenClinicalEdit(selectedAthleteForHistory)} className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition border border-white/20">
                      <i className="fas fa-file-signature mr-2"></i> Editar Historia Clínica
                    </button>
                  )}
                </div>
                {/* ... Contenido historia clínica ... */}
              </div>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-300 max-h-[95vh] flex flex-col">
            <div className="bg-red-900 p-10 text-white flex justify-between items-center flex-shrink-0">
              <h3 className="text-2xl font-black uppercase tracking-tighter italic">{editingSession ? 'Editar Sesión' : 'Nueva Sesión Clínica'}</h3>
              <button onClick={() => setShowForm(false)} className="text-white/40 hover:text-white transition text-3xl"><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-8 bg-white overflow-y-auto custom-scrollbar">
              {!editingSession && (
                <div className="space-y-2 relative">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Deportista*</label>
                  <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-black focus:ring-2 focus:ring-red-900 transition-all" placeholder="Buscar nombre..." value={formData.athleteSearch} onChange={(e) => setFormData({...formData, athleteSearch: e.target.value, athleteId: ''})} required />
                  {suggestedAthletes.length > 0 && !formData.athleteId && (
                    <div className="absolute z-50 w-full mt-2 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
                      {suggestedAthletes.map(a => (
                        <button key={a.id} type="button" onClick={() => handleSelectAthlete(a)} className="w-full p-4 hover:bg-red-50 text-left font-black uppercase italic text-xs flex items-center space-x-3 transition">
                          <img src={a.photo} className="w-8 h-8 rounded-lg object-cover" alt="" />
                          <span>{a.firstName} {a.lastName}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ALERTA DE MOROSIDAD PARA BECADOS */}
              {selectedAthleteInForm && selectedAthleteInForm.isScholarship && (selectedAthleteInForm.monthlyTherapyDebt || 0) > 0 && (
                <div className="bg-rose-50 border-2 border-rose-200 p-6 rounded-3xl flex items-center space-x-4 animate-in slide-in-from-top-4 duration-300">
                  <div className="w-12 h-12 bg-rose-600 rounded-full flex items-center justify-center text-white shadow-lg flex-shrink-0">
                    <i className="fas fa-exclamation-triangle text-xl"></i>
                  </div>
                  <div>
                    <h5 className="text-[10px] font-black text-rose-600 uppercase tracking-widest">¡ALERTA DE MOROSIDAD!</h5>
                    <p className="text-xs font-bold text-rose-900 leading-tight">Este deportista es <span className="underline italic">BECADO</span> pero tiene un adeudo pendiente en su <span className="font-black italic">MENSUALIDAD DE TERAPIA</span> (${selectedAthleteInForm.monthlyTherapyDebt.toLocaleString()}).</p>
                    <p className="text-[9px] font-bold text-rose-400 uppercase mt-1">Favor de remitir a caja antes de proceder si es política de la academia.</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Fecha de Sesión*</label>
                  <input type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-black" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Motivo de Consulta*</label>
                  <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-black" placeholder="Ej: Lesión de rodilla" value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})} required />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Dx Fisioterapéutico*</label>
                <textarea className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl outline-none font-bold h-24 resize-none text-black focus:ring-2 focus:ring-red-900 transition-all" placeholder="Diagnóstico especializado..." value={formData.diagnosis} onChange={(e) => setFormData({...formData, diagnosis: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Tratamiento Realizado*</label>
                <textarea className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl outline-none font-bold h-32 resize-none text-black focus:ring-2 focus:ring-red-900 transition-all" placeholder="Detalle de la intervención..." value={formData.treatment} onChange={(e) => setFormData({...formData, treatment: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Observaciones de Evolución</label>
                <textarea className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl outline-none font-bold h-24 resize-none text-black focus:ring-2 focus:ring-red-900 transition-all" placeholder="Progreso, molestias, etc." value={formData.observations} onChange={(e) => setFormData({...formData, observations: e.target.value})} />
              </div>
              <button type="submit" className="w-full bg-emerald-600 text-white py-5 rounded-3xl font-black uppercase text-sm tracking-widest shadow-2xl shadow-emerald-900/20 active:scale-95 transition-all">
                {editingSession ? 'Guardar Cambios Clínicos' : 'Finalizar y Registrar Sesión'}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* ... Resto de modales ... */}
    </div>
  );
};

export default PhysioPage;
