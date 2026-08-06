import React from 'react';
import { Mail, CheckCircle, XCircle, Clock, MapPin } from 'lucide-react';

const QuickRSVPCards = ({ invitations = [], onRSVP }) => {
  // Filter pending invitations
  const pendingInvites = invitations.filter(inv => inv.status === 'pending');

  if (pendingInvites.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
        <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
          <Mail className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800">Quick RSVP Cards</h3>
          <p className="text-xs text-slate-500">Pending meeting invitations requiring your response</p>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pendingInvites.map(inv => {
          const meeting = inv.meetings;
          const res = meeting?.reservations;
          const room = res?.rooms;
          const organizer = res?.profiles;

          return (
            <div key={inv.id} className="p-4 rounded-2xl bg-purple-50/40 border border-purple-100 space-y-3">
              <div className="flex justify-between items-start">
                <h4 className="font-bold text-slate-800 text-base">{meeting?.title || 'Untitled Meeting'}</h4>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 uppercase tracking-wider">
                  Pending RSVP
                </span>
              </div>

              <div className="space-y-1 text-xs text-slate-600">
                <p><Clock className="w-3.5 h-3.5 inline mr-1 text-indigo-500" /> {res?.date} ({res?.start_time} - {res?.end_time})</p>
                <p><MapPin className="w-3.5 h-3.5 inline mr-1 text-rose-500" /> {room?.name || 'Room'} ({room?.location || ''})</p>
                {organizer?.name && <p className="text-slate-500">Invited by: <strong>{organizer.name}</strong></p>}
              </div>

              {/* Instant RSVP Action Buttons */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => onRSVP(inv.id, 'accepted')}
                  className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1"
                >
                  <CheckCircle className="w-4 h-4" /> Accept
                </button>
                <button
                  onClick={() => onRSVP(inv.id, 'declined')}
                  className="flex-1 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1"
                >
                  <XCircle className="w-4 h-4" /> Decline
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QuickRSVPCards;
