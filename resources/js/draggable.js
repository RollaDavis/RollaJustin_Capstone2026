import { Draggable } from '@fullcalendar/interaction';

const UNSCHEDULED_SELECTOR = '.unscheduled-events';

const unscheduledStore = new Map();

let externalDraggable = null;
let calendarRef = null;
let calendarContainerRef = null;
let unscheduledContainerRef = null;

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

const timeToMinutes = (timeString) => {
	const normalized = normalizeTime(timeString);

	if (!normalized) {
		return null;
	}

	const [hours, minutes] = normalized.split(':').map(Number);

	if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
		return null;
	}

	return (hours * 60) + minutes;
};

const addMinutesToTime = (timeString, minutesToAdd) => {
	const startMinutes = timeToMinutes(timeString);

	if (!Number.isFinite(startMinutes) || !Number.isFinite(minutesToAdd)) {
		return null;
	}

	const totalMinutes = startMinutes + minutesToAdd;
	const wrappedMinutes = ((totalMinutes % (24 * 60)) + (24 * 60)) % (24 * 60);
	const hours = Math.floor(wrappedMinutes / 60);
	const theMinutes = wrappedMinutes % 60;

	return `${String(hours).padStart(2, '0')}:${String(theMinutes).padStart(2, '0')}:00`;
};

const formatDurationLabel = (durationMinutes) => {
	if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
		return 'Duration N/A';
	}

	const hours = Math.floor(durationMinutes / 60);
	const minutes = durationMinutes % 60;

	if (hours > 0 && minutes > 0) {
		return `${hours}h ${minutes}m`;
	}

	if (hours > 0) {
		return `${hours}h`;
	}

	return `${minutes}m`;
};

const getEventDurationMinutes = (eventInput = {}) => {
	const explicitDuration = Number(eventInput.extendedProps?.durationMinutes);

	if (Number.isFinite(explicitDuration) && explicitDuration > 0) {
		return explicitDuration;
	}

	const originalSchedule = eventInput.extendedProps?.originalSchedule || {};
	const startMinutes = timeToMinutes(originalSchedule.startTime || eventInput.startTime);
	const endMinutes = timeToMinutes(originalSchedule.endTime || eventInput.endTime);

	if (!Number.isFinite(startMinutes) || !Number.isFinite(endMinutes)) {
		return null;
	}

	let durationMinutes = endMinutes - startMinutes;

	if (durationMinutes <= 0) {
		durationMinutes += 24 * 60;
	}

	return durationMinutes;
};

const getTimeFromDate = (dateValue) => {
	if (!(dateValue instanceof Date) || Number.isNaN(dateValue.getTime())) {
		return null;
	}

	const hours = String(dateValue.getHours()).padStart(2, '0');
	const minutes = String(dateValue.getMinutes()).padStart(2, '0');

	return `${hours}:${minutes}:00`;
};

const shiftDaysOfWeekPattern = (daysOfWeek = [], droppedDay) => {
	if (!Array.isArray(daysOfWeek) || daysOfWeek.length === 0 || !Number.isInteger(droppedDay)) {
		return Array.isArray(daysOfWeek) ? daysOfWeek : [];
	}

	const sortedUniqueDays = [...new Set(daysOfWeek
		.filter((day) => Number.isInteger(day) && day >= 0 && day <= 6))]
		.sort((a, b) => a - b);

	if (sortedUniqueDays.length === 0) {
		return [];
	}

	const anchorDay = sortedUniqueDays[0];
	const offset = droppedDay - anchorDay;

	return sortedUniqueDays
		.map((day) => ((day + offset) % 7 + 7) % 7)
		.sort((a, b) => a - b);
};

const getUniqueEventsById = (events = []) => {
	const unique = [];
	const seenIds = new Set();

	events.forEach((eventItem) => {
		if (!eventItem) {
			return;
		}

		const eventId = eventItem.id || eventItem.extendedProps?.courseKey || `${eventItem.groupId || 'group'}-${eventItem.title || 'event'}`;

		if (seenIds.has(eventId)) {
			return;
		}

		seenIds.add(eventId);
		unique.push(eventItem);
	});

	return unique;
};

const renderUnscheduledCards = () => {
	if (!unscheduledContainerRef) {
		return;
	}

	unscheduledContainerRef.innerHTML = '';

	if (unscheduledStore.size === 0) {
		const placeholder = document.createElement('p');
		placeholder.className = 'text-muted fw-semibold mb-0 position-absolute top-50 start-50 translate-middle';
		placeholder.style.maxWidth = '14ch';
		placeholder.style.width = '100%';
		placeholder.textContent = 'No Unscheduled Courses...';
		unscheduledContainerRef.appendChild(placeholder);
		return;
	}

	unscheduledStore.forEach((storedEvent, unscheduledId) => {
		const groupedEvents = getUniqueEventsById(Array.isArray(storedEvent.events) ? storedEvent.events : []);
		const displayEvent = groupedEvents.length > 0
			? groupedEvents[0]
			: storedEvent;
		const groupCount = groupedEvents.length > 0 ? groupedEvents.length : 1;
		const card = document.createElement('div');
		card.className = 'unscheduled-event-card fc-event fc-v-event mb-2';
		if (groupCount > 1) {
			card.classList.add('is-grouped');
		}
		card.dataset.unscheduledId = unscheduledId;
		card.dataset.eventId = displayEvent.id;
		card.dataset.groupCount = String(groupCount);
		card.style.cursor = 'grab';
		card.style.userSelect = 'none';
		card.style.borderColor = displayEvent.borderColor || '#0d6efd';
		card.style.backgroundColor = displayEvent.backgroundColor || '#0d6efd';
		card.style.color = displayEvent.textColor || '#ffffff';
		card.style.borderRadius = '0.25rem';

		const durationMinutes = getEventDurationMinutes(displayEvent);
		const durationLabel = formatDurationLabel(durationMinutes);

		const eventMain = document.createElement('div');
		eventMain.className = 'fc-event-main';

		const eventMainFrame = document.createElement('div');
		eventMainFrame.className = 'fc-event-main-frame';

		const eventTime = document.createElement('div');
		eventTime.className = 'fc-event-time';
		eventTime.textContent = durationLabel;

		const titleContainer = document.createElement('div');
		titleContainer.className = 'fc-event-title-container';
		if (groupCount > 1) {
			titleContainer.classList.add('d-flex', 'flex-column', 'gap-1');
		}

		const eventTitle = document.createElement('div');
		eventTitle.className = 'fc-event-title fc-sticky';
		eventTitle.textContent = displayEvent.title || 'Untitled course';

		if (groupCount > 1) {
			const groupBadge = document.createElement('span');
			groupBadge.className = 'badge rounded-pill bg-light text-dark align-self-start';
			groupBadge.textContent = `${groupCount} courses`;
			titleContainer.appendChild(groupBadge);
		}

		titleContainer.appendChild(eventTitle);
		eventMainFrame.appendChild(eventTime);
		eventMainFrame.appendChild(titleContainer);
		eventMain.appendChild(eventMainFrame);

		card.appendChild(eventMain);
		unscheduledContainerRef.appendChild(card);
	});
};

const makeEventInput = (eventApi) => {
	const originalSchedule = eventApi.extendedProps?.originalSchedule || {};

	if (!Array.isArray(originalSchedule.daysOfWeek) || !originalSchedule.startTime || !originalSchedule.endTime) {
		return null;
	}

	return {
		id: eventApi.id,
		groupId: eventApi.groupId,
		title: eventApi.title,
		daysOfWeek: originalSchedule.daysOfWeek,
		startTime: originalSchedule.startTime,
		endTime: originalSchedule.endTime,
		backgroundColor: eventApi.backgroundColor,
		borderColor: eventApi.borderColor,
		textColor: eventApi.textColor,
		allDay: false,
		extendedProps: {
			...eventApi.extendedProps,
			durationMinutes: getEventDurationMinutes({
				startTime: originalSchedule.startTime,
				endTime: originalSchedule.endTime,
				extendedProps: eventApi.extendedProps
			})
		}
	};
};

const moveCalendarEventToUnscheduled = (eventId) => {
	if (!calendarRef || !eventId) {
		return;
	}

	const event = calendarRef.getEventById(eventId);

	if (!event) {
		return;
	}

	const groupedEvents = event.groupId
		? calendarRef.getEvents().filter((calendarEvent) => calendarEvent.groupId === event.groupId)
		: [event];
	const uniqueGroupedEvents = getUniqueEventsById(groupedEvents);

	const normalizedGroup = uniqueGroupedEvents
		.map((groupEvent) => ({
			groupEvent,
			eventInput: makeEventInput(groupEvent)
		}))
		.filter((entry) => entry.eventInput !== null);

	const groupEventInputs = normalizedGroup.map((entry) => entry.eventInput);
	const eventInput = groupEventInputs[0] || null;

	if (!eventInput) {
		return;
	}

	unscheduledStore.set(eventInput.id, {
		...eventInput,
		events: groupEventInputs
	});
	normalizedGroup.forEach((entry) => {
		entry.groupEvent.remove();
	});
	renderUnscheduledCards();
};

const setupExternalDraggable = () => {
	if (!unscheduledContainerRef) {
		return;
	}

	if (externalDraggable) {
		externalDraggable.destroy();
	}

	externalDraggable = new Draggable(unscheduledContainerRef, {
		itemSelector: '.unscheduled-event-card',
		eventData: (eventEl) => {
			const unscheduledId = eventEl?.dataset?.unscheduledId;
			const storedEvent = unscheduledId ? unscheduledStore.get(unscheduledId) : null;

			if (!storedEvent) {
				return null;
			}

			const groupedEvents = getUniqueEventsById(Array.isArray(storedEvent.events) && storedEvent.events.length > 0
				? storedEvent.events
				: [storedEvent]);
			const displayEvent = groupedEvents[0] || storedEvent;

			const originalSchedule = displayEvent.extendedProps?.originalSchedule || {};

			const durationMinutes = getEventDurationMinutes(displayEvent);

			return {
				title: groupedEvents.length > 1
					? `${displayEvent.title || 'Untitled course'} (${groupedEvents.length})`
					: displayEvent.title,
				groupId: displayEvent.groupId,
				daysOfWeek: Array.isArray(originalSchedule.daysOfWeek) ? originalSchedule.daysOfWeek : displayEvent.daysOfWeek,
				startTime: originalSchedule.startTime || displayEvent.startTime,
				endTime: originalSchedule.endTime || displayEvent.endTime,
				backgroundColor: displayEvent.backgroundColor,
				borderColor: displayEvent.borderColor,
				textColor: displayEvent.textColor,
				duration: Number.isFinite(durationMinutes) ? { minutes: durationMinutes } : undefined,
				extendedProps: {
					...displayEvent.extendedProps,
					durationMinutes,
					groupedEvents,
					unscheduledId
				}
			};
		}
	});
};

document.addEventListener('schedule:calendar-ready', (event) => {
	calendarRef = event.detail?.calendar || null;
	calendarContainerRef = event.detail?.calendarEl || document.getElementById('calendar');
	unscheduledContainerRef = document.querySelector(UNSCHEDULED_SELECTOR);

	if (!calendarRef || !calendarContainerRef || !unscheduledContainerRef) {
		return;
	}

	renderUnscheduledCards();
	setupExternalDraggable();
});

document.addEventListener('schedule:courses-selected', () => {
	unscheduledStore.clear();
	renderUnscheduledCards();
});

document.addEventListener('schedule:move-event-to-unscheduled', (event) => {
	const eventId = event.detail?.eventId;

	if (!eventId) {
		return;
	}

	moveCalendarEventToUnscheduled(eventId);
});

document.addEventListener('schedule:unscheduled-event-received', (event) => {
	const unscheduledId = event.detail?.unscheduledId;
	const droppedStartMs = Number(event.detail?.droppedStartMs);

	if (!calendarRef || !unscheduledId) {
		return;
	}

	const storedEvent = unscheduledStore.get(unscheduledId);

	if (!storedEvent) {
		return;
	}

	const groupedEvents = getUniqueEventsById(Array.isArray(storedEvent.events) && storedEvent.events.length > 0
		? storedEvent.events
		: [storedEvent]);
	const droppedDate = Number.isFinite(droppedStartMs) ? new Date(droppedStartMs) : null;
	const droppedStartTime = getTimeFromDate(droppedDate);
	const droppedDay = droppedDate ? droppedDate.getDay() : null;

	if (droppedStartTime) {
		groupedEvents.forEach((groupedEvent) => {
			const durationMinutes = getEventDurationMinutes(groupedEvent);
			const originalDaysOfWeek = groupedEvent.extendedProps?.originalSchedule?.daysOfWeek;
			const baseDaysOfWeek = Array.isArray(originalDaysOfWeek) && originalDaysOfWeek.length > 0
				? originalDaysOfWeek
				: (Array.isArray(groupedEvent.daysOfWeek) && groupedEvent.daysOfWeek.length > 0
					? groupedEvent.daysOfWeek
					: (Number.isInteger(droppedDay) ? [droppedDay] : []));
			const nextDaysOfWeek = shiftDaysOfWeekPattern(baseDaysOfWeek, droppedDay);

			if (!Number.isFinite(durationMinutes) || nextDaysOfWeek.length === 0) {
				calendarRef.addEvent(groupedEvent);
				return;
			}

			const endTime = addMinutesToTime(droppedStartTime, durationMinutes);

			if (!endTime) {
				calendarRef.addEvent(groupedEvent);
				return;
			}

			calendarRef.addEvent({
				...groupedEvent,
				daysOfWeek: nextDaysOfWeek,
				startTime: droppedStartTime,
				endTime,
				extendedProps: {
					...groupedEvent.extendedProps,
					durationMinutes,
					originalSchedule: {
						daysOfWeek: nextDaysOfWeek,
						startTime: droppedStartTime,
						endTime
					}
				}
			});
		});
		unscheduledStore.delete(unscheduledId);
		renderUnscheduledCards();
		return;
	}

	groupedEvents.forEach((groupedEvent) => {
		calendarRef.addEvent(groupedEvent);
	});
	unscheduledStore.delete(unscheduledId);
	renderUnscheduledCards();
});
