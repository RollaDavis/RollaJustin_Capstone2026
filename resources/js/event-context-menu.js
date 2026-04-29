const MENU_CLASS = 'event-context-menu';
const MENU_ITEM_CLASS = 'event-context-menu__item';
const NATIVE_MENU_DOUBLE_CLICK_WINDOW_MS = 1200;
const MENU_TARGET_EVENT = 'event';
const MENU_TARGET_SELECTION = 'selection';
const MENU_TARGET_BLOCKOFF = 'blockoff';

let calendarRef = null;
let calendarElRef = null;
let menuEl = null;
let activeTargetKey = null;
let calendarSelectionRef = null;
let lastContextMenuState = {
    targetKey: null,
    timestamp: 0
};

const getEventIdFromElement = (eventEl) => {
    if (!eventEl) {
        return null;
    }

    return eventEl.dataset.scheduleEventId || eventEl.getAttribute('data-event-id') || null;
};

const getBlockoffMetaFromElement = (eventEl) => {
    if (!eventEl) {
        return null;
    }

    const isBlockoff = String(eventEl.dataset.scheduleIsBlockoff || '').toLowerCase() === 'true';

    if (!isBlockoff) {
        return null;
    }

    const blockoffId = Number(eventEl.dataset.scheduleBlockoffId || '');
    const targetId = Number(eventEl.dataset.scheduleBlockoffTargetId || '');
    const blockoffType = String(eventEl.dataset.scheduleBlockoffType || '').trim();

    if (!Number.isInteger(blockoffId) || blockoffId <= 0 || !Number.isInteger(targetId) || targetId <= 0) {
        return null;
    }

    if (!['instructor', 'room'].includes(blockoffType)) {
        return null;
    }

    return {
        blockoffId,
        targetId,
        blockoffType
    };
};

const closeMenu = () => {
    if (menuEl) {
        menuEl.remove();
        menuEl = null;
    }

    activeTargetKey = null;
};

const runMenuAction = (action, payload = {}) => {
    const eventId = payload.eventId || null;

    if (action === 'details' && eventId) {
        
        document.dispatchEvent(new CustomEvent('schedule:preserve-selection'));
        document.dispatchEvent(new CustomEvent('schedule:open-event-details', {
            detail: { eventId }
        }));
        return;
    }

    if (action === 'create-blockoff') {
        document.dispatchEvent(new CustomEvent('schedule:open-blockoff-creation', {
            detail: {
                selection: payload.selection || null,
                clickedDate: payload.clickedDate || null
            }
        }));
        return;
    }

    if (action === 'unschedule') {
        document.dispatchEvent(new CustomEvent('schedule:move-event-to-unscheduled', {
            detail: { eventId }
        }));
        return;
    }

    if (action === 'remove-blockoff') {
        document.dispatchEvent(new CustomEvent('schedule:remove-blockoff', {
            detail: {
                blockoffId: payload.blockoffId,
                targetId: payload.targetId,
                blockoffType: payload.blockoffType
            }
        }));
    }
};

const placeMenuWithinViewport = (menu, x, y) => {
    document.body.appendChild(menu);

    const menuRect = menu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const left = Math.min(x, Math.max(8, viewportWidth - menuRect.width - 8));
    const top = Math.min(y, Math.max(8, viewportHeight - menuRect.height - 8));

    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
};

const createMenu = (target, payload, x, y) => {
    const menu = document.createElement('div');
    menu.className = MENU_CLASS;
    menu.setAttribute('role', 'menu');

    if (target === MENU_TARGET_SELECTION) {
        const createBlockoffButton = document.createElement('button');
        createBlockoffButton.type = 'button';
        createBlockoffButton.className = MENU_ITEM_CLASS;
        createBlockoffButton.dataset.action = 'create-blockoff';
        createBlockoffButton.textContent = 'Create Blockoff';
        menu.append(createBlockoffButton);
    } else if (target === MENU_TARGET_BLOCKOFF) {
        const removeBlockoffButton = document.createElement('button');
        removeBlockoffButton.type = 'button';
        removeBlockoffButton.className = MENU_ITEM_CLASS;
        removeBlockoffButton.dataset.action = 'remove-blockoff';
        removeBlockoffButton.textContent = 'Remove Blockoff';
        menu.append(removeBlockoffButton);
    } else {
        const detailsButton = document.createElement('button');
        detailsButton.type = 'button';
        detailsButton.className = MENU_ITEM_CLASS;
        detailsButton.dataset.action = 'details';
        detailsButton.textContent = 'Course Details';

        const unscheduleButton = document.createElement('button');
        unscheduleButton.type = 'button';
        unscheduleButton.className = MENU_ITEM_CLASS;
        unscheduleButton.dataset.action = 'unschedule';
        unscheduleButton.textContent = 'Unschedule Course';

        menu.append(detailsButton, unscheduleButton);
    }

    menu.addEventListener('click', (clickEvent) => {
        const action = clickEvent.target instanceof Element
            ? clickEvent.target.closest(`.${MENU_ITEM_CLASS}`)?.dataset?.action
            : null;

        if (!action) {
            return;
        }

        runMenuAction(action, payload);
        closeMenu();
        
    });

    placeMenuWithinViewport(menu, x, y);

    return menu;
};

const onCalendarContextMenu = (event) => {
    if (!calendarElRef) {
        return;
    }

    const clickedEventEl = event.target instanceof Element
        ? event.target.closest('[data-schedule-event-id], .fc-event')
        : null;
    const blockoffMeta = getBlockoffMetaFromElement(clickedEventEl);

    if (clickedEventEl && blockoffMeta && calendarElRef.contains(clickedEventEl)) {
        const blockoffKey = `blockoff:${blockoffMeta.blockoffType}:${blockoffMeta.targetId}:${blockoffMeta.blockoffId}`;
        const now = Date.now();
        const isSecondRightClickOnSameBlockoff =
            menuEl !== null
            && activeTargetKey === blockoffKey
            && lastContextMenuState.targetKey === blockoffKey
            && (now - lastContextMenuState.timestamp) <= NATIVE_MENU_DOUBLE_CLICK_WINDOW_MS;

        if (isSecondRightClickOnSameBlockoff) {
            closeMenu();
            lastContextMenuState = {
                targetKey: null,
                timestamp: 0
            };
            return;
        }

        event.preventDefault();

        closeMenu();
        menuEl = createMenu(MENU_TARGET_BLOCKOFF, blockoffMeta, event.clientX, event.clientY);
        activeTargetKey = blockoffKey;
        lastContextMenuState = {
            targetKey: blockoffKey,
            timestamp: now
        };
        return;
    }

    const highlightEl = event.target instanceof Element
        ? event.target.closest('.fc-highlight')
        : null;

    if (highlightEl && calendarElRef.contains(highlightEl)) {
        const selection = calendarSelectionRef;
        const clickedDate = highlightEl.closest('.fc-timegrid-col, .fc-daygrid-day')?.getAttribute('data-date') || null;
        const targetKey = selection
            ? `selection:${selection.startStr || ''}:${selection.endStr || ''}`
            : MENU_TARGET_SELECTION;
        const now = Date.now();
        const isSecondRightClickOnSameSelection =
            menuEl !== null
            && activeTargetKey === targetKey
            && lastContextMenuState.targetKey === targetKey
            && (now - lastContextMenuState.timestamp) <= NATIVE_MENU_DOUBLE_CLICK_WINDOW_MS;

        if (isSecondRightClickOnSameSelection) {
            closeMenu();
            lastContextMenuState = {
                targetKey: null,
                timestamp: 0
            };
            return;
        }

        event.preventDefault();

        closeMenu();
        menuEl = createMenu(MENU_TARGET_SELECTION, { selection, clickedDate }, event.clientX, event.clientY);
        activeTargetKey = targetKey;
        lastContextMenuState = {
            targetKey,
            timestamp: now
        };
        return;
    }

    const eventEl = clickedEventEl;

    if (!eventEl || !calendarElRef.contains(eventEl)) {
        closeMenu();
        return;
    }

    const eventId = getEventIdFromElement(eventEl);

    if (!eventId) {
        return;
    }

    const now = Date.now();
    const isSecondRightClickOnSameEvent =
        menuEl !== null
        && activeTargetKey === eventId
        && lastContextMenuState.targetKey === eventId
        && (now - lastContextMenuState.timestamp) <= NATIVE_MENU_DOUBLE_CLICK_WINDOW_MS;

    if (isSecondRightClickOnSameEvent) {
        closeMenu();
        lastContextMenuState = {
            targetKey: null,
            timestamp: 0
        };
        return;
    }

    event.preventDefault();

    closeMenu();
    menuEl = createMenu(MENU_TARGET_EVENT, { eventId }, event.clientX, event.clientY);
    activeTargetKey = eventId;
    lastContextMenuState = {
        targetKey: eventId,
        timestamp: now
    };
};

const resetStateOnGeneralInteractions = () => {
    document.addEventListener('click', (event) => {
        const clickedInsideMenu = menuEl && event.target instanceof Element && menuEl.contains(event.target);

        if (!clickedInsideMenu) {
            closeMenu();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeMenu();
        }
    });

    window.addEventListener('resize', closeMenu);
    window.addEventListener('scroll', closeMenu, true);
};

const initializeContextMenu = () => {
    if (!calendarElRef) {
        return;
    }

    calendarElRef.addEventListener('mousedown', (event) => {
        const eventEl = event.target instanceof Element
            ? event.target.closest('[data-schedule-event-id], .fc-event')
            : null;
        const highlightEl = event.target instanceof Element
            ? event.target.closest('.fc-highlight')
            : null;
        const blockoffMeta = getBlockoffMetaFromElement(eventEl);

        if (event.button === 0 && eventEl && blockoffMeta && calendarElRef.contains(eventEl)) {
            event.preventDefault();
            event.stopPropagation();
            return;
        }

        if (event.button === 2 && ((eventEl && calendarElRef.contains(eventEl)) || (highlightEl && calendarElRef.contains(highlightEl)))) {
            event.preventDefault();
            event.stopPropagation();
        }
    }, true);

    calendarElRef.addEventListener('contextmenu', onCalendarContextMenu);
    resetStateOnGeneralInteractions();
};

document.addEventListener('schedule:calendar-ready', (event) => {
    calendarRef = event.detail?.calendar || null;
    calendarElRef = event.detail?.calendarEl || document.getElementById('calendar');

    if (!calendarRef || !calendarElRef) {
        return;
    }

    initializeContextMenu();
});

document.addEventListener('schedule:selection-changed', (event) => {
    calendarSelectionRef = event.detail?.selection || null;
});

document.addEventListener('schedule:courses-selected', () => {
    calendarSelectionRef = null;
    closeMenu();
});
