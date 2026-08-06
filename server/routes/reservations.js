const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

// --- Notification Helpers ---
const notifyAdmins = async (message, type) => {
  try {
    const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'Admin');
    if (admins && admins.length > 0) {
      const notifications = admins.map(admin => ({ user_id: admin.id, message, type }));
      await supabase.from('notifications').insert(notifications);
    }
  } catch (e) { console.error("Notification Error:", e); }
};

const notifyUser = async (userId, message, type) => {
  try {
    await supabase.from('notifications').insert([{ user_id: userId, message, type }]);
  } catch (e) { console.error("Notification Error:", e); }
};

const notifyAttendees = async (reservationId, message, type) => {
  try {
    const { data: meeting } = await supabase.from('meetings').select('id').eq('reservation_id', reservationId).single();
    if (meeting) {
      const { data: attendees } = await supabase.from('attendees').select('user_id').eq('meeting_id', meeting.id);
      if (attendees && attendees.length > 0) {
        const notifications = attendees.map(a => ({ user_id: a.user_id, message, type }));
        await supabase.from('notifications').insert(notifications);
      }
    }
  } catch (e) { console.error("Notification Error:", e); }
};

const logAudit = async (userId, action, details) => {
  try {
    await supabase.from('audit_logs').insert([{ user_id: userId, action, details }]);
  } catch (e) { console.error("Audit Error:", e); }
};
// ----------------------------

// Helper: fetch policies as a key-value map
const getPoliciesMap = async () => {
  const { data } = await supabase.from('policies').select('key, value');
  const map = {};
  if (data) data.forEach(p => { map[p.key] = p.value; });
  return map;
};

// Get all available rooms for a given date/time
router.get('/available-rooms', async (req, res) => {
  const { date, startTime, endTime, capacity } = req.query;
  if (!date || !startTime || !endTime) return res.status(400).json({ error: 'Missing required parameters' });

  try {
    const cap = parseInt(capacity) || 1;
    const { data: rooms, error: roomsError } = await supabase.from('rooms').select('*').gte('capacity', cap);
    if (roomsError) throw roomsError;

    const { data: reservations } = await supabase.from('reservations')
        .select('*')
        .eq('date', date)
        .in('status', ['approved', 'pending']);

    const bookedRoomIds = (reservations || []).filter(r => {
        return (startTime < r.end_time && endTime > r.start_time);
    }).map(r => r.room_id);

    const availableRooms = rooms.filter(room => !bookedRoomIds.includes(room.id));

    // Fetch ratings for available rooms
    const { data: feedbackData } = await supabase.from('feedback')
      .select('rating_room, rating_overall, reservations(room_id)');

    const roomRatingsMap = {};
    if (feedbackData && feedbackData.length > 0) {
      feedbackData.forEach(f => {
        const roomId = f.reservations?.room_id;
        const rating = f.rating_room || f.rating_overall;
        if (roomId && rating) {
          if (!roomRatingsMap[roomId]) roomRatingsMap[roomId] = { total: 0, count: 0 };
          roomRatingsMap[roomId].total += Number(rating);
          roomRatingsMap[roomId].count += 1;
        }
      });
    }

    const availableRoomsWithRatings = availableRooms.map(room => {
      const stats = roomRatingsMap[room.id];
      const avg = stats && stats.count > 0 ? (stats.total / stats.count).toFixed(1) : null;
      return {
        ...room,
        avg_rating: avg ? parseFloat(avg) : null,
        review_count: stats ? stats.count : 0
      };
    });

    res.json(availableRoomsWithRatings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new reservation request (Organizer)
router.post('/', async (req, res) => {
  const { organizer_id, room_id, date, start_time, end_time, title, description, resources, attendees } = req.body;
  try {
    // --- Policy Enforcement ---
    const policies = await getPoliciesMap();

    // Working Hours Check
    const whStart = policies.working_hours_start || '08:45';
    const whEnd = policies.working_hours_end || '16:30';
    if (start_time < whStart) {
      return res.status(400).json({ error: `Booking start time cannot be before working hours (${whStart}).` });
    }
    if (end_time > whEnd) {
      return res.status(400).json({ error: `Booking end time cannot be after working hours (${whEnd}).` });
    }

    // Max Bookings Per User Check (Upcoming active bookings)
    const maxBookings = parseInt(policies.max_bookings_per_user) || 20;
    const today = new Date().toISOString().split('T')[0];
    const { count: activeBookings } = await supabase.from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('organizer_id', organizer_id)
      .gte('date', today)
      .in('status', ['approved', 'pending']);
    if (activeBookings >= maxBookings) {
      return res.status(400).json({ error: `You have reached the maximum of ${maxBookings} active upcoming bookings.` });
    }

    // --- Validation 1 & 2: Time Conflict & Duplicate Reservation ---
    const { data: overlappingReservations } = await supabase.from('reservations')
      .select('*')
      .eq('room_id', room_id)
      .eq('date', date)
      .in('status', ['approved', 'pending']);
      
    const hasConflict = (overlappingReservations || []).some(r => {
      return (start_time < r.end_time && end_time > r.start_time);
    });
    
    if (hasConflict) {
      const { data: orgProfile } = await supabase.from('profiles').select('role, category').eq('id', organizer_id).single();
      if (orgProfile && orgProfile.category === 'faculty') {
        const priorityEnabled = policies.faculty_priority !== 'disabled';
        if (priorityEnabled) {
          return res.status(400).json({ error: 'Room is already booked for the selected time slot. As a faculty member, your request has been flagged as priority — please contact the Admin.' });
        }
      }
      return res.status(400).json({ error: 'Room is already booked for the selected time slot.' });
    }

    // --- Validation 3: Resource availability ---
    if (resources && resources.length > 0) {
      const { data: allOverlaps } = await supabase.from('reservations')
        .select('id, start_time, end_time')
        .eq('date', date)
        .in('status', ['approved', 'pending']);
        
      const overlapIds = (allOverlaps || [])
        .filter(r => (start_time < r.end_time && end_time > r.start_time))
        .map(r => r.id);
      
      let usageCount = {};
      if (overlapIds.length > 0) {
        const { data: usedResources } = await supabase.from('reservation_resources')
          .select('resource_id, quantity')
          .in('reservation_id', overlapIds);
        if (usedResources) {
          usedResources.forEach(ur => {
            usageCount[ur.resource_id] = (usageCount[ur.resource_id] || 0) + (ur.quantity || 1);
          });
        }
      }
      
      const { data: resourceData } = await supabase.from('resources').select('*, room_resources(quantity)');
      
      for (let rId of resources) {
        const resData = resourceData.find(r => r.id === rId);
        if (resData) {
          const assignedToRooms = (resData.room_resources || []).reduce((sum, rr) => sum + (rr.quantity || 1), 0);
          const usedInMeetings = usageCount[rId] || 0;
          const available = resData.total_quantity - assignedToRooms - usedInMeetings;
          if (available < 1) {
            return res.status(400).json({ error: `Resource "${resData.name}" is fully booked during this time slot.` });
          }
        }
      }
    }

    // --- Create Reservation ---
    const { data: reservation, error: resError } = await supabase.from('reservations')
      .insert([{ organizer_id, room_id, date, start_time, end_time, description }]).select().single();
    if (resError) throw resError;

    // Add requested resources
    if (resources && resources.length > 0) {
      const resourceData = resources.map(rId => ({ reservation_id: reservation.id, resource_id: rId, quantity: 1 }));
      await supabase.from('reservation_resources').insert(resourceData);
    }

    // Create Meeting Entry
    const { data: meeting, error: meetingError } = await supabase.from('meetings')
      .insert([{ reservation_id: reservation.id, title }]).select().single();
    if (meetingError) throw meetingError;

    // Add Attendees
    if (attendees && typeof attendees === 'string') {
      const emails = attendees.split(',').map(e => e.trim()).filter(e => e);
      if (emails.length > 0) {
        const { data: matchedProfiles } = await supabase.from('profiles').select('id, email').in('email', emails);
        
        if (matchedProfiles && matchedProfiles.length > 0) {
          const attendeeData = matchedProfiles.map(p => ({ meeting_id: meeting.id, user_id: p.id }));
          const { error: attError } = await supabase.from('attendees').insert(attendeeData);
          if (attError) console.error("Attendee insert error:", attError);
        }
      }
    }

    // DISPATCH NOTIFICATION
    notifyAdmins(`New reservation request: ${title} on ${date}`, 'request');
    
    // AUDIT LOG
    logAudit(organizer_id, 'RESERVATION_CREATED', `Reservation requested for room ID ${room_id} on ${date} (${start_time}-${end_time})`);

    res.status(201).json({ message: 'Reservation request submitted successfully', reservation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Metadata Storage Helpers (stores MoM, Descriptions, and Venue Requests)
const savePolicyMeta = async (key, value) => {
  try {
    await supabase.from('policies').upsert({ key, value: typeof value === 'object' ? JSON.stringify(value) : String(value), description: 'System Meta' });
  } catch (e) { console.error('Meta save error:', e); }
};

const getPolicyMeta = async (key) => {
  try {
    const { data } = await supabase.from('policies').select('value').eq('key', key).single();
    if (!data) return null;
    try { return JSON.parse(data.value); } catch (e) { return data.value; }
  } catch (e) { return null; }
};

// Enrich reservation object with metadata (description, MoM, venue change)
const enrichReservation = async (res) => {
  const desc = await getPolicyMeta(`desc_${res.id}`);
  const mom = await getPolicyMeta(`mom_${res.id}`);
  const vc = await getPolicyMeta(`vc_${res.id}`);

  let requestedRoom = null;
  if (vc?.requested_room_id) {
    const { data: rm } = await supabase.from('rooms').select('name, location, floor').eq('id', vc.requested_room_id).single();
    requestedRoom = rm;
  }

  // Format meetings object to include minutes_of_meeting
  let meetings = res.meetings;
  if (Array.isArray(meetings) && meetings.length > 0) {
    meetings = meetings.map(m => ({ ...m, minutes_of_meeting: mom?.minutes_of_meeting || null }));
  } else if (meetings && typeof meetings === 'object') {
    meetings = { ...meetings, minutes_of_meeting: mom?.minutes_of_meeting || null };
  }

  return {
    ...res,
    description: desc || res.description || null,
    venue_change_status: vc?.status || res.venue_change_status || null,
    venue_change_reason: vc?.reason || res.venue_change_reason || null,
    requested_room_id: vc?.requested_room_id || null,
    requested_room: requestedRoom,
    meetings
  };
};

// Get Organizer's reservations
router.get('/organizer/:id', async (req, res) => {
  try {
    const { data, error } = await supabase.from('reservations')
      .select('*, rooms(name, location, floor), meetings(id, title)')
      .eq('organizer_id', req.params.id)
      .order('date', { ascending: false });
    if (error) throw error;

    const enriched = await Promise.all((data || []).map(r => enrichReservation(r)));
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all pending requests (Admin)
router.get('/pending', async (req, res) => {
  try {
    const { data, error } = await supabase.from('reservations')
      .select('*, profiles(name, email, category), rooms(name, location, floor), meetings(id, title)')
      .eq('status', 'pending');
    if (error) throw error;

    const enriched = await Promise.all((data || []).map(r => enrichReservation(r)));
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all reservations (Admin)
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let query = supabase.from('reservations')
      .select('*, profiles(name, email, category), rooms(name, location, floor), meetings(id, title)')
      .order('date', { ascending: false });
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    const { data, error } = await query;
    if (error) throw error;

    const enriched = await Promise.all((data || []).map(r => enrichReservation(r)));
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Organizer requests a venue/room change
router.post('/:id/venue-change-request', async (req, res) => {
  const { requested_room_id, reason } = req.body;
  try {
    const resId = req.params.id;
    const { data: reservation } = await supabase.from('reservations').select('*').eq('id', resId).single();

    const vcData = {
      requested_room_id,
      reason,
      status: 'pending'
    };

    await savePolicyMeta(`vc_${resId}`, vcData);

    notifyAdmins(`Venue change requested for booking ID ${resId}`, 'request');
    logAudit(reservation?.organizer_id, 'VENUE_CHANGE_REQUESTED', `Venue change requested to room ID ${requested_room_id}`);

    res.json({ message: 'Venue change request submitted to Admin for approval', reservation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin approves or rejects a venue change request
router.put('/:id/venue-change-approve', async (req, res) => {
  const { status, admin_notes } = req.body; // 'approved' or 'rejected'
  try {
    const resId = req.params.id;
    const { data: currentRes } = await supabase.from('reservations')
      .select('*, meetings(id, title)')
      .eq('id', resId)
      .single();

    const vcMeta = (await getPolicyMeta(`vc_${resId}`)) || {};
    vcMeta.status = status;
    if (admin_notes) vcMeta.admin_notes = admin_notes;

    let updatedRes = currentRes;
    if (status === 'approved' && vcMeta.requested_room_id) {
      const { data: newRoomRes } = await supabase.from('reservations')
        .update({ room_id: vcMeta.requested_room_id })
        .eq('id', resId)
        .select('*, rooms(name, location)')
        .single();
      if (newRoomRes) updatedRes = newRoomRes;
    }

    await savePolicyMeta(`vc_${resId}`, vcMeta);

    const title = currentRes?.meetings?.[0]?.title || currentRes?.meetings?.title || 'Meeting';
    const roomName = updatedRes?.rooms?.name || 'New Room';

    if (status === 'approved') {
      notifyUser(currentRes.organizer_id, `Venue change APPROVED! Meeting "${title}" moved to ${roomName}.`, 'success');
      notifyAttendees(resId, `Venue Updated: Meeting "${title}" is now held at ${roomName}.`, 'info');
      logAudit(currentRes.organizer_id, 'VENUE_CHANGE_APPROVED', `Venue change approved to ${roomName}`);
    } else {
      notifyUser(currentRes.organizer_id, `Venue change request for "${title}" was REJECTED by Admin.`, 'warning');
      logAudit(currentRes.organizer_id, 'VENUE_CHANGE_REJECTED', `Venue change request rejected`);
    }

    res.json({ message: `Venue change request ${status}`, reservation: updatedRes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Organizer submits Minutes of Meeting (MoM)
router.post('/:id/mom', async (req, res) => {
  const { minutes_of_meeting } = req.body;
  try {
    const resId = req.params.id;
    const { data: meetings } = await supabase.from('meetings')
      .select('id, title, reservation_id, reservations(organizer_id)')
      .eq('reservation_id', resId);

    const meetingObj = (meetings && meetings.length > 0) ? meetings[0] : {};

    await savePolicyMeta(`mom_${resId}`, {
      minutes_of_meeting,
      submitted_at: new Date().toISOString(),
      title: meetingObj.title || 'Meeting'
    });

    notifyAttendees(resId, `Minutes of Meeting (MoM) posted for "${meetingObj.title || 'Meeting'}".`, 'info');
    logAudit(meetingObj.reservations?.organizer_id, 'MOM_SUBMITTED', `MoM submitted for meeting "${meetingObj.title || 'Meeting'}"`);

    res.json({ message: 'Minutes of Meeting (MoM) saved successfully', minutes_of_meeting });
  } catch (error) {
    console.error('MoM save error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Approve, Reject, or Request Modification (Admin)
router.put('/:id/status', async (req, res) => {
  const { status, admin_notes } = req.body; 
  try {
    const updatePayload = { status };
    if (admin_notes !== undefined) {
      updatePayload.admin_notes = admin_notes;
    }
    const { data, error } = await supabase.from('reservations')
      .update(updatePayload)
      .eq('id', req.params.id).select().single();
    if (error) throw error;
    
    // Notifications
    const resId = data.id;
    const organizerId = data.organizer_id;
    const resDate = data.date;
    
    if (status === 'approved') {
      notifyUser(organizerId, `Your reservation on ${resDate} was approved!`, 'approval');
      notifyAttendees(resId, `You have been invited to a meeting on ${resDate}.`, 'invitation');
    } else if (status === 'rejected') {
      notifyUser(organizerId, `Your reservation on ${resDate} was rejected.`, 'rejection');
    } else if (status === 'modification_requested') {
      notifyUser(organizerId, `Admin requested modifications for your reservation on ${resDate}.`, 'modification');
    }

    // AUDIT LOG (Admin is the one making the request, but we don't have Admin ID here easily since verifyToken isn't applied strictly or extracting user ID. Wait, req.user.id is available if verifyToken is used! Let's log it against the organizer if admin ID is missing, or just pass req.user.id)
    const adminId = req.user?.id || organizerId;
    logAudit(adminId, `RESERVATION_${status.toUpperCase()}`, `Reservation ID ${resId} status updated to ${status}`);

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Reservation (Organizer Resubmit)
router.put('/:id', async (req, res) => {
  const { date, start_time, end_time, room_id } = req.body;
  try {
    const { data, error } = await supabase.from('reservations')
      .update({ date, start_time, end_time, room_id, status: 'pending', admin_notes: null })
      .eq('id', req.params.id).select().single();
    if (error) throw error;
    
    notifyAdmins(`Reservation ID ${data.id} was resubmitted by the Organizer for ${date}.`, 'update');

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cancel/Delete Reservation (Organizer)
router.delete('/:id', async (req, res) => {
  try {
    const { data: resData, error: fetchErr } = await supabase.from('reservations').select('*').eq('id', req.params.id).single();
    if (fetchErr) throw fetchErr;

    // Cancellation Deadline Policy
    const policies = await getPoliciesMap();
    const deadlineHours = parseInt(policies.cancellation_deadline_hours) || 24;
    if (resData.date && resData.start_time) {
      const meetingStart = new Date(`${resData.date}T${resData.start_time}`);
      const hoursUntilMeeting = (meetingStart - new Date()) / (1000 * 60 * 60);
      if (hoursUntilMeeting < deadlineHours && hoursUntilMeeting > 0) {
        return res.status(400).json({ error: `Cannot cancel within ${deadlineHours} hours of the meeting start time.` });
      }
    }

    const { error } = await supabase.from('reservations').delete().eq('id', req.params.id);
    if (error) throw error;

    notifyAdmins(`Reservation for ${resData.date} was cancelled by Organizer.`, 'cancellation');
    notifyAttendees(resData.id, `A meeting on ${resData.date} has been cancelled.`, 'cancellation');
    
    logAudit(req.user?.id || resData.organizer_id, 'RESERVATION_CANCELLED', `Reservation ID ${req.params.id} cancelled by Organizer.`);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get calendar data (Admin/Organizer)
router.get('/calendar', async (req, res) => {
  try {
    const { data: reservations, error: resError } = await supabase.from('reservations')
      .select('*, rooms(name), meetings(title), profiles(name)')
      .in('status', ['approved', 'pending']);
    if (resError) throw resError;

    const { data: rooms, error: roomsError } = await supabase.from('rooms').select('*');
    if (roomsError) throw roomsError;

    res.json({ reservations, rooms });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
