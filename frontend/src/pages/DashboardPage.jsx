import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Activity,
  AlertTriangle,
  Calendar,
  ClipboardList,
  FileText,
  Heart,
  Plus,
  ShieldCheck,
  Stethoscope,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import api from '../services/api';

const COLORS = ['#0d9488', '#0284c7', '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b'];

export default function DashboardPage() {
  const { user } = useAuth();
  const role = user?.role || 'UNKNOWN';

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

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3 text-slate-500 font-medium">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
          Loading clinical dashboard...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 font-medium">
        {error}
      </div>
    );
  }

  const summary = data?.summary || {};
  const charts = data?.charts || {};

  const kpiMap = {
    patients: { label: 'Total Patients', value: summary.total_patients || 0, icon: Users, color: 'text-teal-600', bg: 'bg-teal-50 border-teal-200' },
    encounters: { label: 'Total Encounters', value: summary.total_encounters || 0, icon: Stethoscope, color: 'text-sky-600', bg: 'bg-sky-50 border-sky-200' },
    vitals: { label: 'Vital Signs', value: summary.total_vitals || 0, icon: Heart, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200' },
    labs: { label: 'Lab Results', value: summary.total_labs || 0, icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200' },
    conditions: { label: 'Diagnosed Conditions', value: summary.total_conditions || 0, icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
    appointments: { label: 'Appointments', value: summary.total_appointments || 0, icon: Calendar, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
    meds: { label: 'Active Meds', value: summary.total_medications || 0, icon: ShieldCheck, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
    allergies: { label: 'Known Allergies', value: summary.total_allergies || 0, icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
  };

  let kpis = [];
  let dashboardTitle = 'Healthcare Dashboard';
  let dashboardDesc = 'Real-time telemetry and clinical data integrated from Synthea MongoDB records.';
  let shortcuts = [];
  let visibleCharts = [];

  switch (role) {
    case 'ADMIN':
      dashboardTitle = 'System Administration Dashboard';
      dashboardDesc = 'System-wide summary of clinical records, activity, and analytics.';
      kpis = Object.values(kpiMap);
      shortcuts = [
        { to: '/users', label: 'User Accounts', primary: true, icon: Users },
        { to: '/audit-logs', label: 'Audit Trail', icon: ClipboardList },
        { to: '/analytics', label: 'Analytics', icon: Activity },
      ];
      visibleCharts = ['encounters', 'conditions', 'demographics', 'types'];
      break;
    case 'DOCTOR':
      dashboardTitle = 'Clinical Overview Dashboard';
      dashboardDesc = 'Patient registry, appointments, and clinical safety analytics.';
      kpis = [kpiMap.patients, kpiMap.appointments, kpiMap.encounters, kpiMap.conditions, kpiMap.meds, kpiMap.allergies];
      shortcuts = [
        { to: '/patients', label: 'Patient Registry', primary: true, icon: Users },
        { to: '/appointments', label: 'Appointments', icon: Calendar },
        { to: '/analytics', label: 'Clinical Analytics', icon: Activity },
      ];
      visibleCharts = ['encounters', 'conditions', 'types'];
      break;
    case 'NURSE':
      dashboardTitle = 'Nursing Station Dashboard';
      dashboardDesc = 'Patient registry, upcoming appointments, and recent vitals.';
      kpis = [kpiMap.patients, kpiMap.appointments, kpiMap.vitals, kpiMap.labs];
      shortcuts = [
        { to: '/patients', label: 'Patient Registry', primary: true, icon: Users },
        { to: '/appointments', label: 'Appointments', icon: Calendar },
        { to: '/notifications', label: 'Notifications', icon: AlertTriangle },
      ];
      visibleCharts = ['demographics', 'types'];
      break;
    case 'PHARMACIST':
      dashboardTitle = 'Pharmacy Operations Dashboard';
      dashboardDesc = 'Medication safety, active prescriptions, and known allergies.';
      kpis = [kpiMap.patients, kpiMap.meds, kpiMap.allergies, kpiMap.labs];
      shortcuts = [
        { to: '/patients', label: 'Patient Registry', primary: true, icon: Users },
        { to: '/notifications', label: 'Safety Alerts', icon: AlertTriangle },
      ];
      visibleCharts = ['conditions'];
      break;
    default:
      kpis = [];
  }

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 p-6 text-white shadow-lg">
        <div>
          <span className="inline-block rounded-full bg-teal-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-teal-300 mb-2">
            HMEPS Portal • {role}
          </span>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{dashboardTitle}</h2>
          <p className="mt-1 text-xs text-slate-300">
            {dashboardDesc}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {shortcuts.map((shortcut, idx) => {
            const IconComponent = shortcut.icon;
            return (
              <Link
                key={idx}
                to={shortcut.to}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                  shortcut.primary
                    ? 'bg-teal-600 text-white hover:bg-teal-500 shadow-md shadow-teal-950/40'
                    : 'border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
              >
                {IconComponent && <IconComponent className="h-4 w-4" />}
                {shortcut.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`rounded-2xl border ${bg} p-5 bg-white shadow-sm transition hover:shadow-md`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
                <p className="mt-2 text-2xl font-bold text-slate-900 tracking-tight">{value.toLocaleString()}</p>
              </div>
              <div className={`rounded-xl p-3 bg-white shadow-sm border ${color}`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      {visibleCharts.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Encounters Over Time */}
          {visibleCharts.includes('encounters') && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Encounter Timeline</h3>
                <p className="text-xs text-slate-500">Monthly patient visit encounters</p>
              </div>
              <TrendingUp className="h-5 w-5 text-teal-600" />
            </div>
            <div className="h-72">
              {(!charts.encounters_over_time || charts.encounters_over_time.length === 0) ? (
                <p className="flex h-full items-center justify-center text-xs text-slate-400">No encounter trend data available</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={charts.encounters_over_time}>
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
          )}

          {/* Top Diagnosed Conditions */}
          {visibleCharts.includes('conditions') && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Top Diagnosed Conditions</h3>
                <p className="text-xs text-slate-500">Most frequent active diagnoses</p>
              </div>
              <Activity className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="h-72">
              {(!charts.top_conditions || charts.top_conditions.length === 0) ? (
                <p className="flex h-full items-center justify-center text-xs text-slate-400">No condition data available</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.top_conditions} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                    <Bar dataKey="value" fill="#6366f1" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
          )}

          {/* Patient Gender Distribution */}
          {visibleCharts.includes('demographics') && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-1">Patient Demographics</h3>
            <p className="text-xs text-slate-500 mb-4">Gender breakdown of registered patients</p>
            <div className="h-64 flex items-center justify-center">
              {(!charts.gender_distribution || charts.gender_distribution.length === 0) ? (
                <p className="text-xs text-slate-400">No demographic data available</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts.gender_distribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {charts.gender_distribution.map((entry, index) => (
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
          )}

          {/* Encounter Classification */}
          {visibleCharts.includes('types') && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-1">Encounter Classifications</h3>
            <p className="text-xs text-slate-500 mb-4">Ambulatory, inpatient, and wellness care</p>
            <div className="h-64">
              {(!charts.encounter_types || charts.encounter_types.length === 0) ? (
                <p className="flex h-full items-center justify-center text-xs text-slate-400">No encounter classification data</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.encounter_types}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                    <Bar dataKey="value" fill="#0284c7" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
          )}
        </div>
      )}
    </div>
  );
}
