import React, { useEffect, useState } from 'react';
import api from '../api';
import { Calendar as CalendarIcon, Clock, User } from 'lucide-react';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  
  useEffect(() => {
    const fetchAppts = async () => {
      try {
        const res = await api.get('/appointments');
        setAppointments(res.data);
      } catch (error) {
        console.error("Error fetching appointments", error);
      }
    };
    fetchAppts();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          New Appointment
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {appointments.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <CalendarIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p>No upcoming appointments found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map(appt => (
              <div key={appt._id} className="flex items-center p-4 border border-gray-100 rounded-lg hover:bg-gray-50">
                <div className="flex-shrink-0 bg-blue-100 p-3 rounded-lg text-blue-600 mr-4">
                  <CalendarIcon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{appt.reason}</h4>
                  <div className="flex items-center text-sm text-gray-500 mt-1 space-x-4">
                    <span className="flex items-center"><User className="h-4 w-4 mr-1"/> Patient ID: {appt.patient_id}</span>
                    <span className="flex items-center"><Clock className="h-4 w-4 mr-1"/> {appt.date} at {appt.time}</span>
                  </div>
                </div>
                <div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    appt.status === 'Scheduled' ? 'bg-blue-50 text-blue-600' :
                    appt.status === 'Completed' ? 'bg-green-50 text-green-600' :
                    'bg-red-50 text-red-600'
                  }`}>
                    {appt.status || 'Scheduled'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Appointments;
