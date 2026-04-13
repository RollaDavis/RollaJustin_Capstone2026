import { Calendar } from '@fullcalendar/core';
import interactionPlugin from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import { buildCalendarEventsFromCourses } from './calendarEvents';
import { initializeUnscheduledCourseDnd } from './unscheduled-course-dnd';
import { showEventDetailsModal } from './event-details-modal';

const formatDurationLabel = (durationHours) => {
    if (!Number.isFinite(durationHours) || durationHours <= 0) {
        return '';
    }

    const totalMinutes = Math.round(durationHours * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0 && minutes > 0) {
        return `${hours}h ${minutes}m`;
    }

    if (hours > 0) {
        return `${hours}h`;
    }

    return `${minutes}m`;
};

const applyDurationLabel = (eventElement, durationHours) => {
    if (!eventElement) {
        return;
    }

    const durationLabel = formatDurationLabel(Number(durationHours));

    if (!durationLabel) {
        return;
    }

    const timeEl = eventElement.querySelector('.fc-event-time, .fc-list-event-time');

    if (!timeEl) {
        return;
    }

    const originalText = timeEl.textContent || '';
    const withoutDuration = originalText.split('|')[0].trim();
    timeEl.textContent = `${withoutDuration} | ${durationLabel}`;
};

const clearSelectedEventState = (calendarEl) => {
    if (!calendarEl) {
        return;
    }

    calendarEl.querySelectorAll('.fc-timegrid-event.is-selected, .fc-list-event.is-selected').forEach((eventEl) => {
        eventEl.classList.remove('is-selected');
    });
};

const setSelectedGroupState = (calendarEl, groupId) => {
    if (!calendarEl || !groupId) {
        return;
    }

    const safeGroupId = CSS.escape(String(groupId));

    calendarEl.querySelectorAll(`.fc-timegrid-event[data-schedule-group-id="${safeGroupId}"], .fc-list-event[data-schedule-group-id="${safeGroupId}"]`).forEach((eventEl) => {
        eventEl.classList.add('is-selected');
    });
};

document.addEventListener('DOMContentLoaded', () => {
    const calendarEl = document.getElementById('calendar');

    if (!calendarEl) {
        return;
    }

    let unscheduledCourseDnd = null;

    const calendar = new Calendar(calendarEl, {
        plugins: [interactionPlugin, dayGridPlugin, timeGridPlugin, listPlugin],
        initialView: 'timeGridWeek',
        allDaySlot: false,
        slotMinTime: '08:00:00',
        slotMaxTime: '17:00:00',
        slotDuration: '00:10:00',
        snapDuration: '00:10:00',
        themeSystem: 'bootstrap5',
        editable: true,
        eventStartEditable: false,
        eventDurationEditable: false,
        selectable: true,
        selectMirror: false,
        eventMaxStack: 1,
        moreLinkClick: "popover",
        dayHeaderFormat: { weekday: 'short' },
        height: '100%',
        headerToolbar: false,
        weekends: false,
        eventDidMount: (info) => {
            info.el.dataset.scheduleEventId = info.event.id;
            if (info.event.groupId) {
                info.el.dataset.scheduleGroupId = info.event.groupId;
            }
            info.el.removeAttribute('tabindex');
            info.el.style.setProperty('--event-opaque-color', info.event.borderColor || '#6c757d');
            applyDurationLabel(info.el, info.event.extendedProps?.durationHours);
        },
        eventClick: (info) => {
            clearSelectedEventState(calendarEl);
            setSelectedGroupState(calendarEl, info.event.groupId || info.event.id);
        }
    });

    calendar.render();

    unscheduledCourseDnd = initializeUnscheduledCourseDnd({ calendar });

    document.dispatchEvent(new CustomEvent('schedule:calendar-ready', {
        detail: {
            calendar,
            calendarEl
        }
    }));

    document.addEventListener('click', (event) => {
        const clickedInsideEvent = event.target instanceof Element
            && event.target.closest('.fc-timegrid-event, .fc-list-event');

        if (!clickedInsideEvent) {
            clearSelectedEventState(calendarEl);
        }
    });

    const renderSelectedCourses = (detail = {}) => {
        const events = buildCalendarEventsFromCourses(detail.courses || []);

        calendar.removeAllEvents();
        events.forEach((event) => {
            calendar.addEvent(event);
        });
    };

    document.addEventListener('schedule:courses-selected', (event) => {
        unscheduledCourseDnd?.clear();
        renderSelectedCourses(event.detail || {});
    });

    document.addEventListener('schedule:open-event-details', (event) => {
        showEventDetailsModal(event.detail || {}, calendar);
    });

    document.addEventListener('schedule:move-event-to-unscheduled', (event) => {
        const eventId = event.detail?.eventId;

        if (!eventId) {
            return;
        }

        const didMove = unscheduledCourseDnd?.moveEventToUnscheduled(eventId);

        if (didMove) {
            clearSelectedEventState(calendarEl);
        }
    });

});
