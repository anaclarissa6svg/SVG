
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
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentType, setPaymentType] = useState<'monthly' | 'physio' | 'therapy_monthly'>('monthly');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedMonthsToPay, setSelectedMonthsToPay] = useState<string[]>([]);
  const canEdit = user.permissions.payments === 'edit';

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

    for (let i = 0; i <= currentMonthIndex; i++) {
      const month = MONTHS[i];
      const key = `${cYear}-${month}`;
      if (!athlete.payments || !athlete.payments[key] || athlete.payments[key] === 0) {
        owed.push(key);
      }
    }
    
    if (athlete.payments) {
        Object.keys(athlete.payments).forEach(key => {
            if (athlete.payments![key] === 0 && !key.startsWith(`${cYear}-`)) {
                owed.push(key);
            }
        });
    }

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
      // Si es becado, por defecto sugerir terapia mensual
      setPaymentType(athlete.isScholarship ? 'therapy_monthly' : 'monthly');
    } else {
      setSelectedAthlete(null);
      setSelectedMonthsToPay([]);
      setPaymentType('monthly');
    }
    setPaymentAmount(0);
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAthlete || !canEdit) return;

    let updatedAthlete = { ...selectedAthlete };
    const newPayments = { ...(updatedAthlete.payments || {}) };

    if (paymentType === 'monthly') {
      if (selectedMonthsToPay.length > 0) {
        selectedMonthsToPay.forEach(key => {
          newPayments[key] = MONTHLY_FEE;
        });
        updatedAthlete.payments = newPayments;
        
        const now = new Date();
        const cYear = now.getFullYear();
        const currentMonthIndex = now.getMonth();
        let remainingDebt = 0;

        for (let i = 0; i <= currentMonthIndex; i++) {
          const key = `${cYear}-${MONTHS[i]}`;
          if (!newPayments[key] || newPayments[key] === 0) remainingDebt += MONTHLY_FEE;
        }
        Object.keys(newPayments).forEach(key => {
          if (newPayments[key] === 0 && !key.startsWith(`${cYear}-`)) remainingDebt += MONTHLY_FEE;
        });

        updatedAthlete.monthlyDebt = remainingDebt;
      } else if (paymentAmount > 0) {
        const monthsOwed = getMonthsOwed(updatedAthlete);
        if (monthsOwed.length > 0) {
          const firstOwed = monthsOwed[0];
          newPayments[firstOwed] = (newPayments[firstOwed] || 0) + paymentAmount;
          updatedAthlete.payments = newPayments;
          updatedAthlete.monthlyDebt = Math.max(0, updatedAthlete.monthlyDebt - paymentAmount);
        }
      }
    } else if (paymentType === 'therapy_monthly') {
      updatedAthlete.monthlyTherapyDebt = Math.max(0, (updatedAthlete.monthlyTherapyDebt || 0) - paymentAmount);
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
    <div className="space-y-6 animate-in fade-in duration-500">
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
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Adeudos Pendientes</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Balance Total</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredAthletes.map(a => {
                const monthsOwed = getMonthsOwed(a);
                const totalDebt = (a.monthlyDebt || 0) + (a.physioDebt || 0) + (a.monthlyTherapyDebt || 0);
                
                return (
                  <tr key={a.id} className="hover:bg-slate-50/30 transition">
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="font-black uppercase italic text-sm text-slate-800">{a.firstName} {a.lastName}</span>
                        <div className="flex gap-2 mt-1">
                          {a.isScholarship && <span className="text-[8px] font-black bg-yellow-400 text-white px-2 py-0.5 rounded shadow-sm">BECADO</span>}
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{a.category}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-wrap gap-1 max-w-sm">
                        {monthsOwed.length > 0 && monthsOwed.map(key => (
                          <span key={key} className="bg-red-50 text-red-600 border-red-100 px-2 py-0.5 rounded text-[8px] font-black uppercase border">
                            {key.split('-')[1]}
                          </span>
                        ))}
                        {a.monthlyTherapyDebt > 0 && (
                          <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[8px] font-black uppercase border border-emerald-100">
                            Terapia Mensual: ${a.monthlyTherapyDebt}
                          </span>
                        )}
                        {a.physioDebt > 0 && (
                          <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[8px] font-black uppercase border border-emerald-100">
                            Fisio Sesión: ${a.physioDebt}
                          </span>
                        )}
                        {monthsOwed.length === 0 && a.monthlyTherapyDebt === 0 && a.physioDebt === 0 && (
                          <span className="text-emerald-500 text-[10px] font-black uppercase italic"><i className="fas fa-check-circle mr-1"></i> Al Corriente</span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`font-black text-sm ${totalDebt > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
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
          <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-red-900 p-8 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black uppercase italic tracking-tighter">Caja de Cobro</h3>
                <p className="text-[10px] font-bold text-red-300 uppercase tracking-widest mt-1">Deportista: {selectedAthlete.firstName} {selectedAthlete.lastName}</p>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="text-white/40 hover:text-white transition text-2xl"><i className="fas fa-times"></i></button>
            </div>
            
            <form onSubmit={handlePaymentSubmit} className="p-10 space-y-8 bg-white">
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-6">
                <div className="flex flex-col gap-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Concepto de Cobro</label>
                  <div className="grid grid-cols-3 gap-2 bg-white p-1 rounded-xl border border-slate-200">
                    {!selectedAthlete.isScholarship && (
                      <button type="button" onClick={() => setPaymentType('monthly')} className={`px-2 py-2 rounded-lg text-[8px] font-black uppercase transition-all ${paymentType === 'monthly' ? 'bg-red-900 text-white shadow-md' : 'text-slate-400'}`}>Mensualidad</button>
                    )}
                    <button type="button" onClick={() => setPaymentType('therapy_monthly')} className={`px-2 py-2 rounded-lg text-[8px] font-black uppercase transition-all ${paymentType === 'therapy_monthly' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400'}`}>Terapia Mensual</button>
                    <button type="button" onClick={() => setPaymentType('physio')} className={`px-2 py-2 rounded-lg text-[8px] font-black uppercase transition-all ${paymentType === 'physio' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400'}`}>Sesión Fisio</button>
                  </div>
                </div>

                {paymentType === 'monthly' && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Seleccionar Meses</label>
                    <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto custom-scrollbar p-1">
                      {getMonthsOwed(selectedAthlete).map(key => (
                        <button key={key} type="button" onClick={() => toggleMonthSelection(key)} className={`p-3 rounded-xl border-2 text-[9px] font-black uppercase transition-all ${selectedMonthsToPay.includes(key) ? 'border-red-900 bg-red-900 text-white shadow-lg' : 'border-slate-200 bg-white text-slate-400'}`}>
                          {key.split('-')[1]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Monto a Recibir ($)</label>
                  <input 
                    type="number" 
                    className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-black text-2xl text-slate-800 focus:border-red-900 outline-none transition-all" 
                    value={selectedMonthsToPay.length > 0 && paymentType === 'monthly' ? selectedMonthsToPay.length * MONTHLY_FEE : (paymentAmount || '')} 
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    readOnly={selectedMonthsToPay.length > 0 && paymentType === 'monthly'}
                    required 
                  />
                  <p className="text-[8px] font-bold text-slate-400 uppercase italic tracking-widest ml-1">
                    {paymentType === 'therapy_monthly' ? 'Pago correspondiente a la cuota fija mensual de terapia para becados/regulares.' : 'Pago de sesión única de rehabilitación.'}
                  </p>
                </div>
              </div>

              <button type="submit" className="w-full bg-emerald-600 text-white py-5 rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-emerald-900/20 active:scale-95 transition-all">
                Registrar Ingreso
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsPage;
