import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import api from '../api';

import enUS from 'date-fns/locale/en-US';

const locales = {
  'en-US': enUS
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const CalendarView = () => {
  const [events, setEvents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [view, setView] = useState(Views.MONTH);
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    fetchCalendarData();
  }, []);

  const fetchCalendarData = async () => {
    try {
      const res = await api.get('/reservations/calendar');
      setRooms(res.data.rooms || []);
      
      const formattedEvents = (res.data.reservations || []).map(r => {
        // Parse date and time
        const start = new Date(`${r.date}T${r.start_time}`);
        const end = new Date(`${r.date}T${r.end_time}`);
        
        return {
          id: r.id,
          title: `${r.rooms?.name} - ${r.meetings?.[0]?.title || 'Meeting'} (${r.status})`,
          start,
          end,
          resourceId: r.room_id,
          status: r.status,
          organizer: r.profiles?.name
        };
      });
      setEvents(formattedEvents);
    } catch (e) {
      console.error("Failed to fetch calendar data", e);
    }
  };

  const eventStyleGetter = (event) => {
    let backgroundColor = event.status === 'approved' ? '#10b981' : '#f59e0b';
    return {
      style: {
        backgroundColor,
        borderRadius: '8px',
        opacity: 0.9,
        color: 'white',
        border: 'none',
        display: 'block',
        padding: '2px 6px',
        fontWeight: 'bold',
        fontSize: '0.8rem'
      }
    };
  };

  // Calculate available vs reserved rooms for the current day
  const reservedRoomIds = new Set();
  events.forEach(e => {
    if (
      e.start.getFullYear() === date.getFullYear() &&
      e.start.getMonth() === date.getMonth() &&
      e.start.getDate() === date.getDate()
    ) {
      reservedRoomIds.add(e.resourceId);
    }
  });

  const availableRoomsCount = rooms.length - reservedRoomIds.size;
  const reservedRoomsCount = reservedRoomIds.size;

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500 font-medium">Reserved Rooms (Today)</p>
          <p className="text-3xl font-bold text-indigo-600">{reservedRoomsCount}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500 font-medium">Available Rooms (Today)</p>
          <p className="text-3xl font-bold text-emerald-600">{availableRoomsCount}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-[700px]">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          views={['month', 'week', 'day']}
          view={view}
          date={date}
          onView={(v) => setView(v)}
          onNavigate={(d) => setDate(d)}
          eventPropGetter={eventStyleGetter}
          popup
        />
      </div>
    </div>
  );
};

export default CalendarView;
