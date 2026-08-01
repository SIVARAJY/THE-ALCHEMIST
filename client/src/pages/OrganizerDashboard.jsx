import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, Search, CheckCircle, Clock, XCircle, LogOut, Plus, CalendarDays, AlertCircle, Menu, LayoutDashboard } from 'lucide-react';
import api from '../api';
import CalendarView from '../components/CalendarView';
import NotificationBell from '../components/NotificationBell';
import OrganizerStats from '../components/OrganizerStats';
import FeedbackModal from '../components/FeedbackModal';

const OrganizerDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useState({ date: '', startTime: '', endTime: '', capacity: '1' });
  const [availableRooms, setAvailableRooms] = useState([]);
  const [searched, setSearched] = useState(false);

  const [selectedRoom, setSelectedRoom] = useState(null);
  const [bookingForm, setBookingForm] = useState({ title: '', attendees: '', resources: [] });
  const [allResources, setAllResources] = useState([]);
  
  const [myReservations, setMyReservations] = useState([]);
  const [reviewedResIds, setReviewedResIds] = useState([]);
  const [feedbackFor, setFeedbackFor] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'Organizer') {
      navigate('/login');
      return;
    }
    setUser(parsedUser);
    fetchResources();
    fetchMyReservations(parsedUser.id);
    fetchReviewed(parsedUser.id);
  }, [navigate]);

  const fetchReviewed = async (userId) => {
    try {
      const res = await api.get(`/feedback/user/${userId}`);
      setReviewedResIds(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchResources = async () => {
    try {
      const res = await api.get('/resources');
      setAllResources(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMyReservations = async (userId) => {
    try {
      const res = await api.get(`/reservations/organizer/${userId}`);
      setMyReservations(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      const res = await api.get('/reservations/available-rooms', { params: searchParams });
      setAvailableRooms(res.data);
      setSearched(true);
    } catch (error) {
      console.error(error);
    }
  };

  const [editingRes, setEditingRes] = useState(null);
  const [editForm, setEditForm] = useState({ date: '', start_time: '', end_time: '', room_id: '' });

  const handleBook = async (e) => {
    e.preventDefault();
    try {
      await api.post('/reservations', {
        organizer_id: user.id,
        room_id: selectedRoom.id,
        date: searchParams.date,
        start_time: searchParams.startTime,
        end_time: searchParams.endTime,
        title: bookingForm.title,
        resources: bookingForm.resources,
        attendees: bookingForm.attendees
      });
      alert('Reservation submitted for approval!');
      setSelectedRoom(null);
      setBookingForm({ title: '', attendees: '', resources: [] });
      fetchMyReservations(user.id);
      setActiveTab('my-reservations');
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || 'Failed to book room');
    }
  };

  const handleResubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/reservations/${editingRes.id}`, editForm);
      alert('Reservation updated and resubmitted successfully!');
      setEditingRes(null);
      fetchMyReservations(user.id);
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || 'Failed to update reservation');
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
          <button onClick={() => { setActiveTab('search'); setIsMobileMenuOpen(false); }} className={`flex items-center w-full px-4 py-3 rounded-xl transition-all ${activeTab === 'search' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <Search className="w-5 h-5 mr-3" /> Book a Room
          </button>
          <button onClick={() => { setActiveTab('calendar'); setIsMobileMenuOpen(false); }} className={`flex items-center w-full px-4 py-3 rounded-xl transition-all ${activeTab === 'calendar' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <CalendarDays className="w-5 h-5 mr-3" /> Calendar View
          </button>
          <button onClick={() => { setActiveTab('my-reservations'); setIsMobileMenuOpen(false); }} className={`flex items-center w-full px-4 py-3 rounded-xl transition-all ${activeTab === 'my-reservations' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <Clock className="w-5 h-5 mr-3" /> My Reservations
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold">
              {user?.name?.charAt(0) || 'O'}
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-slate-400">Organizer</p>
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
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 capitalize">{activeTab.replace('-', ' ')}</h2>
          </div>
          <NotificationBell />
        </header>

        <main className="p-4 md:p-8 max-w-5xl mx-auto flex-1 w-full">
          {activeTab === 'dashboard' && user && (
            <OrganizerStats userId={user.id} />
          )}

          {activeTab === 'calendar' && <CalendarView />}
          
          {activeTab === 'search' && !selectedRoom && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-slate-600 mb-1">Date</label>
                    <input type="date" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500" value={searchParams.date} onChange={e => setSearchParams({...searchParams, date: e.target.value})} required />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-slate-600 mb-1">Start Time</label>
                    <input type="time" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500" value={searchParams.startTime} onChange={e => setSearchParams({...searchParams, startTime: e.target.value})} required />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-slate-600 mb-1">End Time</label>
                    <input type="time" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500" value={searchParams.endTime} onChange={e => setSearchParams({...searchParams, endTime: e.target.value})} required />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-slate-600 mb-1">Capacity</label>
                    <input type="number" min="1" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500" value={searchParams.capacity} onChange={e => setSearchParams({...searchParams, capacity: e.target.value})} required />
                  </div>
                  <div className="col-span-1">
                    <button type="submit" className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center justify-center font-medium">
                      <Search className="w-4 h-4 mr-2" /> Search
                    </button>
                  </div>
                </form>
              </div>

              {searched && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {availableRooms.map(room => (
                    <div key={room.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                      <h3 className="text-lg font-bold text-slate-800 mb-1">{room.name}</h3>
                      <p className="text-slate-500 text-sm mb-4">{room.location} • Floor {room.floor}</p>
                      <div className="flex justify-between items-center mt-auto">
                        <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-semibold">{room.capacity} Seats</span>
                        <button onClick={() => setSelectedRoom(room)} className="text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg text-sm font-medium transition">
                          Book Room
                        </button>
                      </div>
                    </div>
                  ))}
                  {availableRooms.length === 0 && (
                    <div className="col-span-3 text-center py-12 text-slate-500">
                      No rooms available for this time slot. Try adjusting your search.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'search' && selectedRoom && (
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 max-w-2xl mx-auto">
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                <h3 className="text-2xl font-bold text-slate-800">Complete Reservation</h3>
                <button onClick={() => setSelectedRoom(null)} className="text-slate-400 hover:text-slate-600">Cancel</button>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-xl mb-6">
                <p className="font-semibold text-slate-700">{selectedRoom.name}</p>
                <p className="text-sm text-slate-500">{searchParams.date} | {searchParams.startTime} - {searchParams.endTime}</p>
              </div>

              <form onSubmit={handleBook} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Meeting Title</label>
                  <input type="text" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500" value={bookingForm.title} onChange={e => setBookingForm({...bookingForm, title: e.target.value})} required />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Invite Attendees (Emails separated by comma)</label>
                  <textarea className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500" rows="2" placeholder="alice@college.edu, bob@college.edu" value={bookingForm.attendees} onChange={e => setBookingForm({...bookingForm, attendees: e.target.value})}></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Required Resources</label>
                  <div className="grid grid-cols-2 gap-3">
                    {allResources.map(res => (
                      <label key={res.id} className="flex items-center space-x-3 bg-slate-50 p-3 rounded-lg border border-slate-100 cursor-pointer hover:bg-slate-100">
                        <input type="checkbox" className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" 
                          checked={bookingForm.resources.includes(res.id)}
                          onChange={(e) => {
                            if (e.target.checked) setBookingForm({...bookingForm, resources: [...bookingForm.resources, res.id]});
                            else setBookingForm({...bookingForm, resources: bookingForm.resources.filter(id => id !== res.id)});
                          }}
                        />
                        <span className="text-slate-700 text-sm font-medium">{res.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button type="submit" className="w-full bg-indigo-600 text-white px-4 py-3 rounded-xl hover:bg-indigo-700 transition font-bold text-lg shadow-lg shadow-indigo-200">
                  Submit Request
                </button>
              </form>
            </div>
          )}

          {activeTab === 'my-reservations' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-600">
                  <tr>
                    <th className="px-6 py-4">Meeting Title</th>
                    <th className="px-6 py-4">Room</th>
                    <th className="px-6 py-4">Date & Time</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myReservations.map(res => {
                    let isPast = false;
                    if (res?.date && res?.end_time) {
                      const endTime = new Date(`${res.date}T${res.end_time}`);
                      if (endTime < new Date()) isPast = true;
                    }
                    const hasReviewed = reviewedResIds.includes(res.id);

                    return (
                    <React.Fragment key={res.id}>
                    <tr className={`transition-colors ${isPast ? 'bg-slate-50/50' : 'hover:bg-slate-50'}`}>
                      <td className="px-6 py-4 font-medium text-slate-800">{res.meetings?.[0]?.title}</td>
                      <td className="px-6 py-4 text-slate-600">{res.rooms?.name}</td>
                      <td className="px-6 py-4 text-slate-600">
                        <p>{new Date(res.date).toLocaleDateString()}</p>
                        <p className="text-xs">{res.start_time} - {res.end_time}</p>
                      </td>
                      <td className="px-6 py-4 flex items-center space-x-3">
                        {res.status === 'pending' && <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700"><Clock className="w-3 h-3 mr-1"/> Pending</span>}
                        {res.status === 'approved' && !isPast && <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700"><CheckCircle className="w-3 h-3 mr-1"/> Approved</span>}
                        {res.status === 'rejected' && <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700"><XCircle className="w-3 h-3 mr-1"/> Rejected</span>}
                        {res.status === 'modification_requested' && <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700"><AlertCircle className="w-3 h-3 mr-1"/> Modification Requested</span>}
                        
                        {isPast && res.status === 'approved' && (
                           hasReviewed ? (
                             <span className="text-xs font-semibold text-emerald-600">Feedback Submitted</span>
                           ) : (
                             <button onClick={() => setFeedbackFor(res.id)} className="bg-indigo-600 text-white text-xs px-3 py-1.5 rounded font-bold hover:bg-indigo-700 transition">Leave Feedback</button>
                           )
                        )}
                      </td>
                    </tr>
                    {res.status === 'modification_requested' && (
                      <tr key={`${res.id}-notes`} className="bg-blue-50/30">
                        <td colSpan="4" className="px-6 py-3 border-t border-slate-100">
                          <div className="flex items-start justify-between">
                            <div className="text-sm text-blue-800">
                              <span className="font-bold mr-2">Admin Notes:</span> 
                              {res.admin_notes || 'Please modify your request and resubmit.'}
                            </div>
                            <button 
                              onClick={() => {
                                setEditingRes(res);
                                setEditForm({ date: res.date, start_time: res.start_time, end_time: res.end_time, room_id: res.room_id });
                              }}
                              className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded font-medium hover:bg-blue-700 transition-colors"
                            >
                              Edit & Resubmit
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                    );
                  })}
                  {myReservations.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-slate-500">You haven't made any reservations yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Edit Resubmit Modal */}
          {editingRes && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="text-xl font-bold text-slate-800">Modify Reservation</h3>
                  <button onClick={() => setEditingRes(null)} className="text-slate-400 hover:text-slate-600 transition-colors"><XCircle className="w-6 h-6"/></button>
                </div>
                <form onSubmit={handleResubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Date</label>
                    <input type="date" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500" value={editForm.date} onChange={e => setEditForm({...editForm, date: e.target.value})} required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Start Time</label>
                      <input type="time" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500" value={editForm.start_time} onChange={e => setEditForm({...editForm, start_time: e.target.value})} required />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">End Time</label>
                      <input type="time" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500" value={editForm.end_time} onChange={e => setEditForm({...editForm, end_time: e.target.value})} required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Room ID</label>
                    <input type="text" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500" value={editForm.room_id} onChange={e => setEditForm({...editForm, room_id: e.target.value})} required />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button type="button" onClick={() => setEditingRes(null)} className="px-6 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                    <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 font-bold shadow-md shadow-indigo-200 transition-colors">Resubmit Request</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {feedbackFor && (
             <FeedbackModal 
                role="Organizer" 
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

export default OrganizerDashboard;
