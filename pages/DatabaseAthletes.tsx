
import React, { useState } from 'react';
import { Athlete } from '../types';
import * as XLSX from 'xlsx';

interface DatabaseAthletesProps {
  athletes: Athlete[];
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DatabaseAthletes: React.FC<DatabaseAthletesProps> = ({ athletes }) => {
  const [isUploading, setIsUploading] = useState(false);
  const currentYear = new Date().getFullYear();

  const generateWorkbook = () => {
    const data = athletes.map(a => {
      const athleteData: any = {
        'ID': a.id,
        'Nombre Completo': `${a.firstName} ${a.lastName}`,
        'Categoria': a.category,
        'Coach': a.coachName || 'Sin Asignar'
      };

      MONTHS.forEach(m => {
        const key = `${currentYear}-${m}`;
        athleteData[m] = a.payments?.[key] || 0;
      });

      athleteData['Adeudo Mensual Total'] = a.monthlyDebt;
      athleteData['Adeudo Fisio'] = a.physioDebt;
      athleteData['Es Becado'] = a.isScholarship ? 'SI' : 'NO';

      return athleteData;
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pagos");
    return workbook;
  };

  const exportToExcel = () => {
    try {
      const workbook = generateWorkbook();
      XLSX.writeFile(workbook, `Base_Pagos_Savage_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`);
    } catch (e) {
      alert("Error al descargar el archivo Excel.");
    }
  };

  const saveToDrive = async () => {
    const CLIENT_ID = 'TU_CLIENT_ID_DE_GOOGLE.apps.googleusercontent.com';
    
    if (CLIENT_ID.includes('TU_CLIENT_ID')) {
      alert('CONFIGURACIÓN DE NUBE: Para usar OneDrive o Google Drive, se requiere una clave API activa. Por seguridad, utilice "Descargar Excel" para obtener su reporte ahora mismo.');
      return;
    }

    setIsUploading(true);
    // ... lógica OAuth ...
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center italic uppercase tracking-tighter">
            <i className="fas fa-file-invoice-dollar text-red-600 mr-3"></i>
            Base Financiera {currentYear}
          </h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Sincronización detallada de ingresos y becas</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={saveToDrive}
            disabled={isUploading}
            className="bg-white border-2 border-slate-200 text-slate-400 px-6 py-3 rounded-2xl font-black hover:bg-slate-50 transition flex items-center uppercase text-[10px] tracking-widest"
          >
            <i className="fab fa-google-drive mr-2"></i>
            Nube
          </button>
          <button 
            onClick={exportToExcel}
            className="bg-red-900 text-white px-8 py-3 rounded-2xl font-black hover:bg-black transition flex items-center shadow-xl shadow-red-900/20 uppercase text-[10px] tracking-widest"
          >
            <i className="fas fa-file-export mr-2"></i> Descargar Excel
          </button>
        </div>
      </header>

      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse table-auto min-w-[1400px]">
            <thead>
              <tr className="bg-slate-800 text-white">
                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest border border-slate-700 sticky left-0 bg-slate-800 z-10 shadow-lg">Deportista</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest border border-slate-700">Coach</th>
                {MONTHS.map(month => (
                  <th key={month} className="px-4 py-4 text-[9px] font-black uppercase tracking-widest border border-slate-700 text-center">
                    {month}
                  </th>
                ))}
                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest border border-slate-700 text-right">Deuda</th>
                <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest border border-slate-700 text-center">Beca</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {athletes.map((a, idx) => (
                <tr key={a.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-red-50/10 hover:bg-red-50/20 transition'}>
                  <td className="px-4 py-4 border border-slate-100 sticky left-0 bg-inherit z-10 shadow-sm">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-800 uppercase leading-none italic">{a.firstName} {a.lastName}</span>
                      <span className="text-[8px] font-bold text-red-500 uppercase mt-1 tracking-tighter">{a.category}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-[10px] font-bold text-slate-500 border border-slate-100 italic">
                    {a.coachName || 'N/A'}
                  </td>
                  {MONTHS.map(month => {
                    const key = `${currentYear}-${month}`;
                    const amount = a.payments?.[key] || 0;
                    return (
                      <td key={month} className={`px-4 py-4 text-center border border-slate-100 text-[10px] font-black ${amount > 0 ? 'text-emerald-600 bg-emerald-50/30' : 'text-slate-300'}`}>
                        {amount > 0 ? `$${amount}` : '-'}
                      </td>
                    );
                  })}
                  <td className="px-4 py-4 text-right border border-slate-100">
                    <span className={`text-[11px] font-black ${(a.monthlyDebt + a.physioDebt) > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      ${(a.monthlyDebt + a.physioDebt).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center border border-slate-100">
                    {a.isScholarship ? (
                      <span className="text-[8px] font-black bg-yellow-400 text-white px-2 py-0.5 rounded shadow-sm">SI</span>
                    ) : (
                      <span className="text-[8px] font-black text-slate-300">NO</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DatabaseAthletes;
