import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, LogIn, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: 'admin@hmeps.io', password: 'admin123' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 px-4 py-8">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-lg shadow-teal-950/40">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <span className="text-xs uppercase tracking-widest text-teal-400 font-bold block mb-1">HMEPS Clinical HIS</span>
          <h1 className="text-2xl font-bold text-white tracking-tight">Healthcare Portal Access</h1>
          <p className="mt-1 text-xs text-slate-400">Medical Error Prevention & EHR System</p>
        </div>

        <form className="space-y-5 text-xs" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1.5 block font-semibold text-slate-300">Staff Email Address</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block font-semibold text-slate-300">Authorization Key / Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
              required
            />
          </div>

          {error && (
            <div className="rounded-xl border border-rose-900/60 bg-rose-950/60 px-4 py-3 text-xs font-semibold text-rose-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 font-bold text-white shadow-lg shadow-teal-950/50 transition hover:bg-teal-500 disabled:cursor-not-allowed disabled:bg-teal-800"
          >
            <LogIn className="h-4 w-4" />
            {loading ? 'Authenticating...' : 'Sign In to Portal'}
          </button>
        </form>

        <div className="mt-8 rounded-xl border border-slate-800 bg-slate-800/40 p-3.5 text-center text-xs text-slate-400">
          <p className="font-semibold text-slate-300">Demo Staff Credentials:</p>
          <p className="mt-1 font-mono text-[11px] text-teal-400">admin@hmeps.io / admin123</p>
        </div>
      </div>
    </div>
  );
}
