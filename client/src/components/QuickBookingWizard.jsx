import React, { useState, useEffect } from 'react';
import { Zap, Calendar, Clock, Building, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../api';

const QuickBookingWizard = ({ userId, onBookingCreated }) => {
  const [rooms, setRooms] = useState([]);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await api.get('/rooms');
      setRooms(res.data || []);
      if (res.data && res.data.length > 0) {
        setSelectedRoomId(res.data[0].id);
      }
    } catch (err) {
      console.error('Error fetching rooms for quick wizard:', err);
    }
  };

  const handleQuickBook = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);

    if (!title || !selectedRoomId || !date || !startTime || !endTime) {
      setError('Please fill in all quick booking fields.');
      setSubmitting(false);
      return;
    }

    try {
      await api.post('/reservations', {
        organizer_id: userId,
        room_id: selectedRoomId,
        date,
        start_time: startTime,
        end_time: endTime,
        title,
        resources: [],
        attendees: ''
      });

      setMessage('🚀 Reservation request submitted instantly!');
      setTitle('');
      if (onBookingCreated) onBookingCreated();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit quick booking request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-3xl shadow-xl p-6 space-y-5 border border-indigo-500/20">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-400/20">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Quick Booking Wizard</h3>
            <p className="text-xs text-indigo-200/70">Instant 1-click room reservation widget</p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 uppercase tracking-wider">
          Instant
        </span>
      </div>

      {/* Messages */}
      {message && (
        <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-200 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{message}</span>
        </div>
      )}
      {error && (
        <div className="p-3 bg-rose-500/20 border border-rose-500/30 rounded-xl text-rose-200 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleQuickBook} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
        {/* Title */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-indigo-200 mb-1">Meeting Title</label>
          <input
            type="text"
            placeholder="e.g. Project Sprint Sync"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white/10 border border-white/15 rounded-xl text-white text-sm placeholder-indigo-200/40 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            required
          />
        </div>

        {/* Room */}
        <div>
          <label className="block text-xs font-medium text-indigo-200 mb-1">Select Room</label>
          <select
            value={selectedRoomId}
            onChange={e => setSelectedRoomId(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-800 border border-white/15 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
            required
          >
            {rooms.map(r => (
              <option key={r.id} value={r.id}>{r.name} (Cap: {r.capacity})</option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div>
          <label className="block text-xs font-medium text-indigo-200 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-800 border border-white/15 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
            required
          />
        </div>

        {/* Submit */}
        <div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5 fill-white" />
            {submitting ? 'Booking...' : 'Instant Book'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuickBookingWizard;
