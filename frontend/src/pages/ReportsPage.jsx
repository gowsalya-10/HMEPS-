import { useEffect, useState } from 'react';
import { Download, FileText, Filter, RefreshCw, Search } from 'lucide-react';
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
      setError(err.response?.data?.message || 'Unable to load report telemetry data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600">Compliance & Safety</span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Medical Error & Safety Reports</h1>
          <p className="text-xs text-slate-500">Filter, inspect, and export clinical error telemetry and safety events.</p>
        </div>
      </div>

      {/* Filter Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 pb-2 border-b border-slate-100">
          <Filter className="h-4 w-4 text-teal-600" /> Filter Criteria
        </div>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-5 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">End Date</label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Severity</label>
            <select
              value={filters.severity}
              onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
            >
              <option value="">All Severities</option>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Error Type</label>
            <input
              placeholder="e.g. Dosage, Allergy"
              value={filters.error_type}
              onChange={(e) => setFilters({ ...filters, error_type: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Department</label>
            <input
              placeholder="e.g. Pharmacy, ICU"
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 focus:border-teal-500 focus:outline-none"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={loadReports}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-500 transition disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Processing...' : 'Apply Filters'}
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-800">
          <p>{error}</p>
          <button onClick={loadReports} className="mt-2 font-bold underline">Retry Report Query</button>
        </div>
      )}

      {/* Reports Tables */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Errors Table */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/60 p-4">
            <h3 className="text-sm font-bold text-slate-900">Medical Errors Log ({errors.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="p-3">Error Type</th>
                  <th className="p-3">Severity</th>
                  <th className="p-3">Department</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {loading ? (
                  <tr><td colSpan="3" className="p-6 text-center text-slate-400">Loading error log...</td></tr>
                ) : errors.length === 0 ? (
                  <tr><td colSpan="3" className="p-6 text-center text-slate-400">No medical errors found for these filters.</td></tr>
                ) : (
                  errors.map((item, idx) => (
                    <tr key={item._id || idx} className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-slate-900">{item.error_type}</td>
                      <td className="p-3">
                        <span className="rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
                          {item.severity}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500">{item.department || 'General'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Safety Alerts Table */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/60 p-4">
            <h3 className="text-sm font-bold text-slate-900">Safety Telemetry Alerts ({alerts.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="p-3">Alert Description</th>
                  <th className="p-3">Severity</th>
                  <th className="p-3">Department</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {loading ? (
                  <tr><td colSpan="3" className="p-6 text-center text-slate-400">Loading safety alerts...</td></tr>
                ) : alerts.length === 0 ? (
                  <tr><td colSpan="3" className="p-6 text-center text-slate-400">No safety alerts match these filters.</td></tr>
                ) : (
                  alerts.map((item, idx) => (
                    <tr key={item._id || idx} className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-slate-900">{item.message || item.alert_type}</td>
                      <td className="p-3">
                        <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                          {item.severity}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500">{item.department || 'Clinical'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
