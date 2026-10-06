import React from 'react';
import { Bell, Search, User } from 'lucide-react';

const TopNav = () => {
  return (
    <header className="bg-white border-b h-16 flex items-center justify-between px-6">
      <div className="flex-1 flex items-center">
        <div className="relative w-96">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center">
            <Search className="h-5 w-5 text-gray-400" />
          </span>
          <input 
            type="text" 
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 sm:text-sm transition duration-150 ease-in-out" 
            placeholder="Search patients..." 
          />
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <button className="text-gray-400 hover:text-gray-500">
          <Bell className="h-6 w-6" />
        </button>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <User className="h-5 w-5" />
          </div>
          <span className="text-sm font-medium text-gray-700">Dr. Smith</span>
        </div>
      </div>
    </header>
  );
};

export default TopNav;
