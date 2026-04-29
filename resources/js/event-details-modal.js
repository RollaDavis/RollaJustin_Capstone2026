import { Modal, Dropdown } from 'bootstrap';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const detailState = {
    selectedTermId: null,
    terms: null,
    instructorsByTerm: new Map(),
    roomsByTerm: new Map(),
    instructorsByTermMap: new Map(),
    roomsByTermMap: new Map(),
    selectedEventGroupKey: null,
    selectedDayIndexes: [],
    daySelectionsByGroup: new Map(),
    selectedDurationMinutes: null,
    durationSelectionsByGroup: new Map(),
    activeRequestToken: 0,
    actionsBound: false
};


const showLightweightDetailsModal = (unscheduledPayload = {}) => {
    try { console.log('details: showLightweightDetailsModal payload', unscheduledPayload); } catch (e) { }

    const primary = unscheduledPayload?.extendedProps?.courses?.[0] || {};
    const courseTitle = primary.course_name || primary.attributes?.course_name || unscheduledPayload.title || 'Course';
    const instructor = primary.instructor_name || primary.attributes?.instructor_name || '';
    const room = primary.room_name || primary.attributes?.room_name || '';
    const days = primary.days || primary.timeslot_days || primary.attributes?.days || '';
    const start = primary.start_time || primary.timeslot_start_time || primary.attributes?.start_time || '';
    const durationHours = Number(primary.duration || primary.timeslot_duration_hours || primary.attributes?.duration || 0) || '';
    const startLabel = formatClockTimeFromString(start) || (start ? String(start) : '');

    const wrapper = document.createElement('div');
    wrapper.className = 'modal fade';
    wrapper.tabIndex = -1;
    wrapper.setAttribute('role', 'dialog');

    wrapper.innerHTML = `
        <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content border-0 shadow event-details-modal">
                <div class="modal-header event-details-header">
                    <div class="event-details-title-wrap">
                        <h5 class="modal-title event-details-title">${escapeHtml(courseTitle)}</h5>
                        <p class="event-details-subtitle mb-0">Unscheduled — Reschedule</p>
                    </div>
                    <button type="button" class="btn-close" aria-label="Close"></button>
                </div>
                <div class="modal-body event-details-body">
                    <div class="event-details-grid px-2">
                        <div class="event-details-card event-details-card--instructor mb-2">
                            <p class="event-details-label mb-1">Instructor</p>
                            <input id="lwInstructorInput" class="form-control form-control-sm" type="text" placeholder="">
                        </div>
                        <div class="event-details-card event-details-card--room mb-2">
                            <p class="event-details-label mb-1">Room</p>
                            <input id="lwRoomInput" class="form-control form-control-sm" type="text" placeholder="">
                        </div>
                        <div class="event-details-card event-details-card--days mb-2">
                            <p class="event-details-label mb-1">Days</p>
                            <input id="lwDaysInput" class="form-control form-control-sm" type="text" placeholder="">
                        </div>
                        <div class="event-details-card event-details-card--time mb-2">
                            <p class="event-details-label mb-1">Start Time</p>
                            <input id="lwTimeInput" class="form-control form-control-sm" type="text" placeholder="">
                        </div>
                        <div class="event-details-card event-details-card--duration mb-2">
                            <p class="event-details-label mb-1">Duration (hours)</p>
                            <input id="lwDurationInput" class="form-control form-control-sm" type="number" min="0" step="0.25" placeholder="">
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-primary" id="lightweightSaveBtn">Save Changes</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(wrapper);
    try { console.log('details: lightweight modal appended to body'); } catch (e) {}

    let bsModal = null;
    try {
        bsModal = new Modal(wrapper);
        bsModal.show();
        try { console.log('details: lightweight bsModal.show() called'); } catch (e) {}
    } catch (err) {
        console.error('details: creating/showing bsModal failed', err);
    }

    
    setTimeout(() => {
        try {
            const isShown = wrapper.classList.contains('show');
            console.log('details: lightweight modal after timeout classList.contains("show")=', isShown);
            if (!isShown) {
                console.warn('details: lightweight modal did not become visible — applying fallback display/backdrop');
                try {
                    wrapper.style.display = 'block';
                    wrapper.classList.add('show');
                    document.body.classList.add('modal-open');
                    if (!document.querySelector('.modal-backdrop')) {
                        const backdrop = document.createElement('div');
                        backdrop.className = 'modal-backdrop fade show';
                        document.body.appendChild(backdrop);
                        console.log('details: lightweight fallback backdrop appended');
                    }
                } catch (e) {
                    console.error('details: lightweight fallback failed', e);
                }
            }
        } catch (e) { }
    }, 40);

    
    const EMDASH = '\u2014';
    const instructorInput = wrapper.querySelector('#lwInstructorInput');
    const roomInput = wrapper.querySelector('#lwRoomInput');
    const daysInput = wrapper.querySelector('#lwDaysInput');
    const durationInput = wrapper.querySelector('#lwDurationInput');
    const timeInput = wrapper.querySelector('#lwTimeInput');

    const inputs = [instructorInput, roomInput, daysInput, durationInput, timeInput].filter(Boolean);

    
    inputs.forEach((inp) => {
        if (!inp) return;
        const initial = (inp === durationInput && durationHours) ? String(durationHours) : (inp === timeInput && startLabel) ? startLabel : '';
        if (initial) {
            inp.value = initial;
        } else {
            inp.value = EMDASH;
        }

        inp.addEventListener('focus', () => {
            if (inp.value === EMDASH) inp.value = '';
            
            try { updateLWEmptyStates(); } catch (e) { }
        });
        inp.addEventListener('blur', () => {
            if (!String(inp.value || '').trim()) inp.value = EMDASH;
            
            try { updateLWEmptyStates(); } catch (e) { }
        });
    });

    
    const updateLWEmptyStates = () => {
        const mappings = [
            { card: '.event-details-card--instructor', input: instructorInput },
            { card: '.event-details-card--room', input: roomInput },
            { card: '.event-details-card--days', input: daysInput },
            { card: '.event-details-card--duration', input: durationInput },
            { card: '.event-details-card--time', input: timeInput }
        ];

        mappings.forEach(({ card, input }) => {
            try {
                const cardEl = wrapper.querySelector(card);
                if (!cardEl) return;
                const val = input ? String(input.value || '').trim() : '';
                const isEmptyField = val === EMDASH || val === '';
                cardEl.classList.toggle('field-empty', isEmptyField);
                try { console.debug && console.debug('updateLWEmptyStates:', card, 'value:', val, 'field-empty:', isEmptyField); } catch (e) { }
            } catch (e) {  }
        });
    };

    
    try { updateLWEmptyStates(); } catch (e) { }

    
    const removeAll = () => {
        try { bsModal.hide(); } catch (e) {}
        try { wrapper.remove(); } catch (e) {}
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) backdrop.remove();
    };

    
    wrapper.querySelectorAll('.btn-close, [data-bs-dismiss="modal"]').forEach((btn) => {
        btn.addEventListener('click', (e) => { e.preventDefault(); removeAll(); });
    });

    
    const saveBtn = wrapper.querySelector('#lightweightSaveBtn');
    if (saveBtn) saveBtn.addEventListener('click', () => {
        const read = (inp) => {
            if (!inp) return null;
            const v = String(inp.value || '').trim();
            return v === EMDASH || v === '' ? null : v;
        };

        const payload = {
            assignmentId: unscheduledPayload?.extendedProps?.courseKey || unscheduledPayload?.id,
            instructor: read(instructorInput),
            room: read(roomInput),
            days: read(daysInput),
            durationHours: read(durationInput) ? Number(read(durationInput)) : null,
            startTime: read(timeInput)
        };

        console.log('lightweight modal: Save clicked, collected values:', payload);
        removeAll();
        document.dispatchEvent(new CustomEvent('schedule:refresh-selection'));
    });
};


const escapeHtml = (str) => String(str || '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);

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

const getDetailElements = (root = null) => {
    const scope = root || document;
    return {
        course: scope.querySelector('#eventDetailsCourse'),
        meta: scope.querySelector('#eventDetailsMeta'),
        instructorValue: scope.querySelector('#eventDetailsInstructorValue'),
        locationValue: scope.querySelector('#eventDetailsLocationValue'),
        instructorEditButton: scope.querySelector('#eventDetailsInstructorEditButton'),
        locationEditButton: scope.querySelector('#eventDetailsLocationEditButton'),
        daysEditButton: scope.querySelector('#eventDetailsDaysEditButton'),
        durationEditButton: scope.querySelector('#eventDetailsDurationEditButton'),
        instructorSearch: scope.querySelector('#eventDetailsInstructorSearch') || document.getElementById('eventDetailsInstructorSearch'),
        locationSearch: scope.querySelector('#eventDetailsLocationSearch') || document.getElementById('eventDetailsLocationSearch'),
        instructorList: scope.querySelector('#eventDetailsInstructorList') || document.getElementById('eventDetailsInstructorList'),
        locationList: scope.querySelector('#eventDetailsLocationList') || document.getElementById('eventDetailsLocationList'),
        instructorSelectModal: scope.querySelector('#eventDetailsInstructorSelectModal') || document.getElementById('eventDetailsInstructorSelectModal'),
        locationSelectModal: scope.querySelector('#eventDetailsLocationSelectModal') || document.getElementById('eventDetailsLocationSelectModal'),
        daysSelectModal: scope.querySelector('#eventDetailsDaysSelectModal') || document.getElementById('eventDetailsDaysSelectModal'),
        daysApplyButton: scope.querySelector('#eventDetailsDaysApplyButton') || document.getElementById('eventDetailsDaysApplyButton'),
        daysValidation: scope.querySelector('#eventDetailsDaysValidation') || document.getElementById('eventDetailsDaysValidation'),
        duration: scope.querySelector('#eventDetailsDuration'),
        durationSelectModal: scope.querySelector('#eventDetailsDurationSelectModal') || document.getElementById('eventDetailsDurationSelectModal'),
        durationHoursInput: scope.querySelector('#eventDetailsDurationHoursInput') || document.getElementById('eventDetailsDurationHoursInput'),
        durationMinutesInput: scope.querySelector('#eventDetailsDurationMinutesInput') || document.getElementById('eventDetailsDurationMinutesInput'),
        optionsList: scope.querySelector('#eventDetailsOptionsList') || document.getElementById('eventDetailsOptionsList'),
        durationApplyButton: scope.querySelector('#eventDetailsDurationApplyButton') || document.getElementById('eventDetailsDurationApplyButton'),
        durationValidation: scope.querySelector('#eventDetailsDurationValidation') || document.getElementById('eventDetailsDurationValidation'),
        days: scope.querySelector('#eventDetailsDays'),
        time: scope.querySelector('#eventDetailsTime')
    };
};


const clearOptionsList = (root = null) => {
    detailState.currentOptions = [];
    detailState.selectedOption = null;
    const listEl = document.getElementById('eventDetailsOptionsList');
    if (listEl) listEl.innerHTML = '';
    
    try { disableSaveButton(root); } catch (e) { }
};

function enableSaveButton(root = null) {
    const btn = root ? root.querySelector('#eventDetailsSaveChangesButton') : document.getElementById('eventDetailsSaveChangesButton');
    if (btn) btn.disabled = false;
}

function disableSaveButton(root = null) {
    const btn = root ? root.querySelector('#eventDetailsSaveChangesButton') : document.getElementById('eventDetailsSaveChangesButton');
    if (btn) btn.disabled = true;
}

const renderOptionsList = (payload, root = null) => {
    
    
    const listEl = document.getElementById('eventDetailsOptionsList');

    if (!listEl) {
        console.warn('Options list element not found');
        return;
    }

    
    let options = [];
    if (Array.isArray(payload)) {
        options = payload;
    } else if (Array.isArray(payload?.data)) {
        options = payload.data;
    }

    detailState.currentOptions = options;
    detailState.selectedOption = null;
    listEl.innerHTML = '';

    
    const selectable = options.filter((o) => {
        const a = o.attributes || o;
        return !a.conflicting && !(Array.isArray(a.conflicts) && a.conflicts.length > 0);
    });
    const conflicts = options.filter((o) => !selectable.includes(o));

    const renderItem = (opt, idx, isSelectable = true) => {
        const attrs = opt.attributes || opt;
        const conflictsList = attrs.conflicts || [];
        const labelParts = [];
        const start = attrs.start_time || attrs.startTime || null;
        const durationHours = Number(attrs.duration || attrs.duration_hours || attrs.durationHours || 0);
        if (start) {
            const startLabel = formatClockTimeFromString(start) || String(start);
            let endLabel = null;
            if (Number.isFinite(durationHours) && durationHours > 0) {
                const endTime = addMinutesToTimeString(start, Math.round(durationHours * 60));
                endLabel = formatClockTimeFromString(endTime) || endTime;
            }
            labelParts.push(endLabel ? `${startLabel} - ${endLabel}` : startLabel);
        }
        if (attrs.days) labelParts.push(String(attrs.days));
        if (durationHours) labelParts.push(String(durationHours) + 'h');

        const title = labelParts.filter(Boolean).join(' • ') || `Option ${idx + 1}`;

        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'list-group-item d-flex justify-content-between align-items-start';
        if (isSelectable) item.classList.add('list-group-item-action');
        if (!isSelectable) {
            item.classList.add('disabled');
            item.setAttribute('aria-disabled', 'true');
        }

        const left = document.createElement('div');
        left.className = 'ms-2 me-auto';
        const divTitle = document.createElement('div');
        divTitle.className = 'fw-semibold';
        divTitle.textContent = title;
        left.appendChild(divTitle);

        if (conflictsList.length > 0) {
            const conflictDiv = document.createElement('div');
            conflictDiv.className = 'small text-danger conflict-reasons';

            conflictsList.forEach((reason, ri) => {
                const reasonWrap = document.createElement('div');
                reasonWrap.className = 'conflict-reason';
                reasonWrap.textContent = reason;
                conflictDiv.appendChild(reasonWrap);

                if (ri < conflictsList.length - 1) {
                    const hr = document.createElement('hr');
                    hr.className = 'conflict-reason-divider';
                    conflictDiv.appendChild(hr);
                }
            });

            left.appendChild(conflictDiv);
        }

        const right = document.createElement('div');
        right.className = 'badge bg-' + (attrs.conflicting ? 'danger' : 'success');
        right.textContent = attrs.conflicting ? 'Conflict' : 'OK';

        item.appendChild(left);
        item.appendChild(right);

        if (isSelectable) {
            item.addEventListener('click', () => {
                const previous = listEl.querySelector('.list-group-item.active');
                if (previous) previous.classList.remove('active');
                item.classList.add('active');
                detailState.selectedOption = opt;
                console.log('Selected option:', opt);
                try { applySelectedOptionToTime(opt, root); } catch (e) {  }
            });
        }

        listEl.appendChild(item);
    };

    
    selectable.forEach((opt, i) => renderItem(opt, i, true));

    if (conflicts.length > 0) {
        
        const separator = document.createElement('div');
        separator.className = 'list-group-item small text-muted';
        separator.textContent = 'Conflicts';
        listEl.appendChild(separator);

        conflicts.forEach((opt, i) => renderItem(opt, i, false));
    }
};


document.addEventListener('DOMContentLoaded', () => {
    const applyBtn = document.getElementById('eventOptionsApplyButton');
    applyBtn?.addEventListener('click', () => {
        console.log('Applied option:', detailState.selectedOption);
        const optionsModalEl = document.getElementById('eventOptionsModal');
        if (optionsModalEl) {
            Modal.getOrCreateInstance(optionsModalEl).hide();
        }
    });

    
    const optionsModalEl = document.getElementById('eventOptionsModal');
    const detailsModalEl = document.getElementById('eventDetailsModal');

    if (optionsModalEl && detailsModalEl) {
        optionsModalEl.addEventListener('show.bs.modal', () => {
            detailsModalEl.classList.add('event-details-modal-behind-selector');
        });

        optionsModalEl.addEventListener('hidden.bs.modal', () => {
            detailsModalEl.classList.remove('event-details-modal-behind-selector');
        });
    }

    
    const pendingBtn = document.getElementById('eventDetailsTimePendingButton');
    pendingBtn?.addEventListener('click', async () => {
        try {
            if (animateMissingRequiredFields()) return;
            await fetchAndShowOptions();
        } catch (err) { console.error(err); }
    });

    
    
    
    
    document.addEventListener('click', (ev) => {
        try {
            const btn = ev.target.closest && ev.target.closest('.event-details-edit-btn');
            if (!btn) return;
            if (btn.dataset && btn.dataset.detailBound === 'true') return; 

            const id = btn.id || '';
            let modalId = null;
            let type = null;

            if (id === 'eventDetailsInstructorEditButton') {
                modalId = 'eventDetailsInstructorSelectModal';
                type = 'instructor';
            } else if (id === 'eventDetailsLocationEditButton') {
                modalId = 'eventDetailsLocationSelectModal';
                type = 'location';
            } else if (id === 'eventDetailsDaysEditButton') {
                modalId = 'eventDetailsDaysSelectModal';
            } else if (id === 'eventDetailsDurationEditButton') {
                modalId = 'eventDetailsDurationSelectModal';
            }

            if (!modalId) return;

            const modalEl = document.getElementById(modalId);
            if (modalEl) {
                ev.preventDefault();
                ev.stopPropagation();
                Modal.getOrCreateInstance(modalEl).show();
            }
        } catch (e) {  }
    });

    
    const timeCard = document.querySelector('.event-details-card--time');
    if (timeCard) {
        
        timeCard.addEventListener('click', async (e) => {
            if (!timeCard.classList.contains('pending')) return;
            if (animateMissingRequiredFields()) return;
            try { await fetchAndShowOptions(); } catch (err) { console.error(err); }
        });
        timeCard.addEventListener('keydown', async (e) => {
            if (!timeCard.classList.contains('pending')) return;
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (animateMissingRequiredFields()) return;
                try { await fetchAndShowOptions(); } catch (err) { console.error(err); }
            }
        });
    }
});

const formatDurationLabel = (durationMinutes) => {
    const roundedMinutes = Math.round(Number(durationMinutes));

    if (!Number.isInteger(roundedMinutes) || roundedMinutes <= 0) {
        return '\u2014';
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


const parseDaysToIndexes = (days) => {
    if (!days) return [];
    if (Array.isArray(days)) return toUniqueSortedDayIndexes(days.map((d) => Number(d)).filter((n) => Number.isInteger(n)));
    const s = String(days || '').replace(/[^A-Za-z]/g, '').toUpperCase();
    if (!s) return [];
    const map = { U:0, M:1, T:2, W:3, R:4, F:5, S:6 };
    const indexes = [...new Set([...s].map((ch) => map[ch] ).filter((i) => Number.isInteger(i)))];
    return toUniqueSortedDayIndexes(indexes);
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
        return '\u2014';
    }

    return normalizedDayIndexes
        .map((dayIndex) => DAY_LABELS[dayIndex] || null)
        .filter(Boolean)
        .join(', ');
};

const toUniqueValues = (values = []) => {
    return [...new Set(values.map((value) => String(value || '').trim()).filter(Boolean))];
};


function markTimePending(root = null) {
    const els = getDetailElements(root);
    if (els.time) {
        els.time.textContent = '\u2014';
    }
    clearOptionsList(root);
    
    try { disableSaveButton(root); } catch (e) { }

    
    const scope = root || document;
    const pendingBtn = scope.querySelector('#eventDetailsTimePendingButton');
    if (pendingBtn) {
        pendingBtn.classList.remove('d-none');
    }

    const timeCard = scope.querySelector('.event-details-card--time');
    if (timeCard) {
        timeCard.classList.add('pending');
        try { enableTimeCardInteraction(root); } catch (e) { }
    }
    try { updateTimeEmptyState(root); } catch (e) {  }
    try { updateEmptyFieldStates(root); } catch (e) {  }
    try { updateEmptyFieldStates(root); } catch (e) {  }
}


function enableTimeCardInteraction(root = null) {
    const scope = root || document;
    const timeCard = scope.querySelector('.event-details-card--time');
    if (!timeCard) return;
    timeCard.setAttribute('role', 'button');
    timeCard.tabIndex = 0;
    timeCard.style.cursor = 'pointer';
}


function disableTimeCardInteraction(root = null) {
    const scope = root || document;
    const timeCard = scope.querySelector('.event-details-card--time');
    if (!timeCard) return;
    timeCard.removeAttribute('role');
    timeCard.tabIndex = -1;
    timeCard.style.cursor = '';
}

async function fetchAndShowOptions(root = null) {
    const current = detailState.currentAssignment || {};
    const assignmentId = Number(current.assignmentId || '');
    const termId = Number(current.termId || '');
    if (!Number.isInteger(assignmentId) || assignmentId <= 0 || !Number.isInteger(termId) || termId <= 0) {
        console.warn('Missing assignment or term id; cannot request options.');
        return;
    }

    const dayIndexToChar = ['U','M','T','W','R','F','S'];
    const selectedDayIndexes = Array.isArray(detailState.selectedDayIndexes) ? detailState.selectedDayIndexes : [];
    const days = selectedDayIndexes.map((i) => dayIndexToChar[i] || '').filter(Boolean).join('');

    const durationMinutes = Number(detailState.selectedDurationMinutes || 0);
    const durationHours = Number.isFinite(durationMinutes) && durationMinutes > 0
        ? Math.round(durationMinutes / 60)
        : 0;

    const params = new URLSearchParams();
    if (days) params.set('days', days);
    if (durationHours) params.set('duration', String(durationHours));

    const detailEls = getDetailElements(root);
    let instructorId = null;
    let roomId = null;
    const instructorLabel = detailEls.instructorValue?.textContent?.trim();
    const roomLabel = detailEls.locationValue?.textContent?.trim();
    const cachedInstructors = detailState.instructorsByTermMap.get(termId) || [];
    const cachedRooms = detailState.roomsByTermMap.get(termId) || [];
    const matchedInstructor = cachedInstructors.find((inst) => getOptionLabel(inst) === instructorLabel);
    if (matchedInstructor) {
        instructorId = Number(matchedInstructor.id || matchedInstructor.attributes?.id || '');
        if (Number.isInteger(instructorId) && instructorId > 0) params.set('instructor_id', String(instructorId));
    }
    const matchedRoom = cachedRooms.find((r) => getOptionLabel(r) === roomLabel);
    if (matchedRoom) {
        roomId = Number(matchedRoom.id || matchedRoom.attributes?.id || '');
        if (Number.isInteger(roomId) && roomId > 0) params.set('room_id', String(roomId));
    }

    const endpoint = `/api/v1/terms/${termId}/assignments/${assignmentId}/options` + (params.toString() ? `?${params.toString()}` : '');

    try {
        const resp = await fetch(endpoint, { headers: { 'Accept': 'application/json' } });
        if (!resp.ok) throw new Error(`Options request failed: ${resp.status}`);
        const payload = await resp.json();
        clearOptionsList(root);
        renderOptionsList(payload, root);
        const optsModal = document.getElementById('eventOptionsModal');
        if (optsModal) {
            
            
            if (root) {
                try {
                    root.classList.add('event-details-modal-behind-selector');
                    if (root.id !== 'eventDetailsModal') {
                        root.dataset._prevZ = root.style.zIndex || '';
                        root.style.zIndex = '1040';
                    }
                } catch (e) {  }

                
                optsModal.addEventListener('hidden.bs.modal', () => {
                    try {
                        root.classList.remove('event-details-modal-behind-selector');
                        if (root.id !== 'eventDetailsModal') {
                            if (root.dataset._prevZ !== undefined) {
                                root.style.zIndex = root.dataset._prevZ;
                                delete root.dataset._prevZ;
                            } else {
                                root.style.zIndex = '';
                            }
                        }
                    } catch (e) {  }
                }, { once: true });
            }

            Modal.getOrCreateInstance(optsModal).show();
        }
    } catch (err) {
        console.error('Failed to load assignment options', err);
        clearOptionsList(root);
    }
}

function addMinutesToTimeString(timeString, minutesToAdd) {
    if (!timeString) return null;
    const [hoursPart, minutesPart] = String(timeString).split(':');
    const hours = Number(hoursPart || 0);
    const minutes = Number(minutesPart || 0);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;

    const total = hours * 60 + minutes + Number(minutesToAdd || 0);
    const wrapped = ((total % (24 * 60)) + (24 * 60)) % (24 * 60);
    const endH = Math.floor(wrapped / 60);
    const endM = wrapped % 60;
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
}

function applySelectedOptionToTime(opt, root = null) {
    if (!opt) return;
    const attrs = opt.attributes || opt;
    const start = attrs.start_time || attrs.startTime || null;
    const duration = Number(attrs.duration || attrs.duration_hours || attrs.durationHours || 0);
    if (!start || !Number.isFinite(duration) || duration <= 0) {
        return;
    }

    const startLabel = formatClockTimeFromString(start);
    const endTime = addMinutesToTimeString(start, Math.round(duration * 60));
    const endLabel = formatClockTimeFromString(endTime);
    const els = getDetailElements(root);
    if (els.time) {
        els.time.textContent = (startLabel && endLabel) ? `${startLabel} - ${endLabel}` : '\u2014';
    }
    
    const scope = root || document;
    const pendingBtn = scope.querySelector('#eventDetailsTimePendingButton');
    if (pendingBtn) pendingBtn.classList.add('d-none');
    const timeCard = scope.querySelector('.event-details-card--time');
    if (timeCard) timeCard.classList.remove('pending');
    try { enableSaveButton(root); } catch (e) { }
    
    try { updateTimeEmptyState(root); } catch (e) {  }
    try { updateEmptyFieldStates(root); } catch (e) {  }
    
    try { disableTimeCardInteraction(root); } catch (e) { }
}


function updateTimeEmptyState(root = null) {
    const els = getDetailElements(root);
    const scope = root || document;
    const timeCard = scope.querySelector('.event-details-card--time');
    if (!timeCard || !els.time) return;
    const isEmpty = String(els.time.textContent || '').trim() === '\u2014';
    timeCard.classList.toggle('time-empty', isEmpty);
}


function updateEmptyFieldStates(root = null) {
    const els = getDetailElements(root);
    const scope = root || document;

    const mappings = [
        { card: '.event-details-card--instructor', el: 'instructorValue' },
        { card: '.event-details-card--room', el: 'locationValue' },
        { card: '.event-details-card--days', el: 'days' },
        { card: '.event-details-card--duration', el: 'duration' }
    ];

    mappings.forEach(({ card, el }) => {
        try {
            const cardEl = scope.querySelector(card);
            const valueEl = els[el];
            if (!cardEl || !valueEl) return;
            const txt = String(valueEl.textContent || '').trim();
            const isEmptyField = txt === '\u2014' || txt === '' || /^(Not available)$/i.test(txt);
            cardEl.classList.toggle('field-empty', isEmptyField);
            try { console.debug && console.debug('updateEmptyFieldStates:', card, 'value:', txt, 'field-empty:', isEmptyField); } catch (e) { }
            
            try {
                const btn = cardEl.querySelector('.event-details-edit-btn');
                if (btn) {
                    btn.disabled = false;
                    btn.setAttribute('aria-disabled', 'false');
                    btn.tabIndex = 0;
                }
            } catch (e) {  }
        } catch (e) {  }
    });
}



function animateMissingRequiredFields(root = null) {
    const els = getDetailElements(root);
    const scope = root || document;
    const required = [
        { el: 'instructorValue' },
        { el: 'locationValue' },
        { el: 'days' },
        { el: 'duration' }
    ];

    let anyMissing = false;

        required.forEach((r) => {
            try {
                const valueEl = els[r.el];
                if (!valueEl) return;
                const txt = String(valueEl.textContent || '').trim();
                const isMissing = txt === '\u2014' || txt === '' || /^(Not available)$/i.test(txt);
                if (isMissing) {
                    anyMissing = true;
                    
                    const animateEl = (el) => {
                        if (!el) return;
                        try {
                            el.classList.remove('wiggle');
                            void el.offsetWidth;
                            el.classList.add('wiggle');
                            setTimeout(() => { try { el.classList.remove('wiggle'); } catch (e) {} }, 700);
                        } catch (e) {  }
                    };
                    animateEl(valueEl);
                    
                    
                    const card = valueEl.closest('.event-details-card');
                    if (card) {
                        
                        try { card.classList.add('field-empty'); } catch (e) { }
                        card.classList.add('wiggle-highlight');
                        setTimeout(() => {
                            try { card.classList.remove('wiggle-highlight'); } catch (e) { }
                        }, 800);
                    }
                }
            } catch (e) {  }
        });

    return anyMissing;
}

const setDetailSelectorValues = ({
    valueEl,
    searchEl,
    listEl,
    selectModalEl,
    values = [],
    preferredValue = null,
    fallbackLabel = '\u2014',
    emptyListMessage = 'No options available'
    , root = null
}) => {
    if (!valueEl || !listEl) {
        return;
    }

    const uniqueValues = toUniqueValues(values);
    const normalizedPreferred = String(preferredValue || '').trim();
    
    const firstLabel = normalizedPreferred
        ? normalizedPreferred
        : (uniqueValues[0] || fallbackLabel);

    valueEl.textContent = firstLabel;
    try { updateEmptyFieldStates(root); } catch (e) {  }

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
                
                try { markTimePending(root); } catch (e) {  }
                try { updateEmptyFieldStates(root); } catch (e) {  }
                if (selectModalEl) {
                    try {
                        const canonical = (selectModalEl.id && document.getElementById(selectModalEl.id)) || selectModalEl;
                        Modal.getOrCreateInstance(canonical).hide();
                    } catch (e) {  }
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
    // Try to preselect the preferred value in the list for scheduled courses
    try {
        const rootIsUnscheduled = root && root instanceof Element && String(root.dataset.isUnscheduled || '').toLowerCase() === 'true';
        if (normalizedPreferred && !rootIsUnscheduled) {
            const candidate = [...listEl.children].find((ch) => ch instanceof Element && String(ch.textContent || '').trim() === normalizedPreferred);
            if (candidate) {
                candidate.classList.add('active');
                try { candidate.scrollIntoView({ block: 'nearest' }); } catch (e) { }
            }
        }
    } catch (e) { }
};

const bindDetailActions = (root = null) => {
    const scope = root || document;

    
    if (!root && detailState.actionsBound) {
        return;
    }

    
    if (root && root.__eventDetailsActionsBound) {
        return;
    }

    const detailEls = getDetailElements(root);
    const detailModalRoot = root || document.getElementById('eventDetailsModal');

    const setDetailModalBehindSelector = (behind = false) => {
        if (!detailModalRoot) {
            return;
        }

        detailModalRoot.classList.toggle('event-details-modal-behind-selector', behind);

        
        
        try {
            if (detailModalRoot.id !== 'eventDetailsModal') {
                if (behind) {
                    detailModalRoot.dataset._prevZ = detailModalRoot.style.zIndex || '';
                    detailModalRoot.style.zIndex = '1040';
                } else {
                    if (detailModalRoot.dataset._prevZ !== undefined) {
                        detailModalRoot.style.zIndex = detailModalRoot.dataset._prevZ;
                        delete detailModalRoot.dataset._prevZ;
                    } else {
                        detailModalRoot.style.zIndex = '';
                    }
                }
            }
        } catch (e) {  }
    };

    const openSelectorModal = async (selectorModalEl, type = null) => {
        if (!selectorModalEl) {
            return;
        }

        setDetailModalBehindSelector(true);

        
        try {
            const termId = await resolveSelectedTermId();
            if (termId) {
                if (type === 'instructor') {
                    const all = await getAllInstructorLabelsByTerm(termId);
                    setDetailSelectorValues({
                        valueEl: detailEls.instructorValue,
                        searchEl: detailEls.instructorSearch,
                        listEl: detailEls.instructorList,
                        selectModalEl: detailEls.instructorSelectModal,
                        values: all,
                        preferredValue: detailEls.instructorValue?.textContent?.trim() || null,
                        fallbackLabel: 'No instructors found',
                        root: root
                    });
                } else if (type === 'location') {
                    const all = await getAllRoomLabelsByTerm(termId);
                    setDetailSelectorValues({
                        valueEl: detailEls.locationValue,
                        searchEl: detailEls.locationSearch,
                        listEl: detailEls.locationList,
                        selectModalEl: detailEls.locationSelectModal,
                        values: all,
                        preferredValue: detailEls.locationValue?.textContent?.trim() || null,
                        fallbackLabel: 'No rooms found',
                        root: root
                    });
                }
            }
        } catch (e) {
            
        }

        
        let targetModal = selectorModalEl;
        try {
            if (selectorModalEl && selectorModalEl.id) {
                const byId = document.getElementById(selectorModalEl.id);
                if (byId) targetModal = byId;
            }
        } catch (e) {  }

        Modal.getOrCreateInstance(targetModal).show();
    };

    detailEls.instructorEditButton?.addEventListener('click', async () => {
        const canonical = document.getElementById('eventDetailsInstructorSelectModal') || detailEls.instructorSelectModal;
        await openSelectorModal(canonical, 'instructor');
    });
    try { if (detailEls.instructorEditButton) detailEls.instructorEditButton.dataset.detailBound = 'true'; } catch (e) {}

    detailEls.locationEditButton?.addEventListener('click', async () => {
        const canonical = document.getElementById('eventDetailsLocationSelectModal') || detailEls.locationSelectModal;
        await openSelectorModal(canonical, 'location');
    });
    try { if (detailEls.locationEditButton) detailEls.locationEditButton.dataset.detailBound = 'true'; } catch (e) {}

    detailEls.daysEditButton?.addEventListener('click', () => {
        setSelectedDayCheckboxes(detailState.selectedDayIndexes);
        setDaysValidationState(false);
        const canonical = document.getElementById('eventDetailsDaysSelectModal') || detailEls.daysSelectModal;
        openSelectorModal(canonical);
    });
    try { if (detailEls.daysEditButton) detailEls.daysEditButton.dataset.detailBound = 'true'; } catch (e) {}

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
        const canonical = document.getElementById('eventDetailsDurationSelectModal') || detailEls.durationSelectModal;
        openSelectorModal(canonical);
    });
    try { if (detailEls.durationEditButton) detailEls.durationEditButton.dataset.detailBound = 'true'; } catch (e) {}

    detailEls.daysApplyButton?.addEventListener('click', async () => {
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

        
        try { markTimePending(root); } catch (e) {  }

        if (detailEls.daysSelectModal) {
            Modal.getOrCreateInstance(detailEls.daysSelectModal).hide();
        }

        
        
    });

    detailEls.durationApplyButton?.addEventListener('click', async () => {
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

        
        try { markTimePending(root); } catch (e) {  }

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

    
    if (root) {
        const pendingBtnScoped = scope.querySelector('#eventDetailsTimePendingButton');
        pendingBtnScoped?.addEventListener('click', async () => {
            try {
                if (animateMissingRequiredFields(root)) return;
                await fetchAndShowOptions(root);
            } catch (err) { console.error(err); }
        });

        const timeCardScoped = scope.querySelector('.event-details-card--time');
        if (timeCardScoped) {
            timeCardScoped.addEventListener('click', async (e) => {
                if (!timeCardScoped.classList.contains('pending')) return;
                if (animateMissingRequiredFields(root)) return;
                try { await fetchAndShowOptions(root); } catch (err) { console.error(err); }
            });
            timeCardScoped.addEventListener('keydown', async (e) => {
                if (!timeCardScoped.classList.contains('pending')) return;
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (animateMissingRequiredFields(root)) return;
                    try { await fetchAndShowOptions(root); } catch (err) { console.error(err); }
                }
            });
        }
    }

    
    const saveButton = scope.querySelector('#eventDetailsSaveChangesButton');
    saveButton?.addEventListener('click', async () => {
        const current = detailState.currentAssignment || {};
        const assignmentId = Number(current.assignmentId || '');
        const termId = Number(current.termId || '');

        if (!Number.isInteger(assignmentId) || assignmentId <= 0 || !Number.isInteger(termId) || termId <= 0) {
            console.warn('Missing assignment or term id; cannot save changes.');
            return;
        }

        
        if (!detailState.selectedOption) {
            console.warn('No option selected. Click the red ! next to the time to choose an option first.');
            return;
        }

        const detailEls = getDetailElements(root);
        
        let instructorId = null;
        let roomId = null;

        const instructorLabel = detailEls.instructorValue?.textContent?.trim();
        const roomLabel = detailEls.locationValue?.textContent?.trim();

        const cachedInstructors = detailState.instructorsByTermMap.get(termId) || [];
        const cachedRooms = detailState.roomsByTermMap.get(termId) || [];

        const matchedInstructor = cachedInstructors.find((inst) => getOptionLabel(inst) === instructorLabel);
        if (matchedInstructor) {
            instructorId = Number(matchedInstructor.id || matchedInstructor.attributes?.id || '');
        }

        const matchedRoom = cachedRooms.find((r) => getOptionLabel(r) === roomLabel);
        if (matchedRoom) {
            roomId = Number(matchedRoom.id || matchedRoom.attributes?.id || '');
        }

        try {
            
            const getResp = await fetch(`/api/v1/terms/${termId}/assignments/${assignmentId}`, { headers: { 'Accept': 'application/json' } });
            if (!getResp.ok) throw new Error(`Failed to load assignment: ${getResp.status}`);
            const getPayload = await getResp.json();
            const existingAttrs = getPayload?.data?.attributes || {};
            const existingRels = getPayload?.data?.relationships || {};

            const selected = detailState.selectedOption;
            const timeslotId = (selected?.relationships?.timeslot?.data?.id) || selected?.timeslot_id || selected?.attributes?.timeslot_id || null;

            
            const updateAttrs = {};
            updateAttrs.assignment_id = Number(existingAttrs.assignment_id || assignmentId);
            updateAttrs.term_id = Number(existingAttrs.term_id || termId);

            let resolvedUserId = Number(existingAttrs.user_id || existingAttrs.userId || existingRels?.user?.data?.id || 0);
            if (!Number.isInteger(resolvedUserId) || resolvedUserId <= 0) {
                const meta = document.querySelector('meta[name="current-user-id"]');
                const metaVal = meta?.getAttribute('content') || '';
                const parsed = Number(metaVal || '0');
                if (Number.isInteger(parsed) && parsed > 0) {
                    resolvedUserId = parsed;
                }
            }
            if (Number.isInteger(resolvedUserId) && resolvedUserId > 0) {
                updateAttrs.user_id = resolvedUserId;
            }

            
            const resolvedInstructorId = Number(instructorId || existingAttrs.instructor_id || existingAttrs.instructorId || existingRels?.instructor?.data?.id || 0);
            if (Number.isInteger(resolvedInstructorId) && resolvedInstructorId > 0) {
                updateAttrs.instructor_id = resolvedInstructorId;
            }

            const resolvedSectionId = Number(existingAttrs.section_id || existingAttrs.sectionId || existingRels?.section?.data?.id || 0);
            if (Number.isInteger(resolvedSectionId) && resolvedSectionId > 0) {
                updateAttrs.section_id = resolvedSectionId;
            }

            const resolvedRoomId = Number(roomId || existingAttrs.room_id || existingAttrs.roomId || existingRels?.room?.data?.id || 0);
            if (Number.isInteger(resolvedRoomId) && resolvedRoomId > 0) {
                updateAttrs.room_id = resolvedRoomId;
            }

            if (timeslotId) {
                const ts = Number(timeslotId);
                if (Number.isInteger(ts) && ts > 0) updateAttrs.timeslot_id = ts;
            }

            console.log('PATCH payload (attributes):', updateAttrs);
            const patchResp = await fetch(`/api/v1/terms/${termId}/assignments/${assignmentId}`, {
                method: 'PATCH',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ data: { type: 'assignments', id: assignmentId, attributes: updateAttrs } })
            });
            const patchText = await patchResp.text();
            try {
                console.log('PATCH response status:', patchResp.status, 'body:', patchText ? JSON.parse(patchText) : patchText);
            } catch (e) {
                console.log('PATCH response status:', patchResp.status, 'body text:', patchText);
            }

            if (!patchResp.ok) {
                throw new Error(`Failed to update assignment: ${patchResp.status} ${patchText}`);
            }

            console.log('Assignment updated successfully');

            
            try {
                const verifyResp = await fetch(`/api/v1/terms/${termId}/assignments/${assignmentId}`, { headers: { 'Accept': 'application/json' } });
                const verifyText = await verifyResp.text();
                try {
                    console.log('Updated assignment (verify):', verifyResp.status, verifyText ? JSON.parse(verifyText) : verifyText);
                } catch (e) {
                    console.log('Updated assignment (verify):', verifyResp.status, verifyText);
                }
            } catch (e) {
                console.error('Failed to fetch updated assignment for verification', e);
            }

            
                try {
                const detailElsAfter = getDetailElements(root);
                const existingInstructorId = Number(existingAttrs.instructor_id || existingAttrs.instructorId || existingRels?.instructor?.data?.id || 0);
                const existingRoomId = Number(existingAttrs.room_id || existingAttrs.roomId || existingRels?.room?.data?.id || 0);

                let changedTarget = null;
                let changedId = null;
                let changedName = null;

                if (updateAttrs.instructor_id && updateAttrs.instructor_id !== existingInstructorId) {
                    changedTarget = 'instructor';
                    changedId = updateAttrs.instructor_id;
                    changedName = detailElsAfter.instructorValue?.textContent?.trim() || null;
                } else if (updateAttrs.room_id && updateAttrs.room_id !== existingRoomId) {
                    changedTarget = 'room';
                    changedId = updateAttrs.room_id;
                    changedName = detailElsAfter.locationValue?.textContent?.trim() || null;
                }

                if (changedTarget && changedId) {
                    const courseName = existingAttrs.course_name || detailElsAfter.course?.textContent?.trim() || 'Course';
                    const prettyTarget = changedTarget === 'instructor' ? 'Instructor' : 'Room';
                    const message = `Course ${courseName} updated to ${prettyTarget} ${changedName || ''}`.trim();
                    showChangeBanner({ message, target: changedTarget, id: changedId, name: changedName });
                }
            } catch (e) {
                
            }

            
            const optionsModalEl = document.getElementById('eventOptionsModal');
            try { if (optionsModalEl) Modal.getOrCreateInstance(optionsModalEl).hide(); } catch (e) {}

            
            
            const detailsTarget = root || document.getElementById('eventDetailsModal');
            try { if (detailsTarget) Modal.getOrCreateInstance(detailsTarget).hide(); } catch (e) {}

            
            document.dispatchEvent(new CustomEvent('schedule:refresh-selection'));
            document.dispatchEvent(new CustomEvent('schedule:blockoff-created'));
        } catch (err) {
            console.error('Failed to apply selected option', err);
        }
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
    detailState.instructorsByTermMap.set(termId, instructors || []);
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
    detailState.roomsByTermMap.set(termId, rooms || []);
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

    const originalDays = event?.extendedProps?.originalSchedule?.daysOfWeek;

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

    return '\u2014';
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
        || course.attributes?.instructor_name
        || course.attributes?.instructor_full_name
        || course.attributes?.instructor?.full_name
        || course.instructor?.name
        || course.instructor?.full_name
        || null;
};

const getLocationLabel = (course = {}) => {
    return course.location_name
        || course.attributes?.location_name
        || course.room_name
        || course.attributes?.room_name
        || course.room?.name
        || course.location?.name
        || null;
};

const populateEventDetails = ({ calendar, eventId, unscheduledPayload } = {}, root = null) => {
    const detailEls = getDetailElements(root);

    if (!detailEls.course || !detailEls.meta) {
        return;
    }

    let event = null;
    let usedUnscheduled = null;

    if (unscheduledPayload) {
        usedUnscheduled = unscheduledPayload;
        try { console.log('details: populateEventDetails using unscheduledPayload, id=', usedUnscheduled?.id); } catch (e) { }
    } else {
        event = calendar?.getEventById?.(String(eventId || '')) || null;
        try { console.log('details: populateEventDetails looking up event by id', eventId, 'found=', !!event); } catch (e) { }
    }

    if (!event && !usedUnscheduled) {
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
            fallbackLabel: '\u2014'
        , root: root
        });
        setDetailSelectorValues({
            valueEl: detailEls.locationValue,
            searchEl: detailEls.locationSearch,
            listEl: detailEls.locationList,
            selectModalEl: detailEls.locationSelectModal,
            values: [],
            fallbackLabel: '\u2014'
        , root: root
        });
        detailEls.days.textContent = '\u2014';
        if (detailEls.duration) {
            detailEls.duration.textContent = '\u2014';
        }
        detailEls.time.textContent = '\u2014';
        try { updateTimeEmptyState(root); } catch (e) {  }
        
        clearOptionsList(root);
        if (detailEls.daysEditButton) {
            detailEls.daysEditButton.disabled = true;
        }
        if (detailEls.durationEditButton) {
            detailEls.durationEditButton.disabled = true;
        }
        return;
    }

    const relatedEvents = event ? collectRelatedEvents(calendar, event) : [];
    const eventGroupKey = event ? toGroupKey(event) : (usedUnscheduled?.groupId || toGroupKey({ id: usedUnscheduled?.id }));
    const primaryCourse = event ? getPrimaryCourse(event) : (usedUnscheduled?.extendedProps?.courses?.[0] || {});
    const isUnscheduled = !!usedUnscheduled;
    try { if (root && root instanceof Element) root.dataset.isUnscheduled = isUnscheduled ? 'true' : 'false'; } catch (e) { }
    try { console.log('details: derived primaryCourse:', primaryCourse); } catch (e) { }
    const relatedCourses = event ? getCoursesFromEventGroup(event, relatedEvents) : (primaryCourse ? [primaryCourse] : []);
    const courseTitle = event ? (event.title || primaryCourse.course_name || primaryCourse.section_name || 'Untitled Course') : (primaryCourse.course_name || primaryCourse.section_name || 'Untitled Course');
    const sectionName = primaryCourse.section_name || null;
    const termName = primaryCourse.term_name || primaryCourse.semester_name || primaryCourse.term?.name || null;

    detailEls.course.textContent = courseTitle;
    detailEls.meta.textContent = [sectionName, termName].filter(Boolean).join(' | ') || '';
    const eventInstructors = toUniqueValues(relatedCourses.map((course) => getInstructorLabel(course)));
    const eventRooms = toUniqueValues(relatedCourses.map((course) => getLocationLabel(course)));

    if (isUnscheduled) {
        
        
        const primary = primaryCourse || {};
            const instructorLabel = getInstructorLabel(primary) || '\u2014';
            const locationLabel = getLocationLabel(primary) || '\u2014';

        setDetailSelectorValues({
            valueEl: detailEls.instructorValue,
            searchEl: detailEls.instructorSearch,
            listEl: detailEls.instructorList,
            selectModalEl: detailEls.instructorSelectModal,
            values: [],
            preferredValue: instructorLabel,
            fallbackLabel: instructorLabel,
            root: root
        });

        setDetailSelectorValues({
            valueEl: detailEls.locationValue,
            searchEl: detailEls.locationSearch,
            listEl: detailEls.locationList,
            selectModalEl: detailEls.locationSelectModal,
            values: [],
            preferredValue: locationLabel,
            fallbackLabel: locationLabel,
            root: root
        });

        
        try { detailEls.instructorValue.textContent = instructorLabel; } catch (e) {}
        try { detailEls.locationValue.textContent = locationLabel; } catch (e) {}
        const rawDays = primary.days || primary.timeslot_days || primary.attributes?.days || primary.attributes?.timeslot_days || null;
        const parsedDayIndexes = parseDaysToIndexes(rawDays);

        const durationHours = Number(primary.duration || primary.timeslot_duration_hours || primary.attributes?.duration || 0);
        const durationMinutes = Number.isFinite(durationHours) && durationHours > 0 ? Math.round(durationHours * 60) : null;

        
        
        
        const existingDaySelection = eventGroupKey ? detailState.daySelectionsByGroup.get(eventGroupKey) : null;
        const existingDurationSelection = eventGroupKey ? detailState.durationSelectionsByGroup.get(eventGroupKey) : null;

        if (Array.isArray(existingDaySelection) && existingDaySelection.length > 0) {
            detailState.selectedDayIndexes = existingDaySelection;
        } else {
            detailState.selectedDayIndexes = [];
        }

        detailEls.days.textContent = detailState.selectedDayIndexes.length > 0 ? getDaysLabelFromIndexes(detailState.selectedDayIndexes) : '\u2014';

        if (Number.isInteger(existingDurationSelection) && existingDurationSelection > 0) {
            detailState.selectedDurationMinutes = existingDurationSelection;
        } else {
            detailState.selectedDurationMinutes = null;
        }

        if (detailEls.duration) {
            detailEls.duration.textContent = detailState.selectedDurationMinutes ? formatDurationLabel(detailState.selectedDurationMinutes) : '\u2014';
        }

        
        detailEls.time.textContent = '\u2014';
        try { markTimePending(root); } catch (e) {  }

        if (detailEls.daysEditButton) detailEls.daysEditButton.disabled = false;
        if (detailEls.durationEditButton) detailEls.durationEditButton.disabled = false;
    } else {
        setDetailSelectorValues({
            valueEl: detailEls.instructorValue,
            searchEl: detailEls.instructorSearch,
            listEl: detailEls.instructorList,
            selectModalEl: detailEls.instructorSelectModal,
            values: eventInstructors,
            preferredValue: eventInstructors[0] || null,
            fallbackLabel: 'Loading instructors...'
        , root: root
        });
        setDetailSelectorValues({
            valueEl: detailEls.locationValue,
            searchEl: detailEls.locationSearch,
            listEl: detailEls.locationList,
            selectModalEl: detailEls.locationSelectModal,
            values: eventRooms,
            preferredValue: eventRooms[0] || null,
            fallbackLabel: 'Loading rooms...'
        , root: root
        });
    }
    detailState.selectedEventGroupKey = eventGroupKey;
    const defaultSelectedDayIndexes = event ? getDayIndexes(event, relatedEvents) : [];
    const persistedSelectedDayIndexes = detailState.daySelectionsByGroup.get(eventGroupKey);
    detailState.selectedDayIndexes = Array.isArray(persistedSelectedDayIndexes)
        ? toUniqueSortedDayIndexes(persistedSelectedDayIndexes)
        : defaultSelectedDayIndexes;
    const defaultDurationMinutes = event ? getDurationMinutes(event) : null;
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
    
    if (isUnscheduled) {
        try {
            detailEls.days.textContent = '\u2014';
            if (detailEls.duration) detailEls.duration.textContent = '\u2014';
        } catch (e) {  }
    }
    detailEls.time.textContent = event ? getTimeLabel(event) : '\u2014';
    try { updateTimeEmptyState(root); } catch (e) {  }
    
    detailState.currentAssignment = {
        assignmentId: Number(primaryCourse.assignment_id || primaryCourse.id || primaryCourse.assignmentId || ''),
        termId: Number(primaryCourse.term_id || primaryCourse.term?.id || detailState.selectedTermId || '')
    };
    try { console.log('details: currentAssignment set to', detailState.currentAssignment); } catch (e) { }

    
    
    const timeText = String(detailEls.time.textContent || '').trim();
    const scope = root || document;
    const pendingBtn = scope.querySelector('#eventDetailsTimePendingButton');
    const timeCard = scope.querySelector('.event-details-card--time');

    if (isUnscheduled) {
        
        try { markTimePending(root); } catch (e) {  }
    } else if (timeText && timeText !== '\u2014') {
        if (pendingBtn) pendingBtn.classList.add('d-none');
        if (timeCard) timeCard.classList.remove('pending');
        try { enableSaveButton(root); } catch (e) { }
        try { disableTimeCardInteraction(root); } catch (e) { }
    } else {
        if (pendingBtn) pendingBtn.classList.add('d-none');
        if (timeCard) timeCard.classList.remove('pending');
        try { disableSaveButton(root); } catch (e) { }
        try { disableTimeCardInteraction(root); } catch (e) { }
    }

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
                preferredValue: isUnscheduled ? (detailEls.instructorValue?.textContent?.trim() || null) : (eventInstructors[0] || null),
                fallbackLabel: 'No instructors found',
                root: root
            });

            setDetailSelectorValues({
                valueEl: detailEls.locationValue,
                searchEl: detailEls.locationSearch,
                listEl: detailEls.locationList,
                selectModalEl: detailEls.locationSelectModal,
                values: allRooms,
                preferredValue: isUnscheduled ? (detailEls.locationValue?.textContent?.trim() || null) : (eventRooms[0] || null),
                fallbackLabel: 'No rooms found',
                root: root
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
                preferredValue: isUnscheduled ? (detailEls.instructorValue?.textContent?.trim() || eventInstructors[0] || null) : (eventInstructors[0] || null),
                fallbackLabel: '\u2014',
                root: root
            });

            setDetailSelectorValues({
                valueEl: detailEls.locationValue,
                searchEl: detailEls.locationSearch,
                listEl: detailEls.locationList,
                selectModalEl: detailEls.locationSelectModal,
                values: eventRooms,
                preferredValue: isUnscheduled ? (detailEls.locationValue?.textContent?.trim() || eventRooms[0] || null) : (eventRooms[0] || null),
                fallbackLabel: '\u2014',
                root: root
            });
        });
};

export { bindDetailActions, populateEventDetails };

document.addEventListener('schedule:term-selected', (event) => {
    const selectedTermId = Number(event?.detail?.termId || '');
    detailState.selectedTermId = Number.isInteger(selectedTermId) && selectedTermId > 0 ? selectedTermId : null;
});

export const showEventDetailsModal = (detail = {}, calendar = null) => {
    const modalEl = document.getElementById('eventDetailsModal');

    if (!modalEl) {
        return;
    }

    try {
        console.log('details: showEventDetailsModal called', !!detail, detail && (detail.unscheduledPayload ? 'has unscheduledPayload' : 'no unscheduledPayload'));
    } catch (e) {  }

    if (detail && detail.unscheduledPayload) {
        try {
            console.log('details: unscheduledPayload contents:', detail.unscheduledPayload);
        } catch (e) {  }
    }

    
    
    if (detail && detail.unscheduledPayload && !detail.forceFullModal) {
        try { console.log('details: showing lightweight styled modal for unscheduled reschedule'); } catch (e) { }
        showLightweightDetailsModal(detail.unscheduledPayload);
        return;
    }

    
    
    
    if (detail && detail.unscheduledPayload && detail.forceFullModal) {
        try { console.log('details: opening a cloned full details modal for unscheduled reschedule'); } catch (e) {}

        
        const clone = modalEl.cloneNode(true);
        
        const cloneId = `eventDetailsModalClone_${Date.now()}`;
        clone.id = cloneId;
        document.body.appendChild(clone);

        
        try {
            bindDetailActions(clone);
        } catch (e) { console.error('details: bindDetailActions(clone) failed', e); }

        try {
            populateEventDetails({ calendar, eventId: detail?.eventId, unscheduledPayload: detail?.unscheduledPayload }, clone);
        } catch (e) { console.error('details: populateEventDetails for clone failed', e); }

        const inst = Modal.getOrCreateInstance(clone);
        try {
            inst.show();
        } catch (e) {
            console.error('details: showing cloned modal failed', e);
        }

        
        clone.addEventListener('hidden.bs.modal', () => {
            try { inst.hide(); } catch (e) {}
            try { clone.remove(); } catch (e) {}
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) backdrop.remove();
        });

        return;
    }

    
    bindDetailActions();

    populateEventDetails({
        calendar,
        eventId: detail?.eventId,
        unscheduledPayload: detail?.unscheduledPayload
    });

    try {
        console.log('details: requesting modal show for #eventDetailsModal');
    } catch (e) { }
    const modalInstance = Modal.getOrCreateInstance(modalEl);
    try {
        modalInstance.show();
    } catch (err) {
        console.error('details: Modal.show() threw an error:', err);
    }

    try { console.log('details: modal show requested, immediate classList.contains("show")=', modalEl.classList.contains('show')); } catch (e) { }

    
    setTimeout(() => {
        try {
            const isShown = modalEl.classList.contains('show');
            console.log('details: modal after timeout classList.contains("show")=', isShown);
            console.log('details: any modal.show in document?', !!document.querySelector('.modal.show'));
            console.log('details: backdrop present?', !!document.querySelector('.modal-backdrop'));

            if (!isShown) {
                console.warn('details: modal did not become visible — applying fallback: force show and add backdrop');
                try {
                    modalEl.classList.add('show');
                    modalEl.style.display = 'block';
                    modalEl.setAttribute('aria-modal', 'true');
                    modalEl.removeAttribute('aria-hidden');

                    if (!document.querySelector('.modal-backdrop')) {
                        const backdrop = document.createElement('div');
                        backdrop.className = 'modal-backdrop fade show';
                        document.body.appendChild(backdrop);
                        console.log('details: fallback backdrop appended');
                    }
                } catch (e) {
                    console.error('details: fallback show failed', e);
                }
            }
        } catch (e) { }
    }, 50);
};


function showChangeBanner({ message = 'Updated', target = 'instructor', id = null, name = null } = {}) {
    try {
        
        
        
        
        const setDropdownButtonLabel = (button, text) => {
            if (!button) return;
            const safeText = String(text || '').trim();
            const labelSpan = button.querySelector('.schedule-value-label') || button.querySelector('.schedule-label');
            if (labelSpan) {
                labelSpan.textContent = safeText;
                return;
            }

            
            for (let node of Array.from(button.childNodes)) {
                if (node.nodeType === Node.TEXT_NODE) {
                    node.nodeValue = safeText;
                    return;
                }
            }
            
            const tn = document.createTextNode(safeText);
            button.insertBefore(tn, button.firstChild);
        };

        const container = document.getElementById('globalBannerContainer');
        if (!container) return;

        const wrapper = document.createElement('div');
        wrapper.style.pointerEvents = 'auto';
        wrapper.className = 'toast align-items-center text-white bg-success border-0 show';
        
        wrapper.style.width = '100%';
        wrapper.style.maxWidth = '900px';
        wrapper.style.borderRadius = '0.25rem';
        wrapper.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
        wrapper.setAttribute('role', 'alert');
        wrapper.setAttribute('aria-live', 'assertive');
        wrapper.setAttribute('aria-atomic', 'true');

        const inner = document.createElement('div');
        inner.className = 'd-flex w-100 justify-content-between align-items-center';

        const body = document.createElement('div');
        body.className = 'toast-body flex-grow-1';
        body.style.paddingRight = '0.75rem';
        body.textContent = message;

        const btnWrap = document.createElement('div');
        btnWrap.className = 'd-flex align-items-center gap-2';
        btnWrap.style.marginRight = '0.5rem';

        const viewBtn = document.createElement('button');
        viewBtn.type = 'button';
        viewBtn.className = 'btn btn-sm btn-light';
        viewBtn.textContent = 'View';
        viewBtn.addEventListener('click', () => {
            try {
                const scheduleBySelect = document.getElementById('scheduleBySelect');
                const scheduleValueSelect = document.getElementById('scheduleValueSelect');
                const scheduleValueDropdownButton = document.getElementById('scheduleValueDropdownButton');
                if (!scheduleBySelect || !scheduleValueSelect || !scheduleValueDropdownButton) return;

                const stopShowOnce = (ev) => {
                    try {
                        const tgt = ev.target;
                        if (tgt === scheduleValueDropdownButton || (tgt instanceof Element && tgt.contains && tgt.contains(scheduleValueDropdownButton))) {
                            ev.preventDefault();
                            try {
                                Dropdown.getOrCreateInstance(scheduleValueDropdownButton).hide();
                            } catch (inner) {  }
                        }
                    } catch (e) {  }
                };

                document.addEventListener('show.bs.dropdown', stopShowOnce, { capture: true, once: true });

                scheduleBySelect.value = target === 'room' ? 'room' : 'instructor';
                scheduleBySelect.dispatchEvent(new Event('change'));

                
                const trySetSecondary = (attemptsLeft = 10) => {
                    try {
                        
                        if (!scheduleValueDropdownButton.disabled) {
                            scheduleValueSelect.value = String(id || '');

                            
                            
                            
                            const menu = scheduleValueDropdownButton ? scheduleValueDropdownButton.nextElementSibling : null;
                            const prevMenuDisplay = menu ? menu.style.display : null;
                            const prevPointer = scheduleValueDropdownButton ? scheduleValueDropdownButton.style.pointerEvents : null;

                            try {
                                if (menu) menu.style.display = 'none';
                                if (scheduleValueDropdownButton) scheduleValueDropdownButton.style.pointerEvents = 'none';
                            } catch (e) {  }

                            
                            try {
                                setDropdownButtonLabel(scheduleValueDropdownButton, name || String(scheduleValueDropdownButton.textContent || '').trim());
                            } catch (e) {  }

                            
                            document.dispatchEvent(new CustomEvent('schedule:refresh-selection'));
                            document.dispatchEvent(new CustomEvent('schedule:blockoff-created'));

                            
                            try {
                                Dropdown.getOrCreateInstance(scheduleValueDropdownButton).hide();
                            } catch (inner) {
                                try {
                                    scheduleValueDropdownButton.setAttribute('aria-expanded', 'false');
                                    if (menu && menu.classList.contains('show')) menu.classList.remove('show');
                                } catch (e) {  }
                            }

                            
                            requestAnimationFrame(() => {
                                try {
                                    if (menu) menu.style.display = prevMenuDisplay || '';
                                    if (scheduleValueDropdownButton) scheduleValueDropdownButton.style.pointerEvents = prevPointer || '';
                                } catch (e) {  }
                            });

                            return true;
                        }
                    } catch (e) {  }

                    if (attemptsLeft <= 0) return false;
                    setTimeout(() => trySetSecondary(attemptsLeft - 1), 120);
                    return false;
                };

                trySetSecondary();
            } catch (e) {
                console.error('Failed to navigate to changed target', e);
            }
        });

        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'btn-close btn-close-white';
        closeBtn.setAttribute('aria-label', 'Close');
        closeBtn.addEventListener('click', () => fadeOutAndRemove(wrapper));

        btnWrap.appendChild(viewBtn);
        btnWrap.appendChild(closeBtn);

        inner.appendChild(body);
        inner.appendChild(btnWrap);
        wrapper.appendChild(inner);

        container.appendChild(wrapper);
        
        const lifeMs = 6000;
        const progressWrap = document.createElement('div');
        progressWrap.style.position = 'absolute';
        progressWrap.style.left = '0';
        progressWrap.style.right = '0';
        progressWrap.style.bottom = '0';
        progressWrap.style.height = '4px';
        progressWrap.style.background = 'rgba(0,0,0,0.08)';
        progressWrap.style.borderBottomLeftRadius = '0.25rem';
        progressWrap.style.borderBottomRightRadius = '0.25rem';

        const progress = document.createElement('div');
        progress.style.height = '100%';
        progress.style.width = '100%';
        progress.style.background = 'linear-gradient(90deg, rgba(255,255,255,0.9), rgba(255,255,255,0.6))';
        progress.style.transition = `width ${lifeMs}ms linear`;
        
        progress.style.transformOrigin = 'right';

        progressWrap.appendChild(progress);
        wrapper.style.position = 'relative';
        wrapper.appendChild(progressWrap);

        
        requestAnimationFrame(() => {
            progress.style.width = '0%';
        });

        
        function fadeOutAndRemove(el) {
            try {
                el.style.transition = 'opacity 300ms ease, transform 300ms ease';
                el.style.opacity = '0';
                el.style.transform = 'translateY(-6px)';
                setTimeout(() => { el.remove(); }, 320);
            } catch (e) {
                try { el.remove(); } catch (ee) {}
            }
        }

        
        setTimeout(() => {
            fadeOutAndRemove(wrapper);
        }, lifeMs);
    } catch (e) {
        console.error('showChangeBanner failed', e);
    }
}
