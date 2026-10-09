import { useEffect, useState } from 'react';
import { Bell, CheckCircle2, ShieldAlert } from 'lucide-react';
import api from '../services/api';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data.notifications || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications((current) =>
        current.map((notification) =>
          notification.notification_id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update this notification.');
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl bg-white p-8 shadow-sm text-xs text-slate-400">
        Loading notifications...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600">System Alerts</span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Notifications & Broadcasts</h1>
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-xs text-slate-400">
            <Bell className="mx-auto h-8 w-8 text-slate-300 mb-2" />
            No notifications available.
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.notification_id}
              className={`rounded-2xl border p-4 shadow-sm transition text-xs ${
                notification.read
                  ? 'border-slate-200 bg-white text-slate-700'
                  : 'border-teal-200 bg-teal-50/50 text-slate-900 font-medium'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 rounded-xl p-2 ${notification.read ? 'bg-slate-100 text-slate-500' : 'bg-teal-600 text-white'}`}>
                    <Bell className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{notification.message}</p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Severity: <span className="text-slate-600">{notification.severity}</span>
                    </p>
                  </div>
                </div>

                {!notification.read && (
                  <button
                    onClick={() => markRead(notification.notification_id)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-3 py-1.5 font-bold text-white shadow-xs hover:bg-teal-500 transition"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Mark read
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
