import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Users, Calendar, AlertCircle, Sparkles } from 'lucide-react';
import api from '../api';

const TodayMeetingTimeline = ({ userId }) => {
  const [todaysMeetings, setTodaysMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    if (userId) fetchTodaysMeetings();

    // Timer ticker every 10 seconds to update countdowns
    const timer = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(timer);
  }, [userId]);

  const fetchTodaysMeetings = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/reservations/organizer/${userId}`);
      const todayStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split('T')[0];

      // Filter today's approved reservations
      const todayList = (res.data || []).filter(r => r.date === todayStr && r.status === 'approved');

      // Sort by start_time ascending
      todayList.sort((a, b) => a.start_time.localeCompare(b.start_time));
      setTodaysMeetings(todayList);
    } catch (err) {
      console.error('Error fetching today timeline:', err);
    } finally {
      setLoading(false);
    }
  };

  // Countdown Helper
  const getCountdownStatus = (startTimeStr, endTimeStr) => {
    const [sH, sM] = startTimeStr.split(':');
    const [eH, eM] = endTimeStr.split(':');

    const startTime = new Date();
    startTime.setHours(parseInt(sH, 10), parseInt(sM, 10), 0, 0);

    const endTime = new Date();
    endTime.setHours(parseInt(eH, 10), parseInt(eM, 10), 0, 0);

    const diffMs = startTime - now;
    const diffMins = Math.round(diffMs / 60000);

    if (now > endTime) {
      return { label: 'Completed', color: 'bg-slate-100 text-slate-500 border-slate-200' };
    }
    if (now >= startTime && now <= endTime) {
      return { label: '🔥 In Progress Now', color: 'bg-emerald-100 text-emerald-700 border-emerald-300 animate-pulse' };
    }
    if (diffMins > 0 && diffMins <= 60) {
      return { label: `⏳ Starts in ${diffMins} mins`, color: 'bg-amber-100 text-amber-800 border-amber-300 font-bold' };
    }
    if (diffMins > 60) {
      const hours = (diffMins / 60).toFixed(1);
      return { label: `Starts in ${hours} hrs`, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    }
    return { label: 'Scheduled', color: 'bg-slate-100 text-slate-600 border-slate-200' };
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Today's Meeting Timeline</h3>
            <p className="text-xs text-slate-500">Chronological schedule with live countdown timers for today</p>
          </div>
        </div>
        <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
          {now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
        </span>
      </div>

      {/* Timeline List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-8 text-center text-slate-400 animate-pulse">Loading today's schedule...</div>
        ) : todaysMeetings.length === 0 ? (
          <div className="py-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
            <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium">No approved meetings scheduled for today.</p>
            <p className="text-xs text-slate-400 mt-1">Use the Quick Booking Wizard below to schedule one!</p>
          </div>
        ) : (
          <div className="relative pl-6 border-l-2 border-indigo-100 space-y-6">
            {todaysMeetings.map((res) => {
              const countdown = getCountdownStatus(res.start_time, res.end_time);
              const title = res.meetings?.[0]?.title || 'Untitled Meeting';
              const roomName = res.rooms?.name || 'Room';
              const roomLoc = res.rooms?.location || '';

              return (
                <div key={res.id} className="relative group">
                  {/* Timeline Dot */}
                  <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-white bg-indigo-600 shadow-sm group-hover:scale-125 transition-transform"></div>

                  {/* Meeting Card */}
                  <div className="bg-slate-50/70 hover:bg-white p-4 rounded-2xl border border-slate-100 hover:shadow-md transition-all">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                      <h4 className="font-bold text-slate-800 text-base">{title}</h4>
                      <span className={`px-3 py-1 rounded-full text-xs border ${countdown.color}`}>
                        {countdown.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1 font-medium text-slate-700">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{res.start_time} - {res.end_time}</span>
                      </div>

                      <div className="flex items-center gap-1 font-medium text-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        <span>{roomName} {roomLoc && `(${roomLoc})`}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TodayMeetingTimeline;
