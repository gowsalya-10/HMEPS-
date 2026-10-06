import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { User, Activity, FileText, ClipboardList } from 'lucide-react';
import api from '../api';

const PatientProfile = ({ tab = 'overview' }) => {
  const { id } = useParams();
  const location = useLocation();
  const [patient, setPatient] = useState(null);
  
  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const res = await api.get(`/patients/${id}`);
        setPatient(res.data);
      } catch (error) {
        console.error("Error fetching patient", error);
      }
    };
    fetchPatient();
  }, [id]);

  if (!patient) return <div className="p-8 text-center">Loading profile...</div>;

  const tabs = [
    { id: 'overview', label: 'Overview', path: `/patients/${id}` },
    { id: 'records', label: 'EHR & History', path: `/patients/${id}/records` },
    { id: 'vitals', label: 'Vital Signs', path: `/patients/${id}/vitals` },
    { id: 'labs', label: 'Lab Reports', path: `/patients/${id}/labs` },
  ];

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-start space-x-6">
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 flex-shrink-0">
          <User className="w-12 h-12" />
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{patient.full_name}</h1>
              <p className="text-gray-500">ID: {patient.patient_id} • {patient.gender} • DOB: {patient.dob}</p>
            </div>
            <div className="bg-red-50 text-red-600 px-3 py-1 rounded-full font-semibold text-sm">
              Blood: {patient.blood_group}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-500">Phone:</span> {patient.phone}</div>
            <div><span className="text-gray-500">Emergency:</span> {patient.emergency_contact}</div>
            <div className="col-span-2"><span className="text-gray-500">Allergies:</span> <span className="text-red-500 font-medium">{patient.known_allergies || 'None recorded'}</span></div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((t) => (
            <Link
              key={t.id}
              to={t.path}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                tab === t.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 min-h-[400px]">
        {tab === 'overview' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold border-b pb-2">Medical Overview</h3>
            <div>
              <h4 className="font-medium text-gray-700">Existing Conditions</h4>
              <p className="text-gray-600 mt-1">{patient.existing_conditions || 'None reported'}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-700">Address</h4>
              <p className="text-gray-600 mt-1">{patient.address}</p>
            </div>
          </div>
        )}
        
        {tab === 'records' && (
          <div className="text-center text-gray-500 py-12">
            <ClipboardList className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p>EHR integration functionality goes here.</p>
          </div>
        )}

        {tab === 'vitals' && (
          <div className="text-center text-gray-500 py-12">
            <Activity className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p>Vital signs charting goes here.</p>
          </div>
        )}

        {tab === 'labs' && (
          <div className="text-center text-gray-500 py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p>Lab reports functionality goes here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientProfile;
