
import React, { useState } from 'react';
import { Athlete } from '../types';
import * as XLSX from 'xlsx';
import { GoogleGenAI } from "@google/genai";

interface DatabasePhysioProps {
  athletes: Athlete[];
}

const DatabasePhysio: React.FC<DatabasePhysioProps> = ({ athletes }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  // Aplanar todas las consultas
  const records = athletes.flatMap(athlete => 
    athlete.physioConsultations.map(c => ({
      ...c,
      athleteName: `${athlete.firstName} ${athlete.lastName}`,
      category: athlete.category
    }))
  ).sort((a, b) => new Date(a.date.split('/').reverse().join('-')).getTime() - new Date(b.date.split('/').reverse().join('-')).getTime());

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
    try {
      const workbook = generateWorkbook();
      XLSX.writeFile(workbook, `Reporte_Fisioterapia_Savage_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`);
    } catch (error) {
      alert("Error al generar el archivo Excel local.");
    }
  };

  const analyzeWithAI = async () => {
    if (records.length === 0) return;
    setIsAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const dataSummary = records.slice(0, 20).map(r => `${r.athleteName}: ${r.diagnosis}`).join(', ');
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analiza este resumen de fisioterapia de una academia de fútbol y genera un informe ejecutivo breve con tendencias de lesiones y recomendaciones: ${dataSummary}`,
      });
      setAiAnalysis(response.text || "No se pudo generar el análisis.");
    } catch (error) {
      console.error(error);
      setAiAnalysis("Error al conectar con la IA para el análisis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveToDrive = async () => {
    const CLIENT_ID = 'TU_CLIENT_ID_DE_GOOGLE.apps.googleusercontent.com'; // REEMPLAZAR CON CLIENT ID REAL
    
    if (CLIENT_ID.includes('TU_CLIENT_ID')) {
      alert('CONFIGURACIÓN REQUERIDA: Para guardar directamente en Google Drive o OneDrive, el administrador debe configurar un Client ID real en el código. Por ahora, use "Exportar Excel" para descargar el archivo a su dispositivo.');
      return;
    }

    setIsUploading(true);
    // ... resto de la lógica de OAuth ...
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center italic uppercase tracking-tighter">
            <i className="fas fa-file-medical text-emerald-600 mr-3"></i>
            Base Consolidada Fisio
          </h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Histórico de intervenciones clínicas</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={analyzeWithAI}
            disabled={isAnalyzing || records.length === 0}
            className="bg-slate-900 text-white px-5 py-3 rounded-2xl font-black hover:bg-black transition flex items-center shadow-lg uppercase text-[10px] tracking-widest disabled:opacity-50"
          >
            <i className={`fas fa-robot mr-2 ${isAnalyzing ? 'fa-spin' : ''}`}></i>
            {isAnalyzing ? 'Analizando...' : 'Análisis IA'}
          </button>
          <button 
            onClick={saveToDrive}
            className="bg-white border-2 border-slate-200 text-slate-400 px-5 py-3 rounded-2xl font-black hover:bg-slate-50 transition flex items-center uppercase text-[10px] tracking-widest"
          >
            <i className="fab fa-google-drive mr-2"></i>
            Guardar en Nube
          </button>
          <button 
            onClick={exportToExcel}
            className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black hover:bg-emerald-700 transition flex items-center shadow-xl shadow-emerald-900/20 uppercase text-[10px] tracking-widest"
          >
            <i className="fas fa-download mr-2"></i> Descargar Excel
          </button>
        </div>
      </header>

      {aiAnalysis && (
        <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-[2rem] animate-in zoom-in duration-300 relative">
          <button onClick={() => setAiAnalysis(null)} className="absolute top-4 right-4 text-emerald-400 hover:text-emerald-600"><i className="fas fa-times-circle"></i></button>
          <h4 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-3 flex items-center"><i className="fas fa-sparkles mr-2"></i> Informe Ejecutivo de la IA</h4>
          <p className="text-xs text-emerald-900 font-medium leading-relaxed whitespace-pre-wrap italic">{aiAnalysis}</p>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-800 text-white">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest border border-slate-700">Fecha</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest border border-slate-700">Deportista</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest border border-slate-700">Categoría</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest border border-slate-700">Diagnóstico</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest border border-slate-700">Tratamiento</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest border border-slate-700">Especialista</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((r, idx) => (
                <tr key={r.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50 hover:bg-emerald-50/30 transition'}>
                  <td className="px-6 py-4 text-xs font-bold text-slate-500 border border-slate-50">{r.date}</td>
                  <td className="px-6 py-4 text-xs font-black text-slate-800 border border-slate-50 uppercase italic">{r.athleteName}</td>
                  <td className="px-6 py-4 text-[10px] font-black text-red-600 border border-slate-50 uppercase">{r.category}</td>
                  <td className="px-6 py-4 text-xs text-slate-600 border border-slate-50 font-medium">{r.diagnosis}</td>
                  <td className="px-6 py-4 text-xs text-slate-600 border border-slate-50 font-medium">{r.treatment}</td>
                  <td className="px-6 py-4 text-[10px] font-black text-slate-400 border border-slate-50 uppercase">{r.createdBy}</td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-32 text-center text-slate-300 italic font-black uppercase tracking-widest">No hay registros clínicos para mostrar</td>
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
