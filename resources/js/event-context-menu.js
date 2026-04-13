const MENU_CLASS = 'event-context-menu';
const MENU_ITEM_CLASS = 'event-context-menu__item';
const NATIVE_MENU_DOUBLE_CLICK_WINDOW_MS = 1200;
const MENU_TARGET_EVENT = 'event';
const MENU_TARGET_SELECTION = 'selection';

let calendarRef = null;
let calendarElRef = null;
let menuEl = null;
let activeTargetKey = null;
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
        document.dispatchEvent(new CustomEvent('schedule:open-event-details', {
            detail: { eventId }
        }));
        return;
    }

    if (action === 'create-blockoff') {
        return;
    }

    if (action === 'unschedule') {
        document.dispatchEvent(new CustomEvent('schedule:move-event-to-unscheduled', {
            detail: { eventId }
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

    const eventEl = event.target instanceof Element
        ? event.target.closest('.fc-event')
        : null;

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
            ? event.target.closest('.fc-event')
            : null;

        if (event.button === 2 && eventEl && calendarElRef.contains(eventEl)) {
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

document.addEventListener('schedule:courses-selected', () => {
    closeMenu();
});
