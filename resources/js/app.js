import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction/index.js';
import { Modal } from 'bootstrap';
import { buildCalendarEventsFromCourses } from './calendarEvents';

const showEventDetailsModal = () => {
    const modalEl = document.getElementById('eventDetailsModal');

    if (!modalEl) {
        return;
    }

    Modal.getOrCreateInstance(modalEl).show();
};

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

    if (eventElement.classList.contains('fc-event-mirror') || eventElement.classList.contains('fc-event-ghost')) {
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

const getDragScopeKey = (event) => event.groupId || event.id;

const getScopedMoreLinksForDrag = (calendarEl, scopeKey) => {
    if (!calendarEl || !scopeKey) {
        return [];
    }

    const safeScopeKey = CSS.escape(String(scopeKey));
    const affectedEvents = calendarEl.querySelectorAll(`.fc-timegrid-event[data-schedule-drag-key="${safeScopeKey}"]`);

    if (affectedEvents.length === 0) {
        return [];
    }

    const links = new Set();

    affectedEvents.forEach((eventEl) => {
        const eventHarness = eventEl.closest('.fc-timegrid-event-harness') || eventEl;
        const colEvents = eventEl.closest('.fc-timegrid-col-events');

        if (!colEvents) {
            return;
        }

        const eventRect = eventHarness.getBoundingClientRect();
        const colLinks = Array.from(colEvents.querySelectorAll('.fc-timegrid-more-link'));

        if (colLinks.length === 0) {
            return;
        }

        let hasOverlapMatch = false;

        colLinks.forEach((link) => {
            const linkRect = link.getBoundingClientRect();
            const overlapsVertically = linkRect.top <= eventRect.bottom && linkRect.bottom >= eventRect.top;

            if (overlapsVertically) {
                links.add(link);
                hasOverlapMatch = true;
            }
        });

        if (!hasOverlapMatch) {
            const eventMidpoint = eventRect.top + (eventRect.height / 2);
            const nearestLink = colLinks.reduce((nearest, current) => {
                if (!nearest) {
                    return current;
                }

                const nearestRect = nearest.getBoundingClientRect();
                const currentRect = current.getBoundingClientRect();
                const nearestDistance = Math.abs((nearestRect.top + (nearestRect.height / 2)) - eventMidpoint);
                const currentDistance = Math.abs((currentRect.top + (currentRect.height / 2)) - eventMidpoint);

                return currentDistance < nearestDistance ? current : nearest;
            }, null);

            if (nearestLink) {
                links.add(nearestLink);
            }
        }
    });

    return Array.from(links);
};

document.addEventListener('DOMContentLoaded', () => {
    const calendarEl = document.getElementById('calendar');

    if (!calendarEl) {
        return;
    }

    let hiddenMoreLinks = [];

    const hideLinks = (links) => {
        hiddenMoreLinks = links.map((link) => ({
            link,
            originalVisibility: link.style.visibility
        }));

        hiddenMoreLinks.forEach(({ link }) => {
            link.style.visibility = 'hidden';
        });
    };

    const restoreHiddenLinks = () => {
        hiddenMoreLinks.forEach(({ link, originalVisibility }) => {
            link.style.visibility = originalVisibility;
        });

        hiddenMoreLinks = [];
    };

    const calendar = new Calendar(calendarEl, {
        plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
        initialView: 'timeGridWeek',
        allDaySlot: false,
        slotMinTime: '08:00:00',
        slotMaxTime: '17:00:00',
        slotDuration: '00:10:00',
        snapDuration: '00:10:00',
        themeSystem: 'bootstrap5',
        editable: true,
        dragRevertDuration: false,
        selectable: true,
        droppable: true,
        dragScroll: true,
        eventMaxStack: 1,
        moreLinkClick: "popover",
        dayHeaderFormat: { weekday: 'short' },
        height: '100%',
        headerToolbar: false,
        weekends: false,
        eventDidMount: (info) => {
            info.el.dataset.scheduleEventId = info.event.id;
            info.el.dataset.scheduleDragKey = getDragScopeKey(info.event);
            if (info.event.groupId) {
                info.el.dataset.scheduleGroupId = info.event.groupId;
            }
            info.el.style.setProperty('--event-opaque-color', info.event.borderColor || '#6c757d');
            applyDurationLabel(info.el, info.event.extendedProps?.durationHours);
        },
        eventDrop: (info) => {
            applyDurationLabel(info.el, info.event.extendedProps?.durationHours);
        },
        eventClick: (info) => {
            clearSelectedEventState(calendarEl);
            setSelectedGroupState(calendarEl, info.event.groupId || info.event.id);
        },
        eventDragStart: function (info) {
            restoreHiddenLinks();
            const scopeKey = getDragScopeKey(info.event);
            const scopedLinks = getScopedMoreLinksForDrag(calendarEl, scopeKey);
            hideLinks(scopedLinks);
        },
        eventDragStop: function (info) {
            restoreHiddenLinks();
        }
    });

    calendar.render();

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
        renderSelectedCourses(event.detail || {});
    });

    document.addEventListener('schedule:open-event-details', () => {
        showEventDetailsModal();
    });

});
