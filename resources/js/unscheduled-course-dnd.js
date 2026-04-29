import { DEFAULT_EVENT_COLOR_PALETTE } from './eventColorPalette';

const toScheduleGroupKey = ({ id, groupId }) => String(groupId || id || '');

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

const dateToTimeString = (date) => {
    if (!(date instanceof Date)) {
        return null;
    }

    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:00`;
};

const formatTimeLabelFromHHMMSS = (timeString) => {
    const normalized = String(timeString || '').trim();

    if (!normalized) {
        return null;
    }

    const [hoursText, minutesText = '00'] = normalized.split(':');
    const hours = Number(hoursText);
    const minutes = Number(minutesText);

    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
        return null;
    }

    const period = hours >= 12 ? 'PM' : 'AM';
    const normalizedHours = hours % 12 || 12;

    return `${normalizedHours}:${String(minutes).padStart(2, '0')} ${period}`;
};

const formatScheduleWindowLabel = (payload = {}) => {
    const schedule = payload.originalSchedule || payload.extendedProps?.originalSchedule || null;
    const start = formatTimeLabelFromHHMMSS(schedule?.startTime);
    const end = formatTimeLabelFromHHMMSS(schedule?.endTime);

    if (start && end) {
        return `${start} - ${end}`;
    }

    return null;
};

const formatUnscheduledTimeMetaLabel = (payload = {}) => {
    const timeLabel = formatScheduleWindowLabel(payload);

    if (timeLabel) {
        return timeLabel;
    }

    return 'Time TBD';
};

const toUnscheduledPayload = (calendarEvent) => {
    const durationHours = Number(calendarEvent.extendedProps?.durationHours);

    return {
        id: calendarEvent.id,
        title: calendarEvent.title,
        groupId: calendarEvent.groupId || null,
        backgroundColor: calendarEvent.backgroundColor || (DEFAULT_EVENT_COLOR_PALETTE[0] && DEFAULT_EVENT_COLOR_PALETTE[0].backgroundColor) || null,
        borderColor: calendarEvent.borderColor || (DEFAULT_EVENT_COLOR_PALETTE[0] && DEFAULT_EVENT_COLOR_PALETTE[0].borderColor) || null,
        textColor: calendarEvent.textColor || (DEFAULT_EVENT_COLOR_PALETTE[0] && DEFAULT_EVENT_COLOR_PALETTE[0].borderColor) || null,
        durationHours: Number.isFinite(durationHours) ? durationHours : null,
        extendedProps: {
            ...calendarEvent.extendedProps
        }
    };
};

const deriveOriginalSchedule = (calendarEvent, relatedEvents = []) => {
    const existingSchedule = calendarEvent.extendedProps?.originalSchedule;

    if (existingSchedule && Array.isArray(existingSchedule.daysOfWeek) && existingSchedule.daysOfWeek.length > 0) {
        return existingSchedule;
    }

    const inferredDays = [...new Set(relatedEvents
        .map((event) => (event.start instanceof Date ? event.start.getDay() : null))
        .filter((day) => Number.isInteger(day)))].sort((a, b) => a - b);

    return {
        daysOfWeek: inferredDays,
        startTime: dateToTimeString(calendarEvent.start),
        endTime: dateToTimeString(calendarEvent.end)
    };
};

export const initializeUnscheduledCourseDnd = ({
    calendar,
    containerSelector = '.unscheduled-events'
}) => {
    const unscheduledEventsContainer = document.querySelector(containerSelector);
    const unscheduledEmptyState = unscheduledEventsContainer
        ? unscheduledEventsContainer.querySelector('.unscheduled-empty-state')
        : null;
    const unscheduledByKey = new Map();

    if (!calendar || !unscheduledEventsContainer) {
        return {
            moveEventToUnscheduled: () => false,
            handleExternalEventReceive: () => {},
            clear: () => {}
        };
    }

    const updateUnscheduledEmptyState = () => {
        if (!unscheduledEmptyState) return;

        if (unscheduledByKey.size > 0) {
            unscheduledEmptyState.classList.add('d-none');
            return;
        }

        
        const termButton = document.getElementById('termDropdownButton');
        const termId = Number(termButton?.dataset?.termId || '');

        unscheduledEmptyState.classList.remove('d-none');
        if (!Number.isInteger(termId) || termId <= 0) {
            unscheduledEmptyState.textContent = 'Fill out the dropdowns to view your unscheduled courses.';
        } else {
            unscheduledEmptyState.textContent = 'No unscheduled courses for this term.';
        }
    };

    const removeUnscheduledItemByKey = (key) => {
        const safeKey = String(key || '');
        const item = unscheduledByKey.get(safeKey);

        if (!item) {
            return;
        }

        item.remove();
        unscheduledByKey.delete(safeKey);
        updateUnscheduledEmptyState();
    };

    const upsertUnscheduledItem = (payload) => {
        const key = toScheduleGroupKey(payload);

        if (!key || unscheduledByKey.has(key)) {
            return;
        }

        const item = document.createElement('div');
        item.className = 'unscheduled-course-item fc-event fc-h-event fc-timegrid-event text-start';
        item.dataset.unscheduledEventId = String(payload.id);
        item.dataset.unscheduledGroupKey = key;
        item.dataset.unscheduledEventPayload = JSON.stringify(payload);
        item.setAttribute('title', 'Unscheduled course');
        const backgroundColor = payload.backgroundColor || '#6c757d';
        const borderColor = payload.borderColor || backgroundColor;
        const textColor = payload.textColor || '#ffffff';

        item.style.setProperty('--event-opaque-color', borderColor);
        item.style.backgroundColor = backgroundColor;
        item.style.borderColor = borderColor;
        item.style.color = textColor;

        const mainFrame = document.createElement('div');
        mainFrame.className = 'fc-event-main-frame';

        const meta = document.createElement('div');
        meta.className = 'unscheduled-course-item__meta';

        const time = document.createElement('span');
        time.className = 'unscheduled-course-item__time';
        time.textContent = formatUnscheduledTimeMetaLabel(payload);

        const divider = document.createElement('hr');
        divider.className = 'unscheduled-course-item__divider';

        const title = document.createElement('div');
        title.className = 'fc-event-title unscheduled-course-item__title';
        title.textContent = payload.title || 'Untitled Course';
        
        const instructorLabel = payload.extendedProps?.courses?.[0]?.instructor_name
            || payload.extendedProps?.instructor_name
            || payload.extendedProps?.attributes?.instructor_name
            || payload.extendedProps?.attributes?.instructor_full_name
            || '';

        const roomLabel = payload.extendedProps?.courses?.[0]?.room_name
            || payload.extendedProps?.room_name
            || payload.extendedProps?.attributes?.room_name
            || '';

        
        
        const showLabels = !payload.originalEventId;

        meta.append(time);

        if (showLabels && (instructorLabel || roomLabel)) {
            const labelsWrap = document.createElement('div');
            labelsWrap.className = 'unscheduled-course-item__labels small text-muted';
            if (instructorLabel) {
                const instrEl = document.createElement('div');
                instrEl.className = 'unscheduled-course-item__instructor';
                instrEl.textContent = instructorLabel;
                labelsWrap.appendChild(instrEl);
            }
            if (roomLabel) {
                const roomEl = document.createElement('div');
                roomEl.className = 'unscheduled-course-item__room';
                roomEl.textContent = roomLabel;
                labelsWrap.appendChild(roomEl);
            }

            mainFrame.append(meta, divider, title, labelsWrap);
        } else {
            mainFrame.append(meta, divider, title);
        }
        item.append(mainFrame);
        unscheduledEventsContainer.append(item);
        unscheduledByKey.set(key, item);
        updateUnscheduledEmptyState();

        
        item.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            
            document.querySelectorAll('.unscheduled-context-menu').forEach((el) => el.remove());

            const menu = document.createElement('div');
            menu.className = 'unscheduled-context-menu event-context-menu';
            menu.style.position = 'fixed';
            menu.style.zIndex = 9999;
            menu.style.left = `${e.clientX}px`;
            menu.style.top = `${e.clientY}px`;
            menu.setAttribute('role', 'menu');

            
            const rescheduleBtn = document.createElement('button');
            rescheduleBtn.type = 'button';
            rescheduleBtn.className = 'event-context-menu__item';
            rescheduleBtn.textContent = 'Reschedule';
            rescheduleBtn.addEventListener('click', () => {
                console.log('unscheduled: reschedule clicked for payload id', payload?.id);
                document.dispatchEvent(new CustomEvent('schedule:preserve-selection'));
                
                document.dispatchEvent(new CustomEvent('schedule:open-event-details', {
                    detail: { unscheduledPayload: payload, forceFullModal: true }
                }));
                menu.remove();
            });

            menu.append(rescheduleBtn);

            
            setTimeout(() => {
                document.addEventListener('mousedown', function handler(ev) {
                    if (!menu.contains(ev.target)) {
                        menu.remove();
                        document.removeEventListener('mousedown', handler);
                    }
                });
            }, 0);

            document.body.appendChild(menu);
        });
    };

    const moveEventToUnscheduled = (eventId) => {
        const calendarEvent = calendar.getEventById(String(eventId));

        if (!calendarEvent) {
            return false;
        }

        const scheduleGroupKey = toScheduleGroupKey({
            id: calendarEvent.id,
            groupId: calendarEvent.groupId
        });

        const relatedEvents = scheduleGroupKey
            ? calendar.getEvents().filter((event) => toScheduleGroupKey({ id: event.id, groupId: event.groupId }) === scheduleGroupKey)
            : [calendarEvent];

        const payload = toUnscheduledPayload(calendarEvent);
        
        
        
        payload.originalEventId = calendarEvent.id;
        payload.originalSchedule = null;
        payload.extendedProps = {
            ...payload.extendedProps,
            originalSchedule: null
        };

        upsertUnscheduledItem(payload);
        relatedEvents.forEach((event) => event.remove());

        
        (async () => {
            try {
                
                let assignmentId = Number(
                    calendarEvent.extendedProps?.assignment_id ||
                    calendarEvent.extendedProps?.assignmentId ||
                    calendarEvent.extendedProps?.assignment?.id ||
                    payload.extendedProps?.assignment_id ||
                    payload.extendedProps?.assignmentId ||
                    payload.id || ''
                );

                const termId = Number(
                    calendarEvent.extendedProps?.term_id ||
                    calendarEvent.extendedProps?.termId ||
                    calendarEvent.extendedProps?.term?.id ||
                    payload.extendedProps?.term_id ||
                    payload.extendedProps?.term?.id ||
                    document.getElementById('termDropdownButton')?.dataset?.termId || ''
                );

                console.log('unschedule persistence: derived ids', { assignmentId, termId });

                
                if (!Number.isInteger(assignmentId) || assignmentId <= 0) {
                    console.log('unschedule persistence: attempting to parse assignment id from event identifiers', { eventId: calendarEvent.id, originalEventId: payload.originalEventId, payloadExtended: payload.extendedProps });
                    const idCandidates = [calendarEvent.id, payload.originalEventId, payload.extendedProps?.assignment_id, payload.extendedProps?.assignmentId, payload.extendedProps?.assignment?.id];
                    for (const cand of idCandidates) {
                        if (!cand) continue;
                        const asNum = Number(String(cand).replace(/^assignment[-:]?/i, '').replace(/[^0-9]+/g, ''));
                        if (Number.isInteger(asNum) && asNum > 0) {
                            assignmentId = asNum;
                            console.log('unschedule persistence: parsed assignmentId from candidate', { cand, assignmentId });
                            break;
                        }
                    }
                }

                console.log('unschedule persistence: ids after parsing attempt', { assignmentId, termId });

                if (!Number.isInteger(assignmentId) || assignmentId <= 0 || !Number.isInteger(termId) || termId <= 0) {
                    console.warn('unschedule persistence: missing assignmentId/termId, aborting PATCH', { assignmentId, termId });
                    return;
                }

                console.log(`unschedule persistence: fetching assignment /api/v1/terms/${termId}/assignments/${assignmentId}`);
                const getResp = await fetch(`/api/v1/terms/${termId}/assignments/${assignmentId}`, { headers: { 'Accept': 'application/json' } });

                if (!getResp.ok) {
                    console.warn(`Failed to load assignment for unschedule persistence: ${getResp.status}`);
                    return;
                }

                const getJson = await getResp.json();
                const existingAttrs = getJson?.data?.attributes || {};
                const existingRels = getJson?.data?.relationships || {};

                const d = {};
                d.assignment_id = Number(existingAttrs.assignment_id || assignmentId);
                d.term_id = Number(existingAttrs.term_id || termId);

                let userId = Number(existingAttrs.user_id || existingAttrs.userId || existingRels?.user?.data?.id || 0);
                if (!Number.isInteger(userId) || userId <= 0) {
                    const metaUser = document.querySelector('meta[name="current-user-id"]')?.getAttribute('content') || '';
                    const metaNum = Number(metaUser || '0');
                    if (Number.isInteger(metaNum) && metaNum > 0) userId = metaNum;
                }
                if (Number.isInteger(userId) && userId > 0) d.user_id = userId;

                const instr = Number(payload.extendedProps?.instructor_id || existingAttrs.instructor_id || existingAttrs.instructorId || existingRels?.instructor?.data?.id || 0);
                if (Number.isInteger(instr) && instr > 0) d.instructor_id = instr;

                const sect = Number(payload.extendedProps?.section_id || existingAttrs.section_id || existingAttrs.sectionId || existingRels?.section?.data?.id || 0);
                if (Number.isInteger(sect) && sect > 0) d.section_id = sect;

                const room = Number(payload.extendedProps?.room_id || existingAttrs.room_id || existingAttrs.roomId || existingRels?.room?.data?.id || 0);
                if (Number.isInteger(room) && room > 0) d.room_id = room;

                
                d.timeslot_id = null;

                console.log('unschedule persistence: patching assignment to set timeslot_id=null', { assignmentId, termId, payload: d });
                const patchResp = await fetch(`/api/v1/terms/${termId}/assignments/${assignmentId}`, {
                    method: 'PATCH',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ data: { type: 'assignments', id: String(assignmentId), attributes: d } })
                });

                const patchText = await patchResp.text();
                try {
                    console.log('unschedule persistence: PATCH response', { status: patchResp.status, body: JSON.parse(patchText) });
                } catch (e) {
                    console.log('unschedule persistence: PATCH response (text)', { status: patchResp.status, bodyText: patchText });
                }

                if (!patchResp.ok) {
                    console.warn(`Failed to persist unscheduled assignment: ${patchResp.status}`, patchText);
                }
            } catch (e) {
                console.error('Error persisting unscheduled assignment', e);
            }
        })();

        return true;
    };

    const handleExternalEventReceive = (receiveInfo) => {
        const eventId = String(receiveInfo?.event?.id || '');

        if (!eventId) {
            return;
        }

        const scheduleGroupKey = toScheduleGroupKey({
            id: eventId,
            groupId: receiveInfo?.event?.groupId
        });

        removeUnscheduledItemByKey(scheduleGroupKey);
    };

    const clear = () => {
        unscheduledByKey.forEach((item) => item.remove());
        unscheduledByKey.clear();
        updateUnscheduledEmptyState();
    };

    updateUnscheduledEmptyState();

    return {
        moveEventToUnscheduled,
        handleExternalEventReceive,
        clear,
        
        addUnscheduledPayload: (payload) => upsertUnscheduledItem(payload)
    };
};
