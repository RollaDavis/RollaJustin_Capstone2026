<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAssignmentRequest;
use App\Http\Requests\UpdateAssignmentRequest;
use App\Http\Resources\AssignmentResource;
use App\Http\Resources\InstructorResource;
use App\Http\Resources\ProgramResource;
use App\Http\Resources\RoomResource;
use App\Models\Assignment;
use App\Models\Instructor;
use App\Models\Program;
use App\Models\ProgramAssignment;
use App\Models\Room;
use App\Models\Term;

class AssignmentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreAssignmentRequest $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(Assignment $assignment)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Assignment $assignment)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateAssignmentRequest $request, Assignment $assignment)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Assignment $assignment)
    {
        //
    }

    public function getTermInstructors(Term $term)
    {
        return InstructorResource::collection($term->instructors()->orderBy('name')->get());
    }

    public function getTermRooms(Term $term)
    {
        return RoomResource::collection($term->rooms);
    }

    public function getTermPrograms(Term $term)
    {
        $result = $term->programAssignments()
            ->with('program')
            ->select('program_id', 'year')
            ->distinct()
            ->orderBy('program_id')
            ->orderBy('year')
            ->get();

        return ProgramResource::collection($result);
    }

    public function getAssignmentsForInstructor(Term $term, Instructor $instructor)
    {
        $assignments = Assignment::query()
            ->with(['section.course', 'timeslot', 'room', 'instructor'])
            ->where('term_id', $term->id)
            ->where('instructor_id', $instructor->id)
            ->get();

        return AssignmentResource::collection($assignments);
    }

    public function getAssignmentsForRoom(Term $term, Room $room)
    {
        $assignments = Assignment::query()
            ->with(['section.course', 'timeslot', 'room', 'instructor'])
            ->where('term_id', $term->id)
            ->where('room_id', $room->id)
            ->get();

        return AssignmentResource::collection($assignments);
    }

    public function getAssignmentsForProgram(Term $term, Program $program, $year)
    {
        $programAssignmentSections = ProgramAssignment::query()
            ->with(['course.section',])
            ->where('term_id', $term->id)
            ->where('program_id', $program->id)
            ->where('year', $year)
            ->get();

        
    }
}
