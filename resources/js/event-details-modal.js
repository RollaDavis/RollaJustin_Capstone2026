import { Modal } from 'bootstrap';

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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
        instructor: document.getElementById('eventDetailsInstructor'),
        location: document.getElementById('eventDetailsLocation'),
        days: document.getElementById('eventDetailsDays'),
        time: document.getElementById('eventDetailsTime')
    };
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

const populateEventDetails = ({ calendar, eventId }) => {
    const detailEls = getDetailElements();

    if (!detailEls.course || !detailEls.meta) {
        return;
    }

    const event = calendar?.getEventById?.(String(eventId || '')) || null;

    if (!event) {
        detailEls.course.textContent = 'No course selected';
        detailEls.meta.textContent = 'Right-click an event and choose Course Details.';
        detailEls.instructor.textContent = 'Not available';
        detailEls.location.textContent = 'Not available';
        detailEls.days.textContent = 'Not available';
        detailEls.time.textContent = 'Not available';
        return;
    }

    const relatedEvents = collectRelatedEvents(calendar, event);
    const primaryCourse = getPrimaryCourse(event);
    const courseTitle = event.title || primaryCourse.course_name || primaryCourse.section_name || 'Untitled Course';
    const sectionName = primaryCourse.section_name || null;
    const termName = primaryCourse.term_name || primaryCourse.semester_name || null;

    const instructorLabel = primaryCourse.instructor_name
        || primaryCourse.instructor?.name
        || primaryCourse.instructor?.full_name
        || 'Not available';

    const locationLabel = primaryCourse.location_name
        || primaryCourse.room_name
        || primaryCourse.room?.name
        || primaryCourse.location?.name
        || 'Not available';

    detailEls.course.textContent = courseTitle;
    detailEls.meta.textContent = [sectionName, termName].filter(Boolean).join(' | ') || 'Schedule details';
    detailEls.instructor.textContent = instructorLabel;
    detailEls.location.textContent = locationLabel;
    detailEls.days.textContent = getDaysLabel(event, relatedEvents);
    detailEls.time.textContent = getTimeLabel(event);
};

export const showEventDetailsModal = (detail = {}, calendar = null) => {
    const modalEl = document.getElementById('eventDetailsModal');

    if (!modalEl) {
        return;
    }

    populateEventDetails({
        calendar,
        eventId: detail?.eventId
    });

    Modal.getOrCreateInstance(modalEl).show();
};
