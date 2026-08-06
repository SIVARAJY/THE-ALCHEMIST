import React, { useState, useEffect } from 'react';
import { Mail, AlertTriangle, Clock, RefreshCw, XCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import api from '../api';

const ActionRequiredCards = ({ userId, onActionCompleted }) => {
  const [actionableList, setActionableList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modifyingRes, setModifyingRes] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');

  useEffect(() => {
    if (userId) fetchActionable();
  }, [userId]);

  const fetchActionable = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/reservations/organizer/${userId}`);
      const list = (res.data || []).filter(r => r.status === 'needs_modification' || r.status === 'pending');
      setActionableList(list);
    } catch (err) {
      console.error('Error fetching actionable reservations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this reservation request?')) return;
    try {
      await api.delete(`/reservations/${id}`);
      fetchActionable();
      if (onActionCompleted) onActionCompleted();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to cancel reservation');
    }
  };

  const handleOpenModifyModal = (res) => {
    setModifyingRes(res);
    setNewTitle(res.meetings?.[0]?.title || '');
    setNewDate(res.date);
    setNewStartTime(res.start_time);
    setNewEndTime(res.end_time);
  };

  const handleResubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/reservations/${modifyingRes.id}/status`, {
        status: 'pending',
        date: newDate,
        start_time: newStartTime,
        end_time: newEndTime,
        admin_notes: null
      });
      setModifyingRes(null);
      fetchActionable();
      if (onActionCompleted) onActionCompleted();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to resubmit reservation');
    }
  };

  if (loading || actionableList.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
        <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
          <Mail className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800">Interactive Action Cards</h3>
          <p className="text-xs text-slate-500">Bookings requiring your attention or awaiting admin approval</p>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {actionableList.map(res => {
          const isMod = res.status === 'needs_modification';
          const title = res.meetings?.[0]?.title || 'Untitled Meeting';
          const roomName = res.rooms?.name || 'Room';

          return (
            <div
              key={res.id}
              className={`p-4 rounded-2xl border transition-all ${
                isMod
                  ? 'bg-amber-50/60 border-amber-200'
                  : 'bg-indigo-50/40 border-indigo-100'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wider ${
                  isMod
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-indigo-100 text-indigo-800 border-indigo-200'
                }`}>
                  {isMod ? 'Modification Requested' : 'Pending Admin Approval'}
                </span>

                <button
                  onClick={() => handleCancel(res.id)}
                  className="text-xs text-slate-400 hover:text-red-600 transition"
                  title="Cancel Request"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>

              <h4 className="font-bold text-slate-800 text-base mb-1">{title}</h4>
              <p className="text-xs text-slate-600 mb-2">
                <strong>Room:</strong> {roomName} | <strong>Date:</strong> {res.date} ({res.start_time} - {res.end_time})
              </p>

              {/* Admin Notes Box */}
              {isMod && res.admin_notes && (
                <div className="p-2.5 bg-amber-100/70 border border-amber-200 rounded-xl text-xs text-amber-900 mb-3">
                  <strong>Admin Note:</strong> "{res.admin_notes}"
                </div>
              )}

              {/* Action Button */}
              {isMod ? (
                <button
                  onClick={() => handleOpenModifyModal(res)}
                  className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Modify & Resubmit Request
                </button>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-indigo-700 font-medium">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Awaiting Admin Review</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modify Modal */}
      {modifyingRes && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Resubmit Reservation Request</h3>
            <p className="text-xs text-slate-500">Update details according to admin notes and resubmit for approval.</p>

            <form onSubmit={handleResubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Date</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={newStartTime}
                    onChange={e => setNewStartTime(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">End Time</label>
                  <input
                    type="time"
                    value={newEndTime}
                    onChange={e => setNewEndTime(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModifyingRes(null)}
                  className="flex-1 py-2 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md"
                >
                  Resubmit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionRequiredCards;
