import React, { useState, useEffect } from 'react';
import { Activity, Calendar, CheckCircle2, XCircle, UserPlus, Star, Clock, RefreshCw } from 'lucide-react';
import api from '../api';

const LiveActivityFeed = () => {
  const [activities, setActivities] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchActivities();
    const interval = setInterval(() => {
      fetchActivities(true);
    }, 10000); // Live poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchActivities = async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);
    try {
      const res = await api.get('/audit');
      setActivities(res.data || []);
    } catch (err) {
      console.error('Failed to fetch activity feed:', err);
    } finally {
      setLoading(false);
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  // Helper to format relative time
  const getRelativeTime = (timestamp) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInSeconds = Math.floor((now - past) / 1000);

    if (diffInSeconds < 30) return 'Just now';
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return past.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // Event category helper
  const getEventCategory = (action) => {
    const act = (action || '').toUpperCase();
    if (act.includes('BOOKING') || act.includes('RESERVATION_CREATE')) return 'bookings';
    if (act.includes('APPROV') || act.includes('REJECT') || act.includes('CANCEL')) return 'approvals';
    if (act.includes('REGISTER') || act.includes('USER')) return 'registrations';
    if (act.includes('FEEDBACK') || act.includes('RATING')) return 'feedback';
    return 'system';
  };

  // Event Styling and Icon Config
  const getEventConfig = (action) => {
    const act = (action || '').toUpperCase();
    if (act.includes('REGISTER')) {
      return {
        icon: <UserPlus className="w-4 h-4 text-purple-600" />,
        badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
        label: 'User Registered'
      };
    }
    if (act.includes('APPROVED')) {
      return {
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
        badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        label: 'Request Approved'
      };
    }
    if (act.includes('REJECTED')) {
      return {
        icon: <XCircle className="w-4 h-4 text-red-600" />,
        badgeBg: 'bg-red-100 text-red-800 border-red-200',
        label: 'Request Rejected'
      };
    }
    if (act.includes('FEEDBACK')) {
      return {
        icon: <Star className="w-4 h-4 text-amber-600 fill-amber-400" />,
        badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
        label: 'Feedback Submitted'
      };
    }
    if (act.includes('BOOKING') || act.includes('CREATE')) {
      return {
        icon: <Calendar className="w-4 h-4 text-blue-600" />,
        badgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
        label: 'New Booking Created'
      };
    }
    return {
      icon: <Activity className="w-4 h-4 text-slate-600" />,
      badgeBg: 'bg-slate-100 text-slate-700 border-slate-200',
      label: action.replace(/_/g, ' ')
    };
  };

  const filteredActivities = filter === 'all'
    ? activities
    : activities.filter(act => getEventCategory(act.action) === filter);

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-800">Live Activity Feed</h3>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Real-Time Stream
              </span>
            </div>
            <p className="text-xs text-slate-500">Live stream of platform bookings, approvals, users, and feedback</p>
          </div>
        </div>

        {/* Filter Pills & Manual Refresh */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => fetchActivities()}
            className={`p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`}
            title="Refresh Feed"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {['all', 'bookings', 'approvals', 'registrations', 'feedback'].map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                filter === cat
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Feed List */}
      <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
        {loading ? (
          <div className="py-12 text-center text-slate-400 animate-pulse">
            Loading live activity stream...
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            No events logged for this filter category yet.
          </div>
        ) : (
          filteredActivities.slice(0, 15).map(event => {
            const config = getEventConfig(event.action);
            const userName = event.profiles?.name || 'System User';
            const userEmail = event.profiles?.email || '';

            return (
              <div
                key={event.id}
                className="p-4 rounded-2xl bg-slate-50/70 hover:bg-slate-100/80 border border-slate-100 transition-all flex items-start gap-4 group"
              >
                <div className="p-2.5 rounded-xl bg-white shadow-sm shrink-0 border border-slate-100">
                  {config.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border uppercase tracking-wide ${config.badgeBg}`}>
                      {config.label}
                    </span>
                    <span className="text-xs font-semibold text-slate-700">
                      {userName}
                    </span>
                    {userEmail && (
                      <span className="text-[11px] text-slate-400 font-normal truncate">
                        ({userEmail})
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-slate-700 leading-snug">
                    {event.details || event.action}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {getRelativeTime(event.created_at)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LiveActivityFeed;
