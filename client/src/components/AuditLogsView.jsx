import React, { useState, useEffect } from 'react';
import { Search, LogIn, LogOut, CalendarPlus, CheckCircle, XCircle, X as XIcon, RefreshCw, FileText } from 'lucide-react';
import api from '../api';

const ACTION_STYLES = {
  LOGIN: { bg: 'bg-blue-100', text: 'text-blue-700', icon: LogIn },
  LOGOUT: { bg: 'bg-slate-100', text: 'text-slate-700', icon: LogOut },
  RESERVATION_CREATED: { bg: 'bg-indigo-100', text: 'text-indigo-700', icon: CalendarPlus },
  RESERVATION_APPROVED: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle },
  RESERVATION_REJECTED: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
  RESERVATION_MODIFICATION_REQUESTED: { bg: 'bg-amber-100', text: 'text-amber-700', icon: RefreshCw },
  RESERVATION_CANCELLED: { bg: 'bg-red-100', text: 'text-red-600', icon: XIcon },
};

const AuditLogsView = () => {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async (searchTerm) => {
    setLoading(true);
    try {
      const params = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : '';
      const res = await api.get(`/audit${params}`);
      setLogs(res.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchLogs(search);
  };

  const clearSearch = () => {
    setSearch('');
    fetchLogs();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-700">System Audit Logs</h3>
        <span className="text-sm text-slate-400">{logs.length} records</span>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by user name, email, action, or details..."
            className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white shadow-sm"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button type="submit" className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition font-semibold shadow-md shadow-indigo-200">
          Search
        </button>
        {search && (
          <button type="button" onClick={clearSearch} className="px-4 py-3 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition font-medium">
            Clear
          </button>
        )}
      </form>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 animate-pulse">Loading logs...</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-600">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {logs.map(log => {
                const style = ACTION_STYLES[log.action] || { bg: 'bg-slate-100', text: 'text-slate-700', icon: FileText };
                const Icon = style.icon;
                
                return (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-800">{log.profiles?.name || 'Unknown'}</p>
                        <p className="text-xs text-slate-400">{log.profiles?.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold ${style.bg} ${style.text}`}>
                        <Icon className="w-3.5 h-3.5 mr-1.5" />
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 max-w-sm truncate">{log.details || '—'}</td>
                  </tr>
                );
              })}
              {logs.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-16 text-center text-slate-400">
                    {search ? 'No logs matching your search.' : 'No audit logs recorded yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AuditLogsView;
