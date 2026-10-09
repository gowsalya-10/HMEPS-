import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Eye, Filter, Plus, Search, Trash2, UserPlus } from 'lucide-react';
import api from '../services/api';

const PatientList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState(initialSearch);
  const [genderFilter, setGenderFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchPatients();
  }, [search]);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/patients${search ? `?search=${encodeURIComponent(search)}` : ''}`);
      setPatients(res.data || []);
    } catch (error) {
      console.error('Error fetching patients', error);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const deletePatient = async (id, name) => {
    if (window.confirm(`Are you sure you want to remove patient records for "${name}"?`)) {
      try {
        await api.delete(`/patients/${id}`);
        fetchPatients();
      } catch (error) {
        alert('Failed to delete patient record');
      }
    }
  };

  const filteredPatients = patients.filter((patient) => {
    if (genderFilter !== 'ALL' && patient.gender?.toUpperCase() !== genderFilter) {
      return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage) || 1;
  const paginatedPatients = filteredPatients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600">Clinical Management</span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Patient Registry</h1>
          <p className="text-xs text-slate-500">Access registered patient records, vitals, labs, and history.</p>
        </div>
        <Link
          to="/patients/new"
          className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-teal-900/20 hover:bg-teal-500 transition"
        >
          <UserPlus className="h-4 w-4" /> Register New Patient
        </Link>
      </div>

      {/* Main Filter & Table Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/50 p-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, ID, or phone..."
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-xs text-slate-800 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Filter className="h-4 w-4 text-slate-400" />
              <span className="font-semibold">Gender:</span>
            </div>
            <select
              value={genderFilter}
              onChange={(e) => {
                setGenderFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-teal-500 focus:outline-none"
            >
              <option value="ALL">All Genders</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
          </div>
        </div>

        {/* Table View */}
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
            Loading patient records...
          </div>
        ) : paginatedPatients.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <p className="text-sm font-semibold text-slate-700">No patients found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria or register a new patient.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] uppercase font-bold tracking-wider text-slate-500">
                  <th className="p-4">Patient ID</th>
                  <th className="p-4">Full Name</th>
                  <th className="p-4">Gender / DOB</th>
                  <th className="p-4">Blood Group</th>
                  <th className="p-4">Contact Phone</th>
                  <th className="p-4">Known Allergies</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {paginatedPatients.map((patient) => {
                  const targetId = patient._id || patient.patient_id;
                  return (
                    <tr key={targetId} className="hover:bg-slate-50/80 transition">
                      <td className="p-4 font-bold text-teal-700">{patient.patient_id}</td>
                      <td className="p-4 font-semibold text-slate-900">{patient.full_name}</td>
                      <td className="p-4">
                        <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600 mr-2">
                          {patient.gender}
                        </span>
                        <span>{patient.dob || 'N/A'}</span>
                      </td>
                      <td className="p-4">
                        <span className="inline-block rounded-lg bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700 border border-rose-200">
                          {patient.blood_group || 'O+'}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600">{patient.phone || 'N/A'}</td>
                      <td className="p-4 max-w-xs truncate text-slate-500">
                        {patient.known_allergies && patient.known_allergies.length > 0 ? (
                          <span className="inline-block rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200">
                            {patient.known_allergies.join(', ')}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">None recorded</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/patients/${targetId}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-50 hover:border-teal-300 transition"
                          >
                            <Eye className="h-3.5 w-3.5" /> View EHR
                          </Link>
                          <button
                            onClick={() => deletePatient(targetId, patient.full_name)}
                            className="inline-flex items-center rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                            title="Delete Record"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 p-4 text-xs">
            <span className="text-slate-500">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredPatients.length)} of {filteredPatients.length} patients
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
    </div>
  );
};

export default PatientList;
