const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

// Get all rooms (with assigned resources)
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase.from('rooms')
      .select('*, room_resources(resource_id, resources(name))');
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new room
router.post('/', async (req, res) => {
  const { name, capacity, location, floor, resource_ids } = req.body;
  try {
    const { data, error } = await supabase.from('rooms')
      .insert([{ name, capacity, location, floor }])
      .select().single();
    if (error) throw error;
    
    if (resource_ids && resource_ids.length > 0) {
      const rrData = resource_ids.map(r_id => ({ room_id: data.id, resource_id: r_id }));
      await supabase.from('room_resources').insert(rrData);
    }
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a room fully
router.put('/:id', async (req, res) => {
  const { name, capacity, location, floor, resource_ids } = req.body;
  try {
    const { data, error } = await supabase.from('rooms')
      .update({ name, capacity, location, floor })
      .eq('id', req.params.id).select().single();
    if (error) throw error;
    
    // Refresh resources mapping
    await supabase.from('room_resources').delete().eq('room_id', req.params.id);
    if (resource_ids && resource_ids.length > 0) {
      const rrData = resource_ids.map(r_id => ({ room_id: req.params.id, resource_id: r_id }));
      await supabase.from('room_resources').insert(rrData);
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update room status
router.put('/:id/status', async (req, res) => {
  const { status } = req.body;
  try {
    const { data, error } = await supabase.from('rooms')
      .update({ status })
      .eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a room
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('rooms').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Room deleted' });
});

module.exports = router;
