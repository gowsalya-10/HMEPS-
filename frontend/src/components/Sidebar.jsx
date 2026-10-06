import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Users, Calendar, Activity, Home, Menu } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const isActive = (path) => location.pathname.startsWith(path);

  const links = [
    { to: "/dashboard", icon: Home, label: "Dashboard" },
    { to: "/patients", icon: Users, label: "Patients" },
    { to: "/appointments", icon: Calendar, label: "Appointments" }
  ];

  return (
    <div className="w-64 bg-white border-r min-h-screen flex flex-col">
      <div className="h-16 flex items-center px-6 border-b text-blue-600 font-bold text-xl">
        <Activity className="mr-2" /> HMEPS
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
              isActive(link.to) ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <link.icon className="w-5 h-5 mr-3" />
            <span className="font-medium">{link.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
