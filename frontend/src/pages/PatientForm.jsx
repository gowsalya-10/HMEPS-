import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const PatientForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    patient_id: '',
    full_name: '',
    dob: '',
    gender: 'Male',
    phone: '',
    email: '',
    address: '',
    blood_group: 'A+',
    emergency_contact: '',
    known_allergies: '',
    existing_conditions: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/patients', formData);
      navigate('/patients');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save patient');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Register New Patient</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Patient ID (Unique)</label>
              <input required name="patient_id" value={formData.patient_id} onChange={handleChange} className="w-full border-gray-300 rounded-lg shadow-sm p-2 border focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input required name="full_name" value={formData.full_name} onChange={handleChange} className="w-full border-gray-300 rounded-lg shadow-sm p-2 border focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <input required type="date" name="dob" value={formData.dob} onChange={handleChange} className="w-full border-gray-300 rounded-lg shadow-sm p-2 border focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select name="gender" value={formData.gender} onChange={handleChange} className="w-full border-gray-300 rounded-lg shadow-sm p-2 border focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input required name="phone" value={formData.phone} onChange={handleChange} className="w-full border-gray-300 rounded-lg shadow-sm p-2 border focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full border-gray-300 rounded-lg shadow-sm p-2 border focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea required name="address" value={formData.address} onChange={handleChange} rows="2" className="w-full border-gray-300 rounded-lg shadow-sm p-2 border focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
              <select name="blood_group" value={formData.blood_group} onChange={handleChange} className="w-full border-gray-300 rounded-lg shadow-sm p-2 border focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                <option>A+</option><option>A-</option><option>B+</option><option>B-</option>
                <option>AB+</option><option>AB-</option><option>O+</option><option>O-</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label>
              <input required name="emergency_contact" value={formData.emergency_contact} onChange={handleChange} className="w-full border-gray-300 rounded-lg shadow-sm p-2 border focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Known Allergies</label>
              <input name="known_allergies" value={formData.known_allergies} onChange={handleChange} className="w-full border-gray-300 rounded-lg shadow-sm p-2 border focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="e.g. Penicillin, Peanuts (Leave blank if none)" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Existing Medical Conditions</label>
              <textarea name="existing_conditions" value={formData.existing_conditions} onChange={handleChange} rows="2" className="w-full border-gray-300 rounded-lg shadow-sm p-2 border focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="e.g. Diabetes, Hypertension" />
            </div>
          </div>
          <div className="flex justify-end space-x-4 pt-4 border-t">
            <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700">Register Patient</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientForm;
