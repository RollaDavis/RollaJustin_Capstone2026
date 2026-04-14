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
                        <p class="event-details-subtitle mb-0">Course Detail Overview</p>
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
                    </div>

                    <div class="event-details-grid">
                        <div class="event-details-card">
                            <p class="event-details-label mb-1">Instructor</p>
                            <div class="event-details-value-row">
                                <p class="event-details-value mb-0" id="eventDetailsInstructorValue">Not available</p>
                                <button id="eventDetailsInstructorEditButton" type="button"
                                    class="btn btn-sm event-details-edit-btn"
                                    aria-label="Edit instructor" title="Edit instructor">
                                    <i class="bi bi-pencil"></i>
                                </button>
                            </div>
                        </div>
                        <div class="event-details-card">
                            <p class="event-details-label mb-1">Room</p>
                            <div class="event-details-value-row">
                                <p class="event-details-value mb-0" id="eventDetailsLocationValue">Not available</p>
                                <button id="eventDetailsLocationEditButton" type="button"
                                    class="btn btn-sm event-details-edit-btn"
                                    aria-label="Edit room" title="Edit room">
                                    <i class="bi bi-pencil"></i>
                                </button>
                            </div>
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

    <div class="modal fade event-details-selector-modal" id="eventDetailsInstructorSelectModal" tabindex="-1"
        aria-labelledby="eventDetailsInstructorSelectModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content border-0 shadow">
                <div class="modal-header">
                    <h5 class="modal-title" id="eventDetailsInstructorSelectModalLabel">Select Instructor</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <input id="eventDetailsInstructorSearch" type="search" class="form-control form-control-sm mb-2"
                        placeholder="Search instructors" aria-label="Search instructors">
                    <div id="eventDetailsInstructorList" class="list-group event-details-selection-list"></div>
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade event-details-selector-modal" id="eventDetailsLocationSelectModal" tabindex="-1"
        aria-labelledby="eventDetailsLocationSelectModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content border-0 shadow">
                <div class="modal-header">
                    <h5 class="modal-title" id="eventDetailsLocationSelectModalLabel">Select Room</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <input id="eventDetailsLocationSearch" type="search" class="form-control form-control-sm mb-2"
                        placeholder="Search rooms" aria-label="Search rooms">
                    <div id="eventDetailsLocationList" class="list-group event-details-selection-list"></div>
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade" id="blockoffCreationModal" tabindex="-1" aria-labelledby="blockoffCreationModalLabel"
        aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content border-0 shadow blockoff-creation-modal">
                <div class="modal-header blockoff-creation-header">
                    <div>
                        <h5 class="modal-title blockoff-creation-title" id="blockoffCreationModalLabel">Create Blockoff</h5>
                        <p class="blockoff-creation-subtitle mb-0">Block availability for the selected schedule target</p>
                    </div>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <form id="blockoffCreationForm" class="modal-body blockoff-creation-body">
                    <div id="blockoffCreationFormBody">
                        <div class="blockoff-creation-target mb-3">
                            <p class="blockoff-creation-target-label mb-1">Current Target</p>
                            <p class="mb-0 fw-semibold" id="blockoffCreationTargetSummary">No target selected</p>
                        </div>

                        <div class="mb-3">
                            <label class="form-label blockoff-creation-label">Days</label>
                            <div class="blockoff-days-grid">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" value="M" id="blockoffDayM"
                                        name="blockoffDays">
                                    <label class="form-check-label" for="blockoffDayM">Mon</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" value="T" id="blockoffDayT"
                                        name="blockoffDays">
                                    <label class="form-check-label" for="blockoffDayT">Tue</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" value="W" id="blockoffDayW"
                                        name="blockoffDays">
                                    <label class="form-check-label" for="blockoffDayW">Wed</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" value="R" id="blockoffDayR"
                                        name="blockoffDays">
                                    <label class="form-check-label" for="blockoffDayR">Thu</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" value="F" id="blockoffDayF"
                                        name="blockoffDays">
                                    <label class="form-check-label" for="blockoffDayF">Fri</label>
                                </div>
                            </div>
                        </div>

                        <div class="row g-2 mb-3">
                            <div class="col-6">
                                <label for="blockoffStartTime" class="form-label blockoff-creation-label">Start Time</label>
                                <input id="blockoffStartTime" type="time" class="form-control" step="300" required>
                            </div>
                            <div class="col-6">
                                <label for="blockoffEndTime" class="form-label blockoff-creation-label">End Time</label>
                                <input id="blockoffEndTime" type="time" class="form-control" step="300" required>
                            </div>
                        </div>

                        <div id="blockoffCreationError" class="alert alert-danger py-2 px-3 d-none" role="alert"></div>
                        <div id="blockoffCreationSuccess" class="alert alert-success py-2 px-3 d-none" role="status"></div>
                    </div>

                    <div class="d-flex justify-content-end gap-2 mt-2">
                        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="submit" id="blockoffCreateSubmit" class="btn btn-primary">Create Blockoff</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
@endsection