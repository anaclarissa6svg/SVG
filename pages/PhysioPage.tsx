
import React, { useState, useMemo } from 'react';
import { Athlete, PhysioConsultation, User, UserRole } from '../types';

interface PhysioPageProps {
  athletes: Athlete[];
  selectedAthleteId: string | null;
  onUpdateAthlete: (athlete: Athlete) => void;
  user: User;
}

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const PhysioPage: React.FC<PhysioPageProps> = ({ athletes, selectedAthleteId, onUpdateAthlete, user }) => {
  const [activeTab, setActiveTab] = useState<'sessions' | 'records'>('sessions');
  const [showForm, setShowForm] = useState(false);
  const [showClinicalEdit, setShowClinicalEdit] = useState(false);
  const [sortOrder, setSortOrder] = useState<'recent' | 'oldest'>('recent');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingAthleteId, setViewingAthleteId] = useState<string | null>(selectedAthleteId);
  
  const canEdit = user.permissions.physio === 'edit';

  // Form State for new session
  const [formData, setFormData] = useState({
    athleteId: '',
    athleteSearch: '',
    date: new Date().toISOString().split('T')[0],
    diagnosis: '',
    observations: '',
    treatment: ''
  });

  // State for editing clinical history
  const [clinicalForm, setClinicalForm] = useState<Partial<Athlete>>({});

  // Helper to get months owed
  const getMonthsOwed = (athlete: Athlete) => {
    if (athlete.isScholarship && athlete.monthlyDebt === 0) return [];
    const currentMonthIndex = new Date().getMonth();
    const owed = [];
    for (let i = 0; i <= currentMonthIndex; i++) {
      const month = MONTHS[i];
      if (!athlete.payments || !athlete.payments[month] || athlete.payments[month] === 0) {
        owed.push(month);
      }
    }
    return owed;
  };

  // Flat list of all consultations for the "Recent Sessions" tab
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

  // Filter athletes for the "Records" tab
  const filteredAthletes = useMemo(() => {
    return athletes.filter(a => 
      `${a.firstName} ${a.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [athletes, searchTerm]);

  // Predictive search for new session modal
  const suggestedAthletes = useMemo(() => {
    if (formData.athleteSearch.length < 2) return [];
    return athletes.filter(a => 
      `${a.firstName} ${a.lastName}`.toLowerCase().includes(formData.athleteSearch.toLowerCase())
    ).slice(0, 5);
  }, [athletes, formData.athleteSearch]);

  const handleSetToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setFormData({ ...formData, date: today });
  };

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
    const athlete = athletes.find(a => a.id === formData.athleteId);
    if (!athlete) {
      alert('Por favor seleccione un deportista válido de la lista.');
      return;
    }

    // VALIDACIÓN DE ADEUDOS
    const monthsOwed = getMonthsOwed(athlete);
    const hasMonthlyDebt = monthsOwed.length > 0 || athlete.monthlyDebt > 0;
    const hasPhysioDebt = athlete.physioDebt > 0;

    if (athlete.isScholarship) {
      if (hasPhysioDebt) {
        const confirmScholar = window.confirm(
          `ALERTA DE BECADO: El deportista ${athlete.firstName} ${athlete.lastName} tiene un adeudo de fisioterapia de $${athlete.physioDebt}. ¿Desea proceder con la sesión de todos modos?`
        );
        if (!confirmScholar) return;
      }
    } else {
      if (hasMonthlyDebt || hasPhysioDebt) {
        let message = `ALERTA DE ADEUDO: El deportista ${athlete.firstName} ${athlete.lastName} presenta pagos pendientes:\n`;
        if (monthsOwed.length > 0) message += `- Meses pendientes: ${monthsOwed.join(', ')}\n`;
        if (athlete.monthlyDebt > 0) message += `- Deuda acumulada: $${athlete.monthlyDebt}\n`;
        if (hasPhysioDebt) message += `- Deuda de Fisioterapia: $${athlete.physioDebt}\n`;
        
        const confirmRegular = window.confirm(`${message}\n¿Desea registrar la sesión a pesar del adeudo?`);
        if (!confirmRegular) return;
      }
    }

    const newConsultation: PhysioConsultation = {
      id: Math.random().toString(36).substr(2, 9),
      date: formData.date.split('-').reverse().join('/'),
      reason: 'Sesión de Fisioterapia',
      diagnosis: formData.diagnosis,
      observations: formData.observations,
      treatment: formData.treatment,
      createdBy: user.name
    };

    const updatedAthlete = {
      ...athlete,
      physioConsultations: [newConsultation, ...athlete.physioConsultations]
    };

    onUpdateAthlete(updatedAthlete);
    alert('Sesión guardada exitosamente en el expediente.');
    setShowForm(false);
    setFormData({
      athleteId: '',
      athleteSearch: '',
      date: new Date().toISOString().split('T')[0],
      diagnosis: '',
      observations: '',
      treatment: ''
    });
  };

  const handleOpenClinicalEdit = (athlete: Athlete) => {
    if (!canEdit) return;
    setClinicalForm({
      bloodType: athlete.bloodType || '',
      allergies: athlete.allergies || '',
      chronicDiseases: athlete.chronicDiseases || '',
      medications: athlete.medications || '',
      surgicalHistory: athlete.surgicalHistory || '',
      familyHistory: athlete.familyHistory || '',
      clinicalNotes: athlete.clinicalNotes || ''
    });
    setShowClinicalEdit(true);
  };

  const handleSaveClinicalHistory = () => {
    if (!canEdit) return;
    const athlete = athletes.find(a => a.id === viewingAthleteId);
    if (!athlete) return;

    const updatedAthlete = {
      ...athlete,
      ...clinicalForm
    };

    onUpdateAthlete(updatedAthlete);
    setShowClinicalEdit(false);
    alert('Historia clínica base actualizada con éxito.');
  };

  const selectedAthleteForHistory = athletes.find(a => a.id === viewingAthleteId);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight italic uppercase">
            Módulo de Fisioterapia
          </h1>
          <p className="text-slate-500 font-medium">Gestión clínica y rehabilitación deportiva</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => {
              setActiveTab('records');
              setSearchTerm('');
            }}
            className={`px-6 py-3 rounded-2xl font-black transition text-xs tracking-widest uppercase flex items-center shadow-lg ${activeTab === 'records' ? 'bg-red-900 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
          >
            <i className="fas fa-folder-open mr-2"></i> Expedientes
          </button>
          {canEdit && (
            <button 
              onClick={() => setShowForm(true)}
              className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black hover:bg-emerald-700 transition flex items-center justify-center shadow-xl shadow-emerald-900/20 uppercase text-xs tracking-widest"
            >
              <i className="fas fa-plus mr-2"></i> Nueva Sesión
            </button>
          )}
        </div>
      </header>

      <div className="flex bg-slate-100 p-1 rounded-2xl w-fit">
        <button 
          onClick={() => setActiveTab('sessions')}
          className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${activeTab === 'sessions' ? 'bg-white text-red-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Sesiones Recientes
        </button>
        <button 
          onClick={() => setActiveTab('records')}
          className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${activeTab === 'records' ? 'bg-white text-red-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Expedientes Clínicos
        </button>
      </div>

      {activeTab === 'sessions' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="font-black text-slate-700 text-xs uppercase tracking-[0.2em] flex items-center">
              <i className="fas fa-history mr-2 text-emerald-500"></i>
              Historial Global de Terapias
            </h3>
            <button 
              onClick={() => setSortOrder(sortOrder === 'recent' ? 'oldest' : 'recent')}
              className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl hover:bg-emerald-100 transition flex items-center uppercase tracking-widest"
            >
              {sortOrder === 'recent' ? 'Más recientes' : 'Más antiguas'}
              <i className={`fas fa-sort-amount-${sortOrder === 'recent' ? 'down' : 'up'} ml-2`}></i>
            </button>
          </div>

          <div className="grid gap-4">
            {allConsultations.map(consult => (
              <div key={consult.id} className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition group">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex items-center space-x-4 min-w-[220px]">
                    <div className="relative">
                      <img src={consult.photo} className="w-14 h-14 rounded-2xl object-cover shadow-md border-2 border-white ring-1 ring-slate-100" alt="" />
                      <button 
                        onClick={() => {
                          setViewingAthleteId(consult.athleteId);
                          setActiveTab('records');
                        }}
                        className="absolute -bottom-1 -right-1 bg-red-900 text-white w-6 h-6 rounded-lg flex items-center justify-center text-[10px] shadow-lg hover:scale-110 transition"
                      >
                        <i className="fas fa-folder"></i>
                      </button>
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 leading-tight uppercase italic text-sm">{consult.athleteName}</h4>
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">{consult.date}</p>
                    </div>
                  </div>
                  <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6 border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-8">
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase block mb-1.5 tracking-widest">Diagnóstico</label>
                      <p className="text-xs text-slate-700 font-bold leading-relaxed">{consult.diagnosis}</p>
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase block mb-1.5 tracking-widest">Tratamiento</label>
                      <p className="text-xs text-slate-700 font-bold leading-relaxed">{consult.treatment}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <label className="text-[8px] font-black text-slate-400 uppercase block mb-1 tracking-widest">Evolución</label>
                      <p className="text-[10px] text-slate-500 italic leading-relaxed">"{consult.observations || 'Sin observaciones registradas'}"</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {allConsultations.length === 0 && (
              <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                <i className="fas fa-notes-medical text-5xl text-slate-200 mb-4 block"></i>
                <p className="text-slate-400 font-bold italic">No se han registrado sesiones de fisioterapia todavía.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'records' && (
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8 border-b border-slate-50 pb-8">
              <div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight italic">Archivo Clínico de Deportistas</h3>
                <p className="text-slate-400 text-xs font-medium">Consulta el historial completo por paciente.</p>
              </div>
              <div className="relative w-full md:w-96">
                <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input 
                  type="text" 
                  placeholder="Buscar deportista por nombre o categoría..."
                  className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-red-500/10 focus:border-red-900 outline-none transition-all font-bold text-black text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredAthletes.map(a => (
                <button 
                  key={a.id} 
                  onClick={() => setViewingAthleteId(a.id)}
                  className={`p-5 rounded-[2rem] border-2 transition-all flex items-center space-x-4 group text-left ${viewingAthleteId === a.id ? 'border-red-900 bg-red-50/50 shadow-inner' : 'border-slate-100 bg-slate-50 hover:border-red-200 hover:bg-white hover:shadow-lg'}`}
                >
                  <img src={a.photo} className="w-12 h-12 rounded-2xl object-cover shadow-sm group-hover:scale-110 transition" alt="" />
                  <div className="overflow-hidden">
                    <p className={`font-black text-sm uppercase tracking-tight italic truncate ${viewingAthleteId === a.id ? 'text-red-900' : 'text-slate-800'}`}>{a.firstName} {a.lastName}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{a.category}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {selectedAthleteForHistory && (
            <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
              <div className="bg-slate-900 p-10 text-white flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center space-x-8">
                  <img src={selectedAthleteForHistory.photo} className="w-24 h-24 rounded-[2rem] border-4 border-white/10 object-cover shadow-2xl" alt="" />
                  <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none">{selectedAthleteForHistory.firstName} {selectedAthleteForHistory.lastName}</h2>
                    <div className="flex items-center space-x-4 mt-4">
                      <span className="bg-red-600 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">{selectedAthleteForHistory.category}</span>
                      <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">{selectedAthleteForHistory.position}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                   {canEdit && (
                     <button 
                      onClick={() => handleOpenClinicalEdit(selectedAthleteForHistory)}
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition shadow-xl"
                     >
                       <i className="fas fa-edit mr-2"></i> Editar Historia Base
                     </button>
                   )}
                  <div className="bg-white/5 p-5 rounded-3xl border border-white/10 text-center min-w-[120px]">
                    <p className="text-[8px] font-black text-red-400 uppercase tracking-widest mb-1">Total Sesiones</p>
                    <p className="text-2xl font-black">{selectedAthleteForHistory.physioConsultations.length}</p>
                  </div>
                </div>
              </div>

              <div className="p-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-1 space-y-8">
                  <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-white/5 shadow-2xl text-white">
                    <h4 className="text-red-500 font-black text-[10px] uppercase tracking-widest mb-6 border-b border-white/10 pb-4">
                      Ficha Clínica Permanente
                    </h4>
                    <div className="space-y-6">
                      <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Grupo Sanguíneo</span>
                        <span className="text-xl font-black text-red-500">{selectedAthleteForHistory.bloodType || 'N/A'}</span>
                      </div>
                      
                      {selectedAthleteForHistory.allergies && (
                        <div className="bg-amber-500/10 p-5 rounded-3xl border border-amber-500/30">
                          <p className="text-[8px] font-black text-amber-500 uppercase tracking-widest mb-2 flex items-center">
                            <i className="fas fa-triangle-exclamation mr-2"></i> Alergias Reportadas
                          </p>
                          <p className="text-xs font-bold text-amber-100">{selectedAthleteForHistory.allergies}</p>
                        </div>
                      )}

                      <div className="space-y-4">
                        <div className="border-l-2 border-red-900 pl-4">
                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Enfermedades Crónicas</p>
                          <p className="text-sm font-bold text-slate-300">{selectedAthleteForHistory.chronicDiseases || 'Ninguna reportada'}</p>
                        </div>
                        <div className="border-l-2 border-emerald-900 pl-4">
                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Medicamentos Actuales</p>
                          <p className="text-sm font-bold text-slate-300">{selectedAthleteForHistory.medications || 'Ninguno reportado'}</p>
                        </div>
                        <div className="border-l-2 border-blue-900 pl-4">
                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Cirugías Previas</p>
                          <p className="text-sm font-bold text-slate-300">{selectedAthleteForHistory.surgicalHistory || 'Sin antecedentes'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-rose-50 p-8 rounded-[2.5rem] border border-rose-100 shadow-sm">
                    <h4 className="text-rose-900 font-black text-xs uppercase tracking-widest mb-6 flex items-center border-b border-rose-200 pb-4">
                      <i className="fas fa-history mr-3 text-lg"></i> Antecedentes Deportivos
                    </h4>
                    <div className="space-y-4">
                      {selectedAthleteForHistory.injuryHistory.map((injury, idx) => (
                        <div key={idx} className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-rose-400 rounded-full mt-2 flex-shrink-0"></div>
                          <p className="text-sm font-bold text-rose-800">{injury}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                  <h4 className="text-slate-800 font-black text-lg uppercase tracking-tight italic flex items-center mb-4">
                    <i className="fas fa-notes-medical mr-3 text-red-900"></i> Bitácora de Sesiones Individuales
                  </h4>
                  
                  <div className="space-y-6 max-h-[800px] overflow-y-auto pr-4 custom-scrollbar">
                    {selectedAthleteForHistory.physioConsultations.map(consult => (
                      <div key={consult.id} className="border border-slate-100 bg-white p-8 rounded-[2.5rem] shadow-sm hover:shadow-lg transition">
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <p className="text-[10px] font-black text-red-600 uppercase tracking-[0.2em]">{consult.date}</p>
                            <h5 className="font-black text-slate-800 text-lg uppercase tracking-tighter mt-1">{consult.reason}</h5>
                          </div>
                          <span className="bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">Intervención Médica</span>
                        </div>
                        <div className="grid md:grid-cols-2 gap-8">
                          <div>
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Diagnóstico</label>
                            <p className="text-sm text-slate-700 font-bold leading-relaxed">{consult.diagnosis}</p>
                          </div>
                          <div>
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Tratamiento</label>
                            <p className="text-sm text-slate-700 font-bold leading-relaxed">{consult.treatment}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {showClinicalEdit && selectedAthleteForHistory && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-300 max-h-[90vh] flex flex-col">
            <div className="bg-slate-900 p-8 text-white flex justify-between items-center flex-shrink-0">
              <div className="flex items-center space-x-4">
                 <img src={selectedAthleteForHistory.photo} className="w-12 h-12 rounded-xl object-cover" alt="" />
                 <div>
                    <h3 className="text-xl font-black uppercase tracking-tighter italic">Editar Historia Base</h3>
                 </div>
              </div>
              <button onClick={() => setShowClinicalEdit(false)} className="text-white/40 hover:text-white transition">
                <i className="fas fa-times text-2xl"></i>
              </button>
            </div>
            
            <div className="p-10 space-y-8 overflow-y-auto custom-scrollbar flex-grow">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Grupo Sanguíneo</label>
                    <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-black" value={clinicalForm.bloodType} onChange={e => setClinicalForm({...clinicalForm, bloodType: e.target.value})}>
                      <option value="">Desconocido</option>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Alergias</label>
                    <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-black" value={clinicalForm.allergies} onChange={e => setClinicalForm({...clinicalForm, allergies: e.target.value})} />
                  </div>
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Enfermedades Crónicas</label>
                 <textarea className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold h-24 resize-none text-black" value={clinicalForm.chronicDiseases} onChange={e => setClinicalForm({...clinicalForm, chronicDiseases: e.target.value})} />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cirugías Previas</label>
                 <textarea className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold h-24 resize-none text-black" value={clinicalForm.surgicalHistory} onChange={e => setClinicalForm({...clinicalForm, surgicalHistory: e.target.value})} />
               </div>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-200 flex gap-4 flex-shrink-0">
               <button onClick={handleSaveClinicalHistory} className="flex-1 bg-red-900 text-white font-black py-4 rounded-2xl hover:bg-black transition uppercase text-sm tracking-widest">Actualizar</button>
               <button onClick={() => setShowClinicalEdit(false)} className="px-8 bg-white border border-slate-200 text-slate-500 font-bold rounded-2xl hover:bg-slate-50 transition uppercase text-xs">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 max-h-[95vh] flex flex-col">
            <div className="bg-red-900 p-10 text-white flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter italic">Nueva Sesión Clínica</h3>
              </div>
              <button onClick={() => setShowForm(false)} className="bg-white/20 w-12 h-12 rounded-full hover:bg-white/40 transition flex items-center justify-center">
                <i className="fas fa-times text-2xl"></i>
              </button>
            </div>

            <div className="overflow-y-auto custom-scrollbar flex-grow">
              <form onSubmit={handleSubmit} className="p-10 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha de Sesión*</label>
                    <div className="flex gap-2">
                      <input type="date" className="flex-grow p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-black" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} required />
                      <button type="button" onClick={handleSetToday} className="bg-red-50 text-red-900 px-6 rounded-2xl font-black text-[10px] uppercase hover:bg-red-100 transition border border-red-100">Hoy</button>
                    </div>
                  </div>
                  <div className="space-y-2 relative">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Deportista (Nombre)*</label>
                    <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-black" placeholder="Escriba para buscar..." value={formData.athleteSearch} onChange={(e) => setFormData({...formData, athleteSearch: e.target.value, athleteId: ''})} required />
                    {suggestedAthletes.length > 0 && !formData.athleteId && (
                      <div className="absolute z-50 w-full mt-2 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
                        {suggestedAthletes.map(a => (
                          <button key={a.id} type="button" onClick={() => handleSelectAthlete(a)} className="w-full p-4 flex items-center justify-between hover:bg-red-50 text-left transition">
                            <div className="flex items-center space-x-3">
                              <img src={a.photo} className="w-10 h-10 rounded-xl object-cover" alt="" />
                              <p className="text-sm font-black text-black uppercase italic">{a.firstName} {a.lastName}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dx Fisioterapéutico*</label>
                  <textarea className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl outline-none font-bold text-black h-24 resize-none" placeholder="Diagnóstico detallado..." value={formData.diagnosis} onChange={(e) => setFormData({...formData, diagnosis: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tratamiento Realizado*</label>
                  <textarea className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl outline-none font-bold text-black h-36 resize-none" placeholder="Terapia realizada..." value={formData.treatment} onChange={(e) => setFormData({...formData, treatment: e.target.value})} required />
                </div>
                <div className="pt-6 flex gap-4">
                  <button type="submit" className="flex-1 bg-emerald-600 text-white font-black py-5 rounded-3xl hover:bg-emerald-700 transition shadow-2xl uppercase text-sm tracking-widest">Registrar</button>
                  <button type="button" onClick={() => setShowForm(false)} className="px-10 bg-slate-100 text-slate-500 font-black rounded-3xl uppercase text-xs">Cancelar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhysioPage;
