import { useEffect, useState } from 'react';
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

  if (loading) return <div className="rounded-2xl bg-white p-8 text-center shadow-sm">Loading audit logs...</div>;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-5">
        <h3 className="text-2xl font-bold text-slate-900">Audit Logs</h3>
      </div>
      {error && <p role="alert" className="p-4 text-red-700">{error}</p>}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Module</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {!error && logs.length === 0 ? <tr><td colSpan="5" className="px-4 py-6 text-center text-slate-500">No audit records available.</td></tr> : logs.map((log) => (
              <tr key={log.log_id}>
                <td className="px-4 py-3">{log.user_id}</td>
                <td className="px-4 py-3">{log.action}</td>
                <td className="px-4 py-3">{log.module}</td>
                <td className="px-4 py-3 text-slate-600">{log.description}</td>
                <td className="px-4 py-3 text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
