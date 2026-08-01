const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

// Get all meeting records with aggregated data
router.get('/', async (req, res) => {
  try {
    const { data: reservations, error } = await supabase.from('reservations')
      .select(`
        id, date, start_time, end_time, status,
        profiles!organizer_id(name, email),
        rooms!room_id(name, location),
        meetings(id, title, attendees(user_id, status))
      `)
      .order('date', { ascending: false });

    if (error) throw error;

    const now = new Date();

    const records = (reservations || []).map(r => {
      const meeting = r.meetings?.[0];
      const attendees = meeting?.attendees || [];

      // Calculate duration in minutes
      let duration = null;
      if (r.start_time && r.end_time) {
        const [sh, sm] = r.start_time.split(':').map(Number);
        const [eh, em] = r.end_time.split(':').map(Number);
        duration = (eh * 60 + em) - (sh * 60 + sm);
      }

      // Completion status
      let completionStatus = 'upcoming';
      if (r.status === 'rejected') {
        completionStatus = 'rejected';
      } else if (r.status === 'cancelled') {
        completionStatus = 'cancelled';
      } else if (r.date && r.end_time) {
        const endDT = new Date(`${r.date}T${r.end_time}`);
        const startDT = new Date(`${r.date}T${r.start_time}`);
        if (now > endDT) {
          completionStatus = 'completed';
        } else if (now >= startDT && now <= endDT) {
          completionStatus = 'in_progress';
        } else {
          completionStatus = r.status === 'approved' ? 'upcoming' : 'pending';
        }
      }

      // Attendance summary
      const totalInvited = attendees.length;
      const accepted = attendees.filter(a => a.status === 'accepted').length;
      const declined = attendees.filter(a => a.status === 'declined').length;
      const pending = attendees.filter(a => a.status === 'pending').length;

      return {
        meetingId: meeting?.id || null,
        title: meeting?.title || 'Untitled',
        organizer: r.profiles?.name || 'Unknown',
        organizerEmail: r.profiles?.email,
        room: r.rooms?.name || 'N/A',
        roomLocation: r.rooms?.location,
        date: r.date,
        startTime: r.start_time,
        endTime: r.end_time,
        duration,
        completionStatus,
        reservationStatus: r.status,
        attendance: { totalInvited, accepted, declined, pending }
      };
    });

    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
