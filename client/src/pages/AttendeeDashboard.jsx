import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, CheckCircle, XCircle, LogOut, Mail, Clock, MapPin, LayoutDashboard, Menu } from 'lucide-react';
import api from '../api';
import NotificationBell from '../components/NotificationBell';
import AttendeeStats from '../components/AttendeeStats';
import FeedbackModal from '../components/FeedbackModal';

const AttendeeDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [invitations, setInvitations] = useState([]);
  const [reviewedResIds, setReviewedResIds] = useState([]);
  const [feedbackFor, setFeedbackFor] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'Attendee') {
      navigate('/login');
      return;
    }
    setUser(parsedUser);
    fetchInvitations(parsedUser.id);
    fetchReviewed(parsedUser.id);
  }, [navigate]);

  const fetchInvitations = async (userId) => {
    try {
      const res = await api.get(`/attendees/user/${userId}`);
      setInvitations(res.data || []);
    } catch (error) {
      console.error('Error fetching invitations', error);
    }
  };

  const fetchReviewed = async (userId) => {
    try {
      const res = await api.get(`/feedback/user/${userId}`);
      setReviewedResIds(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRSVP = async (id, status) => {
    try {
      await api.put(`/attendees/${id}/status`, { status });
      if (user) fetchInvitations(user.id);
    } catch (error) {
      console.error('Error updating RSVP', error);
    }
  };

  const handleLogout = async () => {
    try { await api.post('/audit/log', { action: 'LOGOUT', details: 'User logged out' }); } catch (e) { console.error(e); }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Drawer */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col shadow-xl transition-transform duration-300 transform md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:static md:z-auto shrink-0`}>
        <div className="p-6 flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 border border-white/10">
            <span className="text-white font-extrabold text-xl tracking-tighter font-sans">M</span>
          </div>
          <span className="text-xl font-bold tracking-tight">Meera</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
          <button onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }} className={`flex items-center w-full px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <LayoutDashboard className="w-5 h-5 mr-3" /> Dashboard
          </button>
          <button onClick={() => { setActiveTab('invitations'); setIsMobileMenuOpen(false); }} className={`flex items-center w-full px-4 py-3 rounded-xl transition-all ${activeTab === 'invitations' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <Mail className="w-5 h-5 mr-3" /> Meeting Invites
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-slate-400">Attendee</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center w-full px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
            <LogOut className="w-5 h-5 mr-3" /> Logout
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-slate-50/50 flex flex-col">
        <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-4 flex justify-between items-center sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
              className="p-2 text-slate-600 hover:text-slate-900 md:hidden rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Toggle Navigation"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 capitalize">{activeTab === 'dashboard' ? 'Dashboard' : 'My Invitations'}</h2>
          </div>
          <NotificationBell />
        </header>

        <main className="p-4 md:p-8 max-w-5xl mx-auto flex-1 w-full">
          {activeTab === 'dashboard' && user && (
            <AttendeeStats userId={user.id} />
          )}

          {activeTab === 'invitations' && (
            <div className="space-y-4">
                {invitations.map(inv => {
                    const meeting = inv.meetings;
                    const res = meeting?.reservations;
                    const room = res?.rooms;
                    
                    // Check if meeting has ended
                    let isPast = false;
                    if (res?.date && res?.end_time) {
                      const endTime = new Date(`${res.date}T${res.end_time}`);
                      if (endTime < new Date()) {
                        isPast = true;
                      }
                    }
                    const hasReviewed = reviewedResIds.includes(res?.id);

                    return (
                        <div key={inv.id} className={`bg-white p-6 rounded-2xl shadow-sm border flex items-center justify-between ${isPast ? 'border-slate-200 bg-slate-50 opacity-90' : 'border-slate-100'}`}>
                            <div>
                                <h3 className={`text-xl font-bold mb-2 ${isPast ? 'text-slate-600' : 'text-slate-800'}`}>{meeting?.title || 'Untitled Meeting'}</h3>
                                <div className="flex space-x-6 text-sm text-slate-500">
                                    <span className="flex items-center"><CalendarIcon className="w-4 h-4 mr-2 text-indigo-500"/> {new Date(res?.date).toLocaleDateString()}</span>
                                    <span className="flex items-center"><Clock className="w-4 h-4 mr-2 text-indigo-500"/> {res?.start_time} - {res?.end_time}</span>
                                    <span className="flex items-center"><MapPin className="w-4 h-4 mr-2 text-indigo-500"/> {room?.name} ({room?.location})</span>
                                </div>
                            </div>
                            <div className="flex space-x-3 items-center">
                                {isPast && inv.status === 'accepted' ? (
                                    hasReviewed ? (
                                        <span className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl">Feedback Submitted</span>
                                    ) : (
                                        <button onClick={() => setFeedbackFor(res.id)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-bold transition">
                                            Leave Feedback
                                        </button>
                                    )
                                ) : (
                                    <>
                                        {inv.status === 'pending' && (
                                            <>
                                                <button onClick={() => handleRSVP(inv.id, 'accepted')} className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-xl text-sm font-bold transition flex items-center shadow-md shadow-emerald-200">
                                                    <CheckCircle className="w-4 h-4 mr-2" /> Accept
                                                </button>
                                                <button onClick={() => handleRSVP(inv.id, 'declined')} className="bg-red-50 hover:bg-red-100 text-red-600 px-5 py-2 rounded-xl text-sm font-bold transition flex items-center">
                                                    <XCircle className="w-4 h-4 mr-2" /> Decline
                                                </button>
                                            </>
                                        )}
                                        {inv.status === 'accepted' && (
                                            <span className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center border border-emerald-200">
                                                <CheckCircle className="w-4 h-4 mr-2" /> Accepted
                                            </span>
                                        )}
                                        {inv.status === 'declined' && (
                                            <span className="bg-red-100 text-red-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center border border-red-200">
                                                <XCircle className="w-4 h-4 mr-2" /> Declined
                                            </span>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
                {invitations.length === 0 && (
                    <div className="text-center py-12 text-slate-500 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        You have no meeting invitations.
                    </div>
                )}
            </div>
          )}

          {feedbackFor && (
             <FeedbackModal 
                role="Attendee" 
                reservationId={feedbackFor} 
                userId={user.id} 
                onClose={() => setFeedbackFor(null)} 
                onSuccess={() => {
                  setFeedbackFor(null);
                  fetchReviewed(user.id);
                }} 
             />
          )}
        </main>
      </div>
    </div>
  );
};

export default AttendeeDashboard;
