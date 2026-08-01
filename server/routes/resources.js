const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

// Get all resources with availability calculation
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase.from('resources')
      .select('*, room_resources(quantity)');
    if (error) throw error;

    const enhancedResources = data.map(r => {
      const assignedToRooms = r.room_resources ? r.room_resources.reduce((sum, rr) => sum + (rr.quantity || 1), 0) : 0;
      return {
        ...r,
        available_quantity: Math.max(0, r.total_quantity - assignedToRooms)
      };
    });

    res.json(enhancedResources);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new resource
router.post('/', async (req, res) => {
  const { name, total_quantity } = req.body;
  try {
    const { data, error } = await supabase.from('resources')
      .insert([{ name, total_quantity }])
      .select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a resource
router.put('/:id', async (req, res) => {
  const { name, total_quantity } = req.body;
  try {
    const { data, error } = await supabase.from('resources')
      .update({ name, total_quantity })
      .eq('id', req.params.id)
      .select().single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a resource
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('resources').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Resource deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
