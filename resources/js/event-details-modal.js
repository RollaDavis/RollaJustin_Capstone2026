import { Modal } from 'bootstrap';

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const detailState = {
    selectedTermId: null,
    terms: null,
    instructorsByTerm: new Map(),
    roomsByTerm: new Map(),
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
        instructorSearch: document.getElementById('eventDetailsInstructorSearch'),
        locationSearch: document.getElementById('eventDetailsLocationSearch'),
        instructorList: document.getElementById('eventDetailsInstructorList'),
        locationList: document.getElementById('eventDetailsLocationList'),
        instructorSelectModal: document.getElementById('eventDetailsInstructorSelectModal'),
        locationSelectModal: document.getElementById('eventDetailsLocationSelectModal'),
        days: document.getElementById('eventDetailsDays'),
        time: document.getElementById('eventDetailsTime')
    };
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

    detailEls.instructorSelectModal?.addEventListener('hidden.bs.modal', () => {
        setDetailModalBehindSelector(false);
    });

    detailEls.locationSelectModal?.addEventListener('hidden.bs.modal', () => {
        setDetailModalBehindSelector(false);
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

const getDaysLabel = (event, relatedEvents = []) => {
    const dayIndexesFromDates = [...new Set(relatedEvents
        .map((entry) => (entry.start instanceof Date ? entry.start.getDay() : null))
        .filter((dayIndex) => Number.isInteger(dayIndex)))];

    if (dayIndexesFromDates.length > 0) {
        return dayIndexesFromDates
            .sort((a, b) => a - b)
            .map((dayIndex) => DAY_LABELS[dayIndex] || null)
            .filter(Boolean)
            .join(', ');
    }

    const originalDays = event.extendedProps?.originalSchedule?.daysOfWeek;

    if (Array.isArray(originalDays) && originalDays.length > 0) {
        return [...new Set(originalDays)]
            .sort((a, b) => a - b)
            .map((dayIndex) => DAY_LABELS[Number(dayIndex)] || null)
            .filter(Boolean)
            .join(', ');
    }

    return 'Not available';
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
        detailEls.time.textContent = 'Not available';
        return;
    }

    const relatedEvents = collectRelatedEvents(calendar, event);
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
    detailEls.days.textContent = getDaysLabel(event, relatedEvents);
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
