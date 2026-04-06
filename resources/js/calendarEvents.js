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

const getCourseColorKey = (course = {}) => {
    const rawCodeSource = [course.course_name, course.section_name]
        .filter(Boolean)
        .map((value) => String(value).trim())
        .find(Boolean) || '';

    if (rawCodeSource) {
        const codeMatch = rawCodeSource.toUpperCase().match(/[A-Z]{1,6}\s*-?\s*\d{2,4}[A-Z]?/);

        if (codeMatch?.[0]) {
            return codeMatch[0].replace(/\s+/g, '');
        }
    }

    if (course.course_id !== undefined && course.course_id !== null) {
        return `course-${course.course_id}`;
    }

    return toSafeGroupToken(rawCodeSource || 'course-unknown');
};

const normalizeSemesterName = (semesterName) => {
    return String(semesterName || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .replace(/\s+/g, ' ');
};

const getTermBucket = (course = {}) => {
    const termName = normalizeSemesterName(course.term_name || course.semester_name);

    if (termName.includes('fall')) {
        return 'fall';
    }

    if (termName.includes('spring')) {
        return 'spring';
    }

    return 'other';
};

const getUniquePaletteColors = (paletteInput = []) => {
    const palette = Array.isArray(paletteInput) ? paletteInput : [];
    const usedTokens = new Set();

    return palette.filter((color) => {
        const token = `${color?.backgroundColor || ''}|${color?.borderColor || ''}`;

        if (!color?.backgroundColor || !color?.borderColor || usedTokens.has(token)) {
            return false;
        }

        usedTokens.add(token);
        return true;
    });
};

const shuffleArray = (items = []) => {
    const shuffled = [...items];

    for (let i = shuffled.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
};

const makeGeneratedStyle = (index, termBucket = 'other') => {
    const hueBaseByBucket = {
        fall: 24,
        spring: 194,
        other: 260
    };
    const hueBase = hueBaseByBucket[termBucket] ?? hueBaseByBucket.other;
    const hue = Math.round((hueBase + (index * 47)) % 360);
    const saturation = 74;
    const lightness = 42;

    return {
        backgroundColor: `hsla(${hue}, ${saturation}%, ${lightness}%, 0.72)`,
        borderColor: `hsl(${hue} ${saturation}% ${lightness}%)`,
        textColor: `hsl(${hue} ${saturation}% ${lightness}%)`
    };
};

const buildCourseColorStyleMap = (courses = []) => {
    const springPalette = shuffleArray(getUniquePaletteColors(SPRING_EVENT_COLOR_PALETTE));
    const fallPalette = shuffleArray(getUniquePaletteColors(FALL_EVENT_COLOR_PALETTE));
    const otherPalette = shuffleArray(getUniquePaletteColors([...springPalette, ...fallPalette]));
    const paletteByBucket = {
        spring: springPalette,
        fall: fallPalette,
        other: otherPalette
    };

    const bucketedKeys = {
        spring: new Set(),
        fall: new Set(),
        other: new Set()
    };
    const styleMap = new Map();

    courses.forEach((course) => {
        const bucket = getTermBucket(course);
        const courseCode = getCourseColorKey(course);
        bucketedKeys[bucket].add(courseCode);
    });

    ['spring', 'fall', 'other'].forEach((bucket) => {
        const palette = paletteByBucket[bucket];
        const uniqueCourseCodes = [...bucketedKeys[bucket]].sort((a, b) => String(a).localeCompare(String(b)));

        uniqueCourseCodes.forEach((courseCode, index) => {
            const paletteColor = palette[index];
            const styleMapKey = `${bucket}:${courseCode}`;

            if (paletteColor) {
                styleMap.set(styleMapKey, {
                    backgroundColor: paletteColor.backgroundColor,
                    borderColor: paletteColor.borderColor,
                    textColor: paletteColor.borderColor
                });
                return;
            }

            styleMap.set(styleMapKey, makeGeneratedStyle(index - palette.length, bucket));
        });
    });

    return styleMap;
};

const getCourseStyleMapKey = (course = {}) => {
    const termBucket = getTermBucket(course);
    const courseCode = getCourseColorKey(course);

    return `${termBucket}:${courseCode}`;
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
    const courseStyleMap = buildCourseColorStyleMap(courses);

    return courses
        .map((course) => {
            const daysOfWeek = parseDays(course.timeslot_days);
            const startTime = normalizeTime(course.timeslot_start_time);
            const durationHours = Number(course.timeslot_duration_hours);

            if (daysOfWeek.length === 0 || !startTime || !Number.isFinite(durationHours)) {
                return null;
            }

            const courseName = course.course_name || course.section_name || 'Untitled Course';
            const groupId = makeGroupIdFromCourses([course]);
            const style = courseStyleMap.get(getCourseStyleMapKey(course)) || makeGeneratedStyle(courseStyleMap.size + 1, getTermBucket(course));
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
