
import React, { useState } from 'react';
import { Athlete } from '../types';
import * as XLSX from 'https://esm.sh/xlsx@0.18.5';

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
    const workbook = generateWorkbook();
    XLSX.writeFile(workbook, `Base_Pagos_Detallada_Savage_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`);
  };

  const saveToDrive = async () => {
    setIsUploading(true);
    try {
      const workbook = generateWorkbook();
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      const fileName = `Base_Pagos_Savage_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`;

      // Flujo de Autenticación con Google GIS
      const client = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: 'TU_CLIENT_ID_DE_GOOGLE.apps.googleusercontent.com', // Requiere configuración en Google Cloud Console
        scope: 'https://www.googleapis.com/auth/drive.file',
        callback: async (response: any) => {
          if (response.error) {
            alert('Error de autenticación con Google');
            setIsUploading(false);
            return;
          }

          const metadata = {
            name: fileName,
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          };

          const form = new FormData();
          form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
          form.append('file', blob);

          const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: { Authorization: `Bearer ${response.access_token}` },
            body: form,
          });

          if (uploadResponse.ok) {
            alert('¡Archivo guardado exitosamente en tu Google Drive!');
          } else {
            const err = await uploadResponse.json();
            console.error(err);
            alert('Error al subir el archivo a Drive.');
          }
          setIsUploading(false);
        },
      });

      client.requestAccessToken();
    } catch (error) {
      console.error(error);
      alert('Error en el proceso de guardado.');
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center">
            <i className="fas fa-file-invoice-dollar text-red-600 mr-3"></i>
            Base de Datos: Pagos Mensuales ({currentYear})
          </h1>
          <p className="text-slate-500 text-sm">Registro histórico de montos por mes y deportista</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={saveToDrive}
            disabled={isUploading}
            className="bg-white border-2 border-red-900 text-red-900 px-6 py-3 rounded-2xl font-black hover:bg-red-50 transition flex items-center shadow-lg shadow-red-900/10 uppercase text-xs tracking-widest disabled:opacity-50"
          >
            <i className={`fab fa-google-drive mr-2 ${isUploading ? 'animate-spin' : ''}`}></i>
            {isUploading ? 'Subiendo...' : 'Guardar en Drive'}
          </button>
          <button 
            onClick={exportToExcel}
            className="bg-red-900 text-white px-6 py-3 rounded-2xl font-black hover:bg-black transition flex items-center shadow-lg shadow-red-900/10 uppercase text-xs tracking-widest"
          >
            <i className="fas fa-file-export mr-2"></i> Descargar Excel
          </button>
        </div>
      </header>

      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse table-auto min-w-[1200px]">
            <thead>
              <tr className="bg-slate-800 text-white">
                <th className="px-3 py-3 text-[9px] font-black uppercase tracking-widest border border-slate-700 sticky left-0 bg-slate-800 z-10">Deportista</th>
                <th className="px-3 py-3 text-[9px] font-black uppercase tracking-widest border border-slate-700">Coach</th>
                {MONTHS.map(month => (
                  <th key={month} className="px-3 py-3 text-[9px] font-black uppercase tracking-widest border border-slate-700 text-center">
                    {month}
                  </th>
                ))}
                <th className="px-3 py-3 text-[9px] font-black uppercase tracking-widest border border-slate-700 text-right">Deuda</th>
                <th className="px-3 py-3 text-[9px] font-black uppercase tracking-widest border border-slate-700 text-center">Beca</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {athletes.map((a, idx) => (
                <tr key={a.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-red-50/10'}>
                  <td className="px-3 py-3 border border-slate-100 sticky left-0 bg-inherit z-10">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-800 uppercase leading-none">{a.firstName} {a.lastName}</span>
                      <span className="text-[8px] font-bold text-red-500 uppercase mt-1">{a.category}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-[10px] font-bold text-slate-500 border border-slate-100 italic">
                    {a.coachName || 'N/A'}
                  </td>
                  {MONTHS.map(month => {
                    const key = `${currentYear}-${month}`;
                    const amount = a.payments?.[key] || 0;
                    return (
                      <td key={month} className={`px-3 py-3 text-center border border-slate-100 text-[10px] font-bold ${amount > 0 ? 'text-emerald-600 bg-emerald-50/30' : 'text-slate-300'}`}>
                        {amount > 0 ? `$${amount}` : '-'}
                      </td>
                    );
                  })}
                  <td className="px-3 py-3 text-right border border-slate-100">
                    <span className={`text-[10px] font-black ${(a.monthlyDebt + a.physioDebt) > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      ${(a.monthlyDebt + a.physioDebt).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center border border-slate-100">
                    {a.isScholarship ? (
                      <span className="text-[8px] font-black bg-yellow-400 text-white px-1.5 py-0.5 rounded shadow-sm">SI</span>
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
