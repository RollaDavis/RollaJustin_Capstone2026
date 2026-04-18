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
        backgroundColor: calendarEvent.backgroundColor || null,
        borderColor: calendarEvent.borderColor || null,
        textColor: calendarEvent.textColor || null,
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
        if (!unscheduledEmptyState) {
            return;
        }

        unscheduledEmptyState.classList.toggle('d-none', unscheduledByKey.size > 0);
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

        meta.append(time);
        mainFrame.append(meta, divider, title);
        item.append(mainFrame);
        unscheduledEventsContainer.append(item);
        unscheduledByKey.set(key, item);
        updateUnscheduledEmptyState();
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
        payload.originalSchedule = deriveOriginalSchedule(calendarEvent, relatedEvents);
        payload.extendedProps = {
            ...payload.extendedProps,
            originalSchedule: payload.originalSchedule
        };

        upsertUnscheduledItem(payload);
        relatedEvents.forEach((event) => event.remove());

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
        clear
    };
};
