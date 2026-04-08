import { DEFAULT_EVENT_COLOR_PALETTE } from './eventColorPalette';

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

const toSafeGroupToken = (value) => {
    return String(value)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

const makeGroupIdFromCourses = (courses) => {
    const uniqueCourseIds = [...new Set(courses
        .map((course) => course?.course_id)
        .filter((courseId) => courseId !== undefined && courseId !== null))];

    if (uniqueCourseIds.length > 0) {
        return `course-${uniqueCourseIds.sort((a, b) => Number(a) - Number(b)).join('-')}`;
    }

    const uniqueCourseNames = [...new Set(courses
        .map((course) => course?.course_name || course?.section_name)
        .filter(Boolean)
        .map((name) => toSafeGroupToken(name)))];

    if (uniqueCourseNames.length > 0) {
        return `course-${uniqueCourseNames.sort().join('-')}`;
    }

    return 'course-unknown';
};


const normalizeSemesterName = (semesterName) => {
    return String(semesterName || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .replace(/\s+/g, ' ');
};

const makeCourseKey = (course = {}) => {
    if (course.assignment_id !== undefined && course.assignment_id !== null) {
        return `assignment-${course.assignment_id}`;
    }

    if (course.instructor_room_section_id !== undefined && course.instructor_room_section_id !== null) {
        return `irs-${course.instructor_room_section_id}`;
    }

    if (course.section_id !== undefined && course.section_id !== null) {
        return `section-${course.section_id}`;
    }

    if (course.course_id !== undefined && course.course_id !== null) {
        return `course-${course.course_id}`;
    }

    return `unknown-${Math.random().toString(36).slice(2, 10)}`;
};

const normalizeCourseForCalendar = (course = {}) => {
    const attributes = course.attributes || {};

    return {
        ...attributes,
        ...course,
        assignment_id: course.assignment_id ?? course.id,
        course_id: course.course_id ?? attributes.course_id ?? course.section?.course_id ?? course.section?.course?.id,
        section_id: course.section_id ?? attributes.section_id ?? course.section?.id,
        section_name: course.section_name ?? attributes.section_name ?? course.section?.name,
        course_name: course.course_name ?? attributes.course_name ?? course.section?.course?.name,
        term_name: course.term_name ?? attributes.term_name ?? course.term?.name,
        semester_name: course.semester_name ?? attributes.semester_name ?? course.term?.name,
        timeslot_days: course.timeslot_days ?? attributes.timeslot_days ?? attributes.days ?? course.timeslot?.days,
        timeslot_start_time: course.timeslot_start_time ?? attributes.timeslot_start_time ?? attributes.start_time ?? course.timeslot?.start_time,
        timeslot_duration_hours: course.timeslot_duration_hours ?? attributes.timeslot_duration_hours ?? attributes.duration ?? course.timeslot?.duration
    };
};

export const buildCalendarEventsFromCourses = (courses = []) => {
    return courses
        .map((rawCourse) => {
            const course = normalizeCourseForCalendar(rawCourse);
            const daysOfWeek = parseDays(course.timeslot_days);
            const startTime = normalizeTime(course.timeslot_start_time);
            const durationHours = Number(course.timeslot_duration_hours);

            if (daysOfWeek.length === 0 || !startTime || !Number.isFinite(durationHours)) {
                return null;
            }

            const courseName = course.course_name || course.section_name || 'Untitled Course';
            const groupId = makeGroupIdFromCourses([course]);
            const defaultColor = DEFAULT_EVENT_COLOR_PALETTE[0] || { backgroundColor: 'rgba(147, 197, 253, 0.72)', borderColor: '#1d4ed8' };
            const style = { backgroundColor: defaultColor.backgroundColor, borderColor: defaultColor.borderColor, textColor: defaultColor.borderColor };
            const courseKey = makeCourseKey(course);
            const endTime = addMinutesToTime(startTime, Math.round(durationHours * 60));

            return {
                id: `slot-${courseKey}`,
                groupId,
                title: courseName,
                daysOfWeek,
                startTime,
                endTime,
                backgroundColor: style.backgroundColor,
                borderColor: style.borderColor,
                textColor: style.textColor,
                allDay: false,
                extendedProps: {
                    courseKey,
                    durationHours,
                    originalSchedule: {
                        daysOfWeek,
                        startTime,
                        endTime
                    },
                    courseCount: 1,
                    courses: [course]
                }
            };
        })
        .filter((event) => event !== null);
};
