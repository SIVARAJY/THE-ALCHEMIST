import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Building, Monitor, Calendar, LogOut, Plus, Trash2, Edit2, CheckSquare, Square, X, CalendarDays, MessageSquare, Star, FileText, Search, ClipboardList, Settings, Users, Menu, FileSpreadsheet } from 'lucide-react';
import api from '../api';
import CalendarView from '../components/CalendarView';
import NotificationBell from '../components/NotificationBell';
import AdminStats from '../components/AdminStats';
import AuditLogsView from '../components/AuditLogsView';
import MeetingRecords from '../components/MeetingRecords';
import PolicySettings from '../components/PolicySettings';
import UserManagement from '../components/UserManagement';
import MeetingReportGenerator from '../components/MeetingReportGenerator';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [rooms, setRooms] = useState([]);
  const [resources, setResources] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [reservationFilter, setReservationFilter] = useState('all');
  const [roomStatusDate, setRoomStatusDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [roomFilterTab, setRoomFilterTab] = useState('all');
  const [feedback, setFeedback] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditSearch, setAuditSearch] = useState('');
  const [user, setUser] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'Admin') {
      navigate('/login');
      return;
    }
    setUser(parsedUser);
    fetchData();
  }, [navigate, activeTab]);

  const fetchData = async () => {
    try {
      const results = await Promise.allSettled([
        api.get('/rooms'),
        api.get('/resources'),
        api.get('/reservations'),
        api.get('/feedback')
      ]);
      if (results[0].status === 'fulfilled') setRooms(results[0].value.data || []);
      else console.error('Failed to fetch rooms:', results[0].reason);
      if (results[1].status === 'fulfilled') setResources(results[1].value.data || []);
      else console.error('Failed to fetch resources:', results[1].reason);
      if (results[2].status === 'fulfilled') setReservations(results[2].value.data || []);
      else console.error('Failed to fetch reservations:', results[2].reason);
      if (results[3].status === 'fulfilled') setFeedback(results[3].value.data || []);
      else console.error('Failed to fetch feedback:', results[3].reason);
    } catch (error) {
      console.error('Error fetching data', error);
    }
  };

  const handleLogout = async () => {
    try { await api.post('/audit/log', { action: 'LOGOUT', details: 'User logged out' }); } catch (e) { console.error(e); }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // ROOM MANAGEMENT
  const [newRoom, setNewRoom] = useState({ name: '', capacity: '', location: '', floor: '1', resource_ids: [] });
  const [editingRoom, setEditingRoom] = useState(null);
  const [roomFormError, setRoomFormError] = useState('');
  
  const createRoom = async (e) => {
    e.preventDefault();
    setRoomFormError('');
    try {
      await api.post('/rooms', newRoom);
      setNewRoom({ name: '', capacity: '', location: '', floor: '1', resource_ids: [] });
      fetchData();
    } catch (error) {
      console.error(error);
      setRoomFormError(error.response?.data?.error || 'Failed to create room');
    }
  };

  const updateRoom = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/rooms/${editingRoom.id}`, editingRoom);
      setEditingRoom(null);
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const toggleRoomStatus = async (room) => {
    try {
      const newStatus = room.status === 'available' ? 'disabled' : 'available';
      await api.put(`/rooms/${room.id}/status`, { status: newStatus });
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const deleteRoom = async (id) => {
    try {
      await api.delete(`/rooms/${id}`);
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleResourceToggle = (resourceId, isEditing = false) => {
    if (isEditing) {
      const currentIds = editingRoom.resource_ids || [];
      const updatedIds = currentIds.includes(resourceId) 
        ? currentIds.filter(id => id !== resourceId) 
        : [...currentIds, resourceId];
      setEditingRoom({ ...editingRoom, resource_ids: updatedIds });
    } else {
      const currentIds = newRoom.resource_ids || [];
      const updatedIds = currentIds.includes(resourceId) 
        ? currentIds.filter(id => id !== resourceId) 
        : [...currentIds, resourceId];
      setNewRoom({ ...newRoom, resource_ids: updatedIds });
    }
  };

  // RESOURCE MANAGEMENT
  const [newResource, setNewResource] = useState({ name: '', total_quantity: '' });
  const [editingResource, setEditingResource] = useState(null);
  
  const createResource = async (e) => {
    e.preventDefault();
    try {
      await api.post('/resources', newResource);
      setNewResource({ name: '', total_quantity: '' });
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const updateResource = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/resources/${editingResource.id}`, editingResource);
      setEditingResource(null);
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const deleteResource = async (id) => {
    try {
      await api.delete(`/resources/${id}`);
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  // RESERVATION MANAGEMENT
  const [requestingModFor, setRequestingModFor] = useState(null);
  const [modNotes, setModNotes] = useState('');

  const handleReservation = async (id, status, notes = null) => {
    try {
      const payload = { status };
      if (notes) payload.admin_notes = notes;
      
      await api.put(`/reservations/${id}/status`, payload);
      setRequestingModFor(null);
      setModNotes('');
      fetchData();
    } catch (error) {
      console.error(error);
    }
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
          <button 
            onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
            className={`flex items-center w-full px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <LayoutDashboard className="w-5 h-5 mr-3" /> Dashboard
          </button>
          <button 
            onClick={() => { setActiveTab('calendar'); setIsMobileMenuOpen(false); }}
            className={`flex items-center w-full px-4 py-3 rounded-xl transition-all ${activeTab === 'calendar' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <CalendarDays className="w-5 h-5 mr-3" /> Calendar View
          </button>
          <button 
            onClick={() => { setActiveTab('rooms'); setIsMobileMenuOpen(false); }}
            className={`flex items-center w-full px-4 py-3 rounded-xl transition-all ${activeTab === 'rooms' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Building className="w-5 h-5 mr-3" /> Rooms
          </button>
          <button 
            onClick={() => { setActiveTab('resources'); setIsMobileMenuOpen(false); }}
            className={`flex items-center w-full px-4 py-3 rounded-xl transition-all ${activeTab === 'resources' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Monitor className="w-5 h-5 mr-3" /> Resources
          </button>
          <button 
            onClick={() => { setActiveTab('reservations'); setIsMobileMenuOpen(false); }}
            className={`flex items-center w-full px-4 py-3 rounded-xl transition-all ${activeTab === 'reservations' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Calendar className="w-5 h-5 mr-3" /> Reservations
          </button>
          <button 
            onClick={() => { setActiveTab('feedback'); setIsMobileMenuOpen(false); }}
            className={`flex items-center w-full px-4 py-3 rounded-xl transition-all ${activeTab === 'feedback' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <MessageSquare className="w-5 h-5 mr-3" /> Feedback
          </button>
          <button 
            onClick={() => { setActiveTab('audit'); setIsMobileMenuOpen(false); }}
            className={`flex items-center w-full px-4 py-3 rounded-xl transition-all ${activeTab === 'audit' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <FileText className="w-5 h-5 mr-3" /> Audit Logs
          </button>
          <button 
            onClick={() => { setActiveTab('records'); setIsMobileMenuOpen(false); }}
            className={`flex items-center w-full px-4 py-3 rounded-xl transition-all ${activeTab === 'records' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <ClipboardList className="w-5 h-5 mr-3" /> Meeting Records
          </button>
          <button 
            onClick={() => { setActiveTab('policies'); setIsMobileMenuOpen(false); }}
            className={`flex items-center w-full px-4 py-3 rounded-xl transition-all ${activeTab === 'policies' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Settings className="w-5 h-5 mr-3" /> Policies
          </button>
          <button 
            onClick={() => { setActiveTab('users'); setIsMobileMenuOpen(false); }}
            className={`flex items-center w-full px-4 py-3 rounded-xl transition-all ${activeTab === 'users' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Users className="w-5 h-5 mr-3" /> User Management
          </button>
          <button 
            onClick={() => { setActiveTab('reports'); setIsMobileMenuOpen(false); }}
            className={`flex items-center w-full px-4 py-3 rounded-xl transition-all ${activeTab === 'reports' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <FileSpreadsheet className="w-5 h-5 mr-3" /> Export Reports
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.name || 'Admin'}</p>
              <p className="text-xs text-slate-400">Administrator</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center w-full px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
            <LogOut className="w-5 h-5 mr-3" /> Logout
          </button>
        </div>
      </div>

      {/* Main Content Area */}
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
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 capitalize">{activeTab} Management</h2>
          </div>
          <NotificationBell />
        </header>

        <main className="p-4 md:p-8 flex-1">
          {activeTab === 'dashboard' && (
            <AdminStats />
          )}

          {activeTab === 'calendar' && <CalendarView />}

          {activeTab === 'rooms' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-semibold mb-4 text-slate-700">Add New Room</h3>
                <form onSubmit={createRoom} className="space-y-4">
                  <div className="flex gap-4">
                    <input type="text" placeholder="Room Name (e.g. Seminar Hall A)" className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" value={newRoom.name} onChange={e => setNewRoom({...newRoom, name: e.target.value})} required />
                    <input type="number" placeholder="Capacity" className="w-32 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" value={newRoom.capacity} onChange={e => setNewRoom({...newRoom, capacity: e.target.value})} required />
                    <input type="text" placeholder="Location" className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" value={newRoom.location} onChange={e => setNewRoom({...newRoom, location: e.target.value})} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-2">Assign Available Resources to this Room:</p>
                    <div className="flex flex-wrap gap-3">
                      {resources.map(res => (
                        <button 
                          key={res.id} 
                          type="button" 
                          onClick={() => handleResourceToggle(res.id, false)}
                          className={`flex items-center px-3 py-1.5 rounded-lg border text-sm transition-colors ${(newRoom.resource_ids || []).includes(res.id) ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        >
                          {(newRoom.resource_ids || []).includes(res.id) ? <CheckSquare className="w-4 h-4 mr-2"/> : <Square className="w-4 h-4 mr-2"/>}
                          {res.name}
                        </button>
                      ))}
                      {resources.length === 0 && <span className="text-xs text-slate-400">No resources available in system. Add some first.</span>}
                    </div>
                  </div>
                  <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center font-medium">
                    <Plus className="w-5 h-5 mr-2" /> Add Room
                  </button>
                </form>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-600">
                    <tr>
                      <th className="px-6 py-4">Room Name</th>
                      <th className="px-6 py-4">Capacity</th>
                      <th className="px-6 py-4">Location</th>
                      <th className="px-6 py-4">Assigned Resources</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rooms.map(room => (
                      <tr key={room.id} className={`transition-colors ${room.status === 'disabled' ? 'bg-slate-50/80 opacity-75' : 'hover:bg-slate-50/50'}`}>
                        <td className="px-6 py-4 font-medium text-slate-800">{room.name}</td>
                        <td className="px-6 py-4 text-slate-600">{room.capacity} seats</td>
                        <td className="px-6 py-4 text-slate-600">{room.location} (Floor {room.floor || 1})</td>
                        <td className="px-6 py-4 text-slate-600 text-sm">
                          {room.room_resources?.length > 0 
                            ? room.room_resources.map(r => r.resources?.name).join(', ')
                            : <span className="text-slate-400 italic">None</span>}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button 
                            onClick={() => toggleRoomStatus(room)}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${room.status === 'available' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                            title="Click to toggle Enable/Disable"
                          >
                            {room.status === 'available' ? 'Enabled' : 'Disabled'}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => setEditingRoom({...room, resource_ids: room.room_resources?.map(r => r.resource_id) || []})} 
                            className="text-indigo-500 hover:text-indigo-700 p-2 rounded-lg hover:bg-indigo-50 transition-colors"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button onClick={() => deleteRoom(room.id)} className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors ml-2">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {rooms.length === 0 && (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-slate-500">No rooms available. Add one above.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Edit Modal */}
              {editingRoom && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <h3 className="text-xl font-bold text-slate-800">Edit Room</h3>
                      <button onClick={() => setEditingRoom(null)} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="w-6 h-6"/></button>
                    </div>
                    <form onSubmit={updateRoom} className="p-6 overflow-y-auto flex-1 space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Room Name</label>
                          <input type="text" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500" value={editingRoom.name} onChange={e => setEditingRoom({...editingRoom, name: e.target.value})} required />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Capacity</label>
                          <input type="number" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500" value={editingRoom.capacity} onChange={e => setEditingRoom({...editingRoom, capacity: e.target.value})} required />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Location</label>
                          <input type="text" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500" value={editingRoom.location} onChange={e => setEditingRoom({...editingRoom, location: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Floor</label>
                          <input type="number" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500" value={editingRoom.floor} onChange={e => setEditingRoom({...editingRoom, floor: e.target.value})} />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Assign Available Resources to this Room</label>
                        <div className="flex flex-wrap gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                          {resources.map(res => (
                            <button 
                              key={res.id} 
                              type="button" 
                              onClick={() => handleResourceToggle(res.id, true)}
                              className={`flex items-center px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${(editingRoom.resource_ids || []).includes(res.id) ? 'bg-indigo-100 border-indigo-200 text-indigo-700 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                            >
                              {(editingRoom.resource_ids || []).includes(res.id) ? <CheckSquare className="w-4 h-4 mr-2"/> : <Square className="w-4 h-4 mr-2"/>}
                              {res.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button type="button" onClick={() => setEditingRoom(null)} className="px-6 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                        <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 font-bold shadow-md shadow-indigo-200 transition-colors">Save Changes</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'resources' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-semibold mb-4 text-slate-700">Add New Resource</h3>
                <form onSubmit={createResource} className="flex gap-4">
                  <input type="text" placeholder="Resource Name (e.g. Projector)" className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" value={newResource.name} onChange={e => setNewResource({...newResource, name: e.target.value})} required />
                  <input type="number" placeholder="Total Quantity" className="w-32 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" value={newResource.total_quantity} onChange={e => setNewResource({...newResource, total_quantity: e.target.value})} required />
                  <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center font-medium">
                    <Plus className="w-5 h-5 mr-2" /> Add Resource
                  </button>
                </form>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-600">
                    <tr>
                      <th className="px-6 py-4">Resource Name</th>
                      <th className="px-6 py-4">Total Quantity</th>
                      <th className="px-6 py-4">Available Quantity</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {resources.map(resource => (
                      <tr key={resource.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-800">{resource.name}</td>
                        <td className="px-6 py-4 text-slate-600">{resource.total_quantity}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${resource.available_quantity > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                            {resource.available_quantity !== undefined ? resource.available_quantity : resource.total_quantity} Available
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => setEditingResource(resource)} className="text-indigo-500 hover:text-indigo-700 p-2 rounded-lg hover:bg-indigo-50 transition-colors">
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button onClick={() => deleteResource(resource.id)} className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors ml-2">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {resources.length === 0 && (
                      <tr>
                        <td colSpan="4" className="px-6 py-8 text-center text-slate-500">No resources available. Add one above.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Edit Resource Modal */}
              {editingResource && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <h3 className="text-xl font-bold text-slate-800">Edit Resource</h3>
                      <button onClick={() => setEditingResource(null)} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="w-6 h-6"/></button>
                    </div>
                    <form onSubmit={updateResource} className="p-6 space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Resource Name</label>
                        <input type="text" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500" value={editingResource.name} onChange={e => setEditingResource({...editingResource, name: e.target.value})} required />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Total Quantity</label>
                        <input type="number" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500" value={editingResource.total_quantity} onChange={e => setEditingResource({...editingResource, total_quantity: e.target.value})} required />
                      </div>

                      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button type="button" onClick={() => setEditingResource(null)} className="px-6 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                        <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 font-bold shadow-md shadow-indigo-200 transition-colors">Save Changes</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'reservations' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-700">Reservation Management</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Manage, approve, reject, or request modifications for room reservations.</p>
                </div>

                {/* Filter Pills */}
                <div className="flex gap-2 flex-wrap">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'pending', label: 'Pending' },
                    { id: 'approved', label: 'Approved' },
                    { id: 'rejected', label: 'Rejected' },
                    { id: 'modification_requested', label: 'Mod Requested' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setReservationFilter(tab.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${reservationFilter === tab.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Organizer</th>
                      <th className="px-6 py-4">Room & Meeting</th>
                      <th className="px-6 py-4">Date & Time</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reservations
                      .filter(res => reservationFilter === 'all' || res.status === reservationFilter)
                      .map(res => (
                        <tr key={res.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-800">
                            <div>
                              <p className="font-semibold text-slate-800">{res.profiles?.name || 'Unknown'}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${res.profiles?.category === 'faculty' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                                  {res.profiles?.category || 'staff'}
                                </span>
                                {res.profiles?.category === 'faculty' && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">Priority</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            <p className="font-semibold text-slate-800">{res.rooms?.name || 'N/A'}</p>
                            <p className="text-xs text-slate-400">{res.meetings?.[0]?.title || 'Untitled Meeting'}</p>
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            <p className="font-medium text-sm text-slate-800">{new Date(res.date).toLocaleDateString()}</p>
                            <p className="text-xs text-slate-400">{res.start_time} - {res.end_time}</p>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                              res.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                              res.status === 'rejected' ? 'bg-red-100 text-red-700' :
                              res.status === 'modification_requested' ? 'bg-blue-100 text-blue-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {res.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            {requestingModFor === res.id ? (
                              <div className="flex flex-col items-end space-y-2 mt-2">
                                <input 
                                  type="text" 
                                  placeholder="Modification notes..." 
                                  className="w-64 px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
                                  value={modNotes} 
                                  onChange={e => setModNotes(e.target.value)} 
                                  autoFocus
                                />
                                <div className="space-x-2">
                                  <button onClick={() => setRequestingModFor(null)} className="text-slate-500 hover:text-slate-700 text-xs font-medium">Cancel</button>
                                  <button onClick={() => handleReservation(res.id, 'modification_requested', modNotes)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-xs font-bold transition-colors">Send Request</button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-1.5">
                                {res.status !== 'approved' && (
                                  <button onClick={() => handleReservation(res.id, 'approved')} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">Approve</button>
                                )}
                                {res.status !== 'rejected' && (
                                  <button onClick={() => handleReservation(res.id, 'rejected')} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">Reject</button>
                                )}
                                {res.status === 'pending' && (
                                  <button onClick={() => setRequestingModFor(res.id)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">Request Mod</button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    {reservations.filter(res => reservationFilter === 'all' || res.status === reservationFilter).length === 0 && (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center text-slate-400">No reservations found for status "{reservationFilter}".</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'feedback' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold mb-4 text-slate-700">Post-Meeting Feedback</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {feedback.map(f => (
                  <div key={f.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-bold text-slate-800">{f.profiles?.name}</p>
                        <p className="text-xs text-slate-500 font-medium bg-slate-100 inline-block px-2 py-0.5 rounded uppercase mt-1">{f.role}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-indigo-600">{f.reservations?.rooms?.name}</p>
                        <p className="text-xs text-slate-400">{new Date(f.reservations?.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4 flex-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-600">Room Condition</span>
                        <div className="flex">
                          {[1,2,3,4,5].map(s => <Star key={s} className={`w-4 h-4 ${s <= f.rating_room ? 'text-amber-400 fill-current' : 'text-slate-200'}`} />)}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-600">Resources</span>
                        <div className="flex">
                          {[1,2,3,4,5].map(s => <Star key={s} className={`w-4 h-4 ${s <= f.rating_resources ? 'text-amber-400 fill-current' : 'text-slate-200'}`} />)}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-600">{f.role === 'Attendee' ? 'Meeting Quality' : 'Overall Exp'}</span>
                        <div className="flex">
                          {[1,2,3,4,5].map(s => <Star key={s} className={`w-4 h-4 ${s <= (f.role === 'Attendee' ? f.rating_meeting : f.rating_overall) ? 'text-amber-400 fill-current' : 'text-slate-200'}`} />)}
                        </div>
                      </div>
                    </div>

                    {f.comments && (
                      <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-700 italic border border-slate-100">
                        "{f.comments}"
                      </div>
                    )}
                  </div>
                ))}
                {feedback.length === 0 && (
                   <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-100">
                     No feedback has been submitted yet.
                   </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <AuditLogsView />
          )}

          {activeTab === 'records' && (
            <MeetingRecords />
          )}

          {activeTab === 'policies' && (
            <PolicySettings />
          )}

          {activeTab === 'users' && (
            <UserManagement />
          )}

          {activeTab === 'reports' && (
            <MeetingReportGenerator />
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
