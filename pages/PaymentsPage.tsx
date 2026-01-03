
import React, { useState, useMemo } from 'react';
import { Athlete, User } from '../types';

interface PaymentsPageProps {
  athletes: Athlete[];
  onUpdateAthlete: (athlete: Athlete) => void;
  user: User;
}

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const MONTHLY_FEE = 500; 

const PaymentsPage: React.FC<PaymentsPageProps> = ({ athletes, onUpdateAthlete, user }) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentType, setPaymentType] = useState<'monthly' | 'therapy_monthly' | 'prev_year'>('monthly');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPredictiveList, setShowPredictiveList] = useState(false);
  
  const [selectedMonthsToPay, setSelectedMonthsToPay] = useState<string[]>([]);
  const [selectedPrevYearMonths, setSelectedPrevYearMonths] = useState<string[]>([]);
  
  const canEdit = user.permissions.payments === 'edit';

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

  const getMonthsOwedCurrent = (athlete: Athlete) => {
    if (athlete.isScholarship) return [];
    const now = new Date();
    const cYear = now.getFullYear();
    const currentMonthIndex = now.getMonth();
    const owed: string[] = [];

    for (let i = 0; i <= currentMonthIndex; i++) {
      const month = MONTHS[i];
      const key = `${cYear}-${month}`;
      if (!athlete.payments || !athlete.payments[key] || athlete.payments[key] === 0) {
        owed.push(key);
      }
    }
    
    return owed.sort((a, b) => {
      const [yearA, monthA] = a.split('-');
      const [yearB, monthB] = b.split('-');
      if (yearA !== yearB) return parseInt(yearA) - parseInt(yearB);
      return MONTHS.indexOf(monthA) - MONTHS.indexOf(monthB);
    });
  };

  const getMonthsOwedPrev = (athlete: Athlete) => {
    const prevYear = new Date().getFullYear() - 1;
    return Object.keys(athlete.payments || {})
      .filter(key => key.startsWith(`${prevYear}-`) && athlete.payments![key] === 0)
      .sort((a, b) => MONTHS.indexOf(a.split('-')[1]) - MONTHS.indexOf(b.split('-')[1]));
  };

  const handleOpenPaymentModal = (athlete: Athlete) => {
    if (!canEdit) return;
    setSelectedAthlete(athlete);
    setSelectedMonthsToPay([]);
    setSelectedPrevYearMonths([]);
    setShowPredictiveList(false);
    setSearchTerm('');
    
    const prevOwed = getMonthsOwedPrev(athlete);
    if (prevOwed.length > 0) {
      setPaymentType('prev_year');
    } else {
      setPaymentType(athlete.isScholarship ? 'therapy_monthly' : 'monthly');
    }
    setPaymentAmount(0);
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAthlete || !canEdit) return;

    let updatedAthlete = { ...selectedAthlete };
    const newPayments = { ...(updatedAthlete.payments || {}) };
    let finalAmount = 0;

    if (paymentType === 'monthly' && !updatedAthlete.isScholarship) {
      if (selectedMonthsToPay.length > 0) {
        selectedMonthsToPay.forEach(key => {
          newPayments[key] = MONTHLY_FEE;
        });
        updatedAthlete.payments = newPayments;
        finalAmount = selectedMonthsToPay.length * MONTHLY_FEE;
        
        const now = new Date();
        const cYear = now.getFullYear();
        const currentMonthIndex = now.getMonth();
        let remainingDebt = 0;
        for (let i = 0; i <= currentMonthIndex; i++) {
          const key = `${cYear}-${MONTHS[i]}`;
          if (!newPayments[key] || newPayments[key] === 0) remainingDebt += MONTHLY_FEE;
        }
        updatedAthlete.monthlyDebt = remainingDebt;
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
    } else if (paymentType === 'therapy_monthly') {
      finalAmount = calculatedAmount;
      updatedAthlete.monthlyTherapyDebt = Math.max(0, (updatedAthlete.monthlyTherapyDebt || 0) - finalAmount);
    }

    onUpdateAthlete(updatedAthlete);
    setShowPaymentModal(false);
    setSelectedAthlete(null);
    setSelectedMonthsToPay([]);
    setSelectedPrevYearMonths([]);
    alert(`Ingreso de $${finalAmount} registrado correctamente.`);
  };

  const toggleMonthSelection = (key: string) => {
    setSelectedMonthsToPay(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const togglePrevYearMonthSelection = (key: string) => {
    setSelectedPrevYearMonths(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const calculatedAmount = useMemo(() => {
    if (paymentType === 'monthly' && selectedMonthsToPay.length > 0) {
      return selectedMonthsToPay.length * MONTHLY_FEE;
    }
    if (paymentType === 'prev_year' && selectedPrevYearMonths.length > 0) {
      return selectedPrevYearMonths.length * MONTHLY_FEE;
    }
    return paymentAmount;
  }, [paymentType, selectedMonthsToPay, selectedPrevYearMonths, paymentAmount]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight italic uppercase">Módulo de Pagos</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Control de Mensualidades y Terapias</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative w-full sm:w-80">
             <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 z-10"></i>
             <input 
              type="text" 
              placeholder="Escribe nombre para cobrar..." 
              className="w-full pl-14 pr-6 py-4 rounded-[1.5rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/50 outline-none text-black font-bold focus:ring-4 focus:ring-red-900/10 transition-all text-sm relative z-0" 
              value={searchTerm} 
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowPredictiveList(true);
              }}
              onFocus={() => setShowPredictiveList(true)}
             />
             
             {showPredictiveList && predictiveResults.length > 0 && (
               <div className="absolute top-full left-0 w-full mt-3 bg-white rounded-[2rem] shadow-2xl border border-slate-50 overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
                 <div className="p-3 bg-slate-50 border-b border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">Sugerencias encontradas</p>
                 </div>
                 {predictiveResults.map(athlete => (
                   <button 
                    key={athlete.id}
                    onClick={() => handleOpenPaymentModal(athlete)}
                    className="w-full p-4 flex items-center space-x-4 hover:bg-red-50 transition-colors text-left border-b border-slate-50 last:border-0"
                   >
                     <img src={athlete.photo} className="w-10 h-10 rounded-xl object-cover shadow-sm" alt="" />
                     <div>
                        <p className="text-xs font-black uppercase italic text-slate-800">{athlete.firstName} {athlete.lastName}</p>
                        <div className="flex gap-2 items-center mt-1">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">{athlete.category}</span>
                          {athlete.isScholarship && <span className="text-[7px] font-black bg-yellow-400 text-white px-1.5 rounded uppercase">Becado</span>}
                        </div>
                     </div>
                     <div className="flex-grow flex justify-end">
                        <i className="fas fa-chevron-right text-slate-200 text-xs"></i>
                     </div>
                   </button>
                 ))}
               </div>
             )}
          </div>
        </div>
      </header>

      <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-slate-100">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Deportista</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Adeudos Pendientes</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Balance Total</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredAthletes.map(a => {
                const currentOwed = getMonthsOwedCurrent(a);
                const prevOwed = getMonthsOwedPrev(a);
                const totalDebt = (a.isScholarship ? 0 : (a.monthlyDebt || 0)) + (a.monthlyTherapyDebt || 0) + (a.previousYearDebt || 0) + (a.physioDebt || 0);
                
                return (
                  <tr key={a.id} className="hover:bg-slate-50/30 transition">
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="font-black uppercase italic text-sm text-slate-800 leading-none mb-1">{a.firstName} {a.lastName}</span>
                        <div className="flex gap-2">
                          {a.isScholarship && <span className="text-[8px] font-black bg-yellow-400 text-white px-2 py-0.5 rounded shadow-sm uppercase italic">Becado</span>}
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter self-center">{a.category}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-wrap gap-2 max-w-sm">
                        {a.isScholarship ? (
                          <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded text-[8px] font-black uppercase border border-emerald-100 shadow-sm">Membresía: Becado</span>
                        ) : (
                          currentOwed.length > 0 && currentOwed.map(key => (
                            <span key={key} className="bg-red-50 text-red-600 border-red-100 px-2 py-0.5 rounded text-[8px] font-black uppercase border shadow-sm">
                              {key.split('-')[1]}
                            </span>
                          ))
                        )}
                        {prevOwed.length > 0 && (
                          <span className="bg-slate-900 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase border border-slate-800 shadow-sm animate-pulse">
                            Ciclo Pasado: {prevOwed.length} meses
                          </span>
                        )}
                        {a.monthlyTherapyDebt > 0 && (
                          <span className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded text-[8px] font-black uppercase border border-rose-100 shadow-sm">
                            Terapia: ${a.monthlyTherapyDebt}
                          </span>
                        )}
                        {currentOwed.length === 0 && (a.monthlyTherapyDebt || 0) === 0 && prevOwed.length === 0 && !a.isScholarship && (
                          <span className="text-emerald-500 text-[10px] font-black uppercase italic tracking-widest"><i className="fas fa-check-circle mr-1"></i> Sin Adeudos</span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className={`font-black text-sm px-4 py-1.5 rounded-2xl ${totalDebt > 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        ${totalDebt.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      {canEdit && (
                        <button onClick={() => handleOpenPaymentModal(a)} className="bg-red-900 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase hover:bg-black transition shadow-lg shadow-red-900/10 tracking-widest">Cobrar</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
      </div>

      {showPaymentModal && selectedAthlete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-red-900 p-8 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black uppercase italic tracking-tighter">Caja de Cobro</h3>
                <p className="text-[10px] font-bold text-red-300 uppercase tracking-widest mt-1">Deportista: {selectedAthlete.firstName} {selectedAthlete.lastName} {selectedAthlete.isScholarship ? '(BECADO)' : ''}</p>
              </div>
              <button onClick={() => { setShowPaymentModal(false); setSelectedAthlete(null); }} className="text-white/40 hover:text-white transition text-2xl"><i className="fas fa-times"></i></button>
            </div>
            
            <form onSubmit={handlePaymentSubmit} className="p-10 space-y-8 bg-white">
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-6">
                <div className="flex flex-col gap-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Concepto de Cobro</label>
                  <div className="grid grid-cols-3 gap-2 bg-white p-1 rounded-xl border border-slate-200">
                    <button 
                      type="button" 
                      disabled={selectedAthlete.isScholarship}
                      onClick={() => setPaymentType('monthly')} 
                      className={`px-2 py-3 rounded-lg text-[8px] font-black uppercase transition-all ${paymentType === 'monthly' ? 'bg-red-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'} ${selectedAthlete.isScholarship ? 'opacity-30 cursor-not-allowed' : ''}`}>
                      {selectedAthlete.isScholarship ? 'Exento Beca' : 'Mensualidad'}
                    </button>
                    <button type="button" onClick={() => setPaymentType('therapy_monthly')} className={`px-2 py-3 rounded-lg text-[8px] font-black uppercase transition-all ${paymentType === 'therapy_monthly' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>Terapia Mensual</button>
                    <button type="button" onClick={() => setPaymentType('prev_year')} className={`px-2 py-3 rounded-lg text-[8px] font-black uppercase transition-all ${paymentType === 'prev_year' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>Año Anterior</button>
                  </div>
                </div>

                {paymentType === 'monthly' && !selectedAthlete.isScholarship && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex justify-between">
                        <span>Meses Ciclo Actual</span>
                        <span className="text-red-900 font-black">${MONTHLY_FEE} c/u</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto custom-scrollbar p-1">
                      {getMonthsOwedCurrent(selectedAthlete).map(key => (
                        <button key={key} type="button" onClick={() => toggleMonthSelection(key)} className={`p-3 rounded-xl border-2 text-[9px] font-black uppercase transition-all ${selectedMonthsToPay.includes(key) ? 'border-red-900 bg-red-900 text-white shadow-lg' : 'border-slate-200 bg-white text-slate-400 hover:border-red-200'}`}>
                          {key.split('-')[1]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {paymentType === 'prev_year' && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex justify-between">
                        <span>Meses Pendientes Año Pasado</span>
                        <span className="text-slate-900 font-black">${MONTHLY_FEE} c/u</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto custom-scrollbar p-1">
                      {getMonthsOwedPrev(selectedAthlete).map(key => (
                        <button key={key} type="button" onClick={() => togglePrevYearMonthSelection(key)} className={`p-3 rounded-xl border-2 text-[9px] font-black uppercase transition-all ${selectedPrevYearMonths.includes(key) ? 'border-slate-900 bg-slate-900 text-white shadow-lg' : 'border-slate-200 bg-white text-slate-400 hover:border-slate-800'}`}>
                          {key.split('-')[1]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {paymentType === 'therapy_monthly' && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex justify-between items-center mb-2">
                       <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Saldo Pendiente Terapia:</span>
                       <span className="text-lg font-black text-emerald-900">${(selectedAthlete.monthlyTherapyDebt || 0).toLocaleString()}</span>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Monto a Abonar ($)</label>
                      <input 
                        type="number" 
                        className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-black text-2xl text-slate-800 focus:border-red-900 outline-none transition-all" 
                        value={paymentAmount || ''} 
                        onChange={(e) => setPaymentAmount(Number(e.target.value))}
                        required 
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                )}
              </div>

              <button type="submit" className="w-full bg-emerald-600 text-white py-6 rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-emerald-900/20 active:scale-95 transition-all">
                Registrar Cobro: ${calculatedAmount.toLocaleString()}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsPage;
