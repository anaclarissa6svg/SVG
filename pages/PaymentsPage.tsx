
import React, { useState, useMemo } from 'react';
import { Athlete, User } from '../types';

interface PaymentsPageProps {
  athletes: Athlete[];
  onUpdateAthlete: (athlete: Athlete) => void;
  user: User;
}

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const MONTHLY_FEE = 500; // Monto estándar por mes

const PaymentsPage: React.FC<PaymentsPageProps> = ({ athletes, onUpdateAthlete, user }) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentType, setPaymentType] = useState<'monthly' | 'physio'>('monthly');
  const [searchTerm, setSearchTerm] = useState('');
  
  // New states for granular payment
  const [selectedMonthsToPay, setSelectedMonthsToPay] = useState<string[]>([]);

  const canEdit = user.permissions.payments === 'edit';

  // State for manual adjustment
  const [tempPayments, setTempPayments] = useState<{ [monthKey: string]: number }>({});
  const [adjustmentYear, setAdjustmentYear] = useState<number>(new Date().getFullYear());

  const currentYear = new Date().getFullYear();
  const availableYears = [currentYear - 2, currentYear - 1, currentYear];

  const filteredAthletes = useMemo(() => {
    return athletes.filter(a => 
      `${a.firstName} ${a.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [athletes, searchTerm]);

  const getMonthsOwed = (athlete: Athlete) => {
    if (athlete.isScholarship) return [];
    const now = new Date();
    const cYear = now.getFullYear();
    const currentMonthIndex = now.getMonth();
    const owed: string[] = [];

    // Calcular adeudos del año actual
    for (let i = 0; i <= currentMonthIndex; i++) {
      const month = MONTHS[i];
      const key = `${cYear}-${month}`;
      if (!athlete.payments || !athlete.payments[key] || athlete.payments[key] === 0) {
        owed.push(key);
      }
    }
    
    // Buscar adeudos históricos registrados en el objeto de pagos
    if (athlete.payments) {
        Object.keys(athlete.payments).forEach(key => {
            if (athlete.payments![key] === 0 && !key.startsWith(`${cYear}-`)) {
                owed.push(key);
            }
        });
    }

    // Ordenar cronológicamente (Año-Mes)
    return owed.sort((a, b) => {
      const [yearA, monthA] = a.split('-');
      const [yearB, monthB] = b.split('-');
      if (yearA !== yearB) return parseInt(yearA) - parseInt(yearB);
      return MONTHS.indexOf(monthA) - MONTHS.indexOf(monthB);
    });
  };

  const handleOpenPaymentModal = (athlete?: Athlete) => {
    if (!canEdit) return;
    if (athlete) {
      setSelectedAthlete(athlete);
      setSelectedMonthsToPay([]);
    } else {
      setSelectedAthlete(null);
      setSelectedMonthsToPay([]);
    }
    setPaymentAmount(0);
    setShowPaymentModal(true);
  };

  const handleOpenAdjustmentModal = (athlete: Athlete) => {
    if (!canEdit) return;
    setSelectedAthlete(athlete);
    setTempPayments({ ...(athlete.payments || {}) });
    setAdjustmentYear(currentYear);
    setShowAdjustmentModal(true);
  };

  const toggleMonthStatus = (month: string) => {
    const key = `${adjustmentYear}-${month}`;
    setTempPayments(prev => {
      const next = { ...prev };
      if (next[key] && next[key] > 0) {
        next[key] = 0;
      } else {
        next[key] = MONTHLY_FEE;
      }
      return next;
    });
  };

  const saveAdjustment = () => {
    if (!selectedAthlete || !canEdit) return;

    const now = new Date();
    const cYear = now.getFullYear();
    const currentMonthIndex = now.getMonth();
    let newMonthlyDebt = 0;
    
    // Recalcular deuda total basada en los meses no pagados
    if (!selectedAthlete.isScholarship) {
      // De este año
      for (let i = 0; i <= currentMonthIndex; i++) {
        const key = `${cYear}-${MONTHS[i]}`;
        if (!tempPayments[key] || tempPayments[key] === 0) {
          newMonthlyDebt += MONTHLY_FEE;
        }
      }
      // De años anteriores presentes en el registro
      Object.keys(tempPayments).forEach(key => {
          if (tempPayments[key] === 0 && !key.startsWith(`${cYear}-`)) {
              newMonthlyDebt += MONTHLY_FEE;
          }
      });
    }

    onUpdateAthlete({ ...selectedAthlete, payments: tempPayments, monthlyDebt: newMonthlyDebt });
    setShowAdjustmentModal(false);
    setSelectedAthlete(null);
  };

  const handleSettleAll = () => {
    if (!selectedAthlete || !canEdit) return;
    const owedKeys = getMonthsOwed(selectedAthlete);
    setSelectedMonthsToPay(owedKeys);
    // El monto se calcula automáticamente en el render
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAthlete || !canEdit) return;

    let updatedAthlete = { ...selectedAthlete };
    const newPayments = { ...(updatedAthlete.payments || {}) };

    if (paymentType === 'monthly') {
      if (selectedMonthsToPay.length > 0) {
        // Pagar meses específicos seleccionados
        selectedMonthsToPay.forEach(key => {
          newPayments[key] = MONTHLY_FEE;
        });
        updatedAthlete.payments = newPayments;
        
        // Recalcular deuda mensual restante (meses que quedan con valor 0 o inexistentes hasta hoy)
        const now = new Date();
        const cYear = now.getFullYear();
        const currentMonthIndex = now.getMonth();
        let remainingDebt = 0;

        // Meses de este año
        for (let i = 0; i <= currentMonthIndex; i++) {
          const key = `${cYear}-${MONTHS[i]}`;
          if (!newPayments[key] || newPayments[key] === 0) remainingDebt += MONTHLY_FEE;
        }
        // Meses de años anteriores
        Object.keys(newPayments).forEach(key => {
          if (newPayments[key] === 0 && !key.startsWith(`${cYear}-`)) remainingDebt += MONTHLY_FEE;
        });

        updatedAthlete.monthlyDebt = remainingDebt;
      } else if (paymentAmount > 0) {
        // Pagar por monto manual (aplica al primer mes adeudado)
        const monthsOwed = getMonthsOwed(updatedAthlete);
        if (monthsOwed.length > 0) {
          const firstOwed = monthsOwed[0];
          newPayments[firstOwed] = (newPayments[firstOwed] || 0) + paymentAmount;
          updatedAthlete.payments = newPayments;
          updatedAthlete.monthlyDebt = Math.max(0, updatedAthlete.monthlyDebt - paymentAmount);
        } else {
          alert("Sin adeudos mensuales pendientes.");
          return;
        }
      } else {
        alert("Seleccione meses a saldar o ingrese un monto.");
        return;
      }
    } else {
      updatedAthlete.physioDebt = Math.max(0, updatedAthlete.physioDebt - paymentAmount);
    }

    onUpdateAthlete(updatedAthlete);
    setShowPaymentModal(false);
    setSelectedAthlete(null);
    setSelectedMonthsToPay([]);
  };

  const toggleMonthSelection = (key: string) => {
    setSelectedMonthsToPay(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight italic uppercase">Módulo de Pagos</h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Control de Aranceles y Mensualidades</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
             <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
             <input type="text" placeholder="Buscar deportista..." className="pl-12 pr-4 py-3 rounded-2xl border border-slate-200 outline-none text-black font-bold focus:ring-2 focus:ring-red-900 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          {canEdit && (
            <button onClick={() => handleOpenPaymentModal()} className="bg-red-900 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-red-900/20 hover:bg-black transition">Registrar Cobro</button>
          )}
        </div>
      </header>

      <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-slate-100">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Deportista</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Adeudos por Mes/Año</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredAthletes.map(a => {
                const monthsOwed = getMonthsOwed(a);
                const hasPastYearDebt = monthsOwed.some(k => !k.startsWith(`${currentYear}-`));
                
                return (
                  <tr key={a.id} className="hover:bg-slate-50/30 transition">
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="font-black uppercase italic text-sm text-slate-800">{a.firstName} {a.lastName}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{a.category} • {a.isScholarship ? 'Becado' : 'Regular'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-wrap gap-1 max-w-sm">
                        {monthsOwed.length > 0 ? monthsOwed.map(key => {
                          const isOld = !key.startsWith(`${currentYear}-`);
                          return (
                            <span key={key} className={`${isOld ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-red-50 text-red-600 border-red-100'} px-2 py-0.5 rounded text-[8px] font-black uppercase border`}>
                              {key.split('-')[1]} {key.split('-')[0]}
                            </span>
                          );
                        }) : (
                          <span className="text-emerald-500 text-[10px] font-black uppercase italic"><i className="fas fa-check-circle mr-1"></i> Al Corriente</span>
                        )}
                        {a.physioDebt > 0 && (
                          <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[8px] font-black uppercase border border-emerald-100">
                            Fisio: ${a.physioDebt}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className={`font-black text-sm ${a.monthlyDebt + a.physioDebt > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                          ${(a.monthlyDebt + a.physioDebt).toLocaleString()}
                        </span>
                        {hasPastYearDebt && (
                          <span className="text-[7px] font-black text-amber-600 uppercase tracking-widest mt-1">Incluye Años Anteriores</span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      {canEdit ? (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleOpenAdjustmentModal(a)} className="bg-slate-100 p-2.5 rounded-xl hover:bg-slate-200 transition text-slate-400" title="Ajuste Manual Histórico"><i className="fas fa-calendar-alt"></i></button>
                          <button onClick={() => handleOpenPaymentModal(a)} className="bg-red-900 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase hover:bg-black transition shadow-lg shadow-red-900/10 tracking-widest">Cobrar</button>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 uppercase italic">Solo Lectura</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
      </div>

      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[95vh] flex flex-col">
            <div className="bg-red-900 p-8 text-white flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="text-xl font-black uppercase italic tracking-tighter">Caja de Cobro</h3>
                {selectedAthlete && <p className="text-[10px] font-bold text-red-300 uppercase tracking-widest mt-1">Recibiendo pago de: {selectedAthlete.firstName} {selectedAthlete.lastName}</p>}
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="text-white/40 hover:text-white transition text-2xl"><i className="fas fa-times"></i></button>
            </div>
            
            <div className="overflow-y-auto custom-scrollbar flex-grow bg-white">
              <form onSubmit={handlePaymentSubmit} className="p-10 space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Deportista*</label>
                  <select 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-black outline-none focus:ring-2 focus:ring-red-900 transition-all" 
                    value={selectedAthlete?.id || ''} 
                    onChange={(e) => {
                      const athlete = athletes.find(a => a.id === e.target.value);
                      setSelectedAthlete(athlete || null);
                      setSelectedMonthsToPay([]);
                    }} 
                    required
                  >
                    <option value="">-- Seleccionar Deportista --</option>
                    {athletes.map(a => (<option key={a.id} value={a.id}>{a.firstName} {a.lastName} ({a.category})</option>))}
                  </select>
                </div>

                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-6">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Concepto de Cobro</label>
                    <div className="flex bg-white p-1 rounded-xl border border-slate-200">
                      <button type="button" onClick={() => setPaymentType('monthly')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${paymentType === 'monthly' ? 'bg-red-900 text-white shadow-md' : 'text-slate-400'}`}>Mensualidad</button>
                      <button type="button" onClick={() => setPaymentType('physio')} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${paymentType === 'physio' ? 'bg-red-900 text-white shadow-md' : 'text-slate-400'}`}>Fisioterapia</button>
                    </div>
                  </div>

                  {paymentType === 'monthly' && selectedAthlete && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Meses Pendientes (Varios Años)</span>
                        <button type="button" onClick={handleSettleAll} className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg hover:bg-emerald-100 transition uppercase tracking-tighter">
                          <i className="fas fa-check-double mr-1"></i> Poner Cuenta al Corriente
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 custom-scrollbar">
                        {getMonthsOwed(selectedAthlete).map(key => {
                          const isOldYear = !key.startsWith(`${currentYear}-`);
                          return (
                            <button 
                              key={key} 
                              type="button" 
                              onClick={() => toggleMonthSelection(key)}
                              className={`p-3 rounded-xl border-2 text-[9px] font-black uppercase tracking-tight transition-all flex flex-col items-center justify-center gap-1 ${selectedMonthsToPay.includes(key) ? 'border-red-900 bg-red-900 text-white shadow-lg' : isOldYear ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-slate-200 bg-white text-slate-400'}`}
                            >
                              <span>{key.split('-')[1]}</span>
                              <span className="opacity-50 text-[7px]">{key.split('-')[0]}</span>
                            </button>
                          );
                        })}
                        {getMonthsOwed(selectedAthlete).length === 0 && (
                          <div className="col-span-full py-4 text-center text-[10px] font-bold text-emerald-600 uppercase italic">
                            ¡Ficha al corriente! No hay adeudos pendientes.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Total a Cobrar ($)</label>
                    <input 
                      type="number" 
                      className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-black text-2xl text-slate-800 focus:border-red-900 outline-none transition-all" 
                      value={selectedMonthsToPay.length > 0 && paymentType === 'monthly' ? selectedMonthsToPay.length * MONTHLY_FEE : (paymentAmount || '')} 
                      onChange={(e) => {
                        if (selectedMonthsToPay.length === 0 || paymentType === 'physio') {
                          setPaymentAmount(Number(e.target.value));
                        }
                      }} 
                      readOnly={selectedMonthsToPay.length > 0 && paymentType === 'monthly'}
                      required 
                    />
                    <p className="text-[8px] font-bold text-slate-400 uppercase italic tracking-widest ml-1">
                      {paymentType === 'monthly' ? `Se saldarán ${selectedMonthsToPay.length} meses seleccionados.` : 'Monto recibido por sesiones de fisioterapia.'}
                    </p>
                  </div>
                </div>

                <div className="pt-4">
                  <button type="submit" className="w-full bg-emerald-600 text-white py-5 rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-emerald-900/20 active:scale-95 transition-all">
                    Confirmar Transacción y Sellar Ficha
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showAdjustmentModal && selectedAthlete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-300 max-h-[95vh] flex flex-col">
            <div className="bg-slate-800 p-8 text-white flex justify-between items-center flex-shrink-0">
               <h3 className="text-xl font-black uppercase italic tracking-tighter">Ajuste de Adeudos Históricos</h3>
               <button onClick={() => setShowAdjustmentModal(false)} className="text-white/40 hover:text-white transition text-2xl"><i className="fas fa-times"></i></button>
            </div>
            <div className="p-10 space-y-8 overflow-y-auto custom-scrollbar flex-grow bg-white">
               <div className="flex items-center justify-between bg-slate-100 p-2 rounded-2xl">
                  <div className="flex gap-2">
                    {availableYears.map(year => (
                      <button key={year} onClick={() => setAdjustmentYear(year)} className={`px-6 py-2 rounded-xl text-xs font-black transition ${adjustmentYear === year ? 'bg-red-900 text-white shadow-md' : 'bg-white text-black'}`}>{year}</button>
                    ))}
                  </div>
               </div>
               <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                  {MONTHS.map(month => {
                    const key = `${adjustmentYear}-${month}`;
                    const isPaid = tempPayments[key] && tempPayments[key] > 0;
                    return (
                      <button key={month} onClick={() => toggleMonthStatus(month)} className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${isPaid ? 'bg-emerald-50 border-emerald-500' : 'bg-red-50 border-red-300'}`}>
                        <span className={`text-[9px] font-black uppercase ${isPaid ? 'text-emerald-700' : 'text-red-700'}`}>{month}</span>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition ${isPaid ? 'bg-emerald-500 text-white' : 'bg-red-100 text-red-400'}`}><i className={`fas ${isPaid ? 'fa-check' : 'fa-clock'} text-[10px]`}></i></div>
                        <span className={`text-[8px] font-bold ${isPaid ? 'text-emerald-500' : 'text-red-400'}`}>{isPaid ? 'PAGADO' : 'DEBE'}</span>
                      </button>
                    );
                  })}
               </div>
               <p className="text-[9px] text-slate-400 font-bold italic text-center">Haga clic en un mes para alternar entre Pagado y Adeudo.</p>
            </div>
            <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4 flex-shrink-0">
               <button onClick={saveAdjustment} className="flex-1 bg-red-900 text-white font-black py-4 rounded-2xl hover:bg-black transition uppercase text-xs tracking-widest">Sincronizar Historial</button>
               <button onClick={() => setShowAdjustmentModal(false)} className="px-8 bg-white border border-slate-200 text-slate-500 font-bold rounded-2xl hover:bg-slate-50 transition uppercase text-xs">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsPage;
