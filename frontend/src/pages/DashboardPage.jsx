import { useEffect, useState } from 'react';
import { AlertTriangle, Activity, FileText, ShieldAlert, Stethoscope, Users } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../services/api';

const cardConfig = [
  { key: 'total_patients', label: 'Total Patients', icon: Users, bg: 'bg-blue-100 text-blue-700' },
  { key: 'total_doctors', label: 'Total Doctors', icon: Stethoscope, bg: 'bg-cyan-100 text-cyan-700' },
  { key: 'total_nurses', label: 'Total Nurses', icon: ShieldAlert, bg: 'bg-emerald-100 text-emerald-700' },
  { key: 'total_pharmacists', label: 'Total Pharmacists', icon: Activity, bg: 'bg-violet-100 text-violet-700' },
  { key: 'total_prescriptions', label: 'Total Prescriptions', icon: FileText, bg: 'bg-amber-100 text-amber-700' },
  { key: 'active_safety_alerts', label: 'Active Safety Alerts', icon: AlertTriangle, bg: 'bg-rose-100 text-rose-700' },
  { key: 'critical_alerts', label: 'Critical Alerts', icon: AlertTriangle, bg: 'bg-red-200 text-red-700' },
  { key: 'medical_errors_detected', label: 'Medical Errors Detected', icon: Activity, bg: 'bg-slate-200 text-slate-700' },
];

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const result = await api.get('/analytics/overview');
        setData(result.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load dashboard metrics');
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  if (loading) return <div className="rounded-2xl bg-white p-8 text-center shadow-sm">Loading dashboard...</div>;
  if (error) return <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-red-700">{error}</div>;
  if (!data) return <div className="rounded-2xl bg-white p-8 text-center shadow-sm">No data available.</div>;

  const summary = data.summary;
  const chartData = data.charts;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Overview</p>
          <h3 className="text-3xl font-bold text-slate-900">Administration Dashboard</h3>
        </div>
        <div className="rounded-xl bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
          Error Detection Rate: {summary.error_detection_rate}%
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cardConfig.map(({ key, label, icon: Icon, bg }) => (
          <div key={key} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-3 text-3xl font-bold text-slate-900">{summary[key]}</p>
              </div>
              <div className={`rounded-xl p-3 ${bg}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h4 className="mb-4 text-lg font-semibold text-slate-800">Errors by Type</h4>
          <div className="h-72">
            {chartData.errors_by_type.length === 0 ? <p className="flex h-full items-center justify-center text-sm text-slate-500">No medical error records available.</p> : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.errors_by_type}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h4 className="mb-4 text-lg font-semibold text-slate-800">Alerts by Severity</h4>
          <div className="h-72">
            {chartData.alerts_by_severity.length === 0 ? <p className="flex h-full items-center justify-center text-sm text-slate-500">No safety alert records available.</p> : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.alerts_by_severity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#f97316" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h4 className="mb-4 text-lg font-semibold text-slate-800">Prescriptions over Time</h4>
          <div className="h-72">
            {chartData.prescriptions_over_time.length === 0 ? <p className="flex h-full items-center justify-center text-sm text-slate-500">No prescription records available.</p> : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.prescriptions_over_time}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h4 className="mb-4 text-lg font-semibold text-slate-800">User Activity</h4>
          <div className="h-72">
            {chartData.user_activity.length === 0 ? <p className="flex h-full items-center justify-center text-sm text-slate-500">No user activity available.</p> : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.user_activity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
