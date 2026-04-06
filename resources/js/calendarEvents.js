import { FALL_EVENT_COLOR_PALETTE, SPRING_EVENT_COLOR_PALETTE } from './eventColorPalette';

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

// const hashString = (value) => {
//     const input = String(value || '');
//     let hash = 0;

//     for (let i = 0; i < input.length; i += 1) {
//         hash = ((hash << 5) - hash) + input.charCodeAt(i);
//         hash |= 0;
//     }

//     return Math.abs(hash);
// };

// const mapSeedToRange = (seed, min, max) => {
//     const span = max - min;

//     if (span <= 0) {
//         return min;
//     }

//     return min + (seed % (span + 1));
// };

// const makeHsl = (h, s, l) => `hsl(${h} ${s}% ${l}%)`;
// const makeHsla = (h, s, l, a) => `hsla(${h}, ${s}%, ${l}%, ${a})`;

// const getSemesterEventStyle = (course = {}) => {
//     const termName = normalizeSemesterName(course.term_name);
//     const seedSource = [
//         course.course_id,
//         course.section_id,
//         course.assignment_id,
//         course.course_name,
//         course.section_name
//     ].filter(Boolean).join('|');
//     const seed = hashString(seedSource || termName || 'course');

//     // Keep spring in blue range and fall in green range while varying shade per course.
//     if (termName.includes('spring')) {
//         const hue = mapSeedToRange(seed, 186, 236);
//         const saturation = mapSeedToRange(seed >> 7, 48, 98);
//         const lightness = mapSeedToRange(seed >> 13, 24, 62);

//         return {
//             backgroundColor: makeHsla(hue, saturation, lightness, 0.72),
//             borderColor: makeHsl(hue, saturation, lightness),
//             textColor: '#ffffff'
//         };
//     }

//     if (termName.includes('fall')) {
//         const hue = mapSeedToRange(seed, 94, 154);
//         const saturation = mapSeedToRange(seed >> 7, 45, 96);
//         const lightness = mapSeedToRange(seed >> 13, 20, 54);

//         return {
//             backgroundColor: makeHsla(hue, saturation, lightness, 0.72),
//             borderColor: makeHsl(hue, saturation, lightness),
//             textColor: '#ffffff'
//         };
//     }

//     const neutralHue = mapSeedToRange(seed, 206, 214);
//     const neutralSaturation = mapSeedToRange(seed >> 2, 10, 20);
//     const neutralLightness = mapSeedToRange(seed >> 4, 40, 48);

//     return {
//         backgroundColor: makeHsla(neutralHue, neutralSaturation, neutralLightness, 0.82),
//         borderColor: makeHsl(neutralHue, neutralSaturation, neutralLightness),
//         textColor: '#ffffff'
//     };
// };

const hashString = (value) => {
    const input = String(value || '');
    let hash = 0;

    for (let i = 0; i < input.length; i += 1) {
        hash = ((hash << 5) - hash) + input.charCodeAt(i);
        hash |= 0;
    }

    return Math.abs(hash);
};

const getSemesterEventStyleFromPalette = (course = {}) => {
    const termName = normalizeSemesterName(course.term_name);

    const springPalette = Array.isArray(SPRING_EVENT_COLOR_PALETTE) ? SPRING_EVENT_COLOR_PALETTE : [];
    const fallPalette = Array.isArray(FALL_EVENT_COLOR_PALETTE) ? FALL_EVENT_COLOR_PALETTE : [];
    const fallbackPalette = [...springPalette, ...fallPalette];
    const palette = termName.includes('spring')
        ? springPalette
        : (termName.includes('fall') ? fallPalette : fallbackPalette);

    const seedSource = [
        course.course_id,
        course.section_id,
        course.assignment_id,
        course.course_name,
        course.section_name,
        course.term_name
    ].filter(Boolean).join('|');

    const seed = hashString(seedSource || 'course');
    const selectedPalette = palette.length > 0 ? palette : fallbackPalette;
    const selectedColor = selectedPalette[seed % selectedPalette.length];

    return {
        backgroundColor: selectedColor.backgroundColor,
        borderColor: selectedColor.borderColor,
        textColor: selectedColor.borderColor
    };
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

export const buildCalendarEventsFromCourses = (courses = []) => {
    return courses
        .map((course) => {
            const daysOfWeek = parseDays(course.timeslot_days);
            const startTime = normalizeTime(course.timeslot_start_time);
            const durationHours = Number(course.timeslot_duration_hours);

            if (daysOfWeek.length === 0 || !startTime || !Number.isFinite(durationHours)) {
                return null;
            }

            const courseName = course.course_name || course.section_name || 'Untitled course';
            const groupId = makeGroupIdFromCourses([course]);
            const style = getSemesterEventStyleFromPalette(course);
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
