import React, { useEffect, useState } from 'react';
import { Users, Calendar, Activity, TrendingUp } from 'lucide-react';
import api from '../api';

const StatCard = ({ title, value, icon: Icon, colorClass }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center">
    <div className={`p-4 rounded-full mr-4 ${colorClass}`}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
    </div>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState({ patients: 0, appointments: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [patientsRes, apptsRes] = await Promise.all([
          api.get('/patients'),
          api.get('/appointments')
        ]);
        setStats({
          patients: patientsRes.data.length,
          appointments: apptsRes.data.length
        });
      } catch (error) {
        console.error("Error fetching stats", error);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Patients" 
          value={stats.patients} 
          icon={Users} 
          colorClass="bg-blue-50 text-blue-600" 
        />
        <StatCard 
          title="Upcoming Appointments" 
          value={stats.appointments} 
          icon={Calendar} 
          colorClass="bg-green-50 text-green-600" 
        />
        <StatCard 
          title="Recent Lab Reports" 
          value="12" 
          icon={Activity} 
          colorClass="bg-purple-50 text-purple-600" 
        />
        <StatCard 
          title="New Diagnoses" 
          value="5" 
          icon={TrendingUp} 
          colorClass="bg-orange-50 text-orange-600" 
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Welcome to HMEPS</h2>
        <p className="text-gray-600">
          The Healthcare Medical Error Prevention System helps you securely manage patient records, 
          vital signs, lab reports, and appointments to reduce medical errors and improve care.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
