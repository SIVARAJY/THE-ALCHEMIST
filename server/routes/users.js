const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const supabase = require('../supabaseClient');

// Get all users (Admin)
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, role, category, status, created_at')
      .order('name');
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create user (Admin — Organizer & Admin roles only)
router.post('/', async (req, res) => {
  const { email, password, name, role, category } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, and name are required' });
  }
  const allowedRoles = ['Organizer', 'Admin'];
  if (!role || !allowedRoles.includes(role)) {
    return res.status(400).json({ error: 'Admin can only create Organizer or Admin accounts' });
  }

  try {
    // Check if email already exists
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (existing) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const { data: newUser, error } = await supabase.from('profiles').insert([
      {
        id: crypto.randomUUID(),
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password_hash,
        role: role || 'Attendee',
        category: category || 'student',
        status: 'active'
      }
    ]).select().single();

    if (error) throw error;
    res.status(201).json({ success: true, user: newUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile (Admin)
router.put('/:id', async (req, res) => {
  const { name, role, category } = req.body;
  try {
    const { data, error } = await supabase.from('profiles')
      .update({ name, role, category })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Activate/Deactivate user (Admin)
router.put('/:id/status', async (req, res) => {
  const { status } = req.body;
  try {
    const { data, error } = await supabase.from('profiles')
      .update({ status })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user (Admin)
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('profiles').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
