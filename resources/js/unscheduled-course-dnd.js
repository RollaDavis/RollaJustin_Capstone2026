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
        item.style.setProperty('--event-opaque-color', payload.borderColor || '#6c757d');
        item.style.backgroundColor = payload.backgroundColor || '#6c757d';
        item.style.borderColor = payload.borderColor || '#6c757d';
        item.style.color = payload.textColor || '#ffffff';

        const mainFrame = document.createElement('div');
        mainFrame.className = 'fc-event-main-frame';

        const time = document.createElement('div');
        time.className = 'fc-event-time';
        time.textContent = formatDurationLabel(Number(payload.durationHours)) || 'Duration unknown';

        const title = document.createElement('div');
        title.className = 'fc-event-title';
        title.textContent = payload.title || 'Untitled Course';

        mainFrame.append(time, title);
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
