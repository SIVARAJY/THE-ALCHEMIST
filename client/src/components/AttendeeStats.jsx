import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, Clock, CalendarDays } from 'lucide-react';
import api from '../api';

const AttendeeStats = ({ userId }) => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (userId) fetchStats();
  }, [userId]);

  const fetchStats = async () => {
    try {
      const res = await api.get(`/stats/attendee/${userId}`);
      setStats(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  if (!stats) return <div className="text-slate-500 animate-pulse">Loading stats...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-gradient-to-br from-indigo-500 to-blue-600 p-6 rounded-3xl shadow-lg text-white flex flex-col justify-between hover:scale-105 transition-transform cursor-pointer">
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm"><Calendar className="w-6 h-6 text-white"/></div>
          <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">Today</span>
        </div>
        <div>
          <p className="text-4xl font-black mb-1">{stats.todaysMeetings}</p>
          <p className="text-indigo-100 font-medium text-sm">Today's Meetings</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-all cursor-pointer">
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-slate-50 rounded-2xl"><CalendarDays className="w-6 h-6 text-indigo-500"/></div>
        </div>
        <div>
          <p className="text-4xl font-black text-slate-800 mb-1">{stats.upcomingMeetings}</p>
          <p className="text-slate-500 font-medium text-sm">Upcoming Meetings</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-all cursor-pointer">
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-emerald-50 rounded-2xl"><CheckCircle className="w-6 h-6 text-emerald-500"/></div>
        </div>
        <div>
          <p className="text-4xl font-black text-slate-800 mb-1">{stats.acceptedInvitations}</p>
          <p className="text-slate-500 font-medium text-sm">Accepted Invitations</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-all cursor-pointer">
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-amber-50 rounded-2xl"><Clock className="w-6 h-6 text-amber-500"/></div>
        </div>
        <div>
          <p className="text-4xl font-black text-slate-800 mb-1">{stats.pendingInvitations}</p>
          <p className="text-slate-500 font-medium text-sm">Pending Invitations</p>
        </div>
      </div>
    </div>
  );
};

export default AttendeeStats;
