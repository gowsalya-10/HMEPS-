import { useEffect, useState } from 'react';
import api from '../services/api';

export default function ReportsPage() {
  const [errors, setErrors] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ start_date: '', end_date: '', severity: '', error_type: '', department: '' });

  const loadReports = async () => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });

    try {
      const [errorResponse, alertResponse] = await Promise.all([
        api.get(`/reports/errors?${params.toString()}`),
        api.get(`/reports/alerts?${params.toString()}`),
      ]);
      setErrors(errorResponse.data.records || []);
      setAlerts(alertResponse.data.records || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-2xl font-bold text-slate-900">Reports</h3>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-5">
          <input type="date" value={filters.start_date} onChange={(e) => setFilters({ ...filters, start_date: e.target.value })} className="rounded-xl border border-slate-300 px-3 py-2" />
          <input type="date" value={filters.end_date} onChange={(e) => setFilters({ ...filters, end_date: e.target.value })} className="rounded-xl border border-slate-300 px-3 py-2" />
          <select value={filters.severity} onChange={(e) => setFilters({ ...filters, severity: e.target.value })} className="rounded-xl border border-slate-300 px-3 py-2">
            <option value="">Severity</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
          <input placeholder="Error type" value={filters.error_type} onChange={(e) => setFilters({ ...filters, error_type: e.target.value })} className="rounded-xl border border-slate-300 px-3 py-2" />
          <input placeholder="Department" value={filters.department} onChange={(e) => setFilters({ ...filters, department: e.target.value })} className="rounded-xl border border-slate-300 px-3 py-2" />
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={loadReports} disabled={loading} className="rounded-xl bg-blue-600 px-4 py-2.5 font-medium text-white disabled:opacity-60">{loading ? 'Loading...' : 'Apply filters'}</button>
        </div>
      </div>
      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800"><p>{error}</p><button onClick={loadReports} className="mt-2 font-semibold underline">Retry</button></div>}

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4">
            <h4 className="text-lg font-semibold text-slate-800">Medical Errors</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Department</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan="3" className="px-4 py-6 text-center text-slate-500">Loading medical errors...</td></tr> : error ? <tr><td colSpan="3" className="px-4 py-6 text-center text-red-700">Report data is unavailable.</td></tr> : errors.length === 0 ? <tr><td colSpan="3" className="px-4 py-6 text-center text-slate-500">No medical errors match these filters.</td></tr> : errors.map((error, index) => (
                  <tr key={error._id || error.error_id || index} className="border-b border-slate-200">
                    <td className="px-4 py-3">{error.error_type}</td>
                    <td className="px-4 py-3">{error.severity}</td>
                    <td className="px-4 py-3">{error.department}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4">
            <h4 className="text-lg font-semibold text-slate-800">Safety Alerts</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3">Message</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Department</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan="3" className="px-4 py-6 text-center text-slate-500">Loading safety alerts...</td></tr> : error ? <tr><td colSpan="3" className="px-4 py-6 text-center text-red-700">Report data is unavailable.</td></tr> : alerts.length === 0 ? <tr><td colSpan="3" className="px-4 py-6 text-center text-slate-500">No safety alerts match these filters.</td></tr> : alerts.map((alert, index) => (
                  <tr key={alert._id || alert.alert_id || index} className="border-b border-slate-200">
                    <td className="px-4 py-3">{alert.message || alert.alert_type}</td>
                    <td className="px-4 py-3">{alert.severity}</td>
                    <td className="px-4 py-3">{alert.department}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
