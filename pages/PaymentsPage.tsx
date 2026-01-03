
import React, { useState, useMemo } from 'react';
import { Athlete, User } from '../types';

interface PaymentsPageProps {
  athletes: Athlete[];
  onUpdateAthlete: (athlete: Athlete) => void;
  user: User;
}

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const MONTHLY_FEE = 650;
const THERAPY_FEE = 500; 
const REGISTRATION_FEE = 1200; // Costo de inscripción

const PaymentsPage: React.FC<PaymentsPageProps> = ({ athletes, onUpdateAthlete, user }) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentType, setPaymentType] = useState<'monthly' | 'therapy_monthly' | 'prev_year' | 'registration'>('monthly');
  const [isCorrectionMode, setIsCorrectionMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPredictiveList, setShowPredictiveList] = useState(false);
  
  const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(null);
  const [selectedTherapyMonths, setSelectedTherapyMonths] = useState<string[]>([]);
  const [selectedPrevYearMonths, setSelectedPrevYearMonths] = useState<string[]>([]);
  
  const canEdit = user.permissions.payments === 'edit';
  const currentYear = new Date().getFullYear().toString();

  const predictiveResults = useMemo(() => {
    if (searchTerm.length < 2) return [];
    return athletes.filter(a => 
      `${a.firstName} ${a.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 6);
  }, [athletes, searchTerm]);

  const filteredAthletes = useMemo(() => {
    return athletes.filter(a => 
      `${a.firstName} ${a.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [athletes, searchTerm]);

  const getCurrentYearMonths = () => {
    const now = new Date();
    const cYear = now.getFullYear();
    const currentMonthIndex = now.getMonth();
    const keys: string[] = [];
    for (let i = 0; i <= currentMonthIndex; i++) {
      keys.push(`${cYear}-${MONTHS[i]}`);
    }
    return keys;
  };

  const getTherapyMonthsOwed = (athlete: Athlete) => {
    if (!athlete.isScholarship) return [];
    const now = new Date();
    const cYear = now.getFullYear();
    const currentMonthIndex = now.getMonth();
    const owed: string[] = [];
    for (let i = 0; i <= currentMonthIndex; i++) {
      const month = MONTHS[i];
      const key = `${cYear}-${month}`;
      const paid = athlete.therapyPayments?.[key] || 0;
      if (paid < THERAPY_FEE) {
        owed.push(key);
      }
    }
    return owed;
  };

  const handleOpenPaymentModal = (athlete: Athlete) => {
    if (!canEdit) return;
    setSelectedAthlete(athlete);
    setSelectedMonthKey(null);
    setSelectedTherapyMonths([]);
    setSelectedPrevYearMonths([]);
    setShowPredictiveList(false);
    setSearchTerm('');
    setIsCorrectionMode(false);
    
    // Por petición: Mandar directamente a Membresía (o Terapia si es becado)
    setPaymentType(athlete.isScholarship ? 'therapy_monthly' : 'monthly');
    setPaymentAmount(0);
    
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAthlete || !canEdit) return;

    let updatedAthlete = { ...selectedAthlete };
    const newPayments = { ...(updatedAthlete.payments || {}) };
    const newTherapyPayments = { ...(updatedAthlete.therapyPayments || {}) };
    const newInscriptions = { ...(updatedAthlete.inscriptionPaid || {}) };
    let finalAmount = 0;

    if (paymentType === 'registration') {
        newInscriptions[currentYear] = true;
        updatedAthlete.inscriptionPaid = newInscriptions;
        finalAmount = paymentAmount;
    } else if (paymentType === 'monthly' && !updatedAthlete.isScholarship) {
      if (selectedMonthKey) {
        const currentAbono = newPayments[selectedMonthKey] || 0;
        newPayments[selectedMonthKey] = currentAbono + paymentAmount;
        updatedAthlete.payments = newPayments;
        finalAmount = paymentAmount;
        
        const now = new Date();
        const cYear = now.getFullYear();
        const currentMonthIndex = now.getMonth();
        let totalDebt = 0;
        for (let i = 0; i <= currentMonthIndex; i++) {
          const key = `${cYear}-${MONTHS[i]}`;
          const paid = newPayments[key] || 0;
          totalDebt += Math.max(0, MONTHLY_FEE - paid);
        }
        updatedAthlete.monthlyDebt = totalDebt;
      }
    } else if (paymentType === 'prev_year') {
      if (selectedPrevYearMonths.length > 0) {
        selectedPrevYearMonths.forEach(key => {
          newPayments[key] = MONTHLY_FEE;
        });
        updatedAthlete.payments = newPayments;
        finalAmount = selectedPrevYearMonths.length * MONTHLY_FEE;
        const prevYear = new Date().getFullYear() - 1;
        const remainingPrevMonths = Object.keys(newPayments).filter(k => k.startsWith(`${prevYear}-`) && newPayments[k] === 0);
        updatedAthlete.previousYearDebt = remainingPrevMonths.length * MONTHLY_FEE;
      }
    } else if (paymentType === 'therapy_monthly' && updatedAthlete.isScholarship) {
      if (isCorrectionMode) {
        const correctionPayments: { [key: string]: number } = { ...(updatedAthlete.therapyPayments || {}) };
        selectedTherapyMonths.forEach(key => { correctionPayments[key] = 0; });
        updatedAthlete.therapyPayments = correctionPayments;
        
        const therapyOwedList = getTherapyMonthsOwed(updatedAthlete);
        updatedAthlete.monthlyTherapyDebt = therapyOwedList.length * THERAPY_FEE;
        finalAmount = 0;
      } else {
        if (selectedTherapyMonths.length > 0) {
          const perMonth = paymentAmount / selectedTherapyMonths.length;
          selectedTherapyMonths.forEach(key => { 
            const currentVal = newTherapyPayments[key] || 0;
            newTherapyPayments[key] = currentVal + perMonth; 
          });
          updatedAthlete.therapyPayments = newTherapyPayments;
          finalAmount = paymentAmount;
          
          // Recalcular deuda total de terapia
          const now = new Date();
          const cYear = now.getFullYear();
          const currentMonthIndex = now.getMonth();
          let totalTherapyDebt = 0;
          for (let i = 0; i <= currentMonthIndex; i++) {
            const key = `${cYear}-${MONTHS[i]}`;
            const paid = newTherapyPayments[key] || 0;
            totalTherapyDebt += Math.max(0, THERAPY_FEE - paid);
          }
          updatedAthlete.monthlyTherapyDebt = totalTherapyDebt;
        }
      }
    }

    onUpdateAthlete(updatedAthlete);
    setShowPaymentModal(false);
    setSelectedAthlete(null);
    setSelectedMonthKey(null);
    setSelectedTherapyMonths([]);
    setSelectedPrevYearMonths([]);
    
    alert(`Cobro de $${finalAmount.toLocaleString()} registrado con éxito.`);
  };

  const toggleTherapyMonthSelection = (key: string) => {
    setSelectedTherapyMonths(prev => {
      const newList = prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key];
      // Solo sugerir el monto si no hay nada ingresado o si se está agregando meses
      if (!isCorrectionMode && newList.length > 0) {
         let totalNeeded = 0;
         newList.forEach(k => {
            const alreadyPaid = selectedAthlete?.therapyPayments?.[k] || 0;
            totalNeeded += Math.max(0, THERAPY_FEE - alreadyPaid);
         });
         setPaymentAmount(totalNeeded);
      }
      return newList;
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight italic uppercase">Caja Savage</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Control de Inscripciones y Mensualidades</p>
        </div>
        <div className="relative w-full sm:w-80">
           <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 z-10"></i>
           <input 
            type="text" 
            placeholder="Buscar deportista..." 
            className="w-full pl-14 pr-6 py-4 rounded-[1.5rem] bg-white border border-slate-100 shadow-xl outline-none text-black font-bold focus:ring-4 focus:ring-red-900/10 transition-all text-sm" 
            value={searchTerm} 
            onChange={(e) => { setSearchTerm(e.target.value); setShowPredictiveList(true); }}
           />
           {showPredictiveList && predictiveResults.length > 0 && (
             <div className="absolute top-full left-0 w-full mt-3 bg-white rounded-[2rem] shadow-2xl border border-slate-50 overflow-hidden z-50 animate-in slide-in-from-top-2">
               {predictiveResults.map(athlete => (
                 <button key={athlete.id} onClick={() => handleOpenPaymentModal(athlete)} className="w-full p-4 flex items-center space-x-4 hover:bg-red-50 transition-colors text-left border-b border-slate-50 last:border-0">
                   <img src={athlete.photo} className="w-10 h-10 rounded-xl object-cover" alt="" />
                   <div>
                      <p className="text-xs font-black uppercase italic text-slate-800">{athlete.firstName} {athlete.lastName}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">{athlete.category}</p>
                   </div>
                 </button>
               ))}
             </div>
           )}
        </div>
      </header>

      <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-slate-100">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Atleta</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Inscripción</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estatus Mensual</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredAthletes.map(a => {
                const isInsPaid = a.inscriptionPaid?.[currentYear];
                const yearMonths = getCurrentYearMonths();
                const therapyOwed = getTherapyMonthsOwed(a);
                
                return (
                  <tr key={a.id} className="hover:bg-slate-50/30 transition">
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="font-black uppercase italic text-sm text-slate-800 leading-none mb-1">{a.firstName} {a.lastName}</span>
                        {a.isScholarship && <span className="text-[7px] font-black bg-yellow-400 text-white px-2 py-0.5 rounded-full w-fit uppercase tracking-tighter">Becado</span>}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                        <div className={`mx-auto w-10 h-10 rounded-xl flex items-center justify-center border-2 shadow-sm transition-all ${isInsPaid ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : 'bg-red-50 border-red-200 text-red-300'}`} title={isInsPaid ? 'Inscripción Pagada' : 'Pendiente'}>
                            <i className={`fas ${isInsPaid ? 'fa-check-circle' : 'fa-ticket'} text-lg`}></i>
                        </div>
                        <p className={`text-[7px] font-black uppercase mt-1 tracking-widest ${isInsPaid ? 'text-emerald-600' : 'text-red-400'}`}>Ciclo {currentYear}</p>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-wrap gap-1.5 max-w-xs">
                        {a.isScholarship ? (
                          <div className="flex flex-col space-y-1">
                             <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-lg w-fit">Membresía Exenta</span>
                             {a.monthlyTherapyDebt > 0 && (
                               <span className="text-[8px] font-black text-rose-600 uppercase tracking-widest bg-rose-50 px-3 py-1 rounded-lg animate-pulse border border-rose-100">Deuda Terapia: ${a.monthlyTherapyDebt}</span>
                             )}
                          </div>
                        ) : (
                          yearMonths.map(key => {
                            const paid = a.payments?.[key] || 0;
                            const isFullyPaid = paid >= MONTHLY_FEE;
                            const hasAbono = paid > 0 && paid < MONTHLY_FEE;
                            return (
                              <div key={key} className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border shadow-sm flex flex-col items-center ${isFullyPaid ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : hasAbono ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                <span>{key.split('-')[1].substring(0,3)}</span>
                                {hasAbono && <span className="text-[6px] opacity-60">${paid}</span>}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      {canEdit && <button onClick={() => handleOpenPaymentModal(a)} className="bg-red-900 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase hover:bg-black transition shadow-lg tracking-widest">Caja</button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
      </div>

      {showPaymentModal && selectedAthlete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="bg-[#2d0000] p-8 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black uppercase italic tracking-tighter">Módulo de Cobro</h3>
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mt-1">{selectedAthlete.firstName} {selectedAthlete.lastName}</p>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="text-white/40 hover:text-white transition text-2xl"><i className="fas fa-times"></i></button>
            </div>
            
            <form onSubmit={handlePaymentSubmit} className="p-10 space-y-8 bg-white overflow-y-auto custom-scrollbar">
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-6">
                <div className="flex flex-col gap-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Seleccionar Motivo de Pago</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white p-1 rounded-xl border border-slate-200">
                    <button type="button" disabled={selectedAthlete.isScholarship} onClick={() => { setPaymentType('monthly'); setPaymentAmount(0); setSelectedMonthKey(null); }} className={`px-2 py-3 rounded-lg text-[8px] font-black uppercase transition-all ${paymentType === 'monthly' ? 'bg-red-900 text-white shadow-md' : 'text-slate-400'} ${selectedAthlete.isScholarship ? 'opacity-30 cursor-not-allowed' : ''}`}>Membresía</button>
                    <button type="button" onClick={() => { setPaymentType('registration'); setPaymentAmount(REGISTRATION_FEE); }} className={`px-2 py-3 rounded-lg text-[8px] font-black uppercase transition-all ${paymentType === 'registration' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400'}`}>Inscripción</button>
                    <button type="button" disabled={!selectedAthlete.isScholarship} onClick={() => { setPaymentType('therapy_monthly'); setPaymentAmount(0); setSelectedTherapyMonths([]); }} className={`px-2 py-3 rounded-lg text-[8px] font-black uppercase transition-all ${paymentType === 'therapy_monthly' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400'} ${!selectedAthlete.isScholarship ? 'opacity-30 cursor-not-allowed' : ''}`}>Terapia</button>
                    <button type="button" onClick={() => { setPaymentType('prev_year'); setPaymentAmount(0); setSelectedPrevYearMonths([]); }} className={`px-2 py-3 rounded-lg text-[8px] font-black uppercase transition-all ${paymentType === 'prev_year' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400'}`}>Anterior</button>
                  </div>
                </div>

                {paymentType === 'registration' && (
                    <div className="p-8 text-center bg-white border-2 border-emerald-100 rounded-3xl animate-in fade-in zoom-in">
                        <i className="fas fa-ticket text-5xl text-emerald-500 mb-4"></i>
                        <h4 className="text-sm font-black uppercase italic text-slate-800">Inscripción Ciclo {currentYear}</h4>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Monto Fijo: ${REGISTRATION_FEE.toLocaleString()}</p>
                        <div className="mt-6 flex flex-col items-center">
                            <span className="text-[9px] font-black text-slate-300 uppercase mb-2">Confirmar Monto</span>
                            <input type="number" className="w-32 p-3 bg-slate-50 border-2 border-emerald-500 rounded-xl text-center font-black text-xl text-emerald-700 outline-none" value={paymentAmount} onChange={e => setPaymentAmount(Number(e.target.value))} />
                        </div>
                    </div>
                )}

                {paymentType === 'monthly' && !selectedAthlete.isScholarship && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Selecciona el Mes a Abonar</label>
                       <div className="grid grid-cols-3 gap-2">
                          {getCurrentYearMonths().map(key => {
                            const paid = selectedAthlete.payments?.[key] || 0;
                            const isSelected = selectedMonthKey === key;
                            return (
                              <button key={key} type="button" onClick={() => { setSelectedMonthKey(key); setPaymentAmount(Math.max(0, MONTHLY_FEE - paid)); }} className={`p-3 rounded-xl border-2 text-[9px] font-black uppercase transition-all flex flex-col items-center ${isSelected ? 'border-red-900 bg-red-900 text-white shadow-lg' : paid >= MONTHLY_FEE ? 'border-emerald-100 bg-emerald-50 text-emerald-400' : 'border-slate-200 bg-white text-slate-400'}`}>
                                <span>{key.split('-')[1]}</span>
                                <span className="text-[7px] opacity-60">${paid} / $${MONTHLY_FEE}</span>
                              </button>
                            );
                          })}
                       </div>
                    </div>
                    {selectedMonthKey && (
                      <div className="space-y-3 p-4 bg-white border border-slate-200 rounded-2xl animate-in slide-in-from-top-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monto del Abono</label>
                        <input type="number" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-2xl text-slate-800 outline-none focus:border-red-900 transition-all" value={paymentAmount || ''} onChange={e => setPaymentAmount(Number(e.target.value))} required />
                      </div>
                    )}
                  </div>
                )}

                {paymentType === 'therapy_monthly' && selectedAthlete.isScholarship && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex justify-between items-center px-1">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selección de Meses (Terapia)</label>
                       <button type="button" onClick={() => setIsCorrectionMode(!isCorrectionMode)} className={`text-[8px] font-black uppercase px-2 py-1 rounded transition-colors ${isCorrectionMode ? 'bg-amber-500 text-white' : 'text-slate-300 hover:text-slate-500'}`}>Modo Corrección</button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 bg-white p-3 rounded-2xl border border-slate-200">
                      {MONTHS.map(m => {
                        const key = `${currentYear}-${m}`;
                        const paid = selectedAthlete.therapyPayments?.[key] || 0;
                        const isFullyPaid = paid >= THERAPY_FEE;
                        const hasAbono = paid > 0 && paid < THERAPY_FEE;
                        const isSelected = selectedTherapyMonths.includes(key);
                        
                        return (
                          <button 
                            key={key} 
                            type="button" 
                            disabled={isFullyPaid && !isCorrectionMode} 
                            onClick={() => toggleTherapyMonthSelection(key)} 
                            className={`p-3 rounded-xl border-2 text-[9px] font-black uppercase transition-all flex flex-col items-center ${
                              isSelected ? (isCorrectionMode ? 'bg-amber-500 border-amber-500 text-white' : 'bg-purple-600 border-purple-600 text-white shadow-lg') : 
                              isFullyPaid ? 'opacity-30 border-emerald-50 text-emerald-400 bg-emerald-50' : 
                              hasAbono ? 'border-amber-100 text-amber-600 bg-amber-50' : 
                              'border-slate-50 text-slate-400 hover:border-purple-100'
                            }`}
                          >
                            <span>{m.substring(0, 3)}</span>
                            {paid > 0 && <span className="text-[7px] opacity-60">${paid}</span>}
                          </button>
                        );
                      })}
                    </div>

                    {!isCorrectionMode && selectedTherapyMonths.length > 0 && (
                      <div className="space-y-3 p-4 bg-white border-2 border-purple-100 rounded-2xl animate-in slide-in-from-top-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monto a Cobrar (Terapia)</label>
                        <input 
                          type="number" 
                          className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-2xl text-purple-900 outline-none focus:border-purple-600 transition-all" 
                          value={paymentAmount || ''} 
                          onChange={e => setPaymentAmount(Number(e.target.value))} 
                          required 
                        />
                        <p className="text-[8px] font-bold text-slate-400 uppercase text-center mt-1 italic">Este monto se dividirá entre los {selectedTherapyMonths.length} meses seleccionados</p>
                      </div>
                    )}

                    {isCorrectionMode && selectedTherapyMonths.length > 0 && (
                       <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-center">
                          <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Los meses seleccionados se resetearán a $0</p>
                       </div>
                    )}
                  </div>
                )}
              </div>

              <button type="submit" disabled={(paymentType === 'monthly' && !selectedMonthKey) || (paymentType === 'therapy_monthly' && selectedTherapyMonths.length === 0)} className={`w-full py-6 rounded-3xl font-black uppercase text-xs tracking-widest shadow-2xl active:scale-95 transition-all ${paymentType === 'therapy_monthly' ? 'bg-purple-600 text-white shadow-purple-900/20' : 'bg-red-900 text-white shadow-red-900/20'}`}>
                {isCorrectionMode ? 'Corregir Saldos' : `Registrar Pago: $${paymentAmount.toLocaleString()}`}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsPage;
