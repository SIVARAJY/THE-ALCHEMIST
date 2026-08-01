const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const jwt = require('jsonwebtoken');
const supabase = require('./supabaseClient');

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_change_me_in_production';

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'No token provided' });
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (jwtError) {
    // Fallback attempt to check legacy Supabase Auth tokens
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ message: 'Invalid or expired token' });
    req.user = user;
    return next();
  }
};

const feedbackRouter = require('./routes/feedback');
const auditRouter = require('./routes/audit');

// Routes
app.use('/api/auth', require('./routes/auth'));

// Protect all other routes with session management
app.use('/api/rooms', verifyToken, require('./routes/rooms'));
app.use('/api/resources', verifyToken, require('./routes/resources'));
app.use('/api/reservations', verifyToken, require('./routes/reservations'));
app.use('/api/attendees', verifyToken, require('./routes/attendees'));
app.use('/api/notifications', verifyToken, require('./routes/notifications'));
app.use('/api/stats', verifyToken, require('./routes/stats'));
app.use('/api/feedback', verifyToken, feedbackRouter);
app.use('/api/audit', verifyToken, auditRouter);
app.use('/api/records', verifyToken, require('./routes/records'));
app.use('/api/policies', verifyToken, require('./routes/policies'));
app.use('/api/users', verifyToken, require('./routes/users'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Meeting Room API is running.' });
});

// Initialize background cron jobs
require('./cron');

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
