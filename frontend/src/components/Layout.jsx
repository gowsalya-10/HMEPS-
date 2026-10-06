import { useEffect, useState } from 'react';
import { Bell, BriefcaseMedical, ClipboardList, FileText, LayoutDashboard, LogOut, ShieldCheck, Users } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/audit-logs', label: 'Audit Logs', icon: ClipboardList },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/analytics', label: 'Analytics', icon: BriefcaseMedical },
  { to: '/reports', label: 'Reports', icon: FileText },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);

  const loadNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.warn('Could not load notifications');
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const unreadCount = notifications.filter((item) => !item.read).length;

  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications((current) => current.map((item) => item.notification_id === notificationId ? { ...item, read: true } : item));
    } catch (error) {
      console.warn('Unable to mark notification as read');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-800">
      <aside className="w-72 bg-slate-900 text-slate-100 p-6 hidden md:flex md:flex-col">
        <div className="mb-8 flex items-center gap-3">
          <div className="rounded-xl bg-blue-600 p-2.5">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-300">HMEPS</p>
            <h1 className="text-lg font-semibold">Module 3</h1>
          </div>
        </div>

        <nav className="space-y-2">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto rounded-2xl border border-slate-700 bg-slate-800 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Logged in as</p>
          <p className="mt-2 text-sm font-semibold">{user?.name || 'Administrator'}</p>
          <p className="text-xs text-slate-400">{user?.role || 'ADMIN'}</p>
        </div>
      </aside>

      <div className="flex-1">
        <header className="border-b border-slate-200 bg-white/90 px-5 py-4 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Healthcare Administration</p>
              <h2 className="text-2xl font-semibold text-slate-900">Security & Monitoring</h2>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <button className="relative rounded-full border border-slate-200 bg-slate-100 p-2.5 text-slate-600 transition hover:bg-slate-200">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {notifications.length > 0 && (
                  <div className="absolute right-0 mt-3 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
                    <p className="mb-2 text-sm font-semibold text-slate-700">Recent notifications</p>
                    <div className="space-y-2">
                      {notifications.slice(0, 4).map((notification) => (
                        <div key={notification.notification_id} className={`rounded-lg border p-2 ${notification.read ? 'border-slate-200 bg-slate-50' : 'border-blue-200 bg-blue-50'}`}>
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-slate-700">{notification.message}</p>
                            {!notification.read && (
                              <button className="text-xs text-blue-600" onClick={() => markAsRead(notification.notification_id)}>
                                Mark read
                              </button>
                            )}
                          </div>
                          <p className="mt-1 text-[11px] text-slate-500">{notification.severity}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                  {user?.name?.charAt(0) || 'A'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{user?.name || 'Admin'}</p>
                  <p className="text-[11px] text-slate-500">{user?.role || 'ADMIN'}</p>
                </div>
              </div>

              <button
                onClick={logout}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
