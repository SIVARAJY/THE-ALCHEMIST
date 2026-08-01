import React, { useState, useEffect } from 'react';
import { Clock, Users, CheckCircle, XCircle, AlertCircle, Loader, PlayCircle, CalendarX2 } from 'lucide-react';
import api from '../api';

const STATUS_STYLES = {
  completed: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle, label: 'Completed' },
  in_progress: { bg: 'bg-blue-100', text: 'text-blue-700', icon: PlayCircle, label: 'In Progress' },
  upcoming: { bg: 'bg-indigo-100', text: 'text-indigo-700', icon: Clock, label: 'Upcoming' },
  pending: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Loader, label: 'Pending Approval' },
  rejected: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle, label: 'Rejected' },
  cancelled: { bg: 'bg-slate-200', text: 'text-slate-600', icon: CalendarX2, label: 'Cancelled' },
};

const MeetingRecords = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const res = await api.get('/records');
      setRecords(res.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = filter === 'all' ? records : records.filter(r => r.completionStatus === filter);

  const formatDuration = (mins) => {
    if (!mins) return '—';
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  if (loading) return <div className="text-slate-400 animate-pulse py-12 text-center">Loading meeting records...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-700">Meeting Records</h3>
        <span className="text-sm text-slate-400">{filtered.length} of {records.length} meetings</span>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'All' },
          { key: 'completed', label: 'Completed' },
          { key: 'in_progress', label: 'In Progress' },
          { key: 'upcoming', label: 'Upcoming' },
          { key: 'pending', label: 'Pending' },
          { key: 'rejected', label: 'Rejected' },
          { key: 'cancelled', label: 'Cancelled' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${filter === f.key ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-4">Meeting</th>
                <th className="px-5 py-4">Organizer</th>
                <th className="px-5 py-4">Room</th>
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4">Time</th>
                <th className="px-5 py-4">Duration</th>
                <th className="px-5 py-4">Attendance</th>
                <th className="px-5 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((rec, idx) => {
                const style = STATUS_STYLES[rec.completionStatus] || STATUS_STYLES.pending;
                const Icon = style.icon;
                const att = rec.attendance;

                return (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-800 text-sm">{rec.title}</p>
                      {rec.meetingId && <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {rec.meetingId.slice(0, 8)}...</p>}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-700 text-sm">{rec.organizer}</p>
                      <p className="text-[11px] text-slate-400">{rec.organizerEmail}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-700 text-sm">{rec.room}</p>
                      {rec.roomLocation && <p className="text-[11px] text-slate-400">{rec.roomLocation}</p>}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600 whitespace-nowrap">
                      {new Date(rec.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600 whitespace-nowrap">
                      {rec.startTime} – {rec.endTime}
                    </td>
                    <td className="px-5 py-4 text-sm font-medium text-slate-700 whitespace-nowrap">
                      {formatDuration(rec.duration)}
                    </td>
                    <td className="px-5 py-4">
                      {att.totalInvited > 0 ? (
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4 text-slate-400 mr-1" />
                          <span className="text-emerald-600 font-bold text-xs">{att.accepted}</span>
                          <span className="text-slate-300 text-xs">/</span>
                          <span className="text-amber-500 font-bold text-xs">{att.pending}</span>
                          <span className="text-slate-300 text-xs">/</span>
                          <span className="text-red-500 font-bold text-xs">{att.declined}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No attendees</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold ${style.bg} ${style.text}`}>
                        <Icon className="w-3.5 h-3.5 mr-1.5" />
                        {style.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-6 py-16 text-center text-slate-400">
                    {filter !== 'all' ? `No ${filter.replace('_', ' ')} meetings.` : 'No meeting records found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Attendance Legend */}
      <div className="flex items-center space-x-6 text-xs text-slate-500 px-2">
        <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span>Accepted</span>
        <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-amber-500 mr-1.5"></span>Pending</span>
        <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-red-500 mr-1.5"></span>Declined</span>
      </div>
    </div>
  );
};

export default MeetingRecords;
