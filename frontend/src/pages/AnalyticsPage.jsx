import { useEffect, useState } from 'react';
import { Activity, AlertTriangle, BriefcaseMedical, Calendar, FileText, Heart, ShieldAlert, Stethoscope, Users } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../services/api';

const COLORS = ['#0d9488', '#0284c7', '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b'];

export default function AnalyticsPage() {
  const [overview, setOverview] = useState(null);
  const [errorSeries, setErrorSeries] = useState([]);
  const [alertSeries, setAlertSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const [overviewResponse, errorsResponse, alertsResponse] = await Promise.all([
        api.get('/analytics/overview'),
        api.get('/analytics/errors'),
        api.get('/analytics/alerts'),
      ]);
      setOverview(overviewResponse.data.summary);
      setErrorSeries(errorsResponse.data.data || []);
      setAlertSeries(alertsResponse.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load medical safety analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3 text-slate-500 font-medium text-xs">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
          Loading safety telemetry analytics...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
        <p className="font-semibold text-sm">{error}</p>
        <button onClick={fetchAnalytics} className="mt-3 text-xs font-bold text-teal-700 underline">
          Retry Analytics Query
        </button>
      </div>
    );
  }

  const kpis = [
    { label: 'Total Patients', value: overview?.total_patients || 0, icon: Users, color: 'text-teal-600' },
    { label: 'Total Encounters', value: overview?.total_encounters || 0, icon: Stethoscope, color: 'text-sky-600' },
    { label: 'Vital Signs Records', value: overview?.total_vitals || 0, icon: Heart, color: 'text-rose-600' },
    { label: 'Lab Reports', value: overview?.total_labs || 0, icon: FileText, color: 'text-indigo-600' },
    { label: 'Diagnosed Conditions', value: overview?.total_conditions || 0, icon: Activity, color: 'text-amber-600' },
    { label: 'Active Appointments', value: overview?.total_appointments || 0, icon: Calendar, color: 'text-emerald-600' },
  ];

  return (
    <div className="space-y-8">
      {/* Page Title Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600">Clinical Telemetry</span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Medical Safety & Clinical Analytics</h1>
          <p className="text-xs text-slate-500">Real-time database analysis of encounters, vitals, labs, and diagnoses.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{value.toLocaleString()}</p>
              </div>
              <div className={`rounded-xl border border-slate-100 bg-slate-50 p-3 ${color}`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Encounter Timeline */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-1">Monthly Encounter Volume</h3>
          <p className="text-xs text-slate-500 mb-4">Historical trend of patient consultations</p>
          <div className="h-72">
            {errorSeries.length === 0 ? (
              <p className="flex h-full items-center justify-center text-xs text-slate-400">No trend data available.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={errorSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                  <Line type="monotone" dataKey="value" stroke="#0d9488" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Allergy Distribution */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-1">Top Patient Allergies</h3>
          <p className="text-xs text-slate-500 mb-4">Prevalence of common allergen sensitivities</p>
          <div className="h-72 flex items-center justify-center">
            {alertSeries.length === 0 ? (
              <p className="text-xs text-slate-400">No allergy frequency data available.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={alertSeries}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {alertSeries.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
