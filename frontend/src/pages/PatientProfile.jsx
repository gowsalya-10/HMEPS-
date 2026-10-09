import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { Activity, AlertTriangle, ArrowLeft, Calendar, ClipboardList, FileText, Heart, ShieldAlert, User } from 'lucide-react';
import api from '../services/api';

const PatientProfile = ({ tab = 'overview' }) => {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [vitals, setVitals] = useState([]);
  const [labs, setLabs] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(tab);

  useEffect(() => {
    setActiveTab(tab);
  }, [tab]);

  useEffect(() => {
    const fetchPatientData = async () => {
      setLoading(true);
      try {
        const pRes = await api.get(`/patients/${id}`);
        setPatient(pRes.data);

        // Fetch child records
        const [vRes, lRes, rRes] = await Promise.allSettled([
          api.get(`/patients/${id}/vitals`),
          api.get(`/patients/${id}/labs`),
          api.get(`/patients/${id}/records`),
        ]);

        if (vRes.status === 'fulfilled') setVitals(vRes.value.data || []);
        if (lRes.status === 'fulfilled') setLabs(lRes.value.data || []);
        if (rRes.status === 'fulfilled') setRecords(rRes.value.data || []);
      } catch (error) {
        console.error('Error fetching patient details', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPatientData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3 text-slate-500 font-medium text-xs">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
          Loading patient health records...
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-700 font-medium">
        <p>Patient record not found.</p>
        <Link to="/patients" className="mt-4 inline-block text-xs font-bold text-teal-700 hover:underline">
          Return to Patient Registry
        </Link>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview & History', path: `/patients/${id}` },
    { id: 'vitals', label: `Vital Signs (${vitals.length})`, path: `/patients/${id}/vitals` },
    { id: 'labs', label: `Lab Reports (${labs.length})`, path: `/patients/${id}/labs` },
    { id: 'records', label: `EHR Notes (${records.length})`, path: `/patients/${id}/records` },
  ];

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div>
        <Link to="/patients" className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-900 transition">
          <ArrowLeft className="h-4 w-4" /> Back to Patient Registry
        </Link>
      </div>

      {/* Patient Profile Header Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 font-bold text-2xl shadow-inner">
              <User className="h-10 w-10" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{patient.full_name}</h1>
                <span className="rounded-md bg-teal-50 border border-teal-200 px-2.5 py-0.5 text-xs font-bold text-teal-800">
                  ID: {patient.patient_id}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500 font-medium">
                Gender: <span className="font-semibold text-slate-700">{patient.gender}</span> • DOB: <span className="font-semibold text-slate-700">{patient.dob || 'N/A'}</span> • Race: <span className="font-semibold text-slate-700">{patient.race || 'Standard'}</span>
              </p>
              <p className="mt-1 text-xs text-slate-500 font-medium">
                Address: <span className="text-slate-700">{patient.address || 'N/A'}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700">
              Blood Group: {patient.blood_group || 'O+'}
            </div>
            <div className="text-right text-xs text-slate-500">
              <span>Phone: <strong className="text-slate-800">{patient.phone || 'N/A'}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Tab Links */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-6 overflow-x-auto">
          {tabs.map((t) => (
            <Link
              key={t.id}
              to={t.path}
              onClick={() => setActiveTab(t.id)}
              className={`whitespace-nowrap pb-3 border-b-2 font-bold text-xs transition ${
                activeTab === t.id
                  ? 'border-teal-600 text-teal-700'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'
              }`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Tab Contents */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm min-h-[350px]">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6 text-xs">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-3">
                  <ShieldAlert className="h-4 w-4 text-amber-600" /> Known Allergies
                </h3>
                {patient.known_allergies && patient.known_allergies.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {patient.known_allergies.map((allergy, idx) => (
                      <span key={idx} className="rounded-lg bg-amber-100/80 border border-amber-300/80 px-2.5 py-1 text-xs font-semibold text-amber-900">
                        {allergy}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400">No known allergies reported.</p>
                )}
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-3">
                  <Activity className="h-4 w-4 text-indigo-600" /> Existing Conditions & Diagnoses
                </h3>
                {patient.existing_conditions && patient.existing_conditions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {patient.existing_conditions.map((cond, idx) => (
                      <span key={idx} className="rounded-lg bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-xs font-semibold text-indigo-800">
                        {cond}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400">No pre-existing conditions recorded.</p>
                )}
              </div>
            </div>

            {/* Recent Vitals Preview */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-3">Recent Vital Signs Summary</h3>
              {vitals.length === 0 ? (
                <p className="text-slate-400">No vital sign entries available.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {vitals.slice(0, 4).map((v, idx) => (
                    <div key={idx} className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                      <p className="text-[11px] font-semibold text-slate-400">{v.type}</p>
                      <p className="mt-1 text-lg font-bold text-slate-900">
                        {v.value} <span className="text-xs font-normal text-slate-500">{v.unit}</span>
                      </p>
                      <p className="mt-1 text-[10px] text-slate-400">{v.date}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VITALS TAB */}
        {activeTab === 'vitals' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Vital Signs Observations</h3>
            {vitals.length === 0 ? (
              <p className="text-xs text-slate-400">No vital sign records found for this patient.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-[11px] uppercase font-bold text-slate-500">
                      <th className="p-3">Date</th>
                      <th className="p-3">Observation Type</th>
                      <th className="p-3">Value</th>
                      <th className="p-3">Unit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {vitals.map((v, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-3 font-semibold text-slate-900">{v.date}</td>
                        <td className="p-3">{v.type}</td>
                        <td className="p-3 font-bold text-teal-700">{v.value}</td>
                        <td className="p-3 text-slate-500">{v.unit || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* LABS TAB */}
        {activeTab === 'labs' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Laboratory Diagnostic Reports</h3>
            {labs.length === 0 ? (
              <p className="text-xs text-slate-400">No laboratory test reports found for this patient.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-[11px] uppercase font-bold text-slate-500">
                      <th className="p-3">Date</th>
                      <th className="p-3">Test Name</th>
                      <th className="p-3">Result</th>
                      <th className="p-3">Reference Range</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {labs.map((l, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-3 font-semibold text-slate-900">{l.date}</td>
                        <td className="p-3">{l.test_name}</td>
                        <td className="p-3 font-bold text-indigo-700">{l.result}</td>
                        <td className="p-3 text-slate-500">{l.reference_range || 'Normal'}</td>
                        <td className="p-3">
                          <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                            {l.status || 'Completed'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* RECORDS TAB */}
        {activeTab === 'records' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Electronic Health Record Notes</h3>
            {records.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                <ClipboardList className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                No clinical EHR notes recorded for this patient yet.
              </div>
            ) : (
              <div className="space-y-3">
                {records.map((r, idx) => (
                  <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-slate-900">{r.record_type || 'Clinical Note'}</span>
                      <span className="text-slate-400">{r.created_at}</span>
                    </div>
                    <p className="text-slate-700">{r.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientProfile;
