import { useEffect, useState } from 'react';
import {
  Activity,
  Bell,
  BriefcaseMedical,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const ALL_ROLES = ['ADMIN', 'DOCTOR', 'NURSE', 'PHARMACIST'];
const ADMIN_ONLY = ['ADMIN'];

const getNavGroups = (userRole) => {
  if (!userRole || userRole === 'UNKNOWN') return [];

  const groups = [
    {
      title: 'Overview',
      items: [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ALL_ROLES },
      ],
    },
    {
      title: 'Clinical',
      items: [
        { to: '/patients', label: 'Patient Registry', icon: Users, roles: ALL_ROLES },
        { to: '/appointments', label: 'Appointments', icon: CalendarDays, roles: ALL_ROLES },
      ],
    },
    {
      title: 'Administration',
      items: [
        { to: '/users', label: 'User Accounts', icon: Users, roles: ADMIN_ONLY },
        { to: '/audit-logs', label: 'Audit Trail', icon: ClipboardList, roles: ADMIN_ONLY },
        { to: '/notifications', label: 'Notifications', icon: Bell, roles: ALL_ROLES },
      ],
    },
    {
      title: 'Insights',
      items: [
        { to: '/analytics', label: 'Safety Analytics', icon: BriefcaseMedical, roles: ALL_ROLES },
        { to: '/reports', label: 'Medical Reports', icon: FileText, roles: ADMIN_ONLY },
      ],
    },
  ];

  return groups
    .map(group => ({
      ...group,
      items: group.items.filter(item => item.roles.includes(userRole))
    }))
    .filter(group => group.items.length > 0);
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  const filteredNavGroups = getNavGroups(user?.role);

  useEffect(() => {
    let active = true;
    const loadNotifications = async () => {
      try {
        const response = await api.get('/notifications');
        if (active) {
          setNotifications(response.data.notifications || []);
        }
      } catch (error) {
        // Fallback silently if offline
      }
    };

    if (user) {
      loadNotifications();
    }
    return () => {
      active = false;
    };
  }, [user]);

  const unreadCount = notifications.filter((item) => !item.read).length;

  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications((current) =>
        current.map((item) =>
          item.notification_id === notificationId ? { ...item, read: true } : item
        )
      );
    } catch (error) {
      console.warn('Unable to mark notification as read');
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (globalSearch.trim()) {
      navigate(`/patients?search=${encodeURIComponent(globalSearch.trim())}`);
      setGlobalSearch('');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar Desktop */}
      <aside
        className={`hidden md:flex flex-col bg-slate-900 text-slate-100 transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-64'
        } shrink-0 border-r border-slate-800`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white font-bold shadow-md shadow-teal-950/20">
              <ShieldCheck className="h-6 w-6" />
            </div>
            {!collapsed && (
              <div>
                <span className="text-xs uppercase tracking-widest text-teal-400 font-semibold block">HMEPS</span>
                <span className="text-sm font-bold text-white tracking-tight leading-tight block">Clinical HIS</span>
              </div>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {filteredNavGroups.map((group, idx) => (
            <div key={idx}>
              {!collapsed && (
                <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  {group.title}
                </p>
              )}
              <div className="space-y-1">
                {group.items.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                        isActive
                          ? 'bg-teal-600 text-white shadow-md shadow-teal-900/30'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`
                    }
                    title={collapsed ? label : undefined}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {!collapsed && <span>{label}</span>}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* User Footer Card */}
        <div className="p-3 border-t border-slate-800">
          <div className="flex items-center gap-3 rounded-xl bg-slate-800/80 p-3 border border-slate-700/60">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-700 text-white font-bold text-sm">
              {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-white">{user?.name || user?.email || 'User'}</p>
                <p className="text-[10px] text-teal-400 font-medium uppercase">{user?.role || 'DOCTOR'}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Overlay Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex w-72 flex-col bg-slate-900 text-slate-100 p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white font-bold">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-xs uppercase tracking-widest text-teal-400 font-semibold block">HMEPS</span>
                  <span className="text-base font-bold text-white block">Clinical HIS</span>
                </div>
              </div>
              <button onClick={() => setMobileOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="flex-1 space-y-4 overflow-y-auto">
              {filteredNavGroups.map((group, idx) => (
                <div key={idx}>
                  <p className="px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">{group.title}</p>
                  <div className="space-y-1">
                    {group.items.map(({ to, label, icon: Icon }) => (
                      <NavLink
                        key={to}
                        to={to}
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                            isActive ? 'bg-teal-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                          }`
                        }
                      >
                        <Icon className="h-5 w-5" />
                        <span>{label}</span>
                      </NavLink>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 sm:px-6 backdrop-blur shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="md:hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Healthcare Management System</p>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">HMEPS HIS Portal</h1>
            </div>
          </div>

          {/* Header Search & Actions */}
          <div className="flex items-center gap-3">
            <form onSubmit={handleSearchSubmit} className="hidden sm:flex relative items-center">
              <Search className="absolute left-3 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search patient, ID, or phone..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="w-64 rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
              />
            </form>

            {/* Notification Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifications((c) => !c)}
                className="relative rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                title="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-teal-600 px-1 text-[10px] font-bold text-white shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 z-50 mt-2 w-80 max-w-[90vw] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-900/10">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                    <h4 className="text-sm font-bold text-slate-900">Notifications</h4>
                    <span className="text-xs font-medium text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
                      {unreadCount} unread
                    </span>
                  </div>
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-500 py-3 text-center">No notifications found.</p>
                  ) : (
                    <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                      {notifications.slice(0, 5).map((notif) => (
                        <div
                          key={notif.notification_id}
                          className={`rounded-xl border p-3 text-xs transition ${
                            notif.read ? 'border-slate-100 bg-slate-50 text-slate-600' : 'border-teal-200 bg-teal-50/50 text-slate-900 font-medium'
                          }`}
                        >
                          <p>{notif.message}</p>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-[10px] font-semibold uppercase text-slate-400">{notif.severity}</span>
                            {!notif.read && (
                              <button
                                onClick={() => markAsRead(notif.notification_id)}
                                className="text-[11px] font-semibold text-teal-700 hover:underline"
                              >
                                Mark read
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Logout */}
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-sm"
            >
              <LogOut className="h-4 w-4 text-slate-500" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="min-w-0 flex-1 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}