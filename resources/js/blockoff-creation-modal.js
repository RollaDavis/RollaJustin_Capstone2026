import { Modal } from 'bootstrap';

const DAYS_IN_ORDER = ['M', 'T', 'W', 'R', 'F'];
const DAY_INDEX_TO_CODE = {
    1: 'M',
    2: 'T',
    3: 'W',
    4: 'R',
    5: 'F'
};

const DATE_STRING_DAY_CODE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const blockoffState = {
    actionsBound: false,
    calendar: null
};

const normalizeScheduleByValue = (value) => {
    if (value === 'instructors') {
        return 'instructor';
    }

    if (value === 'rooms') {
        return 'room';
    }

    return value;
};

const toDate = (value) => {
    if (value instanceof Date) {
        return value;
    }

    const parsedDate = new Date(value || '');

    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const formatTimeHHMM = (date) => {
    if (!(date instanceof Date)) {
        return '';
    }

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${hours}:${minutes}`;
};

const parseHHMMToMinutes = (timeString) => {
    const normalizedTimeString = String(timeString || '').trim();

    if (!/^\d{2}:\d{2}$/.test(normalizedTimeString)) {
        return null;
    }

    const [hoursText, minutesText] = normalizedTimeString.split(':');
    const hours = Number(hoursText);
    const minutes = Number(minutesText);

    if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
        return null;
    }

    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        return null;
    }

    return (hours * 60) + minutes;
};

const setErrorMessage = (message = '') => {
    const errorEl = document.getElementById('blockoffCreationError');

    if (!errorEl) {
        return;
    }

    if (!message) {
        errorEl.classList.add('d-none');
        errorEl.textContent = '';
        return;
    }

    errorEl.textContent = message;
    errorEl.classList.remove('d-none');
};

const setSuccessMessage = (message = '') => {
    const successEl = document.getElementById('blockoffCreationSuccess');

    if (!successEl) {
        return;
    }

    if (!message) {
        successEl.classList.add('d-none');
        successEl.textContent = '';
        return;
    }

    successEl.textContent = message;
    successEl.classList.remove('d-none');
};

const getCurrentSchedulingContext = () => {
    const scheduleByEl = document.getElementById('scheduleBySelect');
    const scheduleValueEl = document.getElementById('scheduleValueSelect');
    const scheduleValueLabelEl = document.getElementById('scheduleValueDropdownButton');
    const selectedView = normalizeScheduleByValue(String(scheduleByEl?.value || '').trim());
    const selectedId = Number(scheduleValueEl?.value || '');
    const selectedName = String(scheduleValueLabelEl?.textContent || '').trim();

    if (!Number.isInteger(selectedId) || selectedId <= 0) {
        return {
            selectedView,
            selectedId: null,
            selectedName
        };
    }

    return {
        selectedView,
        selectedId,
        selectedName
    };
};

const getSelectedDayCodes = () => {
    const checkboxEls = document.querySelectorAll('input[name="blockoffDays"]:checked');
    const selected = [...checkboxEls].map((checkboxEl) => checkboxEl.value);

    return DAYS_IN_ORDER.filter((dayCode) => selected.includes(dayCode));
};

const buildDayCodesFromSelection = (selection = {}) => {
    const start = toDate(selection.start || selection.startStr);
    const end = toDate(selection.end || selection.endStr);

    if (!start || !end || end <= start) {
        return [];
    }

    const daySet = new Set();
    const iterationDate = new Date(start);
    iterationDate.setHours(0, 0, 0, 0);

    const endInclusive = new Date(end.getTime() - 1);
    endInclusive.setHours(23, 59, 59, 999);

    while (iterationDate <= endInclusive) {
        const dayCode = DAY_INDEX_TO_CODE[iterationDate.getDay()];

        if (dayCode) {
            daySet.add(dayCode);
        }

        iterationDate.setDate(iterationDate.getDate() + 1);
    }

    return DAYS_IN_ORDER.filter((dayCode) => daySet.has(dayCode));
};

const getDayCodeFromDateString = (dateString) => {
    const normalizedDateString = String(dateString || '').trim();

    if (!DATE_STRING_DAY_CODE_REGEX.test(normalizedDateString)) {
        return null;
    }

    const parsedDate = toDate(`${normalizedDateString}T00:00:00`);

    if (!parsedDate) {
        return null;
    }

    return DAY_INDEX_TO_CODE[parsedDate.getDay()] || null;
};

const applySelectionDefaults = (selection = {}, clickedDate = null) => {
    const start = toDate(selection.start || selection.startStr);
    const end = toDate(selection.end || selection.endStr);

    const startTimeEl = document.getElementById('blockoffStartTime');
    const endTimeEl = document.getElementById('blockoffEndTime');
    const dayCheckboxEls = document.querySelectorAll('input[name="blockoffDays"]');

    dayCheckboxEls.forEach((checkboxEl) => {
        checkboxEl.checked = false;
    });

    const selectedDayCodes = buildDayCodesFromSelection(selection);
    const clickedDayCode = getDayCodeFromDateString(clickedDate);
    const allSelectedDayCodes = clickedDayCode
        ? [...new Set([...selectedDayCodes, clickedDayCode])]
        : selectedDayCodes;

    allSelectedDayCodes.forEach((dayCode) => {
        const checkboxEl = document.getElementById(`blockoffDay${dayCode}`);

        if (checkboxEl) {
            checkboxEl.checked = true;
        }
    });

    if (startTimeEl) {
        startTimeEl.value = formatTimeHHMM(start);
    }

    if (endTimeEl) {
        if (end instanceof Date && start instanceof Date && end > start) {
            endTimeEl.value = formatTimeHHMM(end);
        } else if (start instanceof Date) {
            const defaultEnd = new Date(start.getTime() + (60 * 60 * 1000));
            endTimeEl.value = formatTimeHHMM(defaultEnd);
        } else {
            endTimeEl.value = '';
        }
    }
};

const populateTargetSummary = (context) => {
    const summaryEl = document.getElementById('blockoffCreationTargetSummary');

    if (!summaryEl) {
        return;
    }

    const label = context.selectedName || 'No target selected';

    if (context.selectedView === 'instructor') {
        summaryEl.textContent = `Instructor: ${label}`;
        return;
    }

    if (context.selectedView === 'room') {
        summaryEl.textContent = `Room: ${label}`;
        return;
    }

    summaryEl.textContent = 'Please Select Instructor or Room before creating a blockoff.';
};

const toggleFormInteractivity = (enabled) => {
    const modalBody = document.getElementById('blockoffCreationFormBody');

    if (!modalBody) {
        return;
    }

    modalBody.querySelectorAll('input, button').forEach((inputEl) => {
        if (inputEl.id === 'blockoffCreateSubmit') {
            return;
        }

        inputEl.disabled = !enabled;
    });
};

const setSubmitState = (isSubmitting) => {
    const submitButton = document.getElementById('blockoffCreateSubmit');

    if (!submitButton) {
        return;
    }

    submitButton.disabled = isSubmitting;
    submitButton.textContent = isSubmitting ? 'Creating...' : 'Create Blockoff';
};

const buildRequest = (context) => {
    const selectedDayCodes = getSelectedDayCodes();
    const startTime = String(document.getElementById('blockoffStartTime')?.value || '').trim();
    const endTime = String(document.getElementById('blockoffEndTime')?.value || '').trim();

    if (selectedDayCodes.length === 0) {
        return { error: 'Select at least one day.' };
    }

    if (!startTime) {
        return { error: 'Start time is required.' };
    }

    if (!endTime) {
        return { error: 'End time is required.' };
    }

    const startMinutes = parseHHMMToMinutes(startTime);
    const endMinutes = parseHHMMToMinutes(endTime);

    if (startMinutes === null || endMinutes === null) {
        return { error: 'Enter valid start and end times.' };
    }

    const durationMinutes = endMinutes - startMinutes;

    if (durationMinutes <= 0) {
        return { error: 'End time must be after start time.' };
    }

    const durationValue = durationMinutes / 60;

    if (!Number.isFinite(durationValue) || durationValue <= 0) {
        return { error: 'Duration must be greater than 0.' };
    }

    if (context.selectedView === 'instructor') {
        return {
            endpoint: `/api/v1/instructors/${context.selectedId}/timeblocks`,
            payload: {
                data: {
                    type: 'instructor_time_blocks',
                    attributes: {
                        instructor_id: context.selectedId,
                        days: selectedDayCodes.join(''),
                        start_time: startTime,
                        duration: durationValue.toFixed(2)
                    }
                }
            }
        };
    }

    if (context.selectedView === 'room') {
        return {
            endpoint: `/api/v1/rooms/${context.selectedId}/timeblocks`,
            payload: {
                data: {
                    type: 'room_time_blocks',
                    attributes: {
                        room_id: context.selectedId,
                        days: selectedDayCodes.join(''),
                        start_time: startTime,
                        duration: durationValue.toFixed(2)
                    }
                }
            }
        };
    }

    return { error: 'Blockoff creation is only available for Instructor or Room schedule views.' };
};

const bindActions = () => {
    if (blockoffState.actionsBound) {
        return;
    }

    const formEl = document.getElementById('blockoffCreationForm');
    const modalEl = document.getElementById('blockoffCreationModal');

    formEl?.addEventListener('submit', async (submitEvent) => {
        submitEvent.preventDefault();

        setErrorMessage('');
        setSuccessMessage('');

        const context = getCurrentSchedulingContext();

        if (!context.selectedId || !['instructor', 'room'].includes(context.selectedView)) {
            setErrorMessage('Choose an Instructor or Room from the schedule filters before creating a blockoff.');
            return;
        }

        const requestData = buildRequest(context);

        if (requestData.error) {
            setErrorMessage(requestData.error);
            return;
        }

        try {
            setSubmitState(true);


            // Resolve CSRF token: prefer XSRF-TOKEN cookie (for Laravel/Sanctum),
            // fallback to the meta csrf token rendered into the page.
            function getCookie(name) {
                const value = `; ${document.cookie}`;
                const parts = value.split(`; ${name}=`);
                if (parts.length === 2) return parts.pop().split(';').shift();
                return null;
            }

            const cookieToken = getCookie('XSRF-TOKEN') ? decodeURIComponent(getCookie('XSRF-TOKEN')) : null;
            const metaEl = document.querySelector('meta[name="csrf-token"]');
            const metaToken = metaEl?.getAttribute('content') || null;
            const csrfToken = cookieToken || metaToken || null;

            const headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            };

            if (csrfToken) {
                // include both header names to be safe
                headers['X-CSRF-TOKEN'] = csrfToken;
                headers['X-XSRF-TOKEN'] = csrfToken;
            }

            const response = await fetch(requestData.endpoint, {
                method: 'POST',
                headers,
                credentials: 'same-origin',
                body: JSON.stringify(requestData.payload)
            });

            if (!response.ok) {
                const errorPayload = await response.json().catch(() => null);
                const firstError = errorPayload?.errors?.[0]?.detail
                    || errorPayload?.message
                    || `Unable to create blockoff (${response.status}).`;
                throw new Error(firstError);
            }

            setSuccessMessage('Blockoff created successfully.');
            document.dispatchEvent(new CustomEvent('schedule:blockoff-created'));
            blockoffState.calendar?.unselect?.();
            Modal.getOrCreateInstance(modalEl).hide();
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Unable to create blockoff.');
        } finally {
            setSubmitState(false);
        }
    });

    modalEl?.addEventListener('hidden.bs.modal', () => {
        setErrorMessage('');
        setSuccessMessage('');
        setSubmitState(false);
    });

    blockoffState.actionsBound = true;
};

export const showBlockoffCreationModal = (detail = {}, calendar = null) => {
    const modalEl = document.getElementById('blockoffCreationModal');

    if (!modalEl) {
        return;
    }

    blockoffState.calendar = calendar;
    bindActions();

    const context = getCurrentSchedulingContext();
    populateTargetSummary(context);
    applySelectionDefaults(detail.selection || {}, detail.clickedDate || null);

    const isSupportedView = ['instructor', 'room'].includes(context.selectedView) && Number.isInteger(context.selectedId);
    toggleFormInteractivity(isSupportedView);
    setErrorMessage('');
    setSuccessMessage('');

    if (!isSupportedView) {
        setErrorMessage('Select an Instructor or Room first, then try creating a blockoff again.');
    }

    Modal.getOrCreateInstance(modalEl).show();
};
