const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

// Get all notifications for a user
router.get('/:userId', async (req, res) => {
  try {
    const { data, error } = await supabase.from('notifications')
      .select('*')
      .eq('user_id', req.params.userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const { data, error } = await supabase.from('notifications')
      .update({ is_read: true })
      .eq('id', req.params.id)
      .select();
      
    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark all as read for a user
router.put('/user/:userId/read-all', async (req, res) => {
  try {
    const { data, error } = await supabase.from('notifications')
      .update({ is_read: true })
      .eq('user_id', req.params.userId)
      .select();
      
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
