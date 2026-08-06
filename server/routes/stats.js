const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

// Helper to get today's date in YYYY-MM-DD
const getTodayStr = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split('T')[0];
};

// Admin Stats
router.get('/admin', async (req, res) => {
  try {
    const today = getTodayStr();
    
    const { count: roomsCount } = await supabase.from('rooms').select('*', { count: 'exact', head: true });
    
    const { data: resources } = await supabase.from('resources').select('total_quantity');
    const totalResources = resources ? resources.reduce((acc, r) => acc + r.total_quantity, 0) : 0;
    
    const { count: pendingReqs } = await supabase.from('reservations').select('*', { count: 'exact', head: true }).eq('status', 'pending');
    
    const { count: todaysMeetings } = await supabase.from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved')
      .eq('date', today);
      
    const { count: activeUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    
    const { data: recentReservations } = await supabase.from('reservations')
      .select('*, profiles!organizer_id(name), rooms(name)')
      .order('id', { ascending: false })
      .limit(5);

    // Calculate live room occupancy right now
    const now = new Date();
    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;

    // Fetch today's approved reservations
    const { data: todayReservations } = await supabase.from('reservations')
      .select('room_id, start_time, end_time')
      .eq('status', 'approved')
      .eq('date', today);

    const activeTodayRoomIds = new Set((todayReservations || []).map(r => r.room_id)).size;
    const occupiedRightNowIds = new Set();
    if (todayReservations && todayReservations.length > 0) {
      todayReservations.forEach(r => {
        if (currentTimeStr >= r.start_time && currentTimeStr <= r.end_time) {
          occupiedRightNowIds.add(r.room_id);
        }
      });
    }

    const totalRoomsCount = roomsCount || 1;
    const occupancyPercentage = Math.min(100, Math.round((activeTodayRoomIds / totalRoomsCount) * 100));

    res.json({
      totalRooms: roomsCount || 0,
      totalResources,
      pendingRequests: pendingReqs || 0,
      todaysMeetings: todaysMeetings || 0,
      activeUsers: activeUsers || 0,
      occupiedRightNow: occupiedRightNowIds.size,
      activeTodayRooms: activeTodayRoomIds,
      occupancyPercentage: occupancyPercentage,
      recentReservations: recentReservations || []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Organizer Stats
router.get('/organizer/:id', async (req, res) => {
  try {
    const today = getTodayStr();
    const orgId = req.params.id;
    
    const { count: upcoming } = await supabase.from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('organizer_id', orgId)
      .eq('status', 'approved')
      .gte('date', today);
      
    const { count: pending } = await supabase.from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('organizer_id', orgId)
      .eq('status', 'pending');
      
    const { count: approved } = await supabase.from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('organizer_id', orgId)
      .eq('status', 'approved');
      
    const { count: rejected } = await supabase.from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('organizer_id', orgId)
      .eq('status', 'rejected');

    res.json({
      upcomingMeetings: upcoming || 0,
      pendingRequests: pending || 0,
      approvedMeetings: approved || 0,
      rejectedMeetings: rejected || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Attendee Stats
router.get('/attendee/:id', async (req, res) => {
  try {
    const today = getTodayStr();
    const userId = req.params.id;
    
    const { data: invitations } = await supabase.from('attendees')
      .select('status, meetings(reservations(date, status))')
      .eq('user_id', userId);
      
    let todaysMeetings = 0;
    let upcomingMeetings = 0;
    let acceptedInvitations = 0;
    let pendingInvitations = 0;
    
    if (invitations) {
      invitations.forEach(inv => {
        if (inv.status === 'accepted') acceptedInvitations++;
        if (inv.status === 'pending') pendingInvitations++;
        
        const resDate = inv.meetings?.reservations?.date;
        const resStatus = inv.meetings?.reservations?.status;
        
        if (inv.status === 'accepted' && resStatus === 'approved') {
          if (resDate === today) todaysMeetings++;
          if (resDate > today) upcomingMeetings++;
        }
      });
    }
    
    res.json({
      todaysMeetings,
      upcomingMeetings,
      acceptedInvitations,
      pendingInvitations
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
