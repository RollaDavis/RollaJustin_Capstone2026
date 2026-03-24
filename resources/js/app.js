import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction/index.js';
import { Popover } from 'bootstrap';
import { buildCalendarEventsFromCourses } from './calendarEvents';

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
        selectMirror: true,
        themeSystem: 'bootstrap5',
        editable: true,
        selectable: true,
        droppable: true,
        dragScroll: true,
        eventMaxStack: 1,
        moreLinkClick: "popover",
        dayHeaderFormat: { weekday: 'short' },
		height: '100%',
		headerToolbar: false,
        weekends: false,
        businessHours: {
            daysOfWeek: [1, 2, 3, 4, 5],
            startTime: '08:00',
            endTime: '17:00'
        },
	});

	calendar.render();

    const renderSelectedCourses = (detail = {}) => {
        const events = buildCalendarEventsFromCourses(detail.courses || []);

        calendar.removeAllEvents();
        events.forEach((event) => {
            calendar.addEvent(event);
        });
    };

    document.addEventListener('schedule:courses-selected', (event) => {
        renderSelectedCourses(event.detail || {});
    });
});
