import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, Clock, XCircle, ChevronRight } from 'lucide-react';
import api from '../api';

const OrganizerStats = ({ userId }) => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (userId) fetchStats();
  }, [userId]);

  const fetchStats = async () => {
    try {
      const res = await api.get(`/stats/organizer/${userId}`);
      setStats(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  if (!stats) return <div className="text-slate-500 animate-pulse">Loading stats...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-all cursor-pointer">
        <div>
          <p className="text-sm text-slate-500 font-medium mb-1">Upcoming Meetings</p>
          <p className="text-3xl font-black text-slate-800">{stats.upcomingMeetings}</p>
        </div>
        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
          <Calendar className="w-6 h-6" />
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-all cursor-pointer">
        <div>
          <p className="text-sm text-slate-500 font-medium mb-1">Pending Requests</p>
          <p className="text-3xl font-black text-slate-800">{stats.pendingRequests}</p>
        </div>
        <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-colors">
          <Clock className="w-6 h-6" />
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-all cursor-pointer">
        <div>
          <p className="text-sm text-slate-500 font-medium mb-1">Approved Meetings</p>
          <p className="text-3xl font-black text-slate-800">{stats.approvedMeetings}</p>
        </div>
        <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
          <CheckCircle className="w-6 h-6" />
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-all cursor-pointer">
        <div>
          <p className="text-sm text-slate-500 font-medium mb-1">Rejected Meetings</p>
          <p className="text-3xl font-black text-slate-800">{stats.rejectedMeetings}</p>
        </div>
        <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-colors">
          <XCircle className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

export default OrganizerStats;
