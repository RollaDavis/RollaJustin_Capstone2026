import './bootstrap';
import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';

document.addEventListener('DOMContentLoaded', () => {
	const calendarEl = document.getElementById('calendar');

	if (!calendarEl) {
		return;
	}

	const calendar = new Calendar(calendarEl, {
		plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
        initialView: 'timeGridWeek',
        allDaySlot: false,
        slotMinTime: '08:00:00',
        slotMaxTime: '17:00:00',
        slotDuration: '00:10:00',
        snapDuration: '00:10:00',
        editable: true,
        selectable: true,
        droppable: true,
        dayHeaderFormat: { weekday: 'short' },
		height: 'auto',
		headerToolbar: {
            left: false,
            center: false,
            right: false
        },
        weekends: false,
        businessHours: {
            daysOfWeek: [1, 2, 3, 4, 5],
            startTime: '08:00',
            endTime: '17:00'
        }
	});

	calendar.render();
});
