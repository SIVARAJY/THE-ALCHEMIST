import React, { useState, useEffect } from 'react';
import { Building, Monitor, Calendar, Users, Clock, History } from 'lucide-react';
import api from '../api';
import LiveActivityFeed from './LiveActivityFeed';
import CampusLiveOccupancyBar from './CampusLiveOccupancyBar';

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

      {/* Campus Live Occupancy Bar Gauge */}
      <CampusLiveOccupancyBar
        totalRooms={stats.totalRooms || 0}
        activeTodayRooms={stats.activeTodayRooms || 0}
        occupancyPercentage={stats.occupancyPercentage || 0}
        occupiedRightNow={stats.occupiedRightNow || 0}
      />

      {/* Live Real-Time Activity Stream Feed */}
      <LiveActivityFeed />
    </div>
  );
};

export default AdminStats;
