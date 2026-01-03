
import React from 'react';
import { AuditEntry } from '../types';

interface AuditLogPageProps {
  logs: AuditEntry[];
}

const AuditLogPage: React.FC<AuditLogPageProps> = ({ logs }) => {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-gray-800">Bitácora de Auditoría</h1>
        <p className="text-gray-500">Historial completo de acciones y cambios en el sistema</p>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Usuario</th>
                <th className="px-6 py-4">Acción</th>
                <th className="px-6 py-4">Entidad</th>
                <th className="px-6 py-4">ID Destino</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50 transition text-sm">
                  <td className="px-6 py-4 font-mono text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">
                        {log.userName.charAt(0)}
                      </div>
                      <span className="font-semibold text-slate-700">{log.userName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{log.action}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">{log.targetType}</td>
                  <td className="px-6 py-4 text-slate-400 text-xs font-mono">{log.targetId}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-24 text-slate-400 italic">No hay registros de auditoría aún.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLogPage;
