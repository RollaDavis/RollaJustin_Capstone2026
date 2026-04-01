import dragula from 'dragula';
import interactionPlugin, { ThirdPartyDraggable } from '@fullcalendar/interaction';

document.addEventListener('DOMContentLoaded', function () {
    let unscheduledEvents = document.getElementById('unscheduled-events');
    let calendarEl = document.getElementBy('calendar');

    dragula([document.querySelector('#left'), calendarEl]);

    let drake = dragula({
        containers: [unscheduledEvents],
        copy: true
    });

    let draggable = new ThirdPartyDraggable(containerEl, {
        itemSelector: '.my-item',
        mirrorSelector: '.gu-mirror', // the dragging element that dragula renders
        eventData: function (eventEl) {
            return {
                title: eventEl.innerText
            };
        }
    });
});
