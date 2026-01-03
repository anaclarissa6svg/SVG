
import React, { useState, useMemo } from 'react';
import { Athlete } from '../types';

interface PaymentsPageProps {
  athletes: Athlete[];
  onUpdateAthlete: (athlete: Athlete) => void;
}

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const MONTHLY_FEE = 500; // Monto estándar por mes

const PaymentsPage: React.FC<PaymentsPageProps> = ({ athletes, onUpdateAthlete }) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentType, setPaymentType] = useState<'monthly' | 'physio'>('monthly');
  const [searchTerm, setSearchTerm] = useState('');

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

    // Verificamos año actual
    for (let i = 0; i <= currentMonthIndex; i++) {
      const month = MONTHS[i];
      const key = `${cYear}-${month}`;
      if (!athlete.payments || !athlete.payments[key] || athlete.payments[key] === 0) {
        owed.push(month);
      }
    }
    
    // Verificamos años anteriores
    if (athlete.payments) {
        Object.keys(athlete.payments).forEach(key => {
            if (athlete.payments![key] === 0 && !key.startsWith(`${cYear}-`)) {
                owed.push(key.replace('-', ' '));
            }
        });
    }

    return owed;
  };

  const handleOpenPaymentModal = (athlete?: Athlete) => {
    if (athlete) {
      setSelectedAthlete(athlete);
    } else {
      setSelectedAthlete(null);
    }
    setPaymentAmount(0);
    setShowPaymentModal(true);
  };

  const handleOpenAdjustmentModal = (athlete: Athlete) => {
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
    if (!selectedAthlete) return;

    const now = new Date();
    const cYear = now.getFullYear();
    const currentMonthIndex = now.getMonth();
    let newMonthlyDebt = 0;
    
    if (!selectedAthlete.isScholarship) {
      for (let i = 0; i <= currentMonthIndex; i++) {
        const key = `${cYear}-${MONTHS[i]}`;
        if (!tempPayments[key] || tempPayments[key] === 0) {
          newMonthlyDebt += MONTHLY_FEE;
        }
      }
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

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAthlete) return;

    let updatedAthlete = { ...selectedAthlete };
    if (paymentType === 'monthly') {
      const monthsOwed = getMonthsOwed(updatedAthlete);
      if (monthsOwed.length > 0) {
        const firstOwed = monthsOwed[0];
        const key = firstOwed.includes(' ') ? firstOwed.replace(' ', '-') : `${currentYear}-${firstOwed}`;
        if (!updatedAthlete.payments) updatedAthlete.payments = {};
        updatedAthlete.payments[key] = (updatedAthlete.payments[key] || 0) + paymentAmount;
        updatedAthlete.monthlyDebt = Math.max(0, updatedAthlete.monthlyDebt - paymentAmount);
      } else {
        alert("Sin adeudos mensuales.");
        return;
      }
    } else {
      updatedAthlete.physioDebt = Math.max(0, updatedAthlete.physioDebt - paymentAmount);
    }

    onUpdateAthlete(updatedAthlete);
    setShowPaymentModal(false);
    setSelectedAthlete(null);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight italic uppercase">Módulo de Pagos</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
             <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
             <input type="text" placeholder="Buscar..." className="pl-12 pr-4 py-3 rounded-2xl border border-slate-200 outline-none text-black font-bold" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <button onClick={() => handleOpenPaymentModal()} className="bg-red-900 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest">Registrar Cobro</button>
        </div>
      </header>

      <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-slate-100">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Deportista</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Deuda</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredAthletes.map(a => (
                <tr key={a.id}>
                  <td className="px-8 py-5 font-black uppercase italic text-sm">{a.firstName} {a.lastName}</td>
                  <td className="px-8 py-5 font-black text-red-600">${a.monthlyDebt.toLocaleString()}</td>
                  <td className="px-8 py-5 text-right">
                    <button onClick={() => handleOpenAdjustmentModal(a)} className="bg-slate-100 p-2 rounded-xl mr-2"><i className="fas fa-cog"></i></button>
                    <button onClick={() => handleOpenPaymentModal(a)} className="bg-red-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase">Cobrar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
      </div>

      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[95vh] flex flex-col">
            <div className="bg-red-900 p-8 text-white flex justify-between items-center flex-shrink-0"><h3 className="text-xl font-black uppercase italic">Caja de Cobro</h3><button onClick={() => setShowPaymentModal(false)} className="text-white/40 hover:text-white transition text-2xl"><i className="fas fa-times"></i></button></div>
            <div className="overflow-y-auto custom-scrollbar flex-grow">
              <form onSubmit={handlePaymentSubmit} className="p-8 space-y-6">
                <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase">Deportista*</label><select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-black" value={selectedAthlete?.id || ''} onChange={(e) => setSelectedAthlete(athletes.find(a => a.id === e.target.value) || null)} required><option value="">-- Buscar --</option>{athletes.map(a => (<option key={a.id} value={a.id}>{a.firstName} {a.lastName}</option>))}</select></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase">Concepto</label><select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-black" value={paymentType} onChange={(e) => setPaymentType(e.target.value as any)}><option value="monthly">Mensualidad</option><option value="physio">Fisioterapia</option></select></div>
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase">Monto ($)</label><input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-black" value={paymentAmount || ''} onChange={(e) => setPaymentAmount(Number(e.target.value))} required /></div>
                </div>
                <button type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest">Confirmar Pago</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {showAdjustmentModal && selectedAthlete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-300 max-h-[95vh] flex flex-col">
            <div className="bg-slate-800 p-8 text-white flex justify-between items-center flex-shrink-0">
               <h3 className="text-xl font-black uppercase italic">Ajuste de Adeudos</h3>
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
            </div>
            <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4 flex-shrink-0">
               <button onClick={saveAdjustment} className="flex-1 bg-red-900 text-white font-black py-4 rounded-2xl hover:bg-black transition uppercase text-xs tracking-widest">Guardar</button>
               <button onClick={() => setShowAdjustmentModal(false)} className="px-8 bg-white border border-slate-200 text-slate-500 font-bold rounded-2xl hover:bg-slate-50 transition uppercase text-xs">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsPage;
