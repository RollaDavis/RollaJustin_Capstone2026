import { Modal } from 'bootstrap';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const detailState = {
    selectedTermId: null,
    terms: null,
    instructorsByTerm: new Map(),
    roomsByTerm: new Map(),
    selectedEventGroupKey: null,
    selectedDayIndexes: [],
    daySelectionsByGroup: new Map(),
    selectedDurationMinutes: null,
    durationSelectionsByGroup: new Map(),
    activeRequestToken: 0,
    actionsBound: false
};

const formatClockTime = (date) => {
    if (!(date instanceof Date)) {
        return null;
    }

    return date.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit'
    });
};

const formatClockTimeFromString = (timeString) => {
    if (!timeString) {
        return null;
    }

    const [hours, minutes = '00'] = String(timeString).split(':');
    const parsedHours = Number(hours);
    const parsedMinutes = Number(minutes);

    if (!Number.isFinite(parsedHours) || !Number.isFinite(parsedMinutes)) {
        return null;
    }

    const date = new Date();
    date.setHours(parsedHours, parsedMinutes, 0, 0);

    return formatClockTime(date);
};

const getDetailElements = () => {
    return {
        course: document.getElementById('eventDetailsCourse'),
        meta: document.getElementById('eventDetailsMeta'),
        instructorValue: document.getElementById('eventDetailsInstructorValue'),
        locationValue: document.getElementById('eventDetailsLocationValue'),
        instructorEditButton: document.getElementById('eventDetailsInstructorEditButton'),
        locationEditButton: document.getElementById('eventDetailsLocationEditButton'),
        daysEditButton: document.getElementById('eventDetailsDaysEditButton'),
        durationEditButton: document.getElementById('eventDetailsDurationEditButton'),
        instructorSearch: document.getElementById('eventDetailsInstructorSearch'),
        locationSearch: document.getElementById('eventDetailsLocationSearch'),
        instructorList: document.getElementById('eventDetailsInstructorList'),
        locationList: document.getElementById('eventDetailsLocationList'),
        instructorSelectModal: document.getElementById('eventDetailsInstructorSelectModal'),
        locationSelectModal: document.getElementById('eventDetailsLocationSelectModal'),
        daysSelectModal: document.getElementById('eventDetailsDaysSelectModal'),
        daysApplyButton: document.getElementById('eventDetailsDaysApplyButton'),
        daysValidation: document.getElementById('eventDetailsDaysValidation'),
        duration: document.getElementById('eventDetailsDuration'),
        durationSelectModal: document.getElementById('eventDetailsDurationSelectModal'),
        durationHoursInput: document.getElementById('eventDetailsDurationHoursInput'),
        durationMinutesInput: document.getElementById('eventDetailsDurationMinutesInput'),
        durationApplyButton: document.getElementById('eventDetailsDurationApplyButton'),
        durationValidation: document.getElementById('eventDetailsDurationValidation'),
        days: document.getElementById('eventDetailsDays'),
        time: document.getElementById('eventDetailsTime')
    };
};

const formatDurationLabel = (durationMinutes) => {
    const roundedMinutes = Math.round(Number(durationMinutes));

    if (!Number.isInteger(roundedMinutes) || roundedMinutes <= 0) {
        return 'Not available';
    }

    const hours = Math.floor(roundedMinutes / 60);
    const minutes = roundedMinutes % 60;

    if (hours > 0 && minutes > 0) {
        return `${hours}h ${minutes}m`;
    }

    if (hours > 0) {
        return `${hours}h`;
    }

    return `${minutes}m`;
};

const toValidDurationMinutes = (hoursValue, minutesValue) => {
    const parsedHours = Number(hoursValue);
    const parsedMinutes = Number(minutesValue);

    if (!Number.isFinite(parsedHours) || !Number.isFinite(parsedMinutes)) {
        return null;
    }

    const hours = Math.floor(parsedHours);
    const minutes = Math.floor(parsedMinutes);

    if (!Number.isInteger(hours) || hours < 0 || hours > 12) {
        return null;
    }

    if (!Number.isInteger(minutes) || minutes < 0 || minutes > 55 || (minutes % 5) !== 0) {
        return null;
    }

    const totalMinutes = (hours * 60) + minutes;

    return totalMinutes > 0 ? totalMinutes : null;
};

const setDurationValidationState = (showError) => {
    const validationEl = document.getElementById('eventDetailsDurationValidation');

    if (!validationEl) {
        return;
    }

    validationEl.classList.toggle('d-none', !showError);
};

const toUniqueSortedDayIndexes = (dayIndexes = []) => {
    return [...new Set(dayIndexes.map((index) => Number(index)).filter((index) => Number.isInteger(index) && index >= 0 && index <= 6))]
        .sort((a, b) => a - b);
};

const getSelectedDayIndexesFromCheckboxes = () => {
    const checkboxEls = document.querySelectorAll('input[name="eventDetailsDays"]:checked');
    const selectedDayIndexes = [...checkboxEls].map((checkboxEl) => Number(checkboxEl.value));

    return toUniqueSortedDayIndexes(selectedDayIndexes);
};

const setSelectedDayCheckboxes = (selectedDayIndexes = []) => {
    const selected = new Set(toUniqueSortedDayIndexes(selectedDayIndexes));
    const checkboxEls = document.querySelectorAll('input[name="eventDetailsDays"]');

    checkboxEls.forEach((checkboxEl) => {
        checkboxEl.checked = selected.has(Number(checkboxEl.value));
    });
};

const setDaysValidationState = (showError) => {
    const validationEl = document.getElementById('eventDetailsDaysValidation');

    if (!validationEl) {
        return;
    }

    validationEl.classList.toggle('d-none', !showError);
};

const getDaysLabelFromIndexes = (dayIndexes = []) => {
    const normalizedDayIndexes = toUniqueSortedDayIndexes(dayIndexes);

    if (normalizedDayIndexes.length === 0) {
        return 'Not available';
    }

    return normalizedDayIndexes
        .map((dayIndex) => DAY_LABELS[dayIndex] || null)
        .filter(Boolean)
        .join(', ');
};

const toUniqueValues = (values = []) => {
    return [...new Set(values.map((value) => String(value || '').trim()).filter(Boolean))];
};

const setDetailSelectorValues = ({
    valueEl,
    searchEl,
    listEl,
    selectModalEl,
    values = [],
    preferredValue = null,
    fallbackLabel = 'Not available',
    emptyListMessage = 'No options available'
}) => {
    if (!valueEl || !listEl) {
        return;
    }

    const uniqueValues = toUniqueValues(values);
    const normalizedPreferred = String(preferredValue || '').trim();
    const firstLabel = (normalizedPreferred && uniqueValues.includes(normalizedPreferred))
        ? normalizedPreferred
        : (uniqueValues[0] || fallbackLabel);

    valueEl.textContent = firstLabel;

    const renderList = (query = '') => {
        const normalizedQuery = String(query).trim().toLowerCase();
        const filteredValues = uniqueValues.filter((value) => value.toLowerCase().includes(normalizedQuery));

        listEl.innerHTML = '';

        if (filteredValues.length === 0) {
            const emptyLabel = document.createElement('span');
            emptyLabel.className = 'text-muted small d-block px-2 py-1';
            emptyLabel.textContent = uniqueValues.length === 0 ? fallbackLabel : emptyListMessage;
            listEl.append(emptyLabel);
            return;
        }

        filteredValues.forEach((value) => {
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'list-group-item list-group-item-action';
            item.textContent = value;
            item.addEventListener('click', () => {
                valueEl.textContent = value;
                if (selectModalEl) {
                    Modal.getOrCreateInstance(selectModalEl).hide();
                }
            });
            listEl.append(item);
        });
    };

    if (searchEl) {
        searchEl.value = '';
        searchEl.disabled = uniqueValues.length === 0;
        searchEl.oninput = () => {
            renderList(searchEl.value);
        };
    }

    renderList();
};

const bindDetailActions = () => {
    if (detailState.actionsBound) {
        return;
    }

    const detailEls = getDetailElements();
    const detailModalRoot = document.getElementById('eventDetailsModal');

    const setDetailModalBehindSelector = (behind = false) => {
        if (!detailModalRoot) {
            return;
        }

        detailModalRoot.classList.toggle('event-details-modal-behind-selector', behind);
    };

    const openSelectorModal = (selectorModalEl) => {
        if (!selectorModalEl) {
            return;
        }

        setDetailModalBehindSelector(true);
        Modal.getOrCreateInstance(selectorModalEl).show();
    };

    detailEls.instructorEditButton?.addEventListener('click', () => {
        openSelectorModal(detailEls.instructorSelectModal);
    });

    detailEls.locationEditButton?.addEventListener('click', () => {
        openSelectorModal(detailEls.locationSelectModal);
    });

    detailEls.daysEditButton?.addEventListener('click', () => {
        setSelectedDayCheckboxes(detailState.selectedDayIndexes);
        setDaysValidationState(false);
        openSelectorModal(detailEls.daysSelectModal);
    });

    detailEls.durationEditButton?.addEventListener('click', () => {
        const durationMinutes = Number(detailState.selectedDurationMinutes || 0);
        const normalizedToFive = Math.round(durationMinutes / 5) * 5;
        const hours = Math.floor(normalizedToFive / 60);
        const minutes = normalizedToFive % 60;

        if (detailEls.durationHoursInput) {
            detailEls.durationHoursInput.value = String(Math.max(0, hours));
        }

        if (detailEls.durationMinutesInput) {
            detailEls.durationMinutesInput.value = String(Math.max(0, minutes));
        }

        setDurationValidationState(false);
        openSelectorModal(detailEls.durationSelectModal);
    });

    detailEls.daysApplyButton?.addEventListener('click', () => {
        const selectedDayIndexes = getSelectedDayIndexesFromCheckboxes();

        if (selectedDayIndexes.length === 0) {
            setDaysValidationState(true);
            return;
        }

        detailState.selectedDayIndexes = selectedDayIndexes;

        if (detailState.selectedEventGroupKey) {
            detailState.daySelectionsByGroup.set(detailState.selectedEventGroupKey, selectedDayIndexes);
        }

        if (detailEls.days) {
            detailEls.days.textContent = getDaysLabelFromIndexes(selectedDayIndexes);
        }

        setDaysValidationState(false);

        if (detailEls.daysSelectModal) {
            Modal.getOrCreateInstance(detailEls.daysSelectModal).hide();
        }
    });

    detailEls.durationApplyButton?.addEventListener('click', () => {
        const selectedDurationMinutes = toValidDurationMinutes(
            detailEls.durationHoursInput?.value,
            detailEls.durationMinutesInput?.value
        );

        if (!selectedDurationMinutes) {
            setDurationValidationState(true);
            return;
        }

        detailState.selectedDurationMinutes = selectedDurationMinutes;

        if (detailState.selectedEventGroupKey) {
            detailState.durationSelectionsByGroup.set(detailState.selectedEventGroupKey, selectedDurationMinutes);
        }

        if (detailEls.duration) {
            detailEls.duration.textContent = formatDurationLabel(selectedDurationMinutes);
        }

        setDurationValidationState(false);

        if (detailEls.durationSelectModal) {
            Modal.getOrCreateInstance(detailEls.durationSelectModal).hide();
        }
    });

    detailEls.instructorSelectModal?.addEventListener('hidden.bs.modal', () => {
        setDetailModalBehindSelector(false);
    });

    detailEls.locationSelectModal?.addEventListener('hidden.bs.modal', () => {
        setDetailModalBehindSelector(false);
    });

    detailEls.daysSelectModal?.addEventListener('hidden.bs.modal', () => {
        setDetailModalBehindSelector(false);
        setDaysValidationState(false);
    });

    detailEls.durationSelectModal?.addEventListener('hidden.bs.modal', () => {
        setDetailModalBehindSelector(false);
        setDurationValidationState(false);
    });

    detailState.actionsBound = true;
};

const extractCollection = async (endpoint) => {
    const response = await fetch(endpoint);

    if (!response.ok) {
        throw new Error(`Failed to load detail dropdown options: ${response.status}`);
    }

    const payload = await response.json();

    if (Array.isArray(payload)) {
        return payload;
    }

    if (Array.isArray(payload?.data)) {
        return payload.data;
    }

    return [];
};

const getOptionLabel = (option = {}) => {
    return option.name
        || option.full_name
        || option.display_name
        || option.room_name
        || option.attributes?.name
        || option.attributes?.full_name
        || null;
};

const getSelectedTermIdFromButton = () => {
    const button = document.getElementById('termDropdownButton');
    const candidateId = Number(button?.dataset?.termId || '');

    return Number.isInteger(candidateId) && candidateId > 0 ? candidateId : null;
};

const getSelectedTermNameFromButton = () => {
    const button = document.getElementById('termDropdownButton');
    const label = String(button?.textContent || '').trim();

    if (!label || /^select\s+a?\s*term$/i.test(label)) {
        return null;
    }

    return label;
};

const resolveSelectedTermId = async () => {
    if (detailState.selectedTermId) {
        return detailState.selectedTermId;
    }

    const idFromDataset = getSelectedTermIdFromButton();

    if (idFromDataset) {
        detailState.selectedTermId = idFromDataset;
        return idFromDataset;
    }

    const selectedTermName = getSelectedTermNameFromButton();

    if (!selectedTermName) {
        return null;
    }

    if (!Array.isArray(detailState.terms)) {
        detailState.terms = await extractCollection('/api/v1/terms');
    }

    const matchedTerm = detailState.terms.find((term) => String(term?.name || '').trim() === selectedTermName);
    const matchedTermId = Number(matchedTerm?.id || '');

    if (Number.isInteger(matchedTermId) && matchedTermId > 0) {
        detailState.selectedTermId = matchedTermId;
        return matchedTermId;
    }

    return null;
};

const getAllInstructorLabelsByTerm = async (termId) => {
    if (!termId) {
        return [];
    }

    if (detailState.instructorsByTerm.has(termId)) {
        return detailState.instructorsByTerm.get(termId) || [];
    }

    const instructors = await extractCollection(`/api/v1/terms/${termId}/instructors`);
    const labels = toUniqueValues(instructors.map((instructor) => getOptionLabel(instructor)));
    detailState.instructorsByTerm.set(termId, labels);
    return labels;
};

const getAllRoomLabelsByTerm = async (termId) => {
    if (!termId) {
        return [];
    }

    if (detailState.roomsByTerm.has(termId)) {
        return detailState.roomsByTerm.get(termId) || [];
    }

    const rooms = await extractCollection(`/api/v1/terms/${termId}/rooms`);
    const labels = toUniqueValues(rooms.map((room) => getOptionLabel(room)));
    detailState.roomsByTerm.set(termId, labels);
    return labels;
};

const toGroupKey = (event) => String(event?.groupId || event?.id || '');

const collectRelatedEvents = (calendar, event) => {
    if (!calendar || !event) {
        return [];
    }

    const key = toGroupKey(event);

    if (!key) {
        return [event];
    }

    return calendar.getEvents().filter((entry) => toGroupKey(entry) === key);
};

const getDayIndexes = (event, relatedEvents = []) => {
    const dayIndexesFromDates = [...new Set(relatedEvents
        .map((entry) => (entry.start instanceof Date ? entry.start.getDay() : null))
        .filter((dayIndex) => Number.isInteger(dayIndex)))];

    if (dayIndexesFromDates.length > 0) {
        return toUniqueSortedDayIndexes(dayIndexesFromDates);
    }

    const originalDays = event.extendedProps?.originalSchedule?.daysOfWeek;

    if (Array.isArray(originalDays) && originalDays.length > 0) {
        return toUniqueSortedDayIndexes(originalDays);
    }

    return [];
};

const getTimeLabel = (event) => {
    const start = formatClockTime(event.start);
    const end = formatClockTime(event.end);

    if (start && end) {
        return `${start} - ${end}`;
    }

    const schedule = event.extendedProps?.originalSchedule;
    const scheduleStart = formatClockTimeFromString(schedule?.startTime);
    const scheduleEnd = formatClockTimeFromString(schedule?.endTime);

    if (scheduleStart && scheduleEnd) {
        return `${scheduleStart} - ${scheduleEnd}`;
    }

    return 'Not available';
};

const getDurationMinutes = (event) => {
    if (event.start instanceof Date && event.end instanceof Date) {
        const durationMs = event.end.getTime() - event.start.getTime();
        const minutesFromEvent = Math.round(durationMs / 60000);

        if (minutesFromEvent > 0) {
            return minutesFromEvent;
        }
    }

    const durationHours = Number(event.extendedProps?.durationHours);

    if (Number.isFinite(durationHours) && durationHours > 0) {
        return Math.round(durationHours * 60);
    }

    const scheduleDurationHours = Number(event.extendedProps?.courses?.[0]?.timeslot_duration_hours);

    if (Number.isFinite(scheduleDurationHours) && scheduleDurationHours > 0) {
        return Math.round(scheduleDurationHours * 60);
    }

    return null;
};

const getPrimaryCourse = (event) => {
    const courses = event.extendedProps?.courses;

    if (Array.isArray(courses) && courses.length > 0) {
        return courses[0] || {};
    }

    return {};
};

const getCoursesFromEventGroup = (event, relatedEvents = []) => {
    const allCourses = relatedEvents
        .flatMap((entry) => (Array.isArray(entry.extendedProps?.courses) ? entry.extendedProps.courses : []));

    if (allCourses.length > 0) {
        return allCourses;
    }

    const primaryCourse = getPrimaryCourse(event);

    return primaryCourse && Object.keys(primaryCourse).length > 0 ? [primaryCourse] : [];
};

const getInstructorLabel = (course = {}) => {
    return course.instructor_name
        || course.instructor?.name
        || course.instructor?.full_name
        || null;
};

const getLocationLabel = (course = {}) => {
    return course.location_name
        || course.room_name
        || course.room?.name
        || course.location?.name
        || null;
};

const populateEventDetails = ({ calendar, eventId }) => {
    const detailEls = getDetailElements();

    if (!detailEls.course || !detailEls.meta) {
        return;
    }

    const event = calendar?.getEventById?.(String(eventId || '')) || null;

    if (!event) {
        detailState.selectedEventGroupKey = null;
        detailState.selectedDayIndexes = [];
        detailState.selectedDurationMinutes = null;
        detailEls.course.textContent = 'No course selected';
        detailEls.meta.textContent = 'Right-click an event and choose Course Details.';
        setDetailSelectorValues({
            valueEl: detailEls.instructorValue,
            searchEl: detailEls.instructorSearch,
            listEl: detailEls.instructorList,
            selectModalEl: detailEls.instructorSelectModal,
            values: [],
            fallbackLabel: 'Not available'
        });
        setDetailSelectorValues({
            valueEl: detailEls.locationValue,
            searchEl: detailEls.locationSearch,
            listEl: detailEls.locationList,
            selectModalEl: detailEls.locationSelectModal,
            values: [],
            fallbackLabel: 'Not available'
        });
        detailEls.days.textContent = 'Not available';
        if (detailEls.duration) {
            detailEls.duration.textContent = 'Not available';
        }
        detailEls.time.textContent = 'Not available';
        if (detailEls.daysEditButton) {
            detailEls.daysEditButton.disabled = true;
        }
        if (detailEls.durationEditButton) {
            detailEls.durationEditButton.disabled = true;
        }
        return;
    }

    const relatedEvents = collectRelatedEvents(calendar, event);
    const eventGroupKey = toGroupKey(event);
    const primaryCourse = getPrimaryCourse(event);
    const relatedCourses = getCoursesFromEventGroup(event, relatedEvents);
    const courseTitle = event.title || primaryCourse.course_name || primaryCourse.section_name || 'Untitled Course';
    const sectionName = primaryCourse.section_name || null;
    const termName = primaryCourse.term_name || primaryCourse.semester_name || null;

    detailEls.course.textContent = courseTitle;
    detailEls.meta.textContent = [sectionName, termName].filter(Boolean).join(' | ') || '';
    const eventInstructors = toUniqueValues(relatedCourses.map((course) => getInstructorLabel(course)));
    const eventRooms = toUniqueValues(relatedCourses.map((course) => getLocationLabel(course)));

    setDetailSelectorValues({
        valueEl: detailEls.instructorValue,
        searchEl: detailEls.instructorSearch,
        listEl: detailEls.instructorList,
        selectModalEl: detailEls.instructorSelectModal,
        values: eventInstructors,
        preferredValue: eventInstructors[0] || null,
        fallbackLabel: 'Loading instructors...'
    });
    setDetailSelectorValues({
        valueEl: detailEls.locationValue,
        searchEl: detailEls.locationSearch,
        listEl: detailEls.locationList,
        selectModalEl: detailEls.locationSelectModal,
        values: eventRooms,
        preferredValue: eventRooms[0] || null,
        fallbackLabel: 'Loading rooms...'
    });
    detailState.selectedEventGroupKey = eventGroupKey;
    const defaultSelectedDayIndexes = getDayIndexes(event, relatedEvents);
    const persistedSelectedDayIndexes = detailState.daySelectionsByGroup.get(eventGroupKey);
    detailState.selectedDayIndexes = Array.isArray(persistedSelectedDayIndexes)
        ? toUniqueSortedDayIndexes(persistedSelectedDayIndexes)
        : defaultSelectedDayIndexes;
    const defaultDurationMinutes = getDurationMinutes(event);
    const persistedDurationMinutes = detailState.durationSelectionsByGroup.get(eventGroupKey);
    detailState.selectedDurationMinutes = Number.isInteger(persistedDurationMinutes) && persistedDurationMinutes > 0
        ? persistedDurationMinutes
        : defaultDurationMinutes;
    if (detailEls.daysEditButton) {
        detailEls.daysEditButton.disabled = false;
    }
    if (detailEls.durationEditButton) {
        detailEls.durationEditButton.disabled = false;
    }
    detailEls.days.textContent = getDaysLabelFromIndexes(detailState.selectedDayIndexes);
    if (detailEls.duration) {
        detailEls.duration.textContent = formatDurationLabel(detailState.selectedDurationMinutes);
    }
    detailEls.time.textContent = getTimeLabel(event);

    const requestToken = ++detailState.activeRequestToken;

    resolveSelectedTermId()
        .then(async (termId) => {
            if (!termId || requestToken !== detailState.activeRequestToken) {
                return;
            }

            const [allInstructors, allRooms] = await Promise.all([
                getAllInstructorLabelsByTerm(termId),
                getAllRoomLabelsByTerm(termId)
            ]);

            if (requestToken !== detailState.activeRequestToken) {
                return;
            }

            setDetailSelectorValues({
                valueEl: detailEls.instructorValue,
                searchEl: detailEls.instructorSearch,
                listEl: detailEls.instructorList,
                selectModalEl: detailEls.instructorSelectModal,
                values: allInstructors,
                preferredValue: eventInstructors[0] || null,
                fallbackLabel: 'No instructors found'
            });

            setDetailSelectorValues({
                valueEl: detailEls.locationValue,
                searchEl: detailEls.locationSearch,
                listEl: detailEls.locationList,
                selectModalEl: detailEls.locationSelectModal,
                values: allRooms,
                preferredValue: eventRooms[0] || null,
                fallbackLabel: 'No rooms found'
            });
        })
        .catch((error) => {
            console.error('Unable to load term-wide detail dropdown options', error);

            if (requestToken !== detailState.activeRequestToken) {
                return;
            }

            setDetailSelectorValues({
                valueEl: detailEls.instructorValue,
                searchEl: detailEls.instructorSearch,
                listEl: detailEls.instructorList,
                selectModalEl: detailEls.instructorSelectModal,
                values: eventInstructors,
                preferredValue: eventInstructors[0] || null,
                fallbackLabel: 'Not available'
            });

            setDetailSelectorValues({
                valueEl: detailEls.locationValue,
                searchEl: detailEls.locationSearch,
                listEl: detailEls.locationList,
                selectModalEl: detailEls.locationSelectModal,
                values: eventRooms,
                preferredValue: eventRooms[0] || null,
                fallbackLabel: 'Not available'
            });
        });
};

document.addEventListener('schedule:term-selected', (event) => {
    const selectedTermId = Number(event?.detail?.termId || '');
    detailState.selectedTermId = Number.isInteger(selectedTermId) && selectedTermId > 0 ? selectedTermId : null;
});

export const showEventDetailsModal = (detail = {}, calendar = null) => {
    const modalEl = document.getElementById('eventDetailsModal');

    if (!modalEl) {
        return;
    }

    bindDetailActions();

    populateEventDetails({
        calendar,
        eventId: detail?.eventId
    });

    Modal.getOrCreateInstance(modalEl).show();
};
