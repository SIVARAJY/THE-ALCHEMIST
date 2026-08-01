const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

// Get all audit logs (Admin only)
router.get('/', async (req, res) => {
  const { search } = req.query;

  try {
    let query = supabase.from('audit_logs')
      .select('*, profiles!user_id(name, email)')
      .order('created_at', { ascending: false });

    if (search) {
      // Basic text search on action or details.
      query = query.or(`action.ilike.%${search}%,details.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    // In-memory filter for profile names if needed, since Supabase doesn't easily let us .or() across foreign tables in a simple request without inner joins.
    let filteredData = data;
    if (search) {
      const s = search.toLowerCase();
      filteredData = data.filter(log => 
        log.action.toLowerCase().includes(s) || 
        (log.details && log.details.toLowerCase().includes(s)) ||
        (log.profiles?.name && log.profiles.name.toLowerCase().includes(s)) ||
        (log.profiles?.email && log.profiles.email.toLowerCase().includes(s))
      );
    }

    res.json(filteredData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Explicit logging (e.g., from client-side for Login/Logout)
router.post('/log', async (req, res) => {
  const { action, details } = req.body;
  const user_id = req.user.id; // from verifyToken

  try {
    const { data, error } = await supabase.from('audit_logs')
      .insert([{ user_id, action, details }]);
      
    if (error) throw error;
    res.status(201).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
