const cron = require('node-cron');
const supabase = require('./supabaseClient');

// Run every minute to check for upcoming meeting reminders (1 hour before start)
cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();
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
      
      // Trigger 1-Hour Reminder if meeting starts in 1 to 60 minutes
      if (diffMinutes > 0 && diffMinutes <= 60) {
        const title = res.meetings[0].title || 'Meeting';
        const orgReminderMsg = `⏰ Meeting Reminder: Your meeting "${title}" starts in 1 hour at ${res.rooms.name} (${res.start_time}). [ID:${res.id}]`;
        const attReminderMsg = `⏰ Upcoming Meeting: "${title}" starts in 1 hour at ${res.rooms.name} (${res.start_time}). [ID:${res.id}]`;
        
        // Notify Organizer 1 hour before meeting
        await sendReminderIfNotSent(res.organizer_id, orgReminderMsg);

        // Notify All Invited & Accepted Attendees 1 hour before meeting
        const { data: attendees } = await supabase.from('attendees')
            .select('user_id')
            .eq('meeting_id', res.meetings[0].id);
        
        if (attendees && attendees.length > 0) {
            for (const att of attendees) {
                await sendReminderIfNotSent(att.user_id, attReminderMsg);
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
