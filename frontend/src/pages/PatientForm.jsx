import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, UserPlus } from 'lucide-react';
import api from '../services/api';

const PatientForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    patient_id: `PT-${Math.floor(1000 + Math.random() * 9000)}`,
    full_name: '',
    dob: '',
    gender: 'Male',
    phone: '',
    email: '',
    address: '',
    blood_group: 'O+',
    emergency_contact: '',
    known_allergies: '',
    existing_conditions: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        ...formData,
        known_allergies: formData.known_allergies ? formData.known_allergies.split(',').map(s => s.trim()) : [],
        existing_conditions: formData.existing_conditions ? formData.existing_conditions.split(',').map(s => s.trim()) : [],
      };
      await api.post('/patients', payload);
      navigate('/patients');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to register patient');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/patients')}
          className="inline-flex items-center gap-2 text-xs font-bold text-teal-700 hover:text-teal-900 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Patient Registry
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 pb-6 border-b border-slate-100 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 border border-teal-200 text-teal-700">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Register New Patient</h1>
            <p className="text-xs text-slate-500">Create a new electronic health record in the HMEPS HIS system.</p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700 mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Patient ID (Unique)</label>
              <input
                required
                name="patient_id"
                value={formData.patient_id}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 font-mono font-bold text-teal-700 focus:bg-white focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Full Legal Name *</label>
              <input
                required
                name="full_name"
                placeholder="e.g. Johnathan Doe"
                value={formData.full_name}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Date of Birth *</label>
              <input
                required
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Gender *</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-slate-900 focus:border-teal-500 focus:outline-none"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Phone Number *</label>
              <input
                required
                name="phone"
                placeholder="(555) 012-3456"
                value={formData.phone}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="patient@example.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Residential Address *</label>
              <textarea
                required
                name="address"
                rows="2"
                placeholder="Street address, City, State ZIP"
                value={formData.address}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Blood Group</label>
              <select
                name="blood_group"
                value={formData.blood_group}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-slate-900 focus:border-teal-500 focus:outline-none"
              >
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Emergency Contact Phone</label>
              <input
                name="emergency_contact"
                placeholder="(555) 999-8888"
                value={formData.emergency_contact}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Known Allergies (Comma-separated)</label>
              <input
                name="known_allergies"
                placeholder="e.g. Penicillin, Peanuts, Latex"
                value={formData.known_allergies}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Existing Medical Conditions (Comma-separated)</label>
              <textarea
                name="existing_conditions"
                rows="2"
                placeholder="e.g. Hypertension, Type 2 Diabetes, Asthma"
                value={formData.existing_conditions}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate('/patients')}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2 font-bold text-white shadow-md shadow-teal-900/20 hover:bg-teal-500 transition disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              {loading ? 'Saving Record...' : 'Register Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientForm;
