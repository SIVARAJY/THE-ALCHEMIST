-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Admin', 'Organizer', 'Attendee')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Rooms table
CREATE TABLE rooms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  capacity INT NOT NULL,
  location TEXT,
  floor INT,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'maintenance', 'disabled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Resources table
CREATE TABLE resources (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  total_quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Reservations table
CREATE TABLE reservations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organizer_id UUID REFERENCES profiles(id) NOT NULL,
  room_id UUID REFERENCES rooms(id) NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Reservation Resources mapping
CREATE TABLE reservation_resources (
  reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1,
  PRIMARY KEY (reservation_id, resource_id)
);

-- Meetings table
CREATE TABLE meetings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  agenda TEXT,
  completion_status TEXT DEFAULT 'scheduled' CHECK (completion_status IN ('scheduled', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Attendees table
CREATE TABLE attendees (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT,
  rating_room INT CHECK (rating_room >= 1 AND rating_room <= 5),
  rating_resources INT CHECK (rating_resources >= 1 AND rating_resources <= 5),
  rating_meeting INT CHECK (rating_meeting >= 1 AND rating_meeting <= 5),
  rating_overall INT CHECK (rating_overall >= 1 AND rating_overall <= 5),
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(reservation_id, user_id)
);

-- Audit Logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- System Policies table
CREATE TABLE IF NOT EXISTS policies (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

INSERT INTO policies (key, value, description) VALUES
  ('working_hours_start', '08:45', 'Official campus operating start time'),
  ('working_hours_end', '16:30', 'Official campus operating end time'),
  ('max_bookings_per_user', '5', 'Maximum active reservations per organizer'),
  ('cancellation_deadline_hours', '24', 'Minimum hours before meeting to cancel'),
  ('faculty_priority', 'enabled', 'Give faculty priority for room conflicts')
ON CONFLICT (key) DO NOTHING;

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Schema Additions for MoM, Meeting Description, & Venue Change Requests
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS requested_room_id UUID REFERENCES rooms(id);
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS venue_change_status TEXT;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS venue_change_reason TEXT;

ALTER TABLE meetings ADD COLUMN IF NOT EXISTS minutes_of_meeting TEXT;
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS mom_submitted_at TIMESTAMPTZ;
