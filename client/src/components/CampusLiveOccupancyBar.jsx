import React from 'react';
import { Building2, CheckCircle2, Clock, Activity, ShieldAlert } from 'lucide-react';

const CampusLiveOccupancyBar = ({ totalRooms = 0, activeTodayRooms = 0, occupancyPercentage = 0, occupiedRightNow = 0 }) => {
  const percent = Math.min(100, Math.max(0, occupancyPercentage || 0));
  const availableCount = Math.max(0, totalRooms - activeTodayRooms);

  // Status Badge Helper
  const getStatusBadge = (p) => {
    if (p >= 75) {
      return {
        label: 'Peak Occupancy — High Demand',
        colorClass: 'bg-red-50 text-red-700 border-red-200',
        barGradient: 'from-amber-500 via-orange-500 to-red-600',
        icon: <ShieldAlert className="w-4 h-4 text-red-600" />
      };
    }
    if (p >= 35) {
      return {
        label: 'Optimal Campus Utilization',
        colorClass: 'bg-amber-50 text-amber-700 border-amber-200',
        barGradient: 'from-emerald-400 via-amber-400 to-orange-500',
        icon: <Clock className="w-4 h-4 text-amber-600" />
      };
    }
    return {
      label: 'Low Occupancy — High Availability',
      colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      barGradient: 'from-teal-400 to-emerald-500',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />
    };
  };

  const status = getStatusBadge(percent);

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-800">Campus Live Occupancy Bar</h3>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Live Utilization
              </span>
            </div>
            <p className="text-xs text-slate-500">Overall campus room utilization and availability metrics right now</p>
          </div>
        </div>

        {/* Status Badge */}
        <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border ${status.colorClass}`}>
          {status.icon}
          <span>{status.label}</span>
        </div>
      </div>

      {/* Progress Gauge Section */}
      <div className="space-y-2">
        <div className="flex justify-between items-end">
          <div>
            <span className="text-4xl font-black text-slate-900 tracking-tight">{percent}%</span>
            <span className="text-sm font-semibold text-slate-500 ml-2">Rooms Occupied Today</span>
          </div>
          <div className="text-xs text-slate-400 font-medium">
            {activeTodayRooms} of {totalRooms} Campus Rooms Reserved
          </div>
        </div>

        {/* Bar Track */}
        <div className="w-full bg-slate-100 h-5 rounded-2xl overflow-hidden p-1 border border-slate-200/60 shadow-inner">
          <div
            className={`h-full rounded-xl bg-gradient-to-r ${status.barGradient} transition-all duration-1000 ease-out shadow-sm`}
            style={{ width: `${Math.max(5, percent)}%` }}
          ></div>
        </div>
      </div>

      {/* Quick Metrics Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
        <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100 text-center">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Rooms</p>
          <p className="text-xl font-bold text-slate-800 mt-0.5">{totalRooms}</p>
        </div>
        <div className="bg-amber-50/50 p-3.5 rounded-2xl border border-amber-100 text-center">
          <p className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider">Occupied Today</p>
          <p className="text-xl font-bold text-amber-900 mt-0.5">{activeTodayRooms}</p>
        </div>
        <div className="bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-100 text-center">
          <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">Available Free</p>
          <p className="text-xl font-bold text-emerald-900 mt-0.5">{availableCount}</p>
        </div>
        <div className="bg-indigo-50/50 p-3.5 rounded-2xl border border-indigo-100 text-center">
          <p className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider">In-Use Right Now</p>
          <p className="text-xl font-bold text-indigo-900 mt-0.5">{occupiedRightNow}</p>
        </div>
      </div>
    </div>
  );
};

export default CampusLiveOccupancyBar;
