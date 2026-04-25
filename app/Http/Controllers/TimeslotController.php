<?php

namespace App\Http\Controllers;

use App\Models\Timeslot;
use App\Models\Instructor_Time_Block;
use App\Models\Room_Time_Block;
use App\Http\Requests\StoreTimeslotRequest;
use App\Http\Requests\UpdateTimeslotRequest;

class TimeslotController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreTimeslotRequest $request)
    {
        $attributes = $request->validated()['data']['attributes'];

        // Check if timeslot already exists
        $existingTimeslot = Timeslot::where('days', $attributes['days'])
            ->where('start_time', $attributes['start_time'])
            ->where('duration', $attributes['duration'])
            ->first();

        if ($existingTimeslot) {
            return response()->json($existingTimeslot, 200);
        }

        // Create and save the new timeslot
        $newTimeslot = Timeslot::create($attributes);

        return response()->json($newTimeslot, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Timeslot $timeslot)
    {
        //
    }


    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateTimeslotRequest $request, Timeslot $timeslot)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Timeslot $timeslot)
    {
        //
    }

    public function checkConflict(Timeslot $timeslot1, Timeslot $timeslot2)
    {
        // Check if the days overlap
        $daysOverlap = array_intersect(str_split($timeslot1->days), str_split($timeslot2->days));
        if (empty($daysOverlap)) {
            return false; // No overlapping days, so no conflict
        }

        $randomdate = " November 15 2025"; // Use a fixed date to compare times
        // Check if the time ranges overlap
        $start1 = strtotime($timeslot1->start_time.$randomdate);
        $end1 = $start1 + (int) round(((float) $timeslot1->duration) * 3600);
        $start2 = strtotime($timeslot2->start_time.$randomdate);
        $end2 = $start2 + (int) round(((float) $timeslot2->duration) * 3600);

        return ($start1 < $end2) && ($start2 < $end1); // Time ranges overlap if this condition is true
    }

    public function checkInstructorTimeBlockConflict(Timeslot $timeslot, $instructorId)
    {
        $timeblocks = Instructor_Time_Block::where('instructor_id', $instructorId)->get();

        foreach ($timeblocks as $block) {
            $blockTimeslot = new Timeslot([
                'days' => $block->days,
                'start_time' => $block->start_time,
                'duration' => $block->duration,
            ]);

            if ($this->checkConflict($timeslot, $blockTimeslot)) {
                return true; // Conflict found
            }
        }

        return false; // No conflicts

    }

    public function checkRoomTimeBlockConflict(Timeslot $timeslot, $roomId)
    {
        $timeblocks = Room_Time_Block::where('room_id', $roomId)->get();

        foreach ($timeblocks as $block) {
            $blockTimeslot = new Timeslot([
                'days' => $block->days,
                'start_time' => $block->start_time,
                'duration' => $block->duration,
            ]);

            if ($this->checkConflict($timeslot, $blockTimeslot)) {
                return true; // Conflict found
            }
        }

        return false; // No conflicts
    }
}
