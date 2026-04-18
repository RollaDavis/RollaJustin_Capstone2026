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
use App\Models\Timeslot;
use Illuminate\Http\Request;

class AssignmentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Term $term)
    {
        $assignments = Assignment::query()
            ->with(['section.course', 'timeslot', 'room', 'instructor'])
            ->where('term_id', $term->id)
            ->get();

        return AssignmentResource::collection($assignments);
    }


    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreAssignmentRequest $request)
    {
        $attributes = $request->validated()['data']['attributes'];

        $assignment = Assignment::create($attributes);

        return new AssignmentResource($assignment);
    }

    /**
     * Display the specified resource.
     */
    public function show(Assignment $assignment)
    {
        return new AssignmentResource($assignment);
    }


    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateAssignmentRequest $request, Assignment $assignment)
    {
        $attributes = $request->validated()['data']['attributes'];

        $assignment->update($attributes);

        return new AssignmentResource($assignment);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Assignment $assignment)
    {
        $assignment->delete();

        return response()->json(null, 204);

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
            ->where('term_id', $term->id)
            ->where('program_id', $program->id)
            ->where('year', $year)
            ->get();


        $my_assignments = [];
        foreach($programAssignmentSections as $item){
            $sections = $item->course->sections;
            foreach($sections as $section){
                $assignments = $section->assignments;
                foreach($assignments as $a) {
                    if($a->term_id == $term->id){
                        $my_assignments[] = $a;
                    }
                }  
            }
        }

        return AssignmentResource::collection($my_assignments);
    }


    public function showAssignmentOptions(Assignment $assignment, Request $request)
    {
        $testAssignment = $assignment->copy();
        $days = $request->input('data.attributes.days');
        $duration = $request->input('data.attributes.duration');
        $start_times = ['08:00', '9:10', '10:20', '11:30', '12:40', '1:50', '3:00'];
        $options = [];
        $failures = [];

        foreach ($start_times as $start_time) {
            $timeslot = $this->timeslotsForOptions($days, $duration, $start_time);

            $testAssignment->timeslot_id = $timeslot->id;

            $conflicts = $this->checkAssignmentConflicts($testAssignment);

            if ($conflicts['has_conflict']) {
                $failures[] = [
                    'timeslot_id' => $timeslot->id,
                    'days' => $days,
                    'start_time' => $start_time,
                    'duration' => $duration,
                    'conflicts' => $conflicts['conflicts']
                ];
            } else {
                $options[] = [
                    'timeslot_id' => $timeslot->id,
                    'days' => $days,
                    'start_time' => $start_time,
                    'duration' => $duration,
                ];
            }

        }
        return ['options' => $options, 'failures' => $failures];
    }

    public function checkAssignmentConflicts(Assignment $assignment)
    {
        $conflicts = [];
        $hasConflict = false;

        if ($this->checkInstructorConflict($assignment)) {
            $conflicts[] = $assignment->instructor->name . ' has a scheduling conflict at this timeslot.';
            $hasConflict = true;
        }

        if ($this->checkRoomConflict($assignment)) {
            $conflicts[] = $assignment->room->name . ' has a scheduling conflict at this timeslot.';
            $hasConflict = true;
        }

        if ($this->checkTermProgramConflicts($assignment)['all_program_years_have_valid_schedule'] === false) {
            foreach ($this->checkTermProgramConflicts($assignment)['invalid_program_years'] as $invalidProgramYear) {
                $conflicts[] = 'Program ' . $invalidProgramYear['program_name'] . ' Year ' . $invalidProgramYear['year'] . ' does not have a valid schedule with this assignment.';
                $hasConflict = true;
            }
        }

        return ['has_conflict' => $hasConflict, 'conflicts' => $conflicts];
    }

    public function checkInstructorConflict(Assignment $assignment)
    {
        $conflict = false;

        $assignments = Assignment::query()
            ->with(['section.course', 'timeslot', 'room', 'instructor'])
            ->where('term_id', $assignment->term_id)
            ->where('instructor_id', $assignment->instructor_id)
            ->get();

            foreach ($assignments as $existingAssignment) {
                if ($existingAssignment->id === $assignment->id) {
                    continue; // Skip the same assignment
                }

                if ($this->timeslotsConflict($assignment->timeslot, $existingAssignment->timeslot)) {
                    $conflict = true;
                    break;
                }
            }
        
    
            if ($this->checkInstructorTimeBlockConflict($assignment->timeslot, $assignment->instructor_id)) {
                $conflict = true;
            }

            return $conflict;
    }

    public function checkRoomConflict(Assignment $assignment)
    {
        $conflict = false;

        $assignments = Assignment::query()
            ->with(['section.course', 'timeslot', 'room', 'instructor'])
            ->where('term_id', $assignment->term_id)
            ->where('room_id', $assignment->room_id)
            ->get();

            foreach ($assignments as $existingAssignment) {
                if ($existingAssignment->id === $assignment->id) {
                    continue; // Skip the same assignment
                }

                if ($this->timeslotsConflict($assignment->timeslot, $existingAssignment->timeslot)) {
                    $conflict = true;
                    break;
                }
            }
        
    
            if ($this->checkRoomTimeBlockConflict($assignment->timeslot, $assignment->room_id)) {
                $conflict = true;
            }

            return $conflict;
    }

    public function checkTermProgramConflicts(Assignment $assignment)
    {
        $course = $assignment->section->course;

        $programYearCombinations = $course->programAssignments()
            ->where('term_id', $assignment->term_id)
            ->with('program')
            ->get()
            ->map(function ($programAssignment) {
                return [
                    'program_assignment_id' => $programAssignment->id,
                    'program_id' => $programAssignment->program_id,
                    'program_name' => $programAssignment->program->name,
                    'year' => $programAssignment->year,
                ];
            })
            ->values();

        $programYearResults = $programYearCombinations->map(function (array $programYearCombination) use ($assignment) {
            $programAssignments = ProgramAssignment::query()
                ->where('term_id', $assignment->term_id)
                ->where('program_id', $programYearCombination['program_id'])
                ->where('year', $programYearCombination['year'])
                ->with([
                    'course.sections.assignments' => function ($query) use ($assignment) {
                        $query->where('term_id', $assignment->term_id);
                    },
                    'course.sections.assignments.timeslot',
                ])
                ->orderBy('course_id')
                ->get();

            $courseSectionOptions = $programAssignments->map(function (ProgramAssignment $programAssignment) {
                return [
                    'program_assignment_id' => $programAssignment->id,
                    'course_id' => $programAssignment->course_id,
                    'course_name' => $programAssignment->course->name,
                    'sections' => $programAssignment->course->sections->values(),
                ];
            })->values();

            $hasValidSchedule = $courseSectionOptions->isNotEmpty()
                && ! $courseSectionOptions->contains(function (array $option) {
                    return $option['sections']->isEmpty();
                })
                && $this->hasValidProgramYearSectionPermutation($courseSectionOptions->all(), $assignment->term_id);

            return [
                'program_id' => $programYearCombination['program_id'],
                'program_name' => $programYearCombination['program_name'],
                'year' => $programYearCombination['year'],
                'has_valid_schedule' => $hasValidSchedule,
            ];
        })->values();

        $invalidProgramYears = $programYearResults
            ->filter(function (array $result) {
                return ! $result['has_valid_schedule'];
            })
            ->values();

        return [
            'all_program_years_have_valid_schedule' => $invalidProgramYears->isEmpty(),
            'invalid_program_years' => $invalidProgramYears,
            'program_year_results' => $programYearResults,
        ];
    }

    private function hasValidProgramYearSectionPermutation(array $courseSectionOptions, int $termId, int $index = 0, array $chosenTimeslots = []): bool
    {
        if ($index === count($courseSectionOptions)) {
            return true;
        }

        $courseOption = $courseSectionOptions[$index];

        foreach ($courseOption['sections'] as $section) {
            $sectionTimeslotsForTerm = $this->getSectionTimeslotsForTerm($section, $termId);

            if ($this->timeslotsConflictWithChosenTimeslots($sectionTimeslotsForTerm, $chosenTimeslots)) {
                continue;
            }

            if ($this->hasValidProgramYearSectionPermutation(
                $courseSectionOptions,
                $termId,
                $index + 1,
                array_merge($chosenTimeslots, $sectionTimeslotsForTerm)
            )) {
                return true;
            }
        }

        return false;
    }

    private function getSectionTimeslotsForTerm($section, int $termId): array
    {
        return $section->assignments
            ->where('term_id', $termId)
            ->pluck('timeslot')
            ->filter()
            ->values()
            ->all();
    }

    private function timeslotsConflictWithChosenTimeslots(array $sectionTimeslots, array $chosenTimeslots): bool
    {
        foreach ($sectionTimeslots as $sectionTimeslot) {
            foreach ($chosenTimeslots as $chosenTimeslot) {
                if ($this->timeslotsConflict($sectionTimeslot, $chosenTimeslot)) {
                    return true;
                }
            }
        }

        return false;
    }

    private function timeslotsConflict(Timeslot $timeslot1, Timeslot $timeslot2): bool
    {
        return app(TimeslotController::class)->checkConflict($timeslot1, $timeslot2);
    }

    private function timeslotsForOptions (string $days, int $duration, string $startTime): Timeslot{
                // Check if timeslot already exists
        $existingTimeslot = Timeslot::where('days', $days)
            ->where('start_time', $startTime)
            ->where('duration', $duration)
            ->first();

        if ($existingTimeslot) {
            return $existingTimeslot;
        }

        // Create and save the new timeslot
        $newTimeslot = Timeslot::create([
            'days' => $days,
            'start_time' => $startTime,
            'duration' => $duration,
            'location_id' => 1, // Assuming location as COT for the moment
            // TODO: Add logic to determine location based on timeslot options or other factors
        ]);

        return $newTimeslot;
    }
}
