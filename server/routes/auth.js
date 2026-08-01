const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const supabase = require('../supabaseClient');

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_change_me_in_production';

// Custom Auth: Register Route (Public — Attendee only)
router.post('/register', async (req, res) => {
  const { email, password, name, category } = req.body;
  const role = 'Attendee'; // Public registration is Attendee-only
  console.log('Custom Auth Register attempt:', email, role);

  if (!email || !password || !name) {
    return res.status(400).json({ message: 'Email, password, and name are required' });
  }

  try {
    // 1. Check if user already exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // 2. Hash password using bcrypt
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // 3. Insert into dedicated DB profiles table
    const { data: newUser, error: insertError } = await supabase
      .from('profiles')
      .insert([
        {
          id: crypto.randomUUID(),
          name: name.trim(),
          email: email.toLowerCase().trim(),
          password_hash,
          role: role || 'Attendee',
          category: category || 'student',
          status: 'active'
        }
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Custom Auth Register Error:', insertError);
      return res.status(400).json({ message: insertError.message });
    }

    // 4. Generate custom JWT token
    const token = jwt.sign(
      {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        category: newUser.category
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        category: newUser.category
      }
    });

  } catch (error) {
    console.error('Register Catch Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Custom Auth: Login Route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    // 1. Fetch user from custom profiles table in project DB
    const { data: user, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error || !user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 2. Check if account is active
    if (user.status === 'inactive') {
      return res.status(403).json({ message: 'Your account has been deactivated. Please contact an admin.' });
    }

    // 3. Verify password hash using bcrypt
    let isPasswordValid = false;
    if (user.password_hash) {
      isPasswordValid = await bcrypt.compare(password, user.password_hash);
    }

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 4. Generate custom JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        category: user.category
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        category: user.category
      }
    });

  } catch (error) {
    console.error('Login Catch Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
