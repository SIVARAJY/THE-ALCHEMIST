import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, X } from 'lucide-react';
import api from '../api';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      fetchNotifications(parsed.id);
      
      // Poll every 20 seconds for real-time notifications
      const interval = setInterval(() => fetchNotifications(parsed.id), 20000);
      return () => clearInterval(interval);
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const fetchNotifications = async (userId) => {
    try {
      const res = await api.get(`/notifications/${userId}`);
      // Show only unread notifications so read ones vanish
      setNotifications(res.data.filter(n => !n.is_read));
    } catch (e) {
      console.error(e);
    }
  };

  // Mark notification as read -> Vanish from panel
  const markAsRead = async (id) => {
    try {
      setNotifications(prev => prev.filter(n => n.id !== id));
      await api.put(`/notifications/${id}/read`);
    } catch (e) {
      console.error(e);
    }
  };

  // Delete notification
  const deleteNotification = async (e, id) => {
    e.stopPropagation();
    try {
      setNotifications(prev => prev.filter(n => n.id !== id));
      await api.delete(`/notifications/${id}`);
    } catch (e) {
      console.error(e);
    }
  };

  const markAllAsRead = async () => {
    try {
      if (!user) return;
      setNotifications([]);
      await api.put(`/notifications/user/${user.id}/read-all`);
    } catch (e) {
      console.error(e);
    }
  };

  const unreadCount = notifications.length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors focus:outline-none"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800">Notifications</h3>
              {unreadCount > 0 && (
                <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
                Clear all
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                🎉 All caught up! No unread notifications.
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {notifications.map(notif => (
                  <div 
                    key={notif.id} 
                    className="p-4 hover:bg-slate-50 transition-colors flex items-start gap-3 bg-indigo-50/20 group relative cursor-pointer"
                    onClick={() => markAsRead(notif.id)}
                  >
                    <div className="w-2 h-2 mt-2 rounded-full bg-indigo-500 flex-shrink-0"></div>
                    <div className="flex-1 pr-6">
                      <p className="text-sm font-medium text-slate-800 leading-snug">
                        {notif.message}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(notif.created_at).toLocaleString([], { hour: '2-digit', minute:'2-digit', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <button 
                      onClick={(e) => deleteNotification(e, notif.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md absolute right-3 top-4"
                      title="Dismiss & Delete"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
