import React, { useState } from 'react';
import { Athlete } from '../types';
import * as XLSX from 'https://esm.sh/xlsx@0.18.5';

interface DatabasePhysioProps {
  athletes: Athlete[];
}

const DatabasePhysio: React.FC<DatabasePhysioProps> = ({ athletes }) => {
  const [isUploading, setIsUploading] = useState(false);

  // Aplanar todas las consultas
  const records = athletes.flatMap(athlete => 
    athlete.physioConsultations.map(c => ({
      ...c,
      athleteName: `${athlete.firstName} ${athlete.lastName}`,
      category: athlete.category
    }))
  ).sort((a, b) => new Date(b.date.split('/').reverse().join('-')).getTime() - new Date(a.date.split('/').reverse().join('-')).getTime());

  const generateWorkbook = () => {
    const data = records.map(r => ({
      'Fecha': r.date,
      'Deportista': r.athleteName,
      'Categoria': r.category,
      'Diagnostico': r.diagnosis,
      'Tratamiento': r.treatment,
      'Observaciones': r.observations,
      'Especialista': r.createdBy
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Fisioterapia");
    return workbook;
  };

  const exportToExcel = () => {
    const workbook = generateWorkbook();
    XLSX.writeFile(workbook, `Reporte_Fisioterapia_Savage_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`);
  };

  const saveToDrive = async () => {
    setIsUploading(true);
    try {
      const workbook = generateWorkbook();
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      const fileName = `Reporte_Fisioterapia_Savage_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`;

      const client = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: 'TU_CLIENT_ID_DE_GOOGLE.apps.googleusercontent.com',
        scope: 'https://www.googleapis.com/auth/drive.file',
        callback: async (response: any) => {
          if (response.error) {
            alert('Error de autenticación');
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
            alert('¡Reporte guardado en tu Drive!');
          } else {
            alert('Error al subir a Drive.');
          }
          setIsUploading(false);
        },
      });

      client.requestAccessToken();
    } catch (error) {
      console.error(error);
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center">
            <i className="fas fa-file-excel text-emerald-600 mr-3"></i>
            Base de Datos: Fisioterapia
          </h1>
          <p className="text-slate-500 text-sm">Vista consolidada de intervenciones clínicas</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={saveToDrive}
            disabled={isUploading}
            className="bg-white border-2 border-emerald-600 text-emerald-600 px-6 py-3 rounded-2xl font-black hover:bg-emerald-50 transition flex items-center shadow-lg shadow-emerald-900/10 uppercase text-xs tracking-widest disabled:opacity-50"
          >
            <i className={`fab fa-google-drive mr-2 ${isUploading ? 'animate-spin' : ''}`}></i>
            {isUploading ? 'Sincronizando...' : 'Guardar en Drive'}
          </button>
          <button 
            onClick={exportToExcel}
            className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black hover:bg-emerald-700 transition flex items-center shadow-lg shadow-emerald-900/10 uppercase text-xs tracking-widest"
          >
            <i className="fas fa-download mr-2"></i> Exportar Excel
          </button>
        </div>
      </header>

      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-800 text-white">
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest border border-slate-700">Fecha</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest border border-slate-700">Deportista</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest border border-slate-700">Categoría</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest border border-slate-700">Diagnóstico</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest border border-slate-700">Tratamiento</th>
                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest border border-slate-700">Especialista</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((r, idx) => (
                <tr key={r.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                  <td className="px-4 py-3 text-xs font-bold text-slate-500 border border-slate-100">{r.date}</td>
                  <td className="px-4 py-3 text-xs font-black text-slate-800 border border-slate-100 uppercase">{r.athleteName}</td>
                  <td className="px-4 py-3 text-[10px] font-bold text-red-600 border border-slate-100">{r.category}</td>
                  <td className="px-4 py-3 text-xs text-slate-600 border border-slate-100">{r.diagnosis}</td>
                  <td className="px-4 py-3 text-xs text-slate-600 border border-slate-100">{r.treatment}</td>
                  <td className="px-4 py-3 text-[10px] font-black text-slate-400 border border-slate-100 uppercase">{r.createdBy}</td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-slate-400 italic font-medium">No hay registros disponibles para exportar.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DatabasePhysio;