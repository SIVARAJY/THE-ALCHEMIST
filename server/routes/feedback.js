const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

// Get all feedback (Admin)
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase.from('feedback')
      .select(`
        *,
        profiles (name, email),
        reservations (date, start_time, end_time, rooms (name), meetings (title))
      `)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check if a user has left feedback for their meetings
router.get('/user/:userId', async (req, res) => {
  try {
    const { data, error } = await supabase.from('feedback')
      .select('reservation_id')
      .eq('user_id', req.params.userId);
      
    if (error) throw error;
    
    // Return array of reservation IDs the user has reviewed
    const reviewedIds = data.map(f => f.reservation_id);
    res.json(reviewedIds);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit feedback
router.post('/', async (req, res) => {
  const { reservation_id, user_id, role, rating_room, rating_resources, rating_meeting, rating_overall, comments } = req.body;
  try {
    const { data, error } = await supabase.from('feedback')
      .insert([{
        reservation_id, user_id, role,
        rating_room, rating_resources, rating_meeting, rating_overall, comments
      }]).select().single();
      
    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return res.status(400).json({ error: 'You have already submitted feedback for this meeting.' });
      }
      throw error;
    }
    
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
