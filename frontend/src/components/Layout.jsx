import { useEffect, useState } from 'react';
import {
  Activity,
  Bell,
  BriefcaseMedical,
  CalendarDays,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/patient-dashboard', label: 'Patient Dashboard', icon: Activity },
  { to: '/patients', label: 'Patients', icon: Users },
  { to: '/appointments', label: 'Appointments', icon: CalendarDays },
  { to: '/users', label: 'User Management', icon: Users },
  { to: '/audit-logs', label: 'Audit Logs', icon: ClipboardList },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/analytics', label: 'Analytics', icon: BriefcaseMedical },
  { to: '/reports', label: 'Reports', icon: FileText },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    let active = true;

    const loadNotifications = async () => {
      try {
        const response = await api.get('/notifications');

        if (active) {
          setNotifications(response.data.notifications || []);
        }
      } catch (error) {
        console.warn('Could not load notifications');
      }
    };

    if (user) {
      loadNotifications();
    }

    return () => {
      active = false;
    };
  }, [user]);

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);

      setNotifications((current) =>
        current.map((notification) =>
          notification.notification_id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error) {
      console.warn('Unable to mark notification as read');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-800">
      <aside className="hidden w-72 shrink-0 flex-col bg-slate-900 p-5 text-slate-100 md:flex">
        <div className="mb-8 flex items-center gap-3">
          <div className="rounded-xl bg-blue-600 p-2.5">
            <ShieldCheck className="h-5 w-5" />
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest text-slate-300">
              HMEPS
            </p>
            <h1 className="text-lg font-semibold">
              Medical Error Prevention
            </h1>
          </div>
        </div>

        <nav className="space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto rounded-2xl border border-slate-700 bg-slate-800 p-4">
          <p className="text-xs uppercase tracking-widest text-slate-400">
            Logged in as
          </p>
          <p className="mt-2 text-sm font-semibold">
            {user?.name || user?.email || 'User'}
          </p>
          <p className="text-xs text-slate-400">
            {user?.role || 'User'}
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-slate-200 bg-white px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500">
                Healthcare Administration
              </p>
              <h2 className="text-xl font-semibold text-slate-900">
                HMEPS Portal
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowNotifications((current) => !current)}
                  aria-label="Toggle notifications"
                  className="relative rounded-full border border-slate-200 bg-slate-100 p-2.5 text-slate-600 hover:bg-slate-200"
                >
                  <Bell className="h-5 w-5" />

                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 z-50 mt-3 w-80 max-w-[85vw] rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
                    <p className="mb-3 text-sm font-semibold text-slate-700">
                      Recent Notifications
                    </p>

                    {notifications.length === 0 ? (
                      <p className="text-sm text-slate-500">
                        No notifications available.
                      </p>
                    ) : (
                      <div className="max-h-80 space-y-2 overflow-y-auto">
                        {notifications.slice(0, 5).map((notification) => (
                          <div
                            key={notification.notification_id}
                            className={`rounded-lg border p-3 ${notification.read
                                ? 'border-slate-200 bg-slate-50'
                                : 'border-blue-200 bg-blue-50'
                              }`}
                          >
                            <p className="text-sm font-medium text-slate-700">
                              {notification.message}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {notification.severity}
                            </p>

                            {!notification.read && (
                              <button
                                type="button"
                                onClick={() =>
                                  markAsRead(notification.notification_id)
                                }
                                className="mt-2 text-xs font-medium text-blue-600 hover:underline"
                              >
                                Mark as read
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="hidden items-center gap-2 sm:flex">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 font-bold text-white">
                  {(user?.name || user?.email || 'U')
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {user?.name || user?.email || 'User'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {user?.role || 'User'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-x-hidden p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}