const cron = require('node-cron');
const supabase = require('./supabaseClient');

// Run every minute to check for upcoming meetings
cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();
    // In local time to match database date strings if they are local
    // Assuming date strings in DB are 'YYYY-MM-DD'
    const today = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    
    const { data: reservations, error } = await supabase.from('reservations')
      .select('*, meetings(id, title), rooms(name)')
      .eq('status', 'approved')
      .eq('date', today);
      
    if (error || !reservations) return;

    for (const res of reservations) {
      if (!res.meetings || res.meetings.length === 0 || !res.rooms) continue;
      
      const [hours, minutes] = res.start_time.split(':');
      const meetingTime = new Date();
      meetingTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      
      const diffMinutes = (meetingTime - now) / 60000;
      
      // If meeting is coming up in <= 15 mins (and hasn't passed)
      if (diffMinutes > 0 && diffMinutes <= 15) {
        const title = res.meetings[0].title || 'Meeting';
        const reminderMsg = `Reminder: "${title}" starts in 15 minutes at ${res.rooms.name}. [ResID:${res.id}]`;
        
        // Notify Organizer
        await sendReminderIfNotSent(res.organizer_id, reminderMsg);

        // Notify Accepted Attendees
        const { data: attendees } = await supabase.from('attendees')
            .select('user_id')
            .eq('meeting_id', res.meetings[0].id)
            .eq('status', 'accepted');
        
        if (attendees) {
            for (const att of attendees) {
                await sendReminderIfNotSent(att.user_id, reminderMsg);
            }
        }
      }
    }
  } catch (error) {
    console.error("Cron Job Error:", error.message);
  }
});

async function sendReminderIfNotSent(userId, message) {
  try {
    const { data, error } = await supabase.from('notifications')
      .select('id')
      .eq('user_id', userId)
      .eq('message', message)
      .eq('type', 'reminder')
      .maybeSingle();
      
    if (error) throw error;

    if (!data) {
      await supabase.from('notifications').insert([{
        user_id: userId,
        message,
        type: 'reminder'
      }]);
    }
  } catch (error) {
    console.error("Reminder Notification Error:", error.message);
  }
}
