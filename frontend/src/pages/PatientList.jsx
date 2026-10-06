import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Eye, Edit, Trash2 } from 'lucide-react';
import api from '../api';

const PatientList = () => {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatients();
  }, [search]);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/patients${search ? `?search=${search}` : ''}`);
      setPatients(res.data);
    } catch (error) {
      console.error("Error fetching patients", error);
    }
    setLoading(false);
  };

  const deletePatient = async (id) => {
    if(window.confirm('Are you sure you want to delete this patient?')) {
      try {
        await api.delete(`/patients/${id}`);
        fetchPatients();
      } catch (error) {
        console.error("Error deleting patient", error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
        <Link to="/patients/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition">
          <Plus className="w-5 h-5 mr-2" /> Add Patient
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div className="relative w-72">
            <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
            <input 
              type="text"
              placeholder="Search by name or ID..."
              className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading patients...</div>
        ) : patients.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No patients found.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-gray-100 text-sm text-gray-500 uppercase tracking-wider">
                <th className="p-4 font-medium">Patient ID</th>
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium">Age/DOB</th>
                <th className="p-4 font-medium">Blood Group</th>
                <th className="p-4 font-medium">Phone</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {patients.map((patient) => (
                <tr key={patient._id} className="hover:bg-gray-50 transition">
                  <td className="p-4 text-gray-900 font-medium">{patient.patient_id}</td>
                  <td className="p-4 text-gray-700">{patient.full_name}</td>
                  <td className="p-4 text-gray-600">{patient.dob}</td>
                  <td className="p-4 text-gray-600">
                    <span className="bg-red-50 text-red-600 px-2 py-1 rounded text-xs font-semibold">
                      {patient.blood_group}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600">{patient.phone}</td>
                  <td className="p-4 text-right space-x-2">
                    <Link to={`/patients/${patient._id}`} className="inline-flex items-center p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                      <Eye className="w-4 h-4" />
                    </Link>
                    <button onClick={() => deletePatient(patient._id)} className="inline-flex items-center p-2 text-red-600 hover:bg-red-50 rounded-lg transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default PatientList;
