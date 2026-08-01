const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

// Get all policies
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase.from('policies')
      .select('*')
      .order('key');
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a policy by key
router.put('/:key', async (req, res) => {
  const { value } = req.body;
  try {
    const { data, error } = await supabase.from('policies')
      .update({ value, updated_at: new Date().toISOString() })
      .eq('key', req.params.key)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper: get policies as a key-value map (used internally by other routes)
router.getPoliciesMap = async () => {
  const { data } = await supabase.from('policies').select('key, value');
  const map = {};
  if (data) data.forEach(p => { map[p.key] = p.value; });
  return map;
};

module.exports = router;
