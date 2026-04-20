import { Calendar } from '@fullcalendar/core';
import interactionPlugin from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';

const DAY_TO_INDEX = {
    U: 0,
    M: 1,
    T: 2,
    W: 3,
    R: 4,
    F: 5,
    S: 6
};

const normalizeTime = (timeString) => {
    if (!timeString) {
        return null;
    }

    const [hours, minutes = '00', seconds = '00'] = String(timeString).split(':');

    if (hours === undefined || minutes === undefined) {
        return null;
    }

    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
};

const addMinutesToTime = (timeString, minutesToAdd) => {
    const normalized = normalizeTime(timeString);

    if (!normalized) {
        return null;
    }

    const [hours, minutes, seconds] = normalized.split(':').map(Number);
    const totalMinutes = (hours * 60) + minutes + minutesToAdd;
    const wrappedMinutes = ((totalMinutes % (24 * 60)) + (24 * 60)) % (24 * 60);
    const endHours = Math.floor(wrappedMinutes / 60);
    const endMins = wrappedMinutes % 60;

    return `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}:${String(seconds || 0).padStart(2, '0')}`;
};

const parseDays = (daysString) => {
    if (!daysString) {
        return [];
    }

    const uniqueDays = new Set();

    for (const dayChar of String(daysString).toUpperCase()) {
        if (Object.prototype.hasOwnProperty.call(DAY_TO_INDEX, dayChar)) {
            uniqueDays.add(DAY_TO_INDEX[dayChar]);
        }
    }

    return [...uniqueDays].sort((a, b) => a - b);
};

const toBlockoffEvent = (rawTimeBlock = {}, selectedView = '') => {
    const attributes = rawTimeBlock.attributes || rawTimeBlock;
    const blockoffId = rawTimeBlock.id ?? attributes.id;
    const selectedId = Number(attributes.instructor_id ?? attributes.room_id ?? '');
    const startTime = normalizeTime(attributes.start_time);
    const durationHours = Number(attributes.duration);
    const daysOfWeek = parseDays(attributes.days);

    if (!blockoffId || !startTime || !Number.isFinite(durationHours) || durationHours <= 0 || daysOfWeek.length === 0) {
        return null;
    }

    const endTime = addMinutesToTime(startTime, Math.round(durationHours * 60));

    if (!endTime) {
        return null;
    }

    return {
        id: `blockoff-${selectedView}-${blockoffId}`,
        title: '',
        daysOfWeek,
        startTime,
        endTime,
        display: 'background',
        overlap: false,
        backgroundColor: 'rgba(197, 11, 11, 0.68)',
        borderColor: '#7f1d1d',
        classNames: ['schedule-blockoff-event'],
        extendedProps: {
            isBlockoff: true,
            blockoffId: Number(blockoffId),
            blockoffType: selectedView,
            blockoffTargetId: Number.isInteger(selectedId) && selectedId > 0 ? selectedId : null
        }
    };
};

const fetchTimeblocksForSelection = async (detail = {}) => {
    const selectedView = String(detail.selectedView || '').trim();
    const selectedId = Number(detail.selectedId || '');

    if (!Number.isInteger(selectedId) || selectedId <= 0) {
        return [];
    }

    let endpoint = null;

    if (selectedView === 'instructor') {
        endpoint = `/api/v1/instructors/${selectedId}/timeblocks`;
    } else if (selectedView === 'room') {
        endpoint = `/api/v1/rooms/${selectedId}/timeblocks`;
    }

    if (!endpoint) {
        return [];
    }

    try {
        const response = await fetch(endpoint);

        if (!response.ok) {
            throw new Error(`Failed to load timeblocks: ${response.status}`);
        }

        const payload = await response.json();
        const timeblocks = Array.isArray(payload)
            ? payload
            : (Array.isArray(payload?.data) ? payload.data : []);

        return timeblocks
            .map((timeblock) => toBlockoffEvent(timeblock, selectedView))
            .filter((event) => event !== null);
    } catch (error) {
        console.error('Unable to load timeblocks for schedule view', error);
        return [];
    }
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
    let currentSelectionDetail = {};
    let activeRenderRequestToken = 0;

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
        selectOverlap: (event) => {
            return !event.extendedProps?.isBlockoff;
        },
        selectMirror: false,
        eventMaxStack: 1,
        moreLinkClick: "popover",
        dayHeaderFormat: { weekday: 'short' },
        height: '100%',
        headerToolbar: false,
        weekends: false,
        select: (selectionInfo) => {
            document.dispatchEvent(new CustomEvent('schedule:selection-changed', {
                detail: {
                    selection: {
                        start: selectionInfo.start,
                        end: selectionInfo.end,
                        startStr: selectionInfo.startStr,
                        endStr: selectionInfo.endStr,
                        allDay: selectionInfo.allDay
                    }
                }
            }));
        },
        unselect: () => {
            document.dispatchEvent(new CustomEvent('schedule:selection-changed', {
                detail: {
                    selection: null
                }
            }));
        },
        eventDidMount: (info) => {
            info.el.dataset.scheduleEventId = info.event.id;
            info.el.dataset.scheduleIsBlockoff = info.event.extendedProps?.isBlockoff ? 'true' : 'false';

            if (info.event.extendedProps?.isBlockoff) {
                info.el.dataset.scheduleBlockoffId = String(info.event.extendedProps?.blockoffId || '');
                info.el.dataset.scheduleBlockoffType = String(info.event.extendedProps?.blockoffType || '');
                info.el.dataset.scheduleBlockoffTargetId = String(info.event.extendedProps?.blockoffTargetId || '');
            }

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

    const renderSelectedCourses = async (detail = {}) => {
        const requestToken = ++activeRenderRequestToken;
        const courseEvents = buildCalendarEventsFromCourses(detail.courses || []);
        const blockoffEvents = await fetchTimeblocksForSelection(detail);

        if (requestToken !== activeRenderRequestToken) {
            return;
        }

        calendar.removeAllEvents();
        [...courseEvents, ...blockoffEvents].forEach((event) => {
            calendar.addEvent(event);
        });
    };

    document.addEventListener('schedule:courses-selected', (event) => {
        unscheduledCourseDnd?.clear();
        currentSelectionDetail = event.detail || {};
        renderSelectedCourses(currentSelectionDetail);
    });

    document.addEventListener('schedule:blockoff-created', () => {
        renderSelectedCourses(currentSelectionDetail);
    });

    document.addEventListener('schedule:open-event-details', (event) => {
        showEventDetailsModal(event.detail || {}, calendar);
    });

    document.addEventListener('schedule:open-blockoff-creation', (event) => {
        showBlockoffCreationModal(event.detail || {}, calendar);
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

    document.addEventListener('schedule:remove-blockoff', async (event) => {
        const blockoffId = Number(event.detail?.blockoffId || '');
        const targetId = Number(event.detail?.targetId || '');
        const blockoffType = String(event.detail?.blockoffType || '').trim();

        if (!Number.isInteger(blockoffId) || blockoffId <= 0 || !Number.isInteger(targetId) || targetId <= 0) {
            return;
        }

        if (!['instructor', 'room'].includes(blockoffType)) {
            return;
        }

        const didConfirm = window.confirm('Are you sure you want to remove this blockoff?');

        if (!didConfirm) {
            return;
        }

        const endpoint = blockoffType === 'instructor'
            ? `/api/v1/instructors/${targetId}/timeblocks/${blockoffId}`
            : `/api/v1/rooms/${targetId}/timeblocks/${blockoffId}`;

        try {
            const response = await fetch(endpoint, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Unable to remove blockoff (${response.status}).`);
            }

            renderSelectedCourses(currentSelectionDetail);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unable to remove blockoff.';
            window.alert(message);
        }
    });

});
