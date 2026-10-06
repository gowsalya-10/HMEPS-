import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../services/api';

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

  if (loading) return <div className="rounded-2xl bg-white p-8 text-center shadow-sm">Loading analytics...</div>;
  if (error) return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-800"><p>{error}</p><button onClick={fetchAnalytics} className="mt-3 font-semibold underline">Retry</button></div>;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-2xl font-bold text-slate-900">Medical Safety Analytics</h3>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {overview && [
          { label: 'Total Prescriptions', value: overview.total_prescriptions },
          { label: 'Total Safety Checks', value: overview.active_safety_alerts || 0 },
          { label: 'Detected Errors', value: overview.medical_errors_detected || 0 },
          { label: 'Error Detection Rate', value: `${overview.error_detection_rate || 0}%` },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h4 className="mb-4 text-lg font-semibold text-slate-800">Error Trends</h4>
          <div className="h-72">
            {errorSeries.length === 0 ? <p className="flex h-full items-center justify-center text-sm text-slate-500">No medical error records available.</p> : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={errorSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h4 className="mb-4 text-lg font-semibold text-slate-800">Alert Distribution</h4>
          <div className="h-72">
            {alertSeries.length === 0 ? <p className="flex h-full items-center justify-center text-sm text-slate-500">No safety alert records available.</p> : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={alertSeries} dataKey="value" nameKey="name" outerRadius={90} fill="#f97316" label />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
