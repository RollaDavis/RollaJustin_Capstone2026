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
            <div class="modal-content border-0 shadow">
                <div class="modal-header">
                   
                </div>
                <div class="modal-body">

                </div>
            </div>
        </div>
    </div>
@endsection