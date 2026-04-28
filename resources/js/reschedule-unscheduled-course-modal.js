
import { Modal } from 'bootstrap';
import { showEventDetailsModal } from './event-details-modal';

// show a reschedule modal for an unscheduled course, styled identically to the detail modal
export const showRescheduleUnscheduledCourseModal = (unscheduledPayload = {}, onSave = null) => {
    // clone the detail modal markup and use the same binding logic for pixel-perfect styling
    const modalEl = document.getElementById('eventDetailsModal');
    if (!modalEl) return;

    const clone = modalEl.cloneNode(true);
    const cloneId = `eventDetailsModalClone_${Date.now()}`;
    clone.id = cloneId;
    document.body.appendChild(clone);


    // do not clone selector modals. use the originals in the dom.

    // patch the title/subtitle for clarity
    const titleWrap = clone.querySelector('.event-details-title-wrap');
    if (titleWrap) {
        const h5 = titleWrap.querySelector('h5');
        if (h5) h5.textContent = 'Course Details';
        const p = titleWrap.querySelector('p');
        if (p) p.textContent = 'Unscheduled — Reschedule';
    }

    // use the same logic as the full details modal for unscheduled courses
    import('./event-details-modal').then(({ bindDetailActions, populateEventDetails }) => {
        try { bindDetailActions(clone); } catch (e) { console.error('bindDetailActions(clone) failed', e); }
        try { populateEventDetails({ unscheduledPayload }, clone); } catch (e) { console.error('populateEventDetails for clone failed', e); }

        // ensure course name is set for unscheduled
        if (unscheduledPayload) {
            const primary = unscheduledPayload?.extendedProps?.courses?.[0] || {};
            const courseTitle = primary.course_name || primary.attributes?.course_name || unscheduledPayload.title || 'Course';
            const courseEl = clone.querySelector('.event-details-course');
            if (courseEl) courseEl.textContent = courseTitle;
        }

        // only show the modal after actions are bound and content is ready
        const inst = Modal.getOrCreateInstance(clone);
        try { inst.show(); } catch (e) { console.error('showing cloned modal failed', e); }

        // remove clone on hide
        clone.addEventListener('hidden.bs.modal', () => {
            try { inst.hide(); } catch (e) {}
            try { clone.remove(); } catch (e) {}
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) backdrop.remove();
        });
    });
};
