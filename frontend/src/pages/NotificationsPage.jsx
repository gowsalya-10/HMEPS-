import { useEffect, useState } from 'react';
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
      setNotifications((current) => current.map((notification) => notification.notification_id === notificationId ? { ...notification, read: true } : notification));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update this notification.');
    }
  };

  if (loading) return <div className="rounded-2xl bg-white p-8 text-center shadow-sm">Loading notifications...</div>;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-2xl font-bold text-slate-900">Notifications</h3>
      </div>

      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">{error}</p>}
      <div className="space-y-3">
        {notifications.length === 0 && !error ? <p className="rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-500">No notifications yet.</p> : notifications.map((notification) => (
          <div key={notification.notification_id} className={`rounded-2xl border p-4 shadow-sm ${notification.read ? 'border-slate-200 bg-white' : 'border-blue-200 bg-blue-50'}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-800">{notification.message}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.15em] text-slate-500">{notification.severity}</p>
              </div>
              {!notification.read && (
                <button onClick={() => markRead(notification.notification_id)} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white">
                  Mark read
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
