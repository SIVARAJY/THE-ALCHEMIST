import React, { useState, useEffect } from 'react';
import { Building, Monitor, Calendar, Users, Clock, History } from 'lucide-react';
import api from '../api';

const AdminStats = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/stats/admin');
      setStats(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  if (!stats) return <div className="text-slate-500 animate-pulse">Loading stats...</div>;

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center transition-transform hover:scale-105">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Building className="text-blue-600 w-6 h-6"/>
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Rooms</p>
              <p className="text-3xl font-bold text-slate-800">{stats.totalRooms}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center transition-transform hover:scale-105">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Monitor className="text-purple-600 w-6 h-6"/>
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Resources</p>
              <p className="text-3xl font-bold text-slate-800">{stats.totalResources}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center transition-transform hover:scale-105">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Clock className="text-amber-600 w-6 h-6"/>
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Pending Requests</p>
              <p className="text-3xl font-bold text-slate-800">{stats.pendingRequests}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center transition-transform hover:scale-105">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Calendar className="text-emerald-600 w-6 h-6"/>
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Today's Meetings</p>
              <p className="text-3xl font-bold text-slate-800">{stats.todaysMeetings}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-8 rounded-3xl shadow-lg text-white flex flex-col justify-center">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-indigo-50">Active Users</h3>
            <Users className="w-8 h-8 text-indigo-200 opacity-80" />
          </div>
          <p className="text-5xl font-black mb-2">{stats.activeUsers}</p>
          <p className="text-indigo-100 text-sm">Registered across the system</p>
        </div>

        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 p-6 overflow-hidden">
          <div className="flex items-center mb-6">
            <History className="w-5 h-5 text-indigo-500 mr-2" />
            <h3 className="text-lg font-bold text-slate-800">Recent Reservations</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <tbody className="divide-y divide-slate-50">
                {stats.recentReservations?.map(res => (
                  <tr key={res.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-2 font-medium text-slate-800">{res.profiles?.name}</td>
                    <td className="py-3 px-2 text-slate-500">{res.rooms?.name}</td>
                    <td className="py-3 px-2 text-slate-500 text-sm">{new Date(res.date).toLocaleDateString()}</td>
                    <td className="py-3 px-2 text-right">
                      <span className={`inline-flex px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        res.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                        res.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        res.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {res.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!stats.recentReservations || stats.recentReservations.length === 0) && (
                  <tr><td colSpan="4" className="py-4 text-center text-slate-400">No recent reservations</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStats;
