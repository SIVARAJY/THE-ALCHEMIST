const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

// Get invitations for a specific user_id
router.get('/user/:userId', async (req, res) => {
  try {
    const { data, error } = await supabase.from('attendees')
      .select('*, meetings(title, minutes_of_meeting, mom_submitted_at, reservations(id, date, start_time, end_time, description, venue_change_status, rooms!room_id(name, location, floor), profiles!organizer_id(name, email)))')
      .eq('user_id', req.params.userId);
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update RSVP status
router.put('/:id/status', async (req, res) => {
  const { status } = req.body; // 'accepted' or 'declined'
  try {
    const { data, error } = await supabase.from('attendees')
      .update({ status })
      .eq('id', req.params.id).select();
    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
