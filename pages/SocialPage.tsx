
import React, { useState, useMemo } from 'react';
import { Athlete, SocialReport, User, UserRole } from '../types';

interface SocialPageProps {
  athletes: Athlete[];
  onUpdateAthlete: (athlete: Athlete) => void;
  user: User;
}

const SocialPage: React.FC<SocialPageProps> = ({ athletes, onUpdateAthlete, user }) => {
  const [activeTab, setActiveTab] = useState<'reports' | 'dossiers'>('reports');
  const [searchTerm, setSearchTerm] = useState('');
  const [showReportForm, setShowReportForm] = useState(false);
  const [showSocialEdit, setShowSocialEdit] = useState(false);
  const [viewingAthleteId, setViewingAthleteId] = useState<string | null>(null);

  const canEdit = user.permissions.social === 'edit';

  const [reportForm, setReportForm] = useState({
    athleteId: '',
    athleteSearch: '',
    title: '',
    content: ''
  });

  const [socialHistoryForm, setSocialHistoryForm] = useState<Partial<Athlete>>({});

  const filteredAthletes = useMemo(() => {
    return athletes.filter(a => 
      `${a.firstName} ${a.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [athletes, searchTerm]);

  const allReports = useMemo(() => {
    const reports: (SocialReport & { athleteName: string, photo: string, athleteId: string })[] = [];
    athletes.forEach(athlete => {
      athlete.socialReports.forEach(r => {
        reports.push({
          ...r,
          athleteName: `${athlete.firstName} ${athlete.lastName}`,
          photo: athlete.photo,
          athleteId: athlete.id
        });
      });
    });
    return reports.sort((a, b) => new Date(b.date.split('/').reverse().join('-')).getTime() - new Date(a.date.split('/').reverse().join('-')).getTime());
  }, [athletes]);

  const suggestedAthletes = useMemo(() => {
    if (reportForm.athleteSearch.length < 2) return [];
    return athletes.filter(a => 
      `${a.firstName} ${a.lastName}`.toLowerCase().includes(reportForm.athleteSearch.toLowerCase())
    ).slice(0, 5);
  }, [athletes, reportForm.athleteSearch]);

  const handleSelectAthlete = (athlete: Athlete) => {
    setReportForm({ ...reportForm, athleteId: athlete.id, athleteSearch: `${athlete.firstName} ${athlete.lastName}` });
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    const athlete = athletes.find(a => a.id === reportForm.athleteId);
    if (!athlete) return;
    const newReport: SocialReport = { id: Math.random().toString(36).substr(2, 9), date: new Date().toLocaleDateString(), title: reportForm.title, content: reportForm.content, createdBy: user.name };
    onUpdateAthlete({ ...athlete, socialReports: [newReport, ...athlete.socialReports] });
    setShowReportForm(false);
    setReportForm({ athleteId: '', athleteSearch: '', title: '', content: '' });
  };

  const handleOpenSocialEdit = (athlete: Athlete) => {
    if (!canEdit) return;
    setSocialHistoryForm({
      familyComposition: athlete.familyComposition || '',
      schoolName: athlete.schoolName || '',
      socialBehavioralNotes: athlete.socialBehavioralNotes || ''
    });
    setShowSocialEdit(true);
  };

  const handleSaveSocialHistory = () => {
    if (!canEdit) return;
    const athlete = athletes.find(a => a.id === viewingAthleteId);
    if (!athlete) return;
    onUpdateAthlete({ ...athlete, ...socialHistoryForm });
    setShowSocialEdit(false);
  };

  const selectedAthlete = athletes.find(a => a.id === viewingAthleteId);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight italic uppercase">Área Social</h1>
          <p className="text-slate-500 font-medium">Seguimiento socioeconómico y familiar</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setActiveTab('dossiers')} className={`px-6 py-3 rounded-2xl font-black transition text-xs tracking-widest uppercase flex items-center shadow-lg ${activeTab === 'dossiers' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}><i className="fas fa-id-card-clip mr-2"></i> Expedientes Sociales</button>
          {canEdit ? (
            <button onClick={() => setShowReportForm(true)} className="bg-purple-600 text-white px-8 py-3 rounded-2xl font-black hover:bg-purple-700 transition flex items-center justify-center shadow-xl shadow-purple-900/20 uppercase text-xs tracking-widest"><i className="fas fa-plus mr-2"></i> Nueva Intervención</button>
          ) : (
             <span className="text-[10px] font-black text-slate-400 uppercase italic self-center">Vista de Lectura Habilitada</span>
          )}
        </div>
      </header>

      <div className="flex bg-slate-100 p-1 rounded-2xl w-fit">
        <button onClick={() => setActiveTab('reports')} className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${activeTab === 'reports' ? 'bg-white text-purple-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Bitácora</button>
        <button onClick={() => setActiveTab('dossiers')} className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${activeTab === 'dossiers' ? 'bg-white text-purple-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Fichas</button>
      </div>

      {activeTab === 'reports' && (
        <div className="grid gap-4">
          {allReports.map(report => (
            <div key={report.id} className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition group">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex items-center space-x-4 min-w-[200px]">
                  <img src={report.photo} className="w-12 h-12 rounded-2xl object-cover shadow-sm" alt="" />
                  <div>
                    <h4 className="font-black text-slate-800 uppercase italic text-sm leading-none mb-1">{report.athleteName}</h4>
                    <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest">{report.date}</p>
                  </div>
                </div>
                <div className="flex-grow border-t md:border-t-0 md:border-l border-slate-50 pt-4 md:pt-0 md:pl-6">
                  <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{report.title}</h5>
                  <p className="text-sm text-slate-600 italic leading-relaxed">"{report.content}"</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'dossiers' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Localizar Expediente</h3>
            <div className="relative w-full md:w-96">
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <input type="text" placeholder="Nombre..." className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-purple-500 font-bold text-sm text-black" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredAthletes.map(a => (
              <button key={a.id} onClick={() => setViewingAthleteId(a.id)} className={`p-4 rounded-3xl border-2 transition-all text-left group ${viewingAthleteId === a.id ? 'border-purple-600 bg-purple-50' : 'border-slate-100 bg-white hover:border-purple-200'}`}>
                <div className="flex flex-col items-center text-center">
                  <img src={a.photo} className="w-16 h-16 rounded-2xl object-cover mb-3 shadow-md group-hover:scale-105 transition" alt="" />
                  <p className="font-black text-[10px] uppercase italic text-slate-800 truncate w-full">{a.firstName} {a.lastName}</p>
                </div>
              </button>
            ))}
          </div>

          {selectedAthlete && (
            <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 animate-in slide-in-from-bottom-4 duration-500">
              <div className="bg-slate-800 p-8 text-white flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center space-x-6">
                  <img src={selectedAthlete.photo} className="w-20 h-20 rounded-3xl border-2 border-white/10 object-cover shadow-2xl" alt="" />
                  <h2 className="text-2xl font-black uppercase italic tracking-tighter">{selectedAthlete.firstName} {selectedAthlete.lastName}</h2>
                </div>
                {canEdit ? (
                  <button onClick={() => handleOpenSocialEdit(selectedAthlete)} className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition border border-white/20"><i className="fas fa-edit mr-2"></i> Editar Ficha Social</button>
                ) : (
                  <span className="text-xs font-black text-slate-400 uppercase italic">Expediente Protegido (Solo Lectura)</span>
                )}
              </div>
              <div className="p-10 grid md:grid-cols-2 gap-8">
                 <div className="bg-slate-50 p-6 rounded-3xl">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase mb-4">Información Base</h4>
                    <p className="text-sm font-bold text-slate-700 leading-relaxed">{selectedAthlete.familyComposition || 'Sin composición familiar registrada.'}</p>
                 </div>
                 <div className="bg-slate-50 p-6 rounded-3xl">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase mb-4">Estudios</h4>
                    <p className="text-sm font-bold text-slate-700">{selectedAthlete.schoolName || 'Sin institución registrada.'}</p>
                 </div>
              </div>
            </div>
          )}
        </div>
      )}

      {showReportForm && canEdit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="bg-purple-600 p-8 text-white flex justify-between items-center flex-shrink-0">
               <h3 className="text-xl font-black uppercase tracking-tighter italic">Nueva Intervención</h3>
               <button onClick={() => setShowReportForm(false)} className="text-white/40 hover:text-white transition text-2xl"><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleReportSubmit} className="p-8 space-y-6">
               <div className="relative">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-1 block">Deportista*</label>
                  <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-black" placeholder="Buscar..." value={reportForm.athleteSearch} onChange={(e) => setReportForm({...reportForm, athleteSearch: e.target.value, athleteId: ''})} required />
                  {suggestedAthletes.length > 0 && !reportForm.athleteId && (
                    <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                       {suggestedAthletes.map(a => (
                         <button key={a.id} type="button" onClick={() => handleSelectAthlete(a)} className="w-full p-4 flex items-center space-x-3 hover:bg-purple-50 transition text-left text-xs font-black uppercase italic">{a.firstName} {a.lastName}</button>
                       ))}
                    </div>
                  )}
               </div>
               <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Motivo*</label><input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-black" value={reportForm.title} onChange={(e) => setReportForm({...reportForm, title: e.target.value})} required /></div>
               <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Detalles*</label><textarea className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-medium h-32 resize-none text-black" value={reportForm.content} onChange={(e) => setReportForm({...reportForm, content: e.target.value})} required /></div>
               <button type="submit" className="w-full bg-purple-600 text-white font-black py-4 rounded-3xl hover:bg-black transition uppercase text-xs tracking-widest">Registrar</button>
            </form>
          </div>
        </div>
      )}

      {showSocialEdit && canEdit && selectedAthlete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="bg-slate-800 p-8 text-white flex justify-between items-center flex-shrink-0">
               <h3 className="text-xl font-black uppercase italic">Actualizar Ficha Social</h3>
               <button onClick={() => setShowSocialEdit(false)} className="text-white/40 hover:text-white transition text-2xl"><i className="fas fa-times"></i></button>
            </div>
            <div className="p-8 space-y-6">
               <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Institución</label><input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-black" value={socialHistoryForm.schoolName} onChange={e => setSocialHistoryForm({...socialHistoryForm, schoolName: e.target.value})} /></div>
               <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-1">Composición Familiar</label><textarea className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold h-24 resize-none text-black" value={socialHistoryForm.familyComposition} onChange={e => setSocialHistoryForm({...socialHistoryForm, familyComposition: e.target.value})} /></div>
               <button onClick={handleSaveSocialHistory} className="w-full bg-purple-600 text-white font-black py-4 rounded-3xl hover:bg-black transition uppercase text-xs tracking-widest">Aplicar Cambios</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialPage;
