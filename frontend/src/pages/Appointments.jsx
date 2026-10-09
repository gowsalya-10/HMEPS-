import React, { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Filter, Plus, Search, Stethoscope, User, X } from 'lucide-react';
import api from '../services/api';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // New Appointment Modal State
  const [showModal, setShowModal] = useState(false);
  const [newAppt, setNewAppt] = useState({
    patient_id: '',
    doctor_id: 'DOC-101',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    reason: 'General Checkup & Consultation',
    status: 'Scheduled',
  });

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/appointments');
      setAppointments(res.data || []);
    } catch (error) {
      console.error('Error fetching appointments', error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    try {
      await api.post('/appointments', newAppt);
      setShowModal(false);
      fetchAppointments();
      setNewAppt({
        patient_id: '',
        doctor_id: 'DOC-101',
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        reason: 'General Checkup & Consultation',
        status: 'Scheduled',
      });
    } catch (error) {
      alert('Failed to schedule appointment');
    }
  };

  const filteredAppointments = appointments.filter((appt) => {
    if (search) {
      const q = search.toLowerCase();
      const matchId = (appt.patient_id || '').toLowerCase().includes(q);
      const matchReason = (appt.reason || '').toLowerCase().includes(q);
      if (!matchId && !matchReason) return false;
    }
    if (statusFilter !== 'ALL' && appt.status?.toUpperCase() !== statusFilter) {
      return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage) || 1;
  const paginatedAppointments = filteredAppointments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600">Clinical Scheduling</span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Appointments & Consultations</h1>
          <p className="text-xs text-slate-500">Manage patient encounters, doctor visits, and clinical schedules.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-900/20 hover:bg-teal-500 transition"
        >
          <Plus className="h-4 w-4" /> Schedule Appointment
        </button>
      </div>

      {/* Table & Filter Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/50 p-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Patient ID or Reason..."
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-xs text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-teal-500 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="SCHEDULED">Scheduled</option>
            </select>
          </div>
        </div>

        {/* Content View */}
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
            Loading clinical appointments...
          </div>
        ) : paginatedAppointments.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <CalendarIcon className="mx-auto h-10 w-10 text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-700">No appointments found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {paginatedAppointments.map((appt, idx) => (
              <div key={appt._id || idx} className="flex flex-wrap items-center justify-between gap-4 p-4 hover:bg-slate-50/80 transition text-xs">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-200 font-bold">
                    <CalendarIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{appt.reason || 'General Examination'}</h4>
                    <div className="mt-1 flex flex-wrap items-center gap-4 text-slate-500 font-medium">
                      <span className="flex items-center gap-1"><User className="h-3.5 w-3.5 text-slate-400" /> Patient: <strong className="text-slate-800">{appt.patient_id}</strong></span>
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-slate-400" /> {appt.date} at {appt.time}</span>
                      <span className="flex items-center gap-1"><Stethoscope className="h-3.5 w-3.5 text-slate-400" /> Provider: {appt.doctor_id}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <span
                    className={`inline-block rounded-lg px-2.5 py-1 text-[11px] font-bold border ${
                      appt.status === 'Completed'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-sky-50 text-sky-700 border-sky-200'
                    }`}
                  >
                    {appt.status || 'Completed'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 p-4 text-xs">
            <span className="text-slate-500">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredAppointments.length)} of {filteredAppointments.length} appointments
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="font-semibold text-slate-700">Page {currentPage} of {totalPages}</span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl z-10 text-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">Schedule New Appointment</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Patient ID *</label>
                <input
                  required
                  placeholder="e.g. PT-0001"
                  value={newAppt.patient_id}
                  onChange={(e) => setNewAppt({ ...newAppt, patient_id: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Appointment Date *</label>
                <input
                  required
                  type="date"
                  value={newAppt.date}
                  onChange={(e) => setNewAppt({ ...newAppt, date: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Appointment Time *</label>
                <input
                  required
                  type="time"
                  value={newAppt.time}
                  onChange={(e) => setNewAppt({ ...newAppt, time: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason for Visit *</label>
                <input
                  required
                  placeholder="e.g. Routine Consultation, Follow-up"
                  value={newAppt.reason}
                  onChange={(e) => setNewAppt({ ...newAppt, reason: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-teal-600 px-4 py-2 font-bold text-white hover:bg-teal-500 shadow-md"
                >
                  Confirm Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;
