@extends('layouts.app')

@section('content')
    <div class="container-fluid px-0">
        <div class="d-flex home-layout-shell">
            <div
                class="bg-white border-end d-flex align-items-start justify-content-center text-center px-3 pt-3 flex-shrink-0 unscheduled-pane">
                <div class="w-100 position-relative full-height">
                    <h6 class="fw-bold mb-2">Unscheduled Courses</h6>
                    <hr>
                    <div class="unscheduled-events position-relative unscheduled-events-body">
                        <p
                            class="text-muted fw-semibold mb-0 position-absolute top-50 start-50 translate-middle unscheduled-empty-state">No
                            Unscheduled Courses...</p>
                    </div>
                </div>
            </div>
            <section class="calendar-pane px-3 pb-3 pt-0 d-flex flex-column calendar-pane-shell">
                <div id="calendar" class="mt-3 calendar-surface"></div>
            </section>
            {{-- <div class="course-details-pane bg-white border-start d-flex align-items-start justify-content-center text-center px-3 pt-3 flex-shrink-0"
                class="details-pane">
                <div class="w-100 position-relative full-height">
                    
                </div>
            </div> --}}
        </div>
    </div>

    <div class="modal fade" id="eventDetailsModal" tabindex="-1" aria-labelledby="eventDetailsModalLabel"
        aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content border-0 shadow event-details-modal">
                <div class="modal-header event-details-header">
                    <div class="event-details-title-wrap">
                        <h5 class="modal-title event-details-title" id="eventDetailsModalLabel">Course Details</h5>
                        <p class="event-details-subtitle mb-0">Schedule and section overview</p>
                    </div>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body event-details-body">
                    <div class="event-details-hero">
                        <div>
                            <p class="event-details-eyebrow mb-1">Selected Course</p>
                            <h4 class="event-details-course mb-1" id="eventDetailsCourse">No course selected</h4>
                            <p class="event-details-meta mb-0" id="eventDetailsMeta">Right-click an event and choose Course Details.</p>
                        </div>
                        <span class="event-details-badge">Details</span>
                    </div>

                    <div class="event-details-grid">
                        <div class="event-details-card">
                            <p class="event-details-label">Instructor</p>
                            <p class="event-details-value" id="eventDetailsInstructor">Not available</p>
                        </div>
                        <div class="event-details-card">
                            <p class="event-details-label">Location</p>
                            <p class="event-details-value" id="eventDetailsLocation">Not available</p>
                        </div>
                        <div class="event-details-card">
                            <p class="event-details-label">Days</p>
                            <p class="event-details-value" id="eventDetailsDays">Not available</p>
                        </div>
                        <div class="event-details-card">
                            <p class="event-details-label">Time</p>
                            <p class="event-details-value" id="eventDetailsTime">Not available</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
@endsection