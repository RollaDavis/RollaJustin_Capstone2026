<?php

use App\Models\Program;
use App\Models\Room;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use App\Models\Instructor;
use App\Models\Term;
use App\Http\Controllers\API\InstructorController;

Route::middleware('auth:sanctum')->group(function() {
    Route::prefix('v1')->group(function () {
        // Route::apiResource('instructors', InstructorController::class);
        // Route::get('/instructors', function(Request $request) {
        //     return Instructor::all();
        // });
    });
});

Route::get('/instructors', function(Request $request) {
    return Instructor::orderBy('name')->get();
});

Route::get('/instructors/{instructor}/courses', function (Instructor $instructor, Request $request) {
    $query = DB::table('assignments')
        ->join('instructors_rooms_sections', 'instructors_rooms_sections.id', '=', 'assignments.instructors_rooms_sections_id')
        ->join('sections', 'sections.id', '=', 'instructors_rooms_sections.section_id')
        ->join('courses', 'courses.id', '=', 'sections.course_id')
        ->join('instructors', 'instructors.id', '=', 'instructors_rooms_sections.instructor_id')
        ->join('rooms', 'rooms.id', '=', 'instructors_rooms_sections.room_id')
        ->join('timeslots', 'timeslots.id', '=', 'assignments.timeslot_id')
        ->join('locations', 'locations.id', '=', 'timeslots.location_id')
        ->join('terms', 'terms.id', '=', 'assignments.term_id')
        ->leftJoin('semesters_courses', 'semesters_courses.course_id', '=', 'courses.id')
        ->leftJoin('programs_semesters', 'programs_semesters.id', '=', 'semesters_courses.programs_semesters_id')
        ->leftJoin('programs', 'programs.id', '=', 'programs_semesters.program_id')
        ->leftJoin('semesters', 'semesters.id', '=', 'programs_semesters.semester_id')
        ->where('instructors_rooms_sections.instructor_id', $instructor->id);

    if ($request->has('term')) {
        $query->where('assignments.term_id', $request->input('term'));
    }

    return $query->select(
        'courses.id as course_id',
        'courses.name as course_name',
        'sections.id as section_id',
        'sections.name as section_name',
        'sections.active as section_active',
        'instructors_rooms_sections.id as instructor_room_section_id',
        'instructors.id as instructor_id',
        'instructors.name as instructor_name',
        'rooms.id as room_id',
        'rooms.name as room_name',
            'assignments.id as assignment_id',
            'assignments.created_at as assignment_created_at',
            'assignments.updated_at as assignment_updated_at',
            'assignments.term_id',
            'terms.name as term_name',
            'assignments.timeslot_id',
            'timeslots.days as timeslot_days',
            'timeslots.start_time as timeslot_start_time',
            'timeslots.duration as timeslot_duration_hours',
            'timeslots.location_id as timeslot_location_id',
            'locations.name as location_name',
            'programs.id as program_id',
            'programs.name as program_name',
            'semesters.id as semester_id',
            'semesters.name as semester_name'
        )
        ->distinct()
        ->orderBy('courses.name')
        ->orderBy('sections.name')
        ->get();
});

Route::get('/rooms', function(Request $request) {
    return Room::all();
});

Route::get('/rooms/{room}/courses', function (Room $room, Request $request) {
    $query = DB::table('assignments')
        ->join('instructors_rooms_sections', 'instructors_rooms_sections.id', '=', 'assignments.instructors_rooms_sections_id')
        ->join('sections', 'sections.id', '=', 'instructors_rooms_sections.section_id')
        ->join('courses', 'courses.id', '=', 'sections.course_id')
        ->join('instructors', 'instructors.id', '=', 'instructors_rooms_sections.instructor_id')
        ->join('rooms', 'rooms.id', '=', 'instructors_rooms_sections.room_id')
        ->join('timeslots', 'timeslots.id', '=', 'assignments.timeslot_id')
        ->join('locations', 'locations.id', '=', 'timeslots.location_id')
        ->join('terms', 'terms.id', '=', 'assignments.term_id')
        ->leftJoin('semesters_courses', 'semesters_courses.course_id', '=', 'courses.id')
        ->leftJoin('programs_semesters', 'programs_semesters.id', '=', 'semesters_courses.programs_semesters_id')
        ->leftJoin('programs', 'programs.id', '=', 'programs_semesters.program_id')
        ->leftJoin('semesters', 'semesters.id', '=', 'programs_semesters.semester_id')
        ->where('instructors_rooms_sections.room_id', $room->id);

    if ($request->has('term')) {
        $query->where('assignments.term_id', $request->input('term'));
    }

    return $query->select(
        'courses.id as course_id',
        'courses.name as course_name',
        'sections.id as section_id',
        'sections.name as section_name',
        'sections.active as section_active',
        'instructors_rooms_sections.id as instructor_room_section_id',
        'instructors.id as instructor_id',
        'instructors.name as instructor_name',
        'rooms.id as room_id',
        'rooms.name as room_name',
        'assignments.id as assignment_id',
        'assignments.created_at as assignment_created_at',
        'assignments.updated_at as assignment_updated_at',
        'assignments.term_id',
        'terms.name as term_name',
        'assignments.timeslot_id',
        'timeslots.days as timeslot_days',
        'timeslots.start_time as timeslot_start_time',
        'timeslots.duration as timeslot_duration_hours',
        'timeslots.location_id as timeslot_location_id',
        'locations.name as location_name',
        'programs.id as program_id',
        'programs.name as program_name',
        'semesters.id as semester_id',
        'semesters.name as semester_name'
    )
        ->distinct()
        ->orderBy('courses.name')
        ->orderBy('sections.name')
        ->get();
});

Route::get('/programs', function(Request $request) {
    return Program::all();
});

Route::get('/programs/{program}/courses', function (Program $program, Request $request) {
    $query = DB::table('assignments')
        ->join('instructors_rooms_sections', 'instructors_rooms_sections.id', '=', 'assignments.instructors_rooms_sections_id')
        ->join('sections', 'sections.id', '=', 'instructors_rooms_sections.section_id')
        ->join('courses', 'courses.id', '=', 'sections.course_id')
        ->join('instructors', 'instructors.id', '=', 'instructors_rooms_sections.instructor_id')
        ->join('rooms', 'rooms.id', '=', 'instructors_rooms_sections.room_id')
        ->join('timeslots', 'timeslots.id', '=', 'assignments.timeslot_id')
        ->join('locations', 'locations.id', '=', 'timeslots.location_id')
        ->join('terms', 'terms.id', '=', 'assignments.term_id')
        ->join('semesters_courses', 'semesters_courses.course_id', '=', 'courses.id')
        ->join('programs_semesters', 'programs_semesters.id', '=', 'semesters_courses.programs_semesters_id')
        ->join('programs', 'programs.id', '=', 'programs_semesters.program_id')
        ->join('semesters', 'semesters.id', '=', 'programs_semesters.semester_id')
        ->where('programs.id', $program->id);

    if ($request->has('term')) {
        $query->where('assignments.term_id', $request->input('term'));
    }

    return $query->select(
        'courses.id as course_id',
        'courses.name as course_name',
        'sections.id as section_id',
        'sections.name as section_name',
        'sections.active as section_active',
        'instructors_rooms_sections.id as instructor_room_section_id',
        'instructors.id as instructor_id',
        'instructors.name as instructor_name',
        'rooms.id as room_id',
        'rooms.name as room_name',
        'assignments.id as assignment_id',
        'assignments.created_at as assignment_created_at',
        'assignments.updated_at as assignment_updated_at',
        'assignments.term_id',
        'terms.name as term_name',
        'assignments.timeslot_id',
        'timeslots.days as timeslot_days',
        'timeslots.start_time as timeslot_start_time',
        'timeslots.duration as timeslot_duration_hours',
        'timeslots.location_id as timeslot_location_id',
        'locations.name as location_name',
        'programs.id as program_id',
        'programs.name as program_name',
        'semesters.id as semester_id',
        'semesters.name as semester_name'
    )
        ->distinct()
        ->orderBy('semesters.name')
        ->orderBy('courses.name')
        ->orderBy('sections.name')
        ->get();
});

Route::get('/terms', function(Request $request) {
    return Term::all();
});
    