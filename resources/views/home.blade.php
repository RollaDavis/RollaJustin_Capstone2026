@extends('layouts.app')

@section('content')
    <div class="container-fluid px-0">
        <div class="d-flex" style="height: calc(100vh - 72px); overflow: hidden;">
            <div class="bg-white border-end d-flex align-items-start justify-content-center text-center px-3 pt-3 flex-shrink-0"
                style="flex: 0 0 15%;">
                <div class="w-100 position-relative" style="height: 100%;">
                    <h6 class="fw-bold mb-2">Unscheduled Courses</h6>
                    <hr>
                    <div class="unscheduled-events">
                        <p class="text-muted fw-semibold mb-0 position-absolute top-50 start-50 translate-middle"
                        style="max-width: 14ch; width: 100%;">No Unscheduled Courses...</p>
                    </div>
                </div>
            </div>
            <section class="calendar-pane px-3 pb-3 pt-0 d-flex flex-column"
                style="flex: 1 1 auto; overflow: visible; background-color: #ebeaea;">
                <div id="calendar" class=" mt-3" style="flex: 1 1 auto; background-color: #fff;"></div>
            </section>
            <div class="course-details-pane bg-white border-start d-flex align-items-start justify-content-center text-center px-3 pt-3 flex-shrink-0"
                style="flex: 0 0 15%;">
                <div class="w-100 position-relative" style="height: 100%;">
                    <h6 class="fw-bold mb-2">Course Details</h6>
                    <hr>
                    {{-- <p class="text-muted fw-semibold mb-0 position-absolute top-50 start-50 translate-middle"
                        style="max-width: 14ch; width: 100%;">No Course Selected...</p> --}}

                    
                </div>
            </div>
        </div>
    </div>
@endsection