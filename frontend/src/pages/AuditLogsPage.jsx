import { useEffect, useState } from 'react';
import { ClipboardList, ShieldCheck } from 'lucide-react';
import api from '../services/api';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await api.get('/audit-logs');
        setLogs(response.data.logs || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load audit logs.');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600">Compliance & Security</span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Audit Trail</h1>
          <p className="text-xs text-slate-500 font-medium">Immutable log of security events, logins, and clinical data modifications.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/60 p-4">
          <h3 className="text-sm font-bold text-slate-900">Audit Trail History ({logs.length})</h3>
        </div>

        {error && <p role="alert" className="p-4 text-xs font-semibold text-rose-700 bg-rose-50">{error}</p>}

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading audit records...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="p-3">User ID</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Module</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {logs.length === 0 ? (
                  <tr><td colSpan="5" className="p-8 text-center text-slate-400">No audit records available.</td></tr>
                ) : (
                  logs.map((log, idx) => (
                    <tr key={log.log_id || idx} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-teal-700">{log.user_id}</td>
                      <td className="p-3">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-800">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500">{log.module}</td>
                      <td className="p-3 text-slate-600 max-w-xs truncate">{log.description}</td>
                      <td className="p-3 text-slate-400 font-mono text-[11px]">
                        {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
