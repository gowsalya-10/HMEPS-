import { useEffect, useState } from 'react';
import { UserCheck, UserPlus, Users, XCircle } from 'lucide-react';
import api from '../services/api';

const initialForm = {
  name: '',
  email: '',
  password: '',
  role: 'NURSE',
  department: 'Nursing',
  status: 'ACTIVE',
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.users || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await api.post('/users', form);
      setForm(initialForm);
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'User account could not be created');
    }
  };

  const disableUser = async (userId) => {
    if (window.confirm('Are you sure you want to disable this user account?')) {
      try {
        await api.delete(`/users/${userId}`);
        loadUsers();
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to disable user account');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600">Access Control</span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User Account Administration</h1>
          <p className="text-xs text-slate-500">Manage hospital staff credentials, roles, and authorization status.</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        {/* User List Table */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/60 p-4">
            <h3 className="text-sm font-bold text-slate-900">Hospital Staff Accounts ({users.length})</h3>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading user accounts...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="p-3">User & Email</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {users.length === 0 ? (
                    <tr><td colSpan="5" className="p-6 text-center text-slate-400">No staff accounts found.</td></tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.user_id} className="hover:bg-slate-50">
                        <td className="p-3">
                          <p className="font-bold text-slate-900">{user.name}</p>
                          <p className="text-[11px] text-slate-400">{user.email}</p>
                        </td>
                        <td className="p-3 font-semibold text-teal-700">{user.role}</td>
                        <td className="p-3 text-slate-500">{user.department}</td>
                        <td className="p-3">
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                              user.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {user.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {user.status === 'ACTIVE' && (
                            <button
                              onClick={() => disableUser(user.user_id)}
                              className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100 transition"
                            >
                              Disable
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create User Form */}
        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 text-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <UserPlus className="h-4 w-4 text-teal-600" />
            <h3 className="text-sm font-bold text-slate-900">Provision New Staff Account</h3>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Dr. Sarah Connor"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="s.connor@hmeps.io"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Password *</label>
            <input
              required
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Role *</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-teal-500 focus:outline-none"
              >
                <option value="ADMIN">ADMIN</option>
                <option value="DOCTOR">DOCTOR</option>
                <option value="NURSE">NURSE</option>
                <option value="PHARMACIST">PHARMACIST</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-teal-500 focus:outline-none"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Department</label>
            <input
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              placeholder="e.g. Cardiology, Pharmacy"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-teal-500 focus:outline-none"
            />
          </div>

          {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}

          <button
            type="submit"
            className="w-full rounded-xl bg-teal-600 px-4 py-2.5 font-bold text-white shadow-md shadow-teal-900/20 hover:bg-teal-500 transition"
          >
            Create Staff Account
          </button>
        </form>
      </div>
    </div>
  );
}
