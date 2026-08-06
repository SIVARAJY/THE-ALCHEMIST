import React from 'react';
import { Calendar, Clock, MapPin, User, Layers } from 'lucide-react';

const AttendeeTodayAgenda = ({ invitations = [] }) => {
  const now = new Date();
  const todayStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split('T')[0];

  // Filter today's accepted invitations
  const todaysAgenda = invitations.filter(inv => {
    const res = inv.meetings?.reservations;
    return inv.status === 'accepted' && res?.date === todayStr;
  });

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">My Today's Agenda</h3>
            <p className="text-xs text-slate-500">Accepted meeting schedule and room locations for today</p>
          </div>
        </div>
        <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
          {now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
        </span>
      </div>

      {/* Cards List */}
      <div className="space-y-4">
        {todaysAgenda.length === 0 ? (
          <div className="py-8 text-center text-slate-400 bg-slate-50/70 rounded-2xl border border-slate-100">
            <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium">No accepted meetings scheduled for today.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {todaysAgenda.map(inv => {
              const meeting = inv.meetings;
              const res = meeting?.reservations;
              const room = res?.rooms;
              const organizer = res?.profiles;

              return (
                <div key={inv.id} className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 hover:shadow-md transition-all space-y-3">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-slate-800 text-base">{meeting?.title || 'Untitled Meeting'}</h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase tracking-wider">
                      Today
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>{res?.start_time} - {res?.end_time}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>{room?.name || 'Room'} ({room?.location || ''})</span>
                    </div>

                    {room?.floor && (
                      <div className="flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>Floor {room.floor}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Organizer: <strong>{organizer?.name || 'Faculty / Organizer'}</strong> ({organizer?.email || ''})</span>
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

export default AttendeeTodayAgenda;
